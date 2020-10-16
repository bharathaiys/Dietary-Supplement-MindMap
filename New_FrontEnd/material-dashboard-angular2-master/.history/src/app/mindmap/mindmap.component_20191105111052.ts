import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import 'd3-scale';
import 'd3-transform';
import 'd3-selection';

@Component({
  selector: 'app-mindmap',
  templateUrl: './mindmap.component.html',
  styleUrls: ['./mindmap.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MindmapComponent implements OnInit {
  ngOnInit(): void {
    var treeData =
  {
    "name": "Top Level",
    "children": [
      { 
        "name": "Level 2: A",
        "children": [
          { "name": "Son of A" },
          { "name": "Daughter of A" }
        ]
      },
      { "name": "Level 2: B" }
    ]
  };

// Set the dimensions and margins of the diagram
var margin = {top: 20, right: 90, bottom: 30, left: 90},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg = d3.select("#body").append("svg")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom);
  
var view = svg.append("g")
              .attr("class", "container")
              .attr("x", 0.5)
              .attr("y", 0.5)
              .attr("width", width - 1)
              .attr("height", height - 1)
              .attr("transform", "translate("
                    + margin.left + "," + margin.top + ")");

var zoom = d3.zoom()
             .scaleExtent([0.1, 40])
            //  .translateExtent([[-1000, -1000], [width + 90, height + 100]])
             .on("zoom", zoomed);


function zoomed() {
    console.log("zoomed");
    console.log(d3.event.transform);
    view.attr("transform", d3.event.transform);
}

svg.call(zoom);

var i = 0,
    duration = 750,
    root;

// declares a tree layout and assigns the size
var treemap = d3.tree().size([height, width]);

// Assigns parent, children, height, depth
root = d3.hierarchy(treeData, function(d) { return d.children; });
root.x0 = height / 2;
root.y0 = 0;

// Collapse after the second level
//root.children.forEach(collapse);

update(root);

// Collapse the node and all it's children
// function collapse(d) {
//   if(d.children) {
//     d._children = d.children
//     d._children.forEach(collapse)
//     d.children = null
//   }
// }

function update(source) {

  // Assigns the x and y position for the nodes
  var treeData = treemap(root);

  // Compute the new tree layout.
  var nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);

  // Normalize for fixed-depth.
  nodes.forEach(function(d){ d.y = d.depth * 180});

  // ****************** Nodes section ***************************

  // Update the nodes...
  var node = view.selectAll('g.node')
      .data(nodes, function(d:any) {return d.id || (d.id = ++i); });

  // Enter any new modes at the parent's previous position.
  var nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr("transform", function(d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
    })
    .on('click', click);

  // Add Circle for the nodes
  nodeEnter.append('circle')
      .attr('class', 'node')
      .attr('r', 1e-6)
      .style("fill", function(d: any) {
          return d._children ? "lightsteelblue" : "#fff";
      });

  // Add labels for the nodes
  nodeEnter.append('text')
      .attr("dy", ".35em")
      .attr("x", function(d: any) {
          return d.children || d._children ? -13 : 13;
      })
      .attr("text-anchor", function(d: any) {
          return d.children || d._children ? "end" : "start";
      })
      .text(function(d: any) { return d.data.name; });

  // UPDATE
  var nodeUpdate = nodeEnter.merge(node);

  // Transition to the proper position for the node
  nodeUpdate.transition()
    .duration(duration)
    .attr("transform", function(d) { 
        return "translate(" + d.y + "," + d.x + ")";
     });

  // Update the node attributes and style
  nodeUpdate.select('circle.node')
    .attr('r', 10)
    .style("fill", function(d: any) {
        return d._children ? "lightsteelblue" : "#fff";
    })
    .attr('cursor', 'pointer');


  // Remove any exiting nodes
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) {
          return "translate(" + source.y + "," + source.x + ")";
      })
      .remove();

  // On exit reduce the node circles size to 0
  nodeExit.select('circle')
    .attr('r', 1e-6);

  // On exit reduce the opacity of text labels
  nodeExit.select('text')
    .style('fill-opacity', 1e-6);

  // ****************** links section ***************************

  // Update the links...
  var link = view.selectAll('path.link')
      .data(links, function(d: any) { return d.id; });

  // Enter any new links at the parent's previous position.
  var linkEnter = link.enter().insert('path', "g")
      .attr("class", "link")
      .attr('d', function(d){
        var o = {x: source.x0, y: source.y0}
        return diagonal(o, o)
      });

  // UPDATE
  var linkUpdate = linkEnter.merge(link);

  // Transition back to the parent element position
  linkUpdate.transition()
      .duration(duration)
      .attr('d', function(d){ return diagonal(d, d.parent) });

  // Remove any exiting links
  var linkExit = link.exit().transition()
      .duration(duration)
      .attr('d', function(d) {
        var o = {x: source.x, y: source.y}
        return diagonal(o, o)
      })
      .remove();

  // Store the old positions for transition.
  nodes.forEach(function(d: any){
    d.x0 = d.x;
    d.y0 = d.y;
  });

  // Creates a curved (diagonal) path from parent to the child nodes
  function diagonal(s, d) {

    var path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`

    return path
  }

  // Toggle children on click.
  function click(d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }

    if (d3.event.defaultPrevented) {
      return; // panning, not clicking
    }
    console.log(this);
    var node = d3.select(this);
    var transform = getTransform(node, this.clickScale);
    view.transition().duration(1000)
      .attr("transform", "translate(" + transform.translate + ")scale(" + transform.scale + ")");
    d3.zoomIdentity.translate(transform.translate[0], transform.translate[1]);
    update(d);
  }

  function getTransform(node, xScale) {
    var bbox = node.node().getBBox();
    console.log(bbox);
    console.log(d3.zoomTransform(node));
    console.log(d3.zoomTransform(node));
    var bx = d3.zoomTransform(node).translate[0];
    var by = d3.zoomTransform(node).translate[1];
    var bw = bbox.width;
    var bh = bbox.height;
    var tx = width / 2 - bx * xScale + bw * xScale / 2;
    var ty = height / 2 - by * xScale - bh * xScale / 2;
    console.log(bx);
    console.log(by);
    return {
      translate: [tx, ty],
      scale: xScale
    }
  }
}

  }

  // @ViewChild('chart', { static: false }) chartElement: ElementRef;
  // constructor() { }
  // root;
  // ngOnInit() {
  //   this.tree = d3.tree().size([this.h, this.w]);
  //   // this.zoom = d3.zoom()
  //   //   .scaleExtent([1, 5]).on("zoom", this.zoomed);
  //   this.vis = d3.select(".svg-container")
  //     .append("svg:svg")
  //     .attr("width", this.width)
  //     .attr("height", this.height)
  //     .style("background", '#F5F5DC');
  //     // .call(this.zoom);
  //   this.container = this.vis.append("svg:g")
  //     .attr("id", "container")
  //     .attr("transform", "translate(0,0)scale(1,1)");
  //   this.queryServer(this.type, this.symptom);
  // }

  // m = [20, 120, 20, 120];
  // w = 900 - this.m[1] - this.m[3];
  // h = 500 - this.m[0] - this.m[2];
  // i = 0;
  // margin = { top: 0, right: 0, bottom: 0, left: 0 };
  // width = '100%';		// canvas width
  // height = 480;		// canvas height
  // data;
  // bbox;
  // viewBox;
  // vx;
  // vy;
  // vw;
  // vh;
  // defaultView;
  // clickScale = 2;

  // getDirection = function (data) {
  //   if (!data) {
  //     return 'root';
  //   }
  //   if (data.position) {
  //     return data.position;
  //   }
  //   return this.getDirection(data.parent);
  // };

  // // selectNode = function (target) {
  // //   if (target) {
  // //     var sel = d3.selectAll('#body svg .node').filter(function (d: any) {
  // //       return d.id == target.id
  // //     })[0][0];
  // //     if (sel) {
  // //       this.select(sel);
  // //     }
  // //   }
  // // };


  // select = function (node) {
  //   // Find previously selected, unselect
  //   d3.select(".selected").classed("selected", false);
  //   // Select current item
  //   d3.select(node).classed("selected", true);
  // };

  // tree;

  // calcLeft(d) {
  //   console.log(d);
  //   var l = d.y;
  //   if (d.position === 'left') {
  //     l = (d.y) - this.w / 2;
  //     l = (this.w / 2) + l;
  //   }
  //   return {
  //     x: d.x,
  //     y: l
  //   };
  // };

  // connector = function (s) {
  //   var d = s.parent;
  //   var path = `M ${s.y} ${s.x}
  //           C ${(s.y + d.y) / 2} ${s.x},
  //             ${(s.y + d.y) / 2} ${d.x},
  //             ${d.y} ${d.x}`

  //   return path;
  // };

  // // zoomed() {
  // //   var translateX = d3.event.translate[0];
  // //   var translateY = d3.event.translate[1];
  // //   var xScale = d3.event.scale;
  // //   this.container.attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + xScale + ")");
  // // }

  // scale = 1.0;

  // zoom;

  // vis;

  // container;


  // toArray = function (item, arr, d) {
  //   arr = arr || [];
  //   var dr = d || 1;
  //   var i = 0,
  //     l = item.children ? item.children.length : 0;
  //   arr.push(item);
  //   if (item.position && item.position === 'left') {
  //     dr = -1;
  //   }
  //   item.y = dr * item.y;
  //   for (; i < l; i++) {
  //     this.toArray(item.children[i], arr, dr);
  //   }
  //   return arr;
  // };
  // record_source;
  // update(source) {
  //   this.record_source = source;
  //   var duration = (d3.event && d3.event.altKey) || 100;
  //   this.root = d3.hierarchy(this.data, function(d) { return d.children; });
  //   this.root.x0 = this.height / 2;
  //   this.root.y0 = 0;
  //   var treeData = this.tree(this.root);
  //   // Compute the new tree layout.
  //   var nodes = treeData.descendants(),
  //       links = treeData.descendants().slice(1);
  //   console.log(nodes);
  //   console.log(links);
  //   // Compute the new tree layout.
  //   // this.root.children = this.root.left.concat(this.root.right);
  //   // this.root._children = null;
  //   // var nodes = this.toArray(this.root, [], 1);

  //   // Normalize for fixed-depth.
  //   nodes.forEach(function(d) { d.y = d.depth * 180; });

  //   // Update the nodes…
  //   var node = this.container.selectAll("g.node")
  //     .data(nodes, function (d: any) {
  //       return d.data.id || (d.data.id = ++this.i);
  //     });

  //   // Enter any new nodes at the parent's previous position.
  //   var nodeEnter = node.enter().append("svg:g")
  //     .attr("class", function (d: any) {
  //       return d.selected ? "node selected" : "node";
  //     })
  //     .attr("transform", function (d) {
  //       return "translate(" + source.y0 + "," + source.x0 + ")";
  //     })
  //   // .on("click", this.clicked);

  //   // nodeEnter.append("svg:circle")
  //   //     .attr("r", 1e-6);
  //   nodeEnter.append("svg:rect")
  //     .attr("width", function (d: any) {
  //       console.log(d);
  //       return d.data.name.length * 7
  //     })
  //     .attr("height", 20)
  //     .attr("stroke-width", 1)
  //     // .attr("stroke", 'rgb(0,0,0)')
  //     .attr("y", "-10")
  //     .style("fill", function (d: any) {
  //       if (d.type == "DIS") {
  //         return '#C64E39';
  //       } else if (d.type == "DSP") {
  //         return '#39B1C6';
  //       } else if (d.type == "SDSI") {
  //         return '#397bc6';
  //       } else {
  //         return '#c6a739';
  //       }
  //     });
  //   console.log(this.container);
  //   this.bbox = (this.container.node() as any).getBBox();
  //   console.log(this.bbox);
  //   this.vx = this.bbox.x;		// container x co-ordinate
  //   this.vy = this.bbox.y;		// container y co-ordinate
  //   this.vw = this.bbox.width;	// container width
  //   this.vh = this.bbox.height;	// container height
  //   this.defaultView = "" + this.vx + " " + this.vy + " " + this.vw + " " + this.vh;
  //   this.container
  //     .attr("viewBox", this.defaultView)
  //     .attr("preserveAspectRatio", "xMidYMid meet");
  //     // .call(this.zoom);
  //   //.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  //   nodeEnter.append("svg:text")
  //     .attr("class", "node-text")
  //     // .attr("x", function (d) {
  //     //     return d.children || d._children ? -10 : 10;
  //     // })
  //     //            .attr("dy", ".35em")
  //     //            .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
  //     .attr("dy", 4)
  //     .attr("dx", 1)
  //     .attr("text-anchor", "start")
  //     .text(function (d: any) {
  //       return (d.data.name || d.data.text);
  //     })
  //     .style("fill-opacity", 1)
  //     .style("fill", "white");

  //   // Transition nodes to their new position.
  //   var nodeUpdate = node.transition()
  //     //.attr("class", function(d){ return d.selected?"node selected":"node"; })
  //     .duration(duration)
  //     .attr("transform", function (d: any) {
  //       return "translate(" + d.y + "," + d.x + ")";
  //     });

  //   nodeUpdate.select("text")
  //     .text(function (d: any) {
  //       return (d.name || d.text);
  //     });

  //   // nodeUpdate.select("circle")
  //   //     .attr("r", 4.5);
  //   nodeUpdate.select("rect")
  //     .attr("width", function (d: any) {
  //       return d.name.length * 7
  //     })
  //     .attr("height", 20);
  //   //.style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

  //   /*
  //           nodeUpdate.select("text")
  //               .attr("dy", 14)
  //               .attr("text-anchor", "middle")
  //               .style("fill-opacity", 1);
  //   */

  //   // Transition exiting nodes to the parent's new position.
  //   var nodeExit = node.exit().transition()
  //     .duration(duration)
  //     .attr("transform", function (d) {
  //       return "translate(" + source.y + "," + source.x + ")";
  //     })
  //     .remove();

  //   // nodeExit.select("circle")
  //   //     .attr("r", 1e-6);

  //   nodeExit.select("rect")
  //     .attr("width", function (d: any) {
  //       return d.name.length * 6.5
  //     })
  //     .attr("height", 20);

  //   nodeExit.select("text")
  //     .style("fill-opacity", 1e-6);

  //   // Update the links…
  //   var link = this.container.selectAll("path.link")
  //     .data(links, function (d: any) {
  //       console.log(d);
  //       return d.data.id;
  //     });
  
  //   console.log(source);
  //   var cal = (d) => {
  //     // console.log(source);
  //     console.log(this);
  //       console.log(this.record_source);
  //       var o = {
  //         x: this.record_source.x0,
  //         y: this.record_source.y0
  //       };
  //       var path = `M ${o.y} ${o.x}
  //           C ${(o.y + o.y) / 2} ${o.x},
  //             ${(o.y + o.y) / 2} ${o.x},
  //             ${o.y} ${o.x}`

  //   return path;
  //   }
  //   // Enter any new links at the parent's previous position.
  //   link.enter().insert("svg:path", "g")
  //     .attr("class", "link")
  //     .attr("d", cal.bind(this))
  //     .transition()
  //     .duration(duration)
  //     .attr("d", this.connector.bind(this));

  //   // Transition links to their new position.
  //   link.transition()
  //     .duration(duration)
  //     .attr("d", this.connector.bind(this));

  //   // Transition exiting nodes to the parent's new position.
  //   link.exit().transition()
  //     .duration(duration)
  //     .attr("d", cal.bind(this))
  //     .remove();

  //   // Stash the old positions for transition.
  //   nodes.forEach(function (d) {
  //     d.x0 = d.x;
  //     d.y0 = d.y;
  //   });
  // }

  // // Toggle children.
  // toggle(d) {
  //   if (d.children) {
  //     d._children = d.children;
  //     d.children = null;
  //   } else {
  //     d.children = d._children;
  //     d._children = null;
  //   }
  // }

  // // Query Database
  // queryServer = function (q_type, q_symptom) {
  //   let data;
  //   if (q_type === 'ingredient') {
  //     data = {
  //       query: `Match (a:SDSI)-[b:is_effective_for]-(c:DIS {name:'${q_symptom}'}) return a, b, c limit 10;`
  //     }
  //   } else {
  //     data = {
  //       query: `Match (a:DSP)-[:has_ingredient]-(SDSI)-[b:is_effective_for]-(c:DIS {name:'${q_symptom}'}) return a, b, c limit 10;`
  //     }
  //   }


  //   fetch("http://54.196.96.108:5001/api/v1/query", {
  //     method: "POST",
  //     body: JSON.stringify(data),
  //     headers: {
  //       'content-type': 'application/json'
  //     },
  //   }).then(res => {
  //     return res.json();
  //   }).then(res => {
  //     console.log(res.graph);
  //     let json = this.transformGraphToMindmap(res.graph, q_type);
  //     this.loadGraph(json);
  //   });
  // }

  // transformGraphToMindmap = function (graph, q_type) {
  //   let nodes = {};
  //   let relationships = {};
  //   graph.forEach(pair => {
  //     if (!nodes[pair.nodes[0].labels[0]]) {
  //       nodes[pair.nodes[0].labels[0]] = {};
  //     }
  //     nodes[pair.nodes[0].labels[0]][pair.nodes[0].id] = pair.nodes[0];

  //     if (!nodes[pair.nodes[1].labels[0]]) {
  //       nodes[pair.nodes[1].labels[0]] = {};
  //     }
  //     nodes[pair.nodes[1].labels[0]][pair.nodes[1].id] = pair.nodes[1];

  //     if (!relationships[pair.relationships[0].type]) {
  //       relationships[pair.relationships[0].type] = [];
  //     }
  //     relationships[pair.relationships[0].type][pair.relationships[0].id] = pair.relationships[0];
  //   });
  //   console.log(nodes);
  //   console.log(relationships);
  //   let root = {
  //     name: "Root",
  //     children: []
  //   }

  //   if (q_type === "ingredient") {
  //     for (var key in nodes['DIS']) {
  //       root.children.push({
  //         name: nodes['DIS'][key].properties.name,
  //         id: nodes['DIS'][key].id,
  //         type: 'DIS'
  //       });
  //     }

  //     let SDSIArray = [];
  //     for (var key in nodes['SDSI']) {
  //       SDSIArray.push({
  //         name: nodes['SDSI'][key].properties.name,
  //         id: nodes['SDSI'][key].id,
  //         type: 'SDSI'
  //       });
  //     }
  //     root.children[0].children = SDSIArray;
  //   } else if (q_type === "production") {
  //     for (var key in nodes['DIS']) {
  //       root.children.push({
  //         name: nodes['DIS'][key].properties.name,
  //         id: nodes['DIS'][key].id,
  //         type: 'DIS'
  //       });
  //     }

  //     let DSPArray = [];
  //     for (var key in nodes['DSP']) {
  //       DSPArray.push({
  //         name: nodes['DSP'][key].properties.name,
  //         id: nodes['DSP'][key].id,
  //         type: 'DSP'
  //       });
  //     }
  //     root.children[0].children = DSPArray;
  //   }

  //   return root;
  // }

  // //*
  // loadGraph = function (json) {
  //   //d3.json("/data/data.json", function(json) {
  //   var i = 0,
  //     l = json.children.length;
  //   this.data = this.root = json;
  //   this.root.x0 = this.h / 2;
  //   this.root.y0 = 0;

  //   json.left = [];
  //   json.right = [];
  //   for (; i < l; i++) {
  //     if (i % 2) {
  //       json.left.push(json.children[i]);
  //       json.children[i].position = 'left';
  //     } else {
  //       json.right.push(json.children[i]);
  //       json.children[i].position = 'right';
  //     }
  //   }

  //   this.update(this.root);
  //   // this.selectNode(this.root);
  // };
  // //*/

  // // getTransform(node, xScale) {
  // //   var bbox = node.node().getBBox();
  // //   console.log(bbox);
  // //   var bx = d3.interpolateTransformSvg(node.attr("transform")).translate[0];
  // //   var by = d3.transform(node.attr("transform")).translate[1];
  // //   var bw = bbox.width;
  // //   var bh = bbox.height;
  // //   var tx = this.vx + this.vw / 2 - bx * xScale + bw * xScale / 2;
  // //   var ty = this.vy + this.vh / 2 - by * xScale - bh * xScale / 2;
  // //   console.log(bx);
  // //   console.log(by);
  // //   return {
  // //     translate: [tx, ty],
  // //     scale: xScale
  // //   }
  // // }

  // // clicked(d, i) {
  // //   if (d3.event.defaultPrevented) {
  // //     return; // panning, not clicking
  // //   }
  // //   console.log(this);
  // //   var node = d3.select(this);
  // //   this.select(this);
  // //   var transform = this.getTransform(node, this.clickScale);
  // //   this.container.transition().duration(1000)
  // //     .attr("transform", "translate(" + transform.translate + ")scale(" + transform.scale + ")");
  // //   this.zoom.scale(transform.scale)
  // //     .translate(transform.translate);
  // //   this.scale = transform.scale;
  // //   this.update(d);
  // // }

  // type = 'ingredient';
  // symptom = 'Diabetes';

  // chooseSearchType = function (_type) {
  //   console.log(_type);
  //   this.type = _type;
  //   this.queryServer(this.type, this.symptom);
  // }

  // chooseSymptom = function (_symptom) {
  //   console.log(_symptom);
  //   this.symptom = _symptom;
  //   this.queryServer(this.type, this.symptom);
  // }

}
