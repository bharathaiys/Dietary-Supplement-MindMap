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
  ngOnInit(): void {
    var treeData =
    {
      "name": "Top Level",
      "children": [
      ]
    };

    // Set the dimensions and margins of the diagram
    var margin = { top: 20, right: 90, bottom: 30, left: 90 },
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
    root = d3.hierarchy(treeData, function (d) { return d.children; });
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
}
