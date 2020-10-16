import { Component, OnInit, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import 'd3-scale';
import 'd3-transform';
import 'd3-selection';
import { MatMenuTrigger, MatSnackBar } from '@angular/material';
import * as ingrdt from './ingredient';
import * as disease from './disease';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: 'app-mindmap',
  templateUrl: './mindmap.component.html',
  styleUrls: ['./mindmap.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MindmapComponent implements OnInit {
  ingredCtrl = new FormControl();
  filteredingredient: Observable<any[]>;
  ingredient = ingrdt.ingredients;
  private ingredient_slice(value) {
    if (value == '') {
      return [];
    }
    return this.ingredient.slice();
  }
  query_i;
  private _filteringredient(value: string): any[] {
    const filterValue = value.toLowerCase();
    if (value == '') {
      return [];
    }
    return this.ingredient.filter(ingred => ingred.name.toLowerCase().indexOf(filterValue) === 0);
  }

  dsCtrl = new FormControl();
  filteredds: Observable<any[]>;
  ds = disease.disease;
  private ds_slice(value) {
    if (value == '') {
      return [];
    }
    return this.ds.slice();
  }
  
  private _filteringds(value: string): any[] {
    const filterValue = value.toLowerCase();
    if (value == '') {
      return [];
    }
    return this.ds.filter(ds => ds.name.toLowerCase().indexOf(filterValue) === 0);
  }

  constructor(private _snackBar: MatSnackBar, private route: ActivatedRoute) {
    this.ingredCtrl.setValue("Melatonin");
    console.log(this.ingredCtrl);
    this.filteredingredient = this.ingredCtrl.valueChanges
      .pipe(
        startWith(''),
        map(ingred => ingred ? this._filteringredient(ingred) : this.ingredient_slice(ingred))
      );
  }
  durationInSeconds = 5;
  openSnackBar() {
    this._snackBar.openFromComponent(ErrorComponent, {
      duration: this.durationInSeconds * 1000,
    });
  }

  @ViewChild(MatMenuTrigger, {static: false})
  contextMenu: MatMenuTrigger;

  contextMenuPosition = { x: '0px', y: '0px' };

  onContextMenu(event: MouseEvent) {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    this.contextMenu.openMenu();
  }

  onContextMenuAction1() {
    alert(`Click on Action 1 for`);
  }

  onContextMenuAction2() {
    alert(`Click on Action 2 for`);
  }

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
  nodeHash = {};
  record_json;
  problemId;
  ngOnInit(): void {

    this.problemId = this.route.snapshot.paramMap.get("id");

    console.log(this.problemId);

    var width = window.innerWidth
                || document.documentElement.clientWidth
                || document.body.clientWidth;

                var height = window.innerHeight
                || document.documentElement.clientHeight
                || document.body.clientHeight;

    console.log(width);
    console.log(height);

    width = width * 0.65;
    height = height * 0.55;

    var treeData =
    {
      "name": "Top Level",
      "children": [
      ]
    };

    // Set the dimensions and margins of the diagram
    this.margin = { top: 20, right: 90, bottom: 30, left: 90 };
    this.width = width - this.margin.left - this.margin.right;
    this.height = height - this.margin.top - this.margin.bottom;

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
    this.record_json = json;
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
      name: "",
      children: []
    }

    if (q_type === "ingredient") {
      for (var key in nodes['DIS']) {
        let tempNode = {
          name: nodes['DIS'][key].properties.name,
          id: nodes['DIS'][key].id,
          type: 'DIS'
        };
        this.nodeHash[nodes['DIS'][key].id] = tempNode;
        root.children.push(tempNode);
      }

      let SDSIArray = [];
      for (var key in nodes['SDSI']) {

        let tempNode = {
          name: nodes['SDSI'][key].properties.name,
          id: nodes['SDSI'][key].id,
          type: 'SDSI',
          background: nodes['SDSI'][key].properties.background
        };

        this.nodeHash[nodes['SDSI'][key].id] = tempNode;

        SDSIArray.push(tempNode);
      }
      root.children[0].children = SDSIArray;
    } else if (q_type === "production") {
      for (var key in nodes['DIS']) {
        let tempNode = {
          name: nodes['DIS'][key].properties.name,
          id: nodes['DIS'][key].id,
          type: 'DIS'
        };

        this.nodeHash[nodes['DIS'][key].id] = tempNode;
        root.children.push(tempNode);
      }

      let DSPArray = [];
      for (var key in nodes['DSP']) {

        let tempNode = {
          name: nodes['DSP'][key].properties.name,
          id: nodes['DSP'][key].id,
          type: 'DSP'
        };

        this.nodeHash[nodes['DSP'][key].id] = tempNode;

        DSPArray.push(tempNode);
      }
      root.children[0].children = DSPArray;
    }
    console.log(this.nodeHash);
    return root;
  }

  update(source) {
    console.log(this.root);
    // Assigns the x and y position for the nodes
    let treeData = this.treemap(this.root);
    console.log(treeData);
    // Compute the new tree layout.
    let nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);

    console.log(nodes);

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
        } else if (d.data.type == "PD") {
          return d._children ? "lightsteelblue" : "rgb(197, 82, 226)";
        } else if (d.data.type == "TC") {
          return d._children ? "lightsteelblue" : "#363";
        } else if (d.data.type == "SOC") {
          return d._children ? "lightsteelblue" : "#a739";
        } else if (d.data.type == "SS") {
          return d._children ? "lightsteelblue" : "#bc6";
        } else {
          return d._children ? "lightsteelblue" : "#c6a739";
        }

      });

    // Add labels for the nodes
    nodeEnter.append('text')
      .attr("dy", ".35em")
      .attr("x", function (d: any) {
        return d.children ? -13 : 13;
      })
      .attr("y", function (d: any) {
        console.log(d);
        return d.children ? -9 : 0;
      })
      .attr("text-anchor", function (d: any) {
        return d.children ? "end" : "start";
      })
      .text(function (d: any) { return d.data.name; });

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate
      // .transition()
      // .duration(500)
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
        } else if (d.data.type == "PD") {
          return d._children ? "lightsteelblue" : "rgb(197, 82, 226)";
        } else if (d.data.type == "TC") {
          return d._children ? "lightsteelblue" : "#363";
        } else if (d.data.type == "SOC") {
          return d._children ? "lightsteelblue" : "#a739";
        } else if (d.data.type == "SS") {
          return d._children ? "lightsteelblue" : "#bc6";
        } else {
          return d._children ? "lightsteelblue" : "#c6a739";
        }
      })
      .attr('cursor', 'pointer');


    // Remove any exiting nodes
    var nodeExit = node.exit()
      // .transition()
      // .duration(500)
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
    linkUpdate
      // .transition()
      // .duration(500)
      .attr('d', function (d) { return diagonal(d, d.parent) });

    // Remove any exiting links
    var linkExit = link.exit()
      // .transition()
      // .duration(500)
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

  reCenter() {
    var duration = 1000;
    var x = this.width / 2;
    var y = 0;
    d3.select('svg').transition().duration(duration)
      .call(this.zoom.transform, d3.zoomIdentity.translate(x, y));
  }

  zoomed() {
    this.view.attr("transform", d3.event.transform);
  }

  selectedNode = {
    data: {
      name: "default",
      type: "default",
      background: "default",
    }
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
      d3.select("#id_" + d.data.id)
      .attr("x", function (d: any) {
        console.log(d);
        return d.children ? -13 : 13;
      })
      .attr("y", function (d: any) {
        console.log(d);
        return d.children ? -9 : 0;
      })
      // if (d3.event.defaultPrevented) {
      //   return;
      // }
      this.update(d);
    }
  }

  atomNode = [
    'DIS_ATOM',
    'DSP_ATOM',
    'PD_ATOM',
    'SDSI_ATOM',
    'SOC_ATOM',
    'SS_ATOM',
    'TC_ATOM'
  ];

  findMore(d, type) {
    console.log(d);
    var data;
    if (type === 'all') {
      data = {
        query: `Match (a:${d.data.type} {name: '${d.data.name}'})-[b]-(c) return a, b, c limit 10;`
      }
    } else {
      data = {
        query: `Match (a:${d.data.type} {name: '${d.data.name}'})-[b]-(c: ${type}) return a, b, c limit 10;`
      }
    }

     
    console.log(data);

    fetch("http://54.196.96.108:5001/api/v1/query", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        'content-type': 'application/json'
      },
    }).then(res => {
      return res.json();
    }).then(res => {
      let selectedNode = this.nodeHash[d.data.id];
      console.log(selectedNode);
      if (res.graph  == 'None') {
        this.openSnackBar();
        return;
      }
      for (let nodes of res.graph) {

        console.log(nodes);
        if (!selectedNode.children) {
          selectedNode.children = [];
        }

        if (!this.nodeHash[nodes.nodes[0].id] && !this.atomNode.includes(nodes.nodes[0].labels[0])) { 
          let tempNode = {
            type: nodes.nodes[0].labels[0],
            name: nodes.nodes[0].properties.name,
            id: nodes.nodes[0].id
          };
          this.nodeHash[nodes.nodes[0].id] = tempNode;
          selectedNode.children.push(tempNode);
        }

        if (!this.nodeHash[nodes.nodes[1].id] && !this.atomNode.includes(nodes.nodes[1].labels[0])) {
          let tempNode = {
            type: nodes.nodes[1].labels[0],
            name: nodes.nodes[1].properties.name,
            id: nodes.nodes[1].id
          };
          this.nodeHash[nodes.nodes[1].id] = tempNode;
          selectedNode.children.push(tempNode);
        }
      }
      console.log(this.record_json);
      this.root = d3.hierarchy(this.record_json, function (d) { return d.children; });
      this.update(d);
      console.log(d3.select("circle.node"));
      d3.select(".gray").classed("gray", false);
      d3.selectAll("circle.node").classed("gray", true);

      selectedNode.children.forEach((el) => {
        d3.select("#id_" + el.id).select(".node").classed("gray", false);
      });

      let parent = d;
      while (parent) {
        d3.select("#id_" + parent.data.id).select(".node").classed("gray", false);
        parent = parent.parent;
      }
    });
  }

  fullNodeName() {
    let name = this.selectedNode.data.type;
    if (name == "DIS") {
      return "Disease or Syndrome";
    } else if (name == "DSP") {
      return "Dietary Supplement Product";
    } else if (name == "SDSI") {
      return "Dietary Supplement Ingredient";
    } else if (name == "PD") {
      return "Drug";
    } else if (name == "TC") {
      return "Therapeutic Class";
    } else if (name == "SOC") {
      return "System Organ Class";
    } else if (name == "SS") {
      return "Sign or Symptom";
    } else {
      return "Default";
    }
  }
}

@Component({
  selector: 'error-popup',
  templateUrl: 'errorPopup.html',
  styles: [`
    .example-pizza-party {
      color: hotpink;
    }
  `],
})
export class ErrorComponent {}