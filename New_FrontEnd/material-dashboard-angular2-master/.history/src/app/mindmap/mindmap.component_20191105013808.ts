import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-mindmap',
  templateUrl: './mindmap.component.html',
  styleUrls: ['./mindmap.component.scss']
})
export class MindmapComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    this.queryServer(type, symptom);
  }

  m = [20, 120, 20, 120];
    w = 900 - this.m[1] - this.m[3];
    h = 500 - this.m[0] - this.m[2];
    i = 0;
    root;
    margin = {top: 0, right: 0, bottom: 0, left: 0};
    width = '100%';		// canvas width
    height = 480;		// canvas height

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

selectNode = function (target) {
    if (target) {
        var sel = d3.selectAll('#body svg .node').filter(function (d) {
            return d.id == target.id
        })[0][0];
        if (sel) {
            select(sel);
        }
    }
};










addNodes = function (dir) {
    this.root[dir].push({
        name: 'bar',
        position: dir
    }, {
        name: 'none',
        position: dir
    }, {
        name: 'some',
        position: dir
    }, {
        name: 'value',
        position: dir
    });
    this.update(this.root);
};

moveNodes = function (from, to) {
    var tmp = this.root[from].shift();
    tmp.position = to;
    this.root[to].push(tmp);
    this.update(this.root);
};

setConnector = function (type) {
    this.connector = window[type];
    this.update(this.root);
};

select = function (node) {
    // Find previously selected, unselect
    d3.select(".selected").classed("selected", false);
    // Select current item
    d3.select(node).classed("selected", true);
};

createNew = function () {
    this.root = {
        name: 'Root',
        children: [],
        left: [],
        right: []
    };
    this.update(this.root, true);
    this.selectNode(this.root);
};

handleClick = function (d, index) {
    this.select(this);
    this.update(d);
};

tree = d3.layout.tree()
    .size([this.h, this.w]);

calcLeft = function (d) {
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

diagonal = d3.svg.diagonal()
    .projection(function (d) {
        return [d.y, d.x];
    });
elbow = function (d, i) {
    var source = this.calcLeft(d.source);
    var target = calcLeft(d.target);
    var hy = (target.y - source.y) / 2;
    console.log(d.name);
    return "M" + source.y + "," + source.x +
        "H" + (source.y + hy) +
        "V" + target.x + "H" + target.y;
};
var connector = elbow;

function zoomed() {
    var translateX = d3.event.translate[0];
    var translateY = d3.event.translate[1];
    var xScale = d3.event.scale;
    container.attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + xScale + ")");
}

var scale = 1.0;

var zoom = d3.behavior.zoom().scale(scale)
    .scaleExtent([1, 5]).on("zoom", zoomed);

var vis = d3.select(".svg-container")
    .append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", '#F5F5DC')
    .call(zoom);

var container = vis.append("svg:g")
    .attr("id", "container")
    .attr("transform", "translate(0,0)scale(1,1)");

//*
var loadJSON = function (fileName) {
    //d3.json("/data/data.json", function(json) {
    d3.json(fileName, function (json) {
        var i = 0,
            l = json.children.length;
        window.data = root = json;
        root.x0 = h / 2;
        root.y0 = 0;

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

        update(root, true);
        selectNode(root);
    });
};
//*/

var toArray = function (item, arr, d) {
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
        toArray(item.children[i], arr, dr);
    }
    return arr;
};

function update(source, slow) {
    var duration = (d3.event && d3.event.altKey) || slow ? 1000 : 100;

    // Compute the new tree layout.
    var nodesLeft = tree
        .size([h, (w / 2) - 20])
        .children(function (d) {
            return (d.depth === 0) ? d.left : d.children;
        })
        .nodes(root)
        .reverse();
    var nodesRight = tree
        .size([h, w / 2])
        .children(function (d) {
            return (d.depth === 0) ? d.right : d.children;
        })
        .nodes(root)
        .reverse();
    root.children = root.left.concat(root.right);
    root._children = null;
    var nodes = toArray(root);

    // Normalize for fixed-depth.
    //nodes.forEach(function(d) { d.y = d.depth * 180; });

    // Update the nodes…
    var node = container.selectAll("g.node")
        .data(nodes, function (d) {
            return d.id || (d.id = ++i);
        });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("svg:g")
        .attr("class", function (d) {
            return d.selected ? "node selected" : "node";
        })
        .attr("transform", function (d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on("click", clicked);

    // nodeEnter.append("svg:circle")
    //     .attr("r", 1e-6);
    nodeEnter.append("svg:rect")
        .attr("width", function (d) {
            return d.name.length * 7
        })
        .attr("height", 20)
        .attr("stroke-width", 1)
        // .attr("stroke", 'rgb(0,0,0)')
        .attr("y", "-10")
        .style("fill", function (d) {
            if (d.type == "DIS") {
                return '#C64E39';
            } else if (d.type == "DSP")  {
                return '#39B1C6';
            } else if (d.type == "SDSI")  {
                return '#397bc6';
            } else {
                return '#c6a739';
            }
        });

        bbox = container.node().getBBox();
        console.log(bbox);
        vx = bbox.x;		// container x co-ordinate
        vy = bbox.y;		// container y co-ordinate
        vw = bbox.width;	// container width
        vh = bbox.height;	// container height
        defaultView = "" + vx + " " + vy + " " + vw + " " + vh;
        container
          .attr("viewBox", defaultView)
          .attr("preserveAspectRatio", "xMidYMid meet")
              .call(zoom);
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
        .text(function (d) {
            return (d.name || d.text);
        })
        .style("fill-opacity", 1)
        .style("fill", "white");

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        //.attr("class", function(d){ return d.selected?"node selected":"node"; })
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    nodeUpdate.select("text")
        .text(function (d) {
            return (d.name || d.text);
        });

    // nodeUpdate.select("circle")
    //     .attr("r", 4.5);
    nodeUpdate.select("rect")
        .attr("width", function (d) {
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
        .attr("width", function (d) {
            return d.name.length * 6.5
        })
        .attr("height", 20);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links…
    var link = container.selectAll("path.link")
        .data(tree.links(nodes), function (d) {
            return d.target.id;
        });

    // Enter any new links at the parent's previous position.
    link.enter().insert("svg:path", "g")
        .attr("class", "link")
        .attr("d", function (d) {
            var o = {
                x: source.x0,
                y: source.y0
            };
            return connector({
                source: o,
                target: o,
                name: source.name
            });
        })
        .transition()
        .duration(duration)
        .attr("d", connector);

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", connector);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function (d) {
            var o = {
                x: source.x,
                y: source.y
            };
            return connector({
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
function toggle(d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
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

//*
var loadGraph = function (json) {
    //d3.json("/data/data.json", function(json) {
    var i = 0,
        l = json.children.length;
    window.data = root = json;
    root.x0 = h / 2;
    root.y0 = 0;

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

    update(root, true);
    selectNode(root);
};
//*/

function getTransform(node, xScale) {
    bbox = node.node().getBBox();
    console.log(bbox);
    var bx = d3.transform(node.attr("transform")).translate[0];
    var by = d3.transform(node.attr("transform")).translate[1];
    var bw = bbox.width;
    var bh = bbox.height;
    var tx = vx + vw / 2 - bx * xScale + bw * xScale / 2;
    var ty = vy + vh / 2 - by * xScale - bh * xScale / 2;
    console.log(bx);
    console.log(by);
    return {
        translate: [tx, ty],
        scale: xScale
    }
}

function clicked(d, i) {
    if (d3.event.defaultPrevented) {
        return; // panning, not clicking
    }
    console.log(this);
    node = d3.select(this);
    select(this);
    var transform = getTransform(node, clickScale);
    container.transition().duration(1000)
        .attr("transform", "translate(" + transform.translate + ")scale(" + transform.scale + ")");
    zoom.scale(transform.scale)
        .translate(transform.translate);
    scale = transform.scale;
    update(d);
}

var type = 'ingredient';
var symptom = 'Diabetes';

var chooseSearchType = function(_type){
    console.log(_type);
    type = _type;
    queryServer(type, symptom);
}

var chooseSymptom = function(_symptom){
    console.log(_symptom);
    symptom = _symptom;
    queryServer(type, symptom);
}

}
