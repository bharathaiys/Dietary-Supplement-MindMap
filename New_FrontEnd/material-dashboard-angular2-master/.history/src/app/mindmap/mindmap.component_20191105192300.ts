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
  type = "production";
  sympton = "Diabetes";
  root;
  svg;
  view;
  treemap;
  zoom;
  i = 0;
  width;
  height;
  margin;
  ngOnInit(): void {
    var treeData =
    {
      "name": "Top Level",
      "children": [
      ]
    };

    // Set the dimensions and margins of the diagram
    this.margin = { top: 20, right: 90, bottom: 30, left: 90 };
    this.width = 950 - this.margin.left - this.margin.right;
    this.height = 500 - this.margin.top - this.margin.bottom;

    // append the svg object to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    this.svg = d3.select("#body").append("svg")
      .attr("width", this.width + this.margin.right + this.margin.left)
      .attr("height", this.height + this.margin.top + this.margin.bottom);

    this.view = this.svg.append("g")
      .attr("class", "container")
      .attr("x", 0.5)
      .attr("y", 0.5)
      .attr("width", this.width - 1)
      .attr("height", this.height - 1)
      .attr("transform", "translate("
        + this.margin.left + "," + this.margin.top + ")");

    this.zoom = d3.zoom()
      .scaleExtent([0.1, 40])
      //  .translateExtent([[-1000, -1000], [width + 90, height + 100]])
      .on("zoom", this.zoomed.bind(this));

    this.svg.call(this.zoom);

    // declares a tree layout and assigns the size
    this.treemap = d3.tree().size([this.height, this.width]);

    // Assigns parent, children, height, depth
    this.root = d3.hierarchy(treeData, function (d) { return d.children; });
    this.root.x0 = this.height / 2;
    this.root.y0 = 0;

    // this.update(this.root);

    this.queryServer(this.type, this.sympton);
  }

  loadGraph = function (json) {
    //d3.json("/data/data.json", function(json) {
    console.log(json);
    this.root = d3.hierarchy(json, function (d) { return d.children; });
    this.root.x0 = this.height / 2;
    this.root.y0 = 0;
    this.update(this.root);
  };

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
          type: 'SDSI',
          background: nodes['SDSI'][key].properties.background
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

  update(source) {

    // Assigns the x and y position for the nodes
    var treeData = this.treemap(this.root);

    // Compute the new tree layout.
    var nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);

    // Normalize for fixed-depth.
    nodes.forEach(function (d) { d.y = d.depth * 180 });

    // ****************** Nodes section ***************************

    // Update the nodes...
    var node = this.view.selectAll('g.node')
      .data(nodes, function (d: any) { return d.id || (d.id = ++this.i); });

    // Enter any new modes at the parent's previous position.
    var nodeEnter = node.enter().append('g')
      .attr("class", function (d) {
        return "node";
      })
      .attr("id", function (d) {
        return "id_" + d.data.id;
      })
      .attr("transform", function (d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
      })
      .on('click', this.click.bind(this));

    // Add Circle for the nodes
    nodeEnter.append('circle')
      .attr("class", function (d) {
        return d.selected ? "node selected" : "node";
      })
      .attr('r', 1e-6)
      .style("fill", function (d: any) {
        console.log(d);
        if (d.data.type == "DIS") {
          return d._children ? "lightsteelblue" : "#C64E39";
        } else if (d.data.type == "DSP") {
          return d._children ? "lightsteelblue" : "#39B1C6";
        } else if (d.data.type == "SDSI") {
          return d._children ? "lightsteelblue" : "#397bc6";
        } else {
          return d._children ? "lightsteelblue" : "#c6a739";
        }

      });

    // Add labels for the nodes
    nodeEnter.append('text')
      .attr("dy", ".35em")
      .attr("x", function (d: any) {
        return d.children || d._children ? -13 : 13;
      })
      .attr("text-anchor", function (d: any) {
        return d.children || d._children ? "end" : "start";
      })
      .text(function (d: any) { return d.data.name; });

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
      .duration(500)
      .attr("transform", function (d) {
        return "translate(" + d.y + "," + d.x + ")";
      });

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
      .attr("class", function (d) {
        return d.selected ? "node selected" : "node";
      })
      .attr('r', 10)
      .style("fill", function (d: any) {
        if (d.data.type == "DIS") {
          return d._children ? "lightsteelblue" : "#C64E39";
        } else if (d.data.type == "DSP") {
          return d._children ? "lightsteelblue" : "#39B1C6";
        } else if (d.data.type == "SDSI") {
          return d._children ? "lightsteelblue" : "#397bc6";
        } else {
          return d._children ? "lightsteelblue" : "#c6a739";
        }
      })
      .attr('cursor', 'pointer');


    // Remove any exiting nodes
    var nodeExit = node.exit().transition()
      .duration(500)
      .attr("transform", function (d) {
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
    var link = this.view.selectAll('path.link')
      .data(links, function (d: any) { return d.id; });

    // Enter any new links at the parent's previous position.
    var linkEnter = link.enter().insert('path', "g")
      .attr("class", "link")
      .attr('d', function (d) {
        var o = { x: source.x0, y: source.y0 }
        return diagonal(o, o)
      });

    // UPDATE
    var linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
      .duration(500)
      .attr('d', function (d) { return diagonal(d, d.parent) });

    // Remove any exiting links
    var linkExit = link.exit().transition()
      .duration(500)
      .attr('d', function (d) {
        var o = { x: source.x, y: source.y }
        return diagonal(o, o)
      })
      .remove();

    // Store the old positions for transition.
    nodes.forEach(function (d: any) {
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
  }

  click(d) {
    console.log(d);
    // if (d.children || d._children) {
    //   if (d.children) {
    //     d._children = d.children;
    //     d.children = null;
    //   } else {
    //     d.children = d._children;
    //     d._children = null;
    //   }
    //   if (d3.event.defaultPrevented) {
    //     return; // panning, not clicking
    //   }
    //   console.log(this);
    //   this.update(d);
    // }
    this.select(d);
    console.log(this);
    this.getTransform(d);
  }

  getTransform(source) {
    var duration = 1000;
    var t = d3.zoomTransform(this.svg.node());
    var x = -source.y0;
    var y = -source.x0;
    var x = x * t.k + this.width / 2;
    var y = y * t.k + this.height / 2;
    d3.select('svg').transition().duration(duration)
      .call(this.zoom.transform, d3.zoomIdentity.translate(x, y).scale(t.k));
  }

  zoomed() {
    this.view.attr("transform", d3.event.transform);
  }

  selectedNode = {data:{
    name: "default",
    type: "default",
    background: "default",
  };

  select = function (node) {
    console.log(node);
    // Find previously selected, unselect
    this.selectedNode = node;
    d3.select(".selected").classed("selected", false);
    // Select current item
    d3.select("#id_" + node.data.id).classed("selected", true);
  }

  collapse(d) {
    console.log(d);
    if (d.children || d._children) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      // if (d3.event.defaultPrevented) {
      //   return;
      // }
      this.update(d);
    }
  }
}
