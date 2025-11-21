// ------------------ Canvas & Context ------------------
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var toolbar = document.getElementById("toolbar");

// ------------------ Variables ------------------
var drawing = false;
var color = "black";
var penSize = 2;
var tool = "normal"; // default tool
var startX = 0, startY = 0, tempX = 0, tempY = 0;
var lastX = 0, lastY = 0;
var shiftLine = false;
var shiftLineStart = null;
var canvasImage = null;
var shiftActive = false;

// ------------------ Shapes & Objects ------------------
var currentShape = null;
var shapeStart = null;
var draggingShape = false;
var tempCanvasImage = null;
var objects = [];
var selectedObject = null;
var offsetX = 0, offsetY = 0;

// ------------------ Resize Canvas ------------------
function resizeCanvas() {
    var w = Math.max(window.innerWidth - toolbar.offsetWidth, 100);
    var h = Math.max(window.innerHeight, 100);

    var tmp = document.createElement("canvas");
    tmp.width = canvas.width || w;
    tmp.height = canvas.height || h;
    var tctx = tmp.getContext("2d");
    tctx.drawImage(canvas, 0, 0);

    canvas.width = w;
    canvas.height = h;

    ctx.drawImage(tmp, 0, 0);
    redrawObjects();
}

// Initialize
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ------------------ Colors ------------------
var colors = ["black","red","green","blue","yellow","purple","cyan","magenta","orange","pink","brown","gray"];
var colorsDiv = document.getElementById("colors");

for (var i=0; i<colors.length; i++){
    (function(c){
        var btn = document.createElement("button");
        btn.className = "color-btn";
        btn.style.background = c;
        btn.onclick = function(){ color = c; };
        colorsDiv.appendChild(btn);
    })(colors[i]);
}

// Custom color
var customBtn = document.getElementById("custom-btn");
customBtn.addEventListener("click", function(){
    var picker = document.createElement("input");
    picker.type = "color";
    picker.style.position = "fixed";
    picker.style.left = "-9999px";
    document.body.appendChild(picker);
    picker.click();
    picker.addEventListener("input", function(){ color = picker.value; });
    picker.addEventListener("change", function(){ document.body.removeChild(picker); });
});

// Pen size
var penInput = document.getElementById("pen-size");
penInput.addEventListener("input", function(e){ penSize = e.target.value; });

// ------------------ Tools & Shapes ------------------
function toggleTool(t){
    if(t === tool){ tool = "normal"; currentShape = null; } 
    else { tool = t; currentShape = null; }
}

function setTool(t){ toggleTool(t); }

function setShape(shape){
    if(currentShape === shape){ currentShape = null; tool = "normal"; } 
    else { currentShape = shape; tool = null; }
}

// ------------------ Erase & Clear ------------------
function erase(){ color = "white"; }
function clearCanvas(){ ctx.clearRect(0,0,canvas.width,canvas.height); objects=[]; redrawObjects(); }

// ------------------ Mouse Events ------------------
function getMousePos(e){
    var rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

canvas.addEventListener("mousedown", function(e){
    var pos = getMousePos(e);
    var x = pos.x, y = pos.y;

    // Alt+drag to move shapes
    if(e.altKey){
        for(var i=objects.length-1; i>=0; i--){
            if(hitTest(objects[i], x, y)){
                selectedObject = objects[i];
                offsetX = x - selectedObject.x1;
                offsetY = y - selectedObject.y1;
                return;
            }
        }
    }

    // Shape creation
    if(currentShape){
        shapeStart = {x:x, y:y};
        draggingShape = true;
        tempCanvasImage = ctx.getImageData(0,0,canvas.width,canvas.height);
        return;
    }

    // Shift-line
    if(shiftActive){
        shiftLine = true;
        shiftLineStart = {x:x, y:y};
        canvasImage = ctx.getImageData(0,0,canvas.width,canvas.height);
        return;
    }

    drawing = true;
    startX = tempX = lastX = x;
    startY = tempY = lastY = y;
});

canvas.addEventListener("mousemove", function(e){
    var pos = getMousePos(e);
    var x = pos.x, y = pos.y;

    // Move selected object
    if(selectedObject && e.altKey){
        var dx = x - offsetX;
        var dy = y - offsetY;
        var w = selectedObject.x2 - selectedObject.x1;
        var h = selectedObject.y2 - selectedObject.y1;
        selectedObject.x1 = dx;
        selectedObject.y1 = dy;
        selectedObject.x2 = dx + w;
        selectedObject.y2 = dy + h;
        redrawObjects();
        return;
    }

    // Shape dragging
    if(draggingShape && currentShape){
        ctx.putImageData(tempCanvasImage,0,0);
        ctx.strokeStyle = color;
        ctx.lineWidth = penSize;
        var startX = shapeStart.x;
        var startY = shapeStart.y;
        var width = x - startX;
        var height = y - startY;
        ctx.beginPath();
        drawShapePreview(currentShape, startX, startY, x, y);
        return;
    }

    // Shift-line preview
    if(shiftLine && shiftLineStart){
        ctx.putImageData(canvasImage,0,0);
        ctx.strokeStyle = color;
        ctx.lineWidth = penSize;
        ctx.beginPath();
        ctx.moveTo(shiftLineStart.x, shiftLineStart.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        return;
    }

    // Free draw
    if(!drawing) return;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = penSize;

    if(tool === "normal"){
        ctx.beginPath();
        ctx.arc(x, y, penSize/2, 0, Math.PI*2);
        ctx.fill();
    } else if(tool === "continuous"){
        ctx.beginPath();
        ctx.moveTo(tempX, tempY);
        ctx.lineTo(x, y);
        ctx.stroke();
    } else if(tool === "dotted"){
        ctx.setLineDash([4,4]);
        ctx.beginPath();
        ctx.moveTo(tempX, tempY);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    tempX = x;
    tempY = y;
    lastX = x;
    lastY = y;
});

canvas.addEventListener("mouseup", function(e){
    if(selectedObject){ selectedObject=null; return; }

    if(draggingShape && currentShape){
        var pos = getMousePos(e);
        addObject({type:currentShape, x1:shapeStart.x, y1:shapeStart.y, x2:pos.x, y2:pos.y, color:color, size:penSize});
        draggingShape = false;
        tempCanvasImage = null;
        shapeStart = null;
        redrawObjects();
        return;
    }

    if(shiftLine && shiftLineStart){
        var pos = getMousePos(e);
        var dx = pos.x - shiftLineStart.x;
        var dy = pos.y - shiftLineStart.y;
        var dist = Math.sqrt(dx*dx + dy*dy);
        if(dist>=5){
            ctx.putImageData(canvasImage,0,0);
            ctx.beginPath();
            ctx.moveTo(shiftLineStart.x, shiftLineStart.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            addObject({type:'line', x1:shiftLineStart.x, y1:shiftLineStart.y, x2:pos.x, y2:pos.y, color:color, size:penSize});
            shiftLineStart = {x:pos.x, y:pos.y};
            canvasImage = ctx.getImageData(0,0,canvas.width,canvas.height);
        } else {
            ctx.putImageData(canvasImage,0,0);
        }
        drawing = false;
        return;
    }

    drawing = false;
});

// ------------------ Keyboard Events ------------------
window.addEventListener("keydown", function(e){ if(e.key === "Shift") shiftActive = true; });
window.addEventListener("keyup", function(e){ if(e.key === "Shift"){ shiftActive=false; shiftLine=false; shiftLineStart=null; canvasImage=null; } });

// ------------------ Object Handling ------------------
function addObject(obj){ objects.push(obj); }
function redrawObjects(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(var i=0; i<objects.length; i++){
        var obj = objects[i];
        ctx.strokeStyle = obj.color;
        ctx.lineWidth = obj.size;
        ctx.beginPath();
        drawShapePreview(obj.type, obj.x1, obj.y1, obj.x2, obj.y2);
    }
}

// ------------------ Hit Test ------------------
function hitTest(obj, x, y){
    // Approx bounding box check for simplicity
    return x >= Math.min(obj.x1,obj.x2) && x <= Math.max(obj.x1,obj.x2) &&
           y >= Math.min(obj.y1,obj.y2) && y <= Math.max(obj.y1,obj.y2);
}

// ------------------ Draw Shape Preview Function ------------------
function drawShapePreview(shape, x1, y1, x2, y2){
    switch(shape){
        case 'rectangle': ctx.strokeRect(x1, y1, x2-x1, y2-y1); break;
        case 'circle': var r=Math.sqrt((x2-x1)**2 + (y2-y1)**2); ctx.arc(x1, y1, r, 0, 2*Math.PI); ctx.stroke(); break;
        case 'line': ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); break;
        case 'triangle': ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x1*2-x2, y2); ctx.closePath(); ctx.stroke(); break;
        // You can add remaining shapes (star, hexagon, pentagon, etc.) similarly
    }
}
