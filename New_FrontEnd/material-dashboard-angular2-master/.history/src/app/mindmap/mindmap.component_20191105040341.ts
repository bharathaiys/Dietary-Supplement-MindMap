import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import * as d3 from 'd3';
import 'd3-scale';
import 'd3-transform';
import 'd3-selection';

@Component({
  selector: 'app-mindmap',
  templateUrl: './mindmap.component.html',
  styleUrls: ['./mindmap.component.scss']
})
export class MindmapComponent implements OnInit {
  @ViewChild('chart', { static: false }) chartElement: ElementRef;
  constructor() { }
  ngOnInit() {
    this.tree = d3.tree().size([this.h, this.w]);
    this.zoom = d3.zoom()
      .scaleExtent([1, 5]).on("zoom", this.zoomed);
    this.vis = d3.select(".svg-container")
      .append("svg:svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .style("background", '#F5F5DC')
      .call(this.zoom);
    this.container = this.vis.append("svg:g")
      .attr("id", "container")
      .attr("transform", "translate(0,0)scale(1,1)");
    this.queryServer(this.type, this.symptom);
  }

  m = [20, 120, 20, 120];
  w = 900 - this.m[1] - this.m[3];
  h = 500 - this.m[0] - this.m[2];
  i = 0;
  root;
  margin = { top: 0, right: 0, bottom: 0, left: 0 };
  width = '100%';		// canvas width
  height = 480;		// canvas height
  data;
  bbox;
  viewBox;
  vx;
  vy;
  vw;
  vh;
  defaultView;
  clickScale = 2;

  getDirection = function (data) {
    if (!data) {
      return 'root';
    }
    if (data.position) {
      return data.position;
    }
    return this.getDirection(data.parent);
  };

  // selectNode = function (target) {
  //   if (target) {
  //     var sel = d3.selectAll('#body svg .node').filter(function (d: any) {
  //       return d.id == target.id
  //     })[0][0];
  //     if (sel) {
  //       this.select(sel);
  //     }
  //   }
  // };


  select = function (node) {
    // Find previously selected, unselect
    d3.select(".selected").classed("selected", false);
    // Select current item
    d3.select(node).classed("selected", true);
  };

  tree;

  calcLeft(d) {
    var l = d.y;
    if (d.position === 'left') {
      l = (d.y) - this.w / 2;
      l = (this.w / 2) + l;
    }
    return {
      x: d.x,
      y: l
    };
  };

  connector = function (d) {
    console.log(this);
    var source = this.calcLeft(d.source);
    var target = this.calcLeft(d.target);
    var hy = (target.y - source.y) / 2;
    console.log(d.name);
    return "M" + source.y + "," + source.x +
      "H" + (source.y + hy) +
      "V" + target.x + "H" + target.y;
  };

  zoomed() {
    var translateX = d3.event.translate[0];
    var translateY = d3.event.translate[1];
    var xScale = d3.event.scale;
    this.container.attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + xScale + ")");
  }

  scale = 1.0;

  zoom;

  vis;

  container;


  toArray = function (item, arr, d) {
    arr = arr || [];
    var dr = d || 1;
    var i = 0,
      l = item.children ? item.children.length : 0;
    arr.push(item);
    if (item.position && item.position === 'left') {
      dr = -1;
    }
    item.y = dr * item.y;
    for (; i < l; i++) {
      this.toArray(item.children[i], arr, dr);
    }
    return arr;
  };

  update(source) {
    var duration = (d3.event && d3.event.altKey) || 100;

    // Compute the new tree layout.
    this.root.children = this.root.left.concat(this.root.right);
    this.root._children = null;
    var nodes = this.toArray(this.root, [], 1);

    // Normalize for fixed-depth.
    //nodes.forEach(function(d) { d.y = d.depth * 180; });

    // Update the nodes…
    var node = this.container.selectAll("g.node")
      .data(nodes, function (d: any, i) {
        return d.id || (d.id = ++i);
      });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("svg:g")
      .attr("class", function (d: any) {
        return d.selected ? "node selected" : "node";
      })
      .attr("transform", function (d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
      })
    // .on("click", this.clicked);

    // nodeEnter.append("svg:circle")
    //     .attr("r", 1e-6);
    nodeEnter.append("svg:rect")
      .attr("width", function (d: any) {
        return d.name.length * 7
      })
      .attr("height", 20)
      .attr("stroke-width", 1)
      // .attr("stroke", 'rgb(0,0,0)')
      .attr("y", "-10")
      .style("fill", function (d: any) {
        if (d.type == "DIS") {
          return '#C64E39';
        } else if (d.type == "DSP") {
          return '#39B1C6';
        } else if (d.type == "SDSI") {
          return '#397bc6';
        } else {
          return '#c6a739';
        }
      });
    console.log(this.container);
    this.bbox = (this.container.node() as any).getBBox();
    console.log(this.bbox);
    this.vx = this.bbox.x;		// container x co-ordinate
    this.vy = this.bbox.y;		// container y co-ordinate
    this.vw = this.bbox.width;	// container width
    this.vh = this.bbox.height;	// container height
    this.defaultView = "" + this.vx + " " + this.vy + " " + this.vw + " " + this.vh;
    this.container
      .attr("viewBox", this.defaultView)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .call(this.zoom);
    //.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

    nodeEnter.append("svg:text")
      .attr("class", "node-text")
      // .attr("x", function (d) {
      //     return d.children || d._children ? -10 : 10;
      // })
      //            .attr("dy", ".35em")
      //            .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
      .attr("dy", 4)
      .attr("dx", 1)
      .attr("text-anchor", "start")
      .text(function (d: any) {
        return (d.name || d.text);
      })
      .style("fill-opacity", 1)
      .style("fill", "white");

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
      //.attr("class", function(d){ return d.selected?"node selected":"node"; })
      .duration(duration)
      .attr("transform", function (d: any) {
        return "translate(" + d.y + "," + d.x + ")";
      });

    nodeUpdate.select("text")
      .text(function (d: any) {
        return (d.name || d.text);
      });

    // nodeUpdate.select("circle")
    //     .attr("r", 4.5);
    nodeUpdate.select("rect")
      .attr("width", function (d: any) {
        return d.name.length * 7
      })
      .attr("height", 20);
    //.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

    /*
            nodeUpdate.select("text")
                .attr("dy", 14)
                .attr("text-anchor", "middle")
                .style("fill-opacity", 1);
    */

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function (d) {
        return "translate(" + source.y + "," + source.x + ")";
      })
      .remove();

    // nodeExit.select("circle")
    //     .attr("r", 1e-6);

    nodeExit.select("rect")
      .attr("width", function (d: any) {
        return d.name.length * 6.5
      })
      .attr("height", 20);

    nodeExit.select("text")
      .style("fill-opacity", 1e-6);

    // Update the links…
    var hierarchy = d3.hierarchy(this.data);
    console.log(hierarchy);
    console.log(this.tree(hierarchy).links());
    var link = this.container.selectAll("path.link")
      .data(this.tree(hierarchy).links(), function (d: any) {
        return d.target.id;
      });

    // Enter any new links at the parent's previous position.
    link.enter().insert("svg:path", "g")
      .attr("class", "link")
      .attr("d", function(d) {
        console.log(this);
        var o = {
          x: source.x0,
          y: source.y0
        };
        return this.connector({
          source: o,
          target: o,
          name: source.name
        }).bind(this);
      })
      .transition()
      .duration(duration)
      .attr("d", this.connector);

    // Transition links to their new position.
    link.transition()
      .duration(duration)
      .attr("d", this.connector);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
        var o = {
          x: source.x,
          y: source.y
        };
        return this.connector({
          source: o,
          target: o,
          name: source.name
        });
      })
      .remove();

    // Stash the old positions for transition.
    nodes.forEach(function (d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  // Toggle children.
  toggle(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
  }

  // Query Database
  queryServer = function (q_type, q_symptom) {
    let data;
    if (q_type === 'ingredient') {
      data = {
        query: `Match (a:SDSI)-[b:is_effective_for]-(c:DIS {name:'${q_symptom}'}) return a, b, c limit 10;`
      }
    } else {
      data = {
        query: `Match (a:DSP)-[:has_ingredient]-(SDSI)-[b:is_effective_for]-(c:DIS {name:'${q_symptom}'}) return a, b, c limit 10;`
      }
    }


    fetch("http://54.196.96.108:5001/api/v1/query", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        'content-type': 'application/json'
      },
    }).then(res => {
      return res.json();
    }).then(res => {
      console.log(res.graph);
      let json = this.transformGraphToMindmap(res.graph, q_type);
      this.loadGraph(json);
    });
  }

  transformGraphToMindmap = function (graph, q_type) {
    let nodes = {};
    let relationships = {};
    graph.forEach(pair => {
      if (!nodes[pair.nodes[0].labels[0]]) {
        nodes[pair.nodes[0].labels[0]] = {};
      }
      nodes[pair.nodes[0].labels[0]][pair.nodes[0].id] = pair.nodes[0];

      if (!nodes[pair.nodes[1].labels[0]]) {
        nodes[pair.nodes[1].labels[0]] = {};
      }
      nodes[pair.nodes[1].labels[0]][pair.nodes[1].id] = pair.nodes[1];

      if (!relationships[pair.relationships[0].type]) {
        relationships[pair.relationships[0].type] = [];
      }
      relationships[pair.relationships[0].type][pair.relationships[0].id] = pair.relationships[0];
    });
    console.log(nodes);
    console.log(relationships);
    let root = {
      name: "Root",
      children: []
    }

    if (q_type === "ingredient") {
      for (var key in nodes['DIS']) {
        root.children.push({
          name: nodes['DIS'][key].properties.name,
          id: nodes['DIS'][key].id,
          type: 'DIS'
        });
      }

      let SDSIArray = [];
      for (var key in nodes['SDSI']) {
        SDSIArray.push({
          name: nodes['SDSI'][key].properties.name,
          id: nodes['SDSI'][key].id,
          type: 'SDSI'
        });
      }
      root.children[0].children = SDSIArray;
    } else if (q_type === "production") {
      for (var key in nodes['DIS']) {
        root.children.push({
          name: nodes['DIS'][key].properties.name,
          id: nodes['DIS'][key].id,
          type: 'DIS'
        });
      }

      let DSPArray = [];
      for (var key in nodes['DSP']) {
        DSPArray.push({
          name: nodes['DSP'][key].properties.name,
          id: nodes['DSP'][key].id,
          type: 'DSP'
        });
      }
      root.children[0].children = DSPArray;
    }

    return root;
  }

  //*
  loadGraph = function (json) {
    //d3.json("/data/data.json", function(json) {
    var i = 0,
      l = json.children.length;
    this.data = this.root = json;
    this.root.x0 = this.h / 2;
    this.root.y0 = 0;

    json.left = [];
    json.right = [];
    for (; i < l; i++) {
      if (i % 2) {
        json.left.push(json.children[i]);
        json.children[i].position = 'left';
      } else {
        json.right.push(json.children[i]);
        json.children[i].position = 'right';
      }
    }

    this.update(this.root);
    // this.selectNode(this.root);
  };
  //*/

  // getTransform(node, xScale) {
  //   var bbox = node.node().getBBox();
  //   console.log(bbox);
  //   var bx = d3.interpolateTransformSvg(node.attr("transform")).translate[0];
  //   var by = d3.transform(node.attr("transform")).translate[1];
  //   var bw = bbox.width;
  //   var bh = bbox.height;
  //   var tx = this.vx + this.vw / 2 - bx * xScale + bw * xScale / 2;
  //   var ty = this.vy + this.vh / 2 - by * xScale - bh * xScale / 2;
  //   console.log(bx);
  //   console.log(by);
  //   return {
  //     translate: [tx, ty],
  //     scale: xScale
  //   }
  // }

  // clicked(d, i) {
  //   if (d3.event.defaultPrevented) {
  //     return; // panning, not clicking
  //   }
  //   console.log(this);
  //   var node = d3.select(this);
  //   this.select(this);
  //   var transform = this.getTransform(node, this.clickScale);
  //   this.container.transition().duration(1000)
  //     .attr("transform", "translate(" + transform.translate + ")scale(" + transform.scale + ")");
  //   this.zoom.scale(transform.scale)
  //     .translate(transform.translate);
  //   this.scale = transform.scale;
  //   this.update(d);
  // }

  type = 'ingredient';
  symptom = 'Diabetes';

  chooseSearchType = function (_type) {
    console.log(_type);
    this.type = _type;
    this.queryServer(this.type, this.symptom);
  }

  chooseSymptom = function (_symptom) {
    console.log(_symptom);
    this.symptom = _symptom;
    this.queryServer(this.type, this.symptom);
  }

}
