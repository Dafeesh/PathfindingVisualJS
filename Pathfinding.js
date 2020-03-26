"use strict";

const canvasId = "pathfindingCanvas";
const cellCount = { x: 30, y: 30, total: function() { return x * y; } };

const cellStart = { x: 0, y: 0 };
const cellTarget = { x: (cellCount.x-1), y: (cellCount.y-1) };

const cellType = {
    START: "START",
    TARGET: "TARGET",
    BLANK: "BLANK",
    WALL: "WALL",
    VISITED: "VISITED",
    PATH: "PATH"
};

var ctx;
var ctxSize = { x: null, y: null };
var ctxCellSize = { x: null, y: null };

var grid = [];

//////////
// Main //

(function() 
{
    setupGrid();

    //calculatePath_Dijkstra();
    //calculatePath_AStar();
})();

// ~Main //
///////////

//////////
// Grid //

function setupGrid() {
    var canvas = document.getElementById(canvasId);
    ctx = canvas.getContext("2d");

    ctxSize.x = canvas.width;
    ctxSize.y = canvas.height;
    ctxCellSize.x = canvas.width / cellCount.x;
    ctxCellSize.y = canvas.height / cellCount.y;

    for (var y=0; y<cellCount.y; y++)
    {
        for (var x=0; x<cellCount.x; x++)
        {
            if (x == 0 && y == 0)
            {
                grid[indexAt(x,y)] = cellType.START;
            }
            else if (x == cellCount.x-1 && y == cellCount.y-1)
            {
                grid[indexAt(x,y)] = cellType.TARGET;
            }
            else
            {
                var rng = Math.random();
                if (rng < 0.3)
                    grid[indexAt(x,y)] = cellType.WALL;
                else
                    grid[indexAt(x,y)] = cellType.BLANK;
            }
        }
    }

    redraw();
}

function redraw() {    
    for (var y=0; y<cellCount.y; y++) {
        for (var x=0; x<cellCount.x; x++) {
            drawCell(x, y, grid[indexAt(x,y)]);
        }
    }
}

function drawCell(x, y, type) {
    let boxInfo = {
        left: x * ctxCellSize.x,
        width: ctxCellSize.x,
        top: y * ctxCellSize.y,
        height: ctxCellSize.y
    }

    switch (type) {
        case cellType.START:
            drawSquare(boxInfo, "Blue", true);
        break;
        case cellType.VISITED:
            drawSquare(boxInfo, "Yellow", true);
        break;
        case cellType.TARGET:
            drawSquare(boxInfo, "Green", true);
        break;
        case cellType.BLANK:
            drawSquare(boxInfo, "White", true);
        break;
        case cellType.WALL:
            drawSquare(boxInfo, "Black", true);
        break;
        case cellType.PATH:
            drawSquare(boxInfo, "Purple", true);
        break;
    }
}

function drawPath(node, type) {
    var nodeCount = 0;
    while (!(node === null)) {
        nodeCount += 1;
        drawCell(node.pos.x, node.pos.y, type);
        node = node.prev;
    }
    console.log('Shortest path: ' + nodeCount);
    setPathLength(nodeCount);
}

function drawSquare(boxInfo, color, fill) {
    if (fill) {    
        //Draw the filled in square
        ctx.fillStyle = color;
        ctx.fillRect(boxInfo.left, boxInfo.top, boxInfo.width, boxInfo.height);

    } else {

        //Erase square
        ctx.fillStyle = blankColor;
        ctx.fillRect(boxInfo.left, boxInfo.top, boxInfo.width, boxInfo.height);

        //Draw the square
        ctx.strikeStyle = color;
        ctx.strokeRect(boxInfo.left, boxInfo.top, boxInfo.width, boxInfo.height);
    }
}

function indexAt(x, y) {
    return (y * cellCount.x) + x;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function distanceTo(start, end) {
    return Math.abs(start.x - end.x) +
           Math.abs(start.y - end.y);
}

/////////////////
// Pathfinding //

async function calculatePath_Dijkstra() {
    var next = [
        {
            pos: cellStart,
            prev: null
        }
    ];

    var COUNTER = 0;
    while (next.length > 0) {
        var current = next.shift(); //dequeue
        var pos = current.pos;

        var ctype = grid[indexAt(pos.x, pos.y)];
        if (ctype == cellType.VISITED || ctype == cellType.WALL)
            continue;
        if (ctype == cellType.TARGET) {
            drawPath(current, cellType.PATH);
            return;
        }

        if (pos.x + 1 < cellCount.x)
            next.push({
                pos: { x: pos.x + 1, y: pos.y},
                prev: current
            });
        if (pos.x - 1 >= 0)
            next.push({
                pos: { x: pos.x - 1, y: pos.y},
                prev: current
            });
        if (pos.y + 1 < cellCount.y)
            next.push({
                pos: { x: pos.x, y: pos.y + 1},
                prev: current
            });
        if (pos.y - 1 >= 0)
            next.push({
                pos: { x: pos.x, y: pos.y - 1},
                prev: current
            });

        grid[indexAt(pos.x, pos.y)] = cellType.VISITED;

        redraw();
        await sleep(20);
    }
    console.log('No valid path found!');
    setPathLength('No valid path found!');
}

////////
// A* //

async function calculatePath_AStar()
{
    var visited = [];
    var next = [
        {
            pos: cellStart,
            prev: null,
            weight: 0,
            distance: distanceTo(cellStart, cellTarget)
        }
    ];

    var COUNTER = 0;
    while (next.length > 0) {

        next.sort((a, b) => (a.distance + a.weight) - (b.distance + b.weight));
        var current = next.shift(); //dequeue
        var pos = current.pos;

        var ctype = grid[indexAt(pos.x, pos.y)];
        if (ctype == cellType.WALL) {
            continue;
        }
        if (ctype == cellType.VISITED) {
            if (visited[indexAt(pos.x, pos.y)] && 
                visited[indexAt(pos.x, pos.y)].weight > current.weight) {
                // Continue as normal
            } else {
                continue;
            }
        }
        if (ctype == cellType.TARGET) {
            drawPath(current, cellType.PATH);
            return;
        }

        visited[indexAt(pos.x, pos.y)] = current;

        if (pos.x + 1 < cellCount.x)
            next.push({
                pos: { x: pos.x + 1, y: pos.y},
                prev: current,
                weight: current.weight + 1,
                distance: distanceTo(current.pos, cellTarget)
            });
        if (pos.x - 1 >= 0)
            next.push({
                pos: { x: pos.x - 1, y: pos.y},
                prev: current,
                weight: current.weight + 1,
                distance: distanceTo(current.pos, cellTarget)
            });
        if (pos.y + 1 < cellCount.y)
            next.push({
                pos: { x: pos.x, y: pos.y + 1},
                prev: current,
                weight: current.weight + 1,
                distance: distanceTo(current.pos, cellTarget)
            });
        if (pos.y - 1 >= 0)
            next.push({
                pos: { x: pos.x, y: pos.y - 1},
                prev: current,
                weight: current.weight + 1,
                distance: distanceTo(current.pos, cellTarget)
            });

        grid[indexAt(pos.x, pos.y)] = cellType.VISITED;

        redraw();
        await sleep(20);
    }
    console.log('No valid path found!');
    setPathLength('No valid path found!');
}
