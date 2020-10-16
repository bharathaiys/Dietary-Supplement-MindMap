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

    function update(source) {

      // Assigns the x and y position for the nodes
      var treeData = treemap(root);

      // Compute the new tree layout.
      var nodes = treeData.descendants(),
        links = treeData.descendants().slice(1);

      // Normalize for fixed-depth.
      nodes.forEach(function (d) { d.y = d.depth * 180 });

      // ****************** Nodes section ***************************

      // Update the nodes...
      var node = view.selectAll('g.node')
        .data(nodes, function (d: any) { return d.id || (d.id = ++i); });

      // Enter any new modes at the parent's previous position.
      var nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", function (d) {
          return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on('click', click);

      // Add Circle for the nodes
      nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 1e-6)
        .style("fill", function (d: any) {
          return d._children ? "lightsteelblue" : "#fff";
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
        .duration(duration)
        .attr("transform", function (d) {
          return "translate(" + d.y + "," + d.x + ")";
        });

      // Update the node attributes and style
      nodeUpdate.select('circle.node')
        .attr('r', 10)
        .style("fill", function (d: any) {
          return d._children ? "lightsteelblue" : "#fff";
        })
        .attr('cursor', 'pointer');


      // Remove any exiting nodes
      var nodeExit = node.exit().transition()
        .duration(duration)
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
      var link = view.selectAll('path.link')
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
        .duration(duration)
        .attr('d', function (d) { return diagonal(d, d.parent) });

      // Remove any exiting links
      var linkExit = link.exit().transition()
        .duration(duration)
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
        // var transform = getTransform(node, this.clickScale);
        // view.transition().duration(1000)
        //   .attr("transform", "translate(" + transform.translate + ")");
        // d3.zoomIdentity.translate(transform.translate[0], transform.translate[1]);
        update(d);
        getTransform(d);
      }
      var duration = 1000;
      function getTransform(source) {
        var t = d3.zoomTransform(svg.node());
        var x = -source.y0;
        var y = -source.x0;
        var x = x * t.k + width / 2;
        var y = y * t.k + height / 2;
        d3.select('svg').transition().duration(duration)
          .call(zoom.transform, d3.zoomIdentity.translate(x, y).scale(t.k));
      }
    }
      // Query Database
      var queryServer = function (q_type, q_symptom) {
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
          let json = transformGraphToMindmap(res.graph, q_type);
          loadGraph(json);
        });
      }

      var transformGraphToMindmap = function (graph, q_type) {
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
  
    queryServer(this.type, this.sympton);
  }

  loadGraph = function (json) {
    //d3.json("/data/data.json", function(json) {
    console.log(json);
    this.root = d3.hierarchy(json, function (d) { return d.children; });
    this.root.x0 = this.height / 2;
    root.y0 = 0;
    update(root);
  };
}
