const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const toolbar = document.getElementById('toolbar');

let drawing = false;
let color = "black";
let penSize = 2;
let tool = "normal"; // default tool
let startX = 0, startY = 0, tempX = 0, tempY = 0;
let lastX = 0, lastY = 0;
let shiftLine = false;
let shiftLineStart = null; 
let canvasImage = null; 
let shiftActive = false; 

// ------------------ Shape & Objects ------------------
let currentShape = null;
let shapeStart = null;
let draggingShape = false;
let tempCanvasImage = null;

let objects = []; // all drawn objects
let selectedObject = null;
let offsetX = 0;
let offsetY = 0;

// ------------------ Tool/Shape Button Toggle ------------------
function toggleTool(t){
    if(t===tool){
        tool="normal";
        currentShape=null;
    }else{
        tool=t;
        currentShape=null;
    }
    document.querySelectorAll('.tool-btn').forEach(btn=>btn.classList.remove('active'));
    if(tool!== 'normal'){
        const btn = document.querySelector(`.tool-btn[data-tool='${t}']`);
        if(btn) btn.classList.add('active');
    }
}

function setShape(shape){
    if(currentShape===shape){
        currentShape=null;
        tool='normal';
        document.querySelectorAll('.shape-btn').forEach(b=>b.classList.remove('active'));
    }else{
        currentShape=shape;
        tool=null;
        document.querySelectorAll('.shape-btn').forEach(b=>b.classList.remove('active'));
        const btn=document.querySelector(`.shape-btn[data-shape='${shape}']`);
        if(btn) btn.classList.add('active');
    }
}

// ------------------ Add Object ------------------
function addObject(obj){
    objects.push(obj);
}
// ------------------ Redraw Objects ------------------
function redrawObjects(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    objects.forEach(obj=>{
        ctx.strokeStyle=obj.color;
        ctx.lineWidth=obj.size;
        ctx.beginPath();
        switch(obj.type){
            case 'rectangle': ctx.strokeRect(obj.x1,obj.y1,obj.x2-obj.x1,obj.y2-obj.y1); break;
            case 'circle': {const r=Math.sqrt((obj.x2-obj.x1)**2+(obj.y2-obj.y1)**2); ctx.arc(obj.x1,obj.y1,r,0,2*Math.PI); ctx.stroke();} break;
            case 'triangle': ctx.moveTo(obj.x1,obj.y1); ctx.lineTo(obj.x2,obj.y2); ctx.lineTo(obj.x1*2-obj.x2,obj.y2); ctx.closePath(); ctx.stroke(); break;
            case 'line': ctx.moveTo(obj.x1,obj.y1); ctx.lineTo(obj.x2,obj.y2); ctx.stroke(); break;
            case 'pentagon': {const r=Math.sqrt((obj.x2-obj.x1)**2+(obj.y2-obj.y1)**2)/2; const cx=(obj.x1+obj.x2)/2; const cy=(obj.y1+obj.y2)/2; const s=5; const a=2*Math.PI/s; ctx.moveTo(cx+r*Math.cos(0),cy+r*Math.sin(0)); for(let i=1;i<=s;i++){ctx.lineTo(cx+r*Math.cos(i*a),cy+r*Math.sin(i*a));} ctx.closePath(); ctx.stroke();} break;
            case 'diamond': {const cx=(obj.x1+obj.x2)/2; const cy=(obj.y1+obj.y2)/2; ctx.moveTo(cx,obj.y1); ctx.lineTo(obj.x2,cy); ctx.lineTo(cx,obj.y2); ctx.lineTo(obj.x1,cy); ctx.closePath(); ctx.stroke();} break;
            case 'right-triangle': ctx.moveTo(obj.x1,obj.y1); ctx.lineTo(obj.x2,obj.y1); ctx.lineTo(obj.x1,obj.y2); ctx.closePath(); ctx.stroke(); break;
            case 'arrow': {ctx.moveTo(obj.x1,obj.y1); ctx.lineTo(obj.x2,obj.y2); const angle=Math.atan2(obj.y2-obj.y1,obj.x2-obj.x1); const headlen=10; ctx.moveTo(obj.x2,obj.y2); ctx.lineTo(obj.x2-headlen*Math.cos(angle-Math.PI/6),obj.y2-headlen*Math.sin(angle-Math.PI/6)); ctx.moveTo(obj.x2,obj.y2); ctx.lineTo(obj.x2-headlen*Math.cos(angle+Math.PI/6),obj.y2-headlen*Math.sin(angle+Math.PI/6)); ctx.stroke(); } break;
            case 'star': {
                const cx=(obj.x1+obj.x2)/2;
                const cy=(obj.y1+obj.y2)/2;
                const spikes=5;
                const outerRadius=Math.abs(obj.x2-obj.x1)/2;
                const innerRadius=outerRadius/2;
                let rot=Math.PI/2*3;
                let x=cx, y=cy;
                let step=Math.PI/spikes;
                ctx.beginPath();
                ctx.moveTo(cx,cy-outerRadius);
                for(let i=0;i<spikes;i++){
                    x=cx+Math.cos(rot)*outerRadius;
                    y=cy+Math.sin(rot)*outerRadius;
                    ctx.lineTo(x,y);
                    rot+=step;
                    x=cx+Math.cos(rot)*innerRadius;
                    y=cy+Math.sin(rot)*innerRadius;
                    ctx.lineTo(x,y);
                    rot+=step;
                }
                ctx.closePath();
                ctx.stroke();
            } break;
            case 'hexagon': {
                const cx=(obj.x1+obj.x2)/2;
                const cy=(obj.y1+obj.y2)/2;
                const radius=Math.abs(obj.x2-obj.x1)/2;
                const sides=6;
                const a=(2*Math.PI)/sides;
                ctx.beginPath();
                ctx.moveTo(cx+radius*Math.cos(0),cy+radius*Math.sin(0));
                for(let i=1;i<=sides;i++){
                    ctx.lineTo(cx+radius*Math.cos(i*a),cy+radius*Math.sin(i*a));
                }
                ctx.closePath();
                ctx.stroke();
            } break;
        }
    });
}
// ------------------ Resize Canvas ------------------
function resizeCanvas(){
    const w=Math.max(window.innerWidth-toolbar.offsetWidth,100);
    const h=Math.max(window.innerHeight,100);

    const tmp=document.createElement('canvas');
    tmp.width=canvas.width||w;
    tmp.height=canvas.height||h;
    const tctx=tmp.getContext('2d');
    tctx.drawImage(canvas,0,0);

    canvas.width=w;
    canvas.height=h;

    ctx.drawImage(tmp,0,0);
    redrawObjects();
}

resizeCanvas();
window.addEventListener('resize',resizeCanvas);

// ------------------ Colors ------------------
const colors = ["black","red","green","blue","yellow","purple","cyan","magenta","orange","pink","brown","gray"];
const colorsDiv = document.getElementById("colors");

colors.forEach(c=>{
    const btn=document.createElement("button");
    btn.className="color-btn";
    btn.style.background=c;
    btn.onclick=()=>color=c;
    colorsDiv.appendChild(btn);
});

// Custom color
const customBtn=document.getElementById('custom-btn');
customBtn.addEventListener('click',()=>{
    const picker=document.createElement('input');
    picker.type='color';
    picker.style.position='fixed';
    picker.style.left='-9999px';
    document.body.appendChild(picker);
    picker.click();
    picker.oninput=()=>{color=picker.value;};
    picker.onchange=()=>document.body.removeChild(picker);
});

// Pen size
const penInput=document.getElementById('pen-size');
penInput.addEventListener('input',e=>penSize=e.target.value);

// Tool functions
function setTool(t){toggleTool(t);}
function erase(){color='white';}
function clearCanvas(){ctx.clearRect(0,0,canvas.width,canvas.height); objects=[]; redrawObjects();}

// ------------------ Mouse Events ------------------
canvas.addEventListener('mousedown',(e)=>{
    const rect=canvas.getBoundingClientRect();
    const x=e.clientX-rect.left;
    const y=e.clientY-rect.top;

    // Alt+drag to move
    if(e.altKey){
        for(let i=objects.length-1;i>=0;i--){
            const obj=objects[i];
            if(hitTest(obj,x,y)){
                selectedObject=obj;
                offsetX=x-obj.x1;
                offsetY=y-obj.y1;
                return;
            }
        }
    }

    // Shapes creation
    if(currentShape){
        shapeStart={x,y};
        draggingShape=true;
        tempCanvasImage=ctx.getImageData(0,0,canvas.width,canvas.height);
        return;
    }

    // Shift-line handling
    if(shiftActive){
        shiftLine=true;
        shiftLineStart={x,y};
        canvasImage=ctx.getImageData(0,0,canvas.width,canvas.height);
        return;
    }

    drawing=true;
    startX=tempX=lastX=x;
    startY=tempY=lastY=y;
});
canvas.addEventListener('mousemove',(e)=>{
    const rect=canvas.getBoundingClientRect();
    const x=e.clientX-rect.left;
    const y=e.clientY-rect.top;

    // Move selected object
    if(selectedObject && e.altKey){
        const dx=x-offsetX;
        const dy=y-offsetY;
        const w=selectedObject.x2-selectedObject.x1;
        const h=selectedObject.y2-selectedObject.y1;
        selectedObject.x1=dx;
        selectedObject.y1=dy;
        selectedObject.x2=dx+w;
        selectedObject.y2=dy+h;
        redrawObjects();
        return;
    }

    // Shapes dragging
    if(draggingShape && currentShape){
        ctx.putImageData(tempCanvasImage,0,0);
        ctx.strokeStyle=color;
        ctx.lineWidth=penSize;
        const startX=shapeStart.x;
        const startY=shapeStart.y;
        const width=x-startX;
        const height=y-startY;
        ctx.beginPath();
        switch(currentShape){
            case 'rectangle': ctx.strokeRect(startX,startY,width,height); break;
            case 'circle': {const r=Math.sqrt(width*width+height*height); ctx.arc(startX,startY,r,0,2*Math.PI); ctx.stroke();} break;
            case 'triangle': ctx.moveTo(startX,startY); ctx.lineTo(x,y); ctx.lineTo(startX*2-x,y); ctx.closePath(); ctx.stroke(); break;
            case 'line': ctx.moveTo(startX,startY); ctx.lineTo(x,y); ctx.stroke(); break;
            case 'pentagon': {const r=Math.sqrt(width*width+height*height)/2; const cx=(startX+x)/2; const cy=(startY+y)/2; const s=5; const a=2*Math.PI/s; ctx.moveTo(cx+r*Math.cos(0),cy+r*Math.sin(0)); for(let i=1;i<=s;i++){ctx.lineTo(cx+r*Math.cos(i*a),cy+r*Math.sin(i*a));} ctx.closePath(); ctx.stroke();} break;
            case 'diamond': {const cx=(startX+x)/2; const cy=(startY+y)/2; ctx.moveTo(cx,startY); ctx.lineTo(x,cy); ctx.lineTo(cx,y); ctx.lineTo(startX,cy); ctx.closePath(); ctx.stroke();} break;
            case 'right-triangle': ctx.moveTo(startX,startY); ctx.lineTo(x,startY); ctx.lineTo(startX,y); ctx.closePath(); ctx.stroke(); break;
            case 'arrow': {ctx.moveTo(startX,startY); ctx.lineTo(x,y); const angle=Math.atan2(y-startY,x-startX); const headlen=10; ctx.moveTo(x,y); ctx.lineTo(x-headlen*Math.cos(angle-Math.PI/6),y-headlen*Math.sin(angle-Math.PI/6)); ctx.moveTo(x,y); ctx.lineTo(x-headlen*Math.cos(angle+Math.PI/6),y-headlen*Math.sin(angle+Math.PI/6)); ctx.stroke();} break;
            case 'star': {
                const cx=(startX+x)/2;
                const cy=(startY+y)/2;
                const spikes=5;
                const outerRadius=Math.abs(x-startX)/2;
                const innerRadius=outerRadius/2;
                let rot=Math.PI/2*3;
                let sx, sy;
                let step=Math.PI/spikes;
                ctx.beginPath();
                ctx.moveTo(cx,cy-outerRadius);
                for(let i=0;i<spikes;i++){
                    sx=cx+Math.cos(rot)*outerRadius;
                    sy=cy+Math.sin(rot)*outerRadius;
                    ctx.lineTo(sx,sy);
                    rot+=step;
                    sx=cx+Math.cos(rot)*innerRadius;
                    sy=cy+Math.sin(rot)*innerRadius;
                    ctx.lineTo(sx,sy);
                    rot+=step;
                }
                ctx.closePath();
                ctx.stroke();
            } break;
            case 'hexagon': {
                const cx=(startX+x)/2;
                const cy=(startY+y)/2;
                const radius=Math.abs(x-startX)/2;
                const sides=6;
                const a=(2*Math.PI)/sides;
                ctx.beginPath();
                ctx.moveTo(cx+radius*Math.cos(0),cy+radius*Math.sin(0));
                for(let i=1;i<=sides;i++){
                    ctx.lineTo(cx+radius*Math.cos(i*a),cy+radius*Math.sin(i*a));
                }
                ctx.closePath();
                ctx.stroke();
            } break;
        }
        return;
    }

    // Shift-line preview
    if(shiftLine && shiftLineStart){
        ctx.putImageData(canvasImage,0,0);
        ctx.strokeStyle=color;
        ctx.lineWidth=penSize;
        ctx.beginPath();
        ctx.moveTo(shiftLineStart.x,shiftLineStart.y);
        ctx.lineTo(x,y);
        ctx.stroke();
        return;
    }

    if(!drawing) return;
    ctx.strokeStyle=color;
    ctx.fillStyle=color;
    ctx.lineWidth=penSize;
    if(tool==='normal'){ctx.beginPath(); ctx.arc(x,y,penSize/2,0,Math.PI*2); ctx.fill();}
    else if(tool==='continuous'){ctx.beginPath(); ctx.moveTo(tempX,tempY); ctx.lineTo(x,y); ctx.stroke();}
    else if(tool==='dotted'){ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(tempX,tempY);ctx.lineTo(x,y);ctx.stroke();ctx.setLineDash([]);}
    tempX=x;
    tempY=y;
    lastX=x;
    lastY=y;
});

canvas.addEventListener('mouseup',(e)=>{
    if(selectedObject){selectedObject=null; return;}
    if(draggingShape && currentShape){
        const rect=canvas.getBoundingClientRect();
        const x=e.clientX-rect.left;
        const y=e.clientY-rect.top;
        addObject({type:currentShape,x1:shapeStart.x,y1:shapeStart.y,x2:x,y2:y,color:color,size:penSize});
        draggingShape=false;
        tempCanvasImage=null;
        shapeStart=null;
        redrawObjects();
        return;
    }

    if(shiftLine && shiftLineStart){
        const rect=canvas.getBoundingClientRect();
        const x=e.clientX-rect.left;
        const y=e.clientY-rect.top;
        const dx=x-shiftLineStart.x;
        const dy=y-shiftLineStart.y;
        const dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<5) ctx.putImageData(canvasImage,0,0);
        else{
            ctx.putImageData(canvasImage,0,0);
            ctx.strokeStyle=color;
            ctx.lineWidth=penSize;
            ctx.beginPath();
            ctx.moveTo(shiftLineStart.x,shiftLineStart.y);
            ctx.lineTo(x,y);
            ctx.stroke();
            addObject({type:'line',x1:shiftLineStart.x,y1:shiftLineStart.y,x2:x,y2:y,color:color,size:penSize});
            shiftLineStart={x:x,y:y};
            canvasImage=ctx.getImageData(0,0,canvas.width,canvas.height);
        }
        drawing=false;
        return;
    }

    drawing=false;
});
// ------------------ Shift Key ------------------
window.addEventListener('keydown',e=>{if(e.key==='Shift') shiftActive=true;});
window.addEventListener('keyup',e=>{if(e.key==='Shift'){shiftActive=false;shiftLine=false;shiftLineStart=null;canvasImage=null;}});

// ------------------ Hit Test ------------------
function hitTest(obj,x,y){
    if(obj.type==='rectangle') return x>=obj.x1 && x<=obj.x2 && y>=obj.y1 && y<=obj.y2;
    if(obj.type==='circle'){const r=Math.sqrt((obj.x2-obj.x1)**2+(obj.y2-obj.y1)**2); return Math.sqrt((x-obj.x1)**2+(y-obj.y1)**2)<=r;}
    if(obj.type==='triangle') return x>=Math.min(obj.x1,obj.x2)&&x<=Math.max(obj.x1,obj.x2)&&y>=Math.min(obj.y1,obj.y2)&&y<=Math.max(obj.y1,obj.y2);
    if(obj.type==='line'){const dist=pointLineDistance(x,y,obj.x1,obj.y1,obj.x2,obj.y2); return dist<5;}
    if(obj.type==='pentagon') return x>=Math.min(obj.x1,obj.x2)&&x<=Math.max(obj.x1,obj.x2)&&y>=Math.min(obj.y1,obj.y2)&&y<=Math.max(obj.y1,obj.y2);
    if(obj.type==='diamond') {const cx=(obj.x1+obj.x2)/2; const cy=(obj.y1+obj.y2)/2; return x>=obj.x1 && x<=obj.x2 && y>=obj.y1 && y<=obj.y2;} 
    if(obj.type==='right-triangle') return x>=obj.x1 && x<=obj.x2 && y>=obj.y1 && y<=obj.y2;
    if(obj.type==='arrow'){const minX=Math.min(obj.x1,obj.x2),maxX=Math.max(obj.x1,obj.x2),minY=Math.min(obj.y1,obj.y2),maxY=Math.max(obj.y1,obj.y2); return x>=minX && x<=maxX && y>=minY && y<=maxY;}
    if(obj.type==='star'){const cx=(obj.x1+obj.x2)/2; const cy=(obj.y1+obj.y2)/2; const r=Math.abs(obj.x2-obj.x1)/2; return x>=cx-r && x<=cx+r && y>=cy-r && y<=cy+r;}
    if(obj.type==='hexagon'){const cx=(obj.x1+obj.x2)/2; const cy=(obj.y1+obj.y2)/2; const r=Math.abs(obj.x2-obj.x1)/2; return x>=cx-r && x<=cx+r && y>=cy-r && y<=cy+r;}
    return false;
}

function pointLineDistance(px,py,x1,y1,x2,y2){
    const A=px-x1, B=py-y1, C=x2-x1, D=y2-y1;
    const dot=A*C+B*D;
    const len_sq=C*C+D*D;
    let param=-1;
    if(len_sq!==0) param=dot/len_sq;
    let xx,yy;
    if(param<0){xx=x1; yy=y1;}else if(param>1){xx=x2; yy=y2;}else{xx=x1+param*C; yy=y1+param*D;}
    const dx=px-xx; const dy=py-yy;
    return Math.sqrt(dx*dx+dy*dy);
}