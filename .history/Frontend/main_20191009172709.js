/*
// Add a new item
root.right.push({name: 'bar'}, {name: 'none'}, {name: 'some'}, {name: 'value'});
update(root);

// Move from the first to the last
root.right.push(root.right.shift());
update(root);

// Move from right to left
var tmp = root.right.shift();
tmp.position = 'left';
root.left.push(tmp);
update(root);

// Move from left to right
var tmp = root.left.shift();
tmp.position = 'right';
root.right.push(tmp);
update(root);

// Switch connector type
connector = diagonal;
update(root);

*/

var m = [20, 120, 20, 120],
    //w = 1280 - m[1] - m[3],
    w = 900 - m[1] - m[3],
    h = 500 - m[0] - m[2],
    i = 0,
    root;

var getDirection = function (data) {
    if (!data) {
        return 'root';
    }
    if (data.position) {
        return data.position;
    }
    return getDirection(data.parent);
};

var selectNode = function (target) {
    if (target) {
        var sel = d3.selectAll('#body svg .node').filter(function (d) {
            return d.id == target.id
        })[0][0];
        if (sel) {
            select(sel);
        }
    }
};

Mousetrap.bind('left', function () {
    // left key pressed
    var selection = d3.select(".node.selected")[0][0];
    if (selection) {
        var data = selection.__data__;
        var dir = getDirection(data);
        switch (dir) {
            case ('right'):
            case ('root'):
                selectNode(data.parent || data.left[0]);
                break;
            case ('left'):
                selectNode((data.children || [])[0]);
                break;
            default:
                break;
        }
    }
});
Mousetrap.bind('right', function () {
    // right key pressed
    var selection = d3.select(".node.selected")[0][0];
    if (selection) {
        var data = selection.__data__;
        var dir = getDirection(data);
        switch (dir) {
            case ('left'):
            case ('root'):
                selectNode(data.parent || data.right[0]);
                break;
            case ('right'):
                selectNode((data.children || [])[0]);
                break;
            default:
                break;
        }
    }
});
Mousetrap.bind('up', function () {
    // up key pressed
    var selection = d3.select(".node.selected")[0][0];
    if (selection) {
        var data = selection.__data__;
        var dir = getDirection(data);
        switch (dir) {
            case ('root'):
                break;
            case ('left'):
            case ('right'):
                var p = data.parent,
                    nl = p.children || [],
                    i = 1;
                if (p[dir]) {
                    nl = p[dir];
                }
                l = nl.length;
                for (; i < l; i++) {
                    if (nl[i].id === data.id) {
                        selectNode(nl[i - 1]);
                        break;
                    }
                }
                break;
        }
    }
    return false;
});
Mousetrap.bind('down', function () {
    // down key pressed
    // up key pressed
    var selection = d3.select(".node.selected")[0][0];
    if (selection) {
        var data = selection.__data__;
        var dir = getDirection(data);
        switch (dir) {
            case ('root'):
                break;
            case ('left'):
            case ('right'):
                var p = data.parent,
                    nl = p.children || [],
                    i = 0;
                if (p[dir]) {
                    nl = p[dir];
                }
                l = nl.length;
                for (; i < l - 1; i++) {
                    if (nl[i].id === data.id) {
                        selectNode(nl[i + 1]);
                        break;
                    }
                }
                break;
        }
    }
    return false;
});

Mousetrap.bind('ins', function () {
    var selection = d3.select(".node.selected")[0][0];
    if (selection) {
        var data = selection.__data__;
        var dir = getDirection(data);
        var name = prompt('New name');
        if (name) {
            if (dir === 'root') {
                dir = data.right.length > data.left.length ? 'left' : 'right';
            }
            var cl = data[dir] || data.children || data._children;
            if (!cl) {
                cl = data.children = [];
            }
            cl.push({
                name: name,
                position: dir
            });
            update(root);
        }
    }
});

Mousetrap.bind('del', function () {
    var selection = d3.select(".node.selected")[0][0];
    if (selection) {
        var data = selection.__data__;
        var dir = getDirection(data);
        if (dir === 'root') {
            alert('Can\'t delete root');
            return;
        }
        var cl = data.parent[dir] || data.parent.children;
        if (!cl) {
            alert('Could not locate children');
            return;
        }
        var i = 0,
            l = cl.length;
        for (; i < l; i++) {
            if (cl[i].id === data.id) {
                if (confirm('Sure you want to delete ' + data.name + '?') === true) {
                    cl.splice(i, 1);
                }
                break;
            }
        }
        selectNode(root);
        update(root);
    }
});

Mousetrap.bind('enter', function () {
    var selection = d3.select(".node.selected")[0][0];
    if (selection) {
        var data = selection.__data__;
        data.name = prompt('New text:', data.name) || data.name;
        update(root);
    }
});

var addNodes = function (dir) {
    root[dir].push({
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
    update(root);
};

var moveNodes = function (from, to) {
    var tmp = root[from].shift();
    tmp.position = to;
    root[to].push(tmp);
    update(root);
};

var setConnector = function (type) {
    connector = window[type];
    update(root);
};

var select = function (node) {
    // Find previously selected, unselect
    d3.select(".selected").classed("selected", false);
    // Select current item
    d3.select(node).classed("selected", true);
};

var createNew = function () {
    root = {
        name: 'Root',
        children: [],
        left: [],
        right: []
    };
    update(root, true);
    selectNode(root);
};

var handleClick = function (d, index) {
    select(this);
    update(d);
};

var tree = d3.layout.tree()
    .size([h, w]);

var calcLeft = function (d) {
    var l = d.y;
    if (d.position === 'left') {
        l = (d.y) - w / 2;
        l = (w / 2) + l;
    }
    return {
        x: d.x,
        y: l
    };
};

var diagonal = d3.svg.diagonal()
    .projection(function (d) {
        return [d.y, d.x];
    });
var elbow = function (d, i) {
    var source = calcLeft(d.source);
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

var zoom = d3.behavior.zoom().scale(1)
.scaleExtent([1, 5]).on("zoom", 
  });

var vis = d3.select("#body")
    .append("svg:svg")
    .attr("width", "100%")
    .attr("height", 600)
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
        .on("click", handleClick);

    // nodeEnter.append("svg:circle")
    //     .attr("r", 1e-6);
    nodeEnter.append("svg:rect")
    .attr("width", function(d){return d.name.length * 7})
    .attr("height", 20)
    .attr("stroke-width", 1)
    // .attr("stroke", 'rgb(0,0,0)')
    .attr("y", "-10")
    .style("fill", function(d){ 
        if (d.type == "DIS") {
            return '#C64E39';
        } else {
            return '#39B1C6';
        }
     })
     .on("click", clicked);;
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
        .attr("width", function(d){return d.name.length * 7})
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
        .attr("width", function(d){return d.name.length * 6.5})
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
var queryServer = function() {
    let data = {query: "Match (a:SDSI)-[b:is_effective_for]-(c:DIS {name:'Colds, Common'}) return a, b, c;"};

    fetch("http://localhost:5000/api/v1/query", {
            method: "POST", 
            body: JSON.stringify(data),
            headers:{'content-type': 'application/json'},
        }).then(res => {
            return res.json();
        }).then(res => {
            console.log(res.graph);
            let json = transformGraphToMindmap(res.graph);
            loadGraph(json);
        });
}

var transformGraphToMindmap = function(graph) {
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
var bbox, viewBox, vx, vy, vw, vh, defaultView;
var clickScale = 2.0;
function getTransform(node, xScale) {
    bbox = node.node().getBBox();
    var bx = bbox.x;
    var by = bbox.y;
    var bw = bbox.width;
    var bh = bbox.height;
    var tx = -bx*xScale + vx + vw/2 - bw*xScale/2;
    var ty = -by*xScale + vy + vh/2 - bh*xScale/2;
    return {translate: [tx, ty], scale: xScale}
  }

function clicked(d, i) {
    if (d3.event.defaultPrevented) {
      return; // panning, not clicking
    }
    node = d3.select(this);
    var transform = getTransform(node, clickScale);
    container.transition().duration(1000)
       .attr("transform", "translate(" + transform.translate + ")scale(" + transform.scale + ")");
    zoom.scale(transform.scale)
        .translate(transform.translate);
    scale = transform.scale;
  }

// loadJSON('data.json');
queryServer();