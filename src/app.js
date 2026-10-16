import {makeMask,makeAutoMask} from './mask.js';
const $=id=>document.getElementById(id),canvas=$('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
let original,mask,history=[],seed=0,selectionBase=null,hasSelection=false,selectionKind='manual',busy=false,tool='view',view='result',zoom=1,drawing=false,lastPoint,name='imagem',loadId=0;
const status=text=>$('status').textContent=text;
const save=()=>{history.push({mask:mask.slice(),seed,selectionBase,hasSelection,selectionKind});if(history.length>5)history.shift();$('undo').disabled=false;};
function render(){if(!original)return;const result=new ImageData(new Uint8ClampedArray(original.data),original.width,original.height);let removed=0;for(let i=0;i<mask.length;i++){removed+=mask[i]/255;const p=i*4;if(view==='result')result.data[p+3]=Math.round(original.data[p+3]*(1-mask[i]/255));if(view==='mask'){const a=mask[i]/255*.7;result.data[p]=original.data[p]*(1-a)+245*a;result.data[p+1]=original.data[p+1]*(1-a)+85*a;result.data[p+2]=original.data[p+2]*(1-a)+105*a;}}ctx.putImageData(result,0,0);$('removalCount').textContent=(removed/mask.length*100).toLocaleString('pt-BR',{maximumFractionDigits:1})+'% removido';}
function fit(){if(!original)return;zoom=Math.max(.01,Math.min(1,($('stage').clientWidth-48)/canvas.width,($('stage').clientHeight-32)/canvas.height));size();$('stage').scrollTo(0,0);}
function size(){canvas.style.width=canvas.width*zoom+'px';canvas.style.height=canvas.height*zoom+'px';$('zoomValue').textContent=Math.round(zoom*100)+'%';}
function useImage(image,filename){canvas.width=image.width;canvas.height=image.height;ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0);original=ctx.getImageData(0,0,canvas.width,canvas.height);mask=new Uint8ClampedArray(canvas.width*canvas.height);history=[];seed=0;selectionBase=null;hasSelection=false;name=filename.replace(/\.[^.]+$/,'');$('empty').hidden=true;canvas.hidden=false;$('dimensions').textContent=`${canvas.width} × ${canvas.height} px`;$('filename').textContent=filename;setTool('view');for(const id of ['auto','manual','reset','download'])$(id).disabled=false;$('undo').disabled=true;setView('result');fit();status('Imagem carregada. Escolha a remoção automática ou por cliques.');}
async function load(file){if(!file)return;const id=++loadId;if(!['image/png','image/jpeg','image/webp'].includes(file.type)){status('Escolha uma imagem PNG, JPG ou WebP.');return;}if(file.size>20*1024*1024){status('A imagem deve ter no máximo 20 MB.');return;}try{const image=await createImageBitmap(file);if(id!==loadId){image.close();return;}if(image.width*image.height>16000000){image.close();status('Use uma imagem de até 16 megapixels.');return;}useImage(image,file.name);image.close();}catch{status('Não foi possível abrir esta imagem. Tente outro arquivo.');}}
for(const id of ['upload','choose'])$(id).onclick=()=>$('file').click();$('file').onchange=e=>{load(e.target.files[0]);e.target.value='';};
const stage=$('stage');stage.ondragover=e=>{e.preventDefault();stage.classList.add('drag');};stage.ondragleave=()=>stage.classList.remove('drag');stage.ondrop=e=>{e.preventDefault();stage.classList.remove('drag');load(e.dataTransfer.files[0]);};
function applySelection(area){
  area??=selectionKind==='auto'?makeAutoMask(original.data,canvas.width,canvas.height,+$('tolerance').value,+$('feather').value,$('connected').checked).mask:makeMask(original.data,canvas.width,canvas.height,seed,+$('tolerance').value,+$('feather').value,$('connected').checked);
  if(!area)return false;
  // Keep every previous removal, including partially transparent edges and brush edits.
  for(let i=0;i<mask.length;i++)mask[i]=Math.max(selectionBase[i],area[i]);
  setView(view==='original'?'result':view);
  return true;
}
function remove(nextSeed){if(!original||busy)return;save();selectionKind='manual';selectionBase=mask.slice();seed=nextSeed;hasSelection=true;applySelection();status('Área adicionada à remoção. Continue clicando em outras áreas.');}
function refineSelection(){if(!original||busy)return;if(!hasSelection){status('Ajuste aplicado à próxima remoção. Seus retoques foram preservados.');return;}save();if(!applySelection()){status('Não encontrei um fundo uniforme com esses ajustes. A edição foi preservada.');return;}status(selectionKind==='auto'?'Remoção automática ajustada. Confira a prévia.':'Última área ajustada. As remoções anteriores foram preservadas.');}
$('auto').onclick=async()=>{
  if(!original||busy)return;
  busy=true;$('auto').disabled=true;status('Analisando as cores nas bordas da imagem…');
  const image=original,version=loadId;
  await new Promise(resolve=>setTimeout(resolve,30));
  try{
    if(original!==image||loadId!==version)return;
    const result=makeAutoMask(original.data,canvas.width,canvas.height,+$('tolerance').value,+$('feather').value,$('connected').checked);
    if(!result.mask){status(result.reason==='transparent'?'As bordas já são transparentes. Use os cliques para remover outras áreas.':'Não encontrei um fundo uniforme. Use a remoção por cliques.');return;}
    save();selectionBase=mask.slice();selectionKind='auto';hasSelection=true;applySelection(result.mask);setTool('view');
    status('Fundo detectado nas bordas e removido. Use os cliques ou pincéis para refinar.');
  }catch{status('Não foi possível analisar esta imagem. Tente a remoção por cliques.');}
  finally{busy=false;$('auto').disabled=!original;}
};
for(const id of ['tolerance','feather','brush']){$(id).oninput=()=>{$(id+'Value').textContent=$(id).value+(id==='brush'?' px':'');};if(id!=='brush')$(id).onchange=refineSelection;}
$('connected').onchange=refineSelection;
function setView(value){view=value;document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-pressed',String(b.dataset.view===view));});$('viewLabel').textContent={result:'PRÉVIA DO RECORTE',original:'IMAGEM ORIGINAL',mask:'ÁREA REMOVIDA · EM VERMELHO'}[view];render();}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
function setTool(value){
  tool=value;
  document.querySelectorAll('[data-tool]').forEach(el=>{const active=el.dataset.tool===tool;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active));});
  canvas.style.cursor=tool==='view'?'default':'crosshair';
  $('toolHelp').textContent={view:'Prévia do recorte. Ative Remover por cliques para selecionar áreas. Role para dar zoom.',select:'Clique em cada área para somar à remoção. Use a roda do mouse para aproximar.',erase:'Arraste o pincel sobre as áreas que deseja deixar transparentes.',restore:'Arraste o pincel para recuperar detalhes da imagem original.'}[tool];
}
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
function point(e){const r=canvas.getBoundingClientRect();return{x:Math.max(0,Math.min(canvas.width-1,(e.clientX-r.left)*canvas.width/r.width)),y:Math.max(0,Math.min(canvas.height-1,(e.clientY-r.top)*canvas.height/r.height))};}
function brush(p){const radius=+$('brush').value/2;for(let y=Math.max(0,Math.floor(p.y-radius));y<Math.min(canvas.height,Math.ceil(p.y+radius));y++)for(let x=Math.max(0,Math.floor(p.x-radius));x<Math.min(canvas.width,Math.ceil(p.x+radius));x++){if(Math.hypot(x-p.x,y-p.y)<=radius)mask[y*canvas.width+x]=tool==='erase'?255:0;}}
canvas.onpointerdown=e=>{if(!original||busy||tool==='view'||e.button!==0)return;e.preventDefault();const p=point(e);if(tool==='select'){remove(Math.floor(p.y)*canvas.width+Math.floor(p.x));return;}if(view==='original')setView('result');save();hasSelection=false;selectionBase=null;drawing=true;lastPoint=p;canvas.setPointerCapture(e.pointerId);brush(p);render();};
canvas.onpointermove=e=>{if(!drawing)return;const p=point(e),distance=Math.hypot(p.x-lastPoint.x,p.y-lastPoint.y),steps=Math.max(1,Math.ceil(distance/Math.max(1,+$('brush').value/4)));for(let i=1;i<=steps;i++)brush({x:lastPoint.x+(p.x-lastPoint.x)*i/steps,y:lastPoint.y+(p.y-lastPoint.y)*i/steps});lastPoint=p;render();};
canvas.onpointerup=canvas.onpointercancel=()=>{drawing=false;};
$('undo').onclick=()=>{if(busy)return;if(history.length){({mask,seed,selectionBase,hasSelection,selectionKind}=history.pop());render();$('undo').disabled=!history.length;status('Última edição desfeita.');}};$('reset').onclick=()=>{if(original&&!busy){save();mask.fill(0);hasSelection=false;selectionBase=null;setView('result');status('Imagem original restaurada.');}};
function changeZoom(factor,clientX,clientY){
  if(!original)return;
  const bounds=stage.getBoundingClientRect();
  clientX??=bounds.left+stage.clientWidth/2;clientY??=bounds.top+stage.clientHeight/2;
  const before=canvas.getBoundingClientRect();
  const x=(clientX-before.left)/zoom,y=(clientY-before.top)/zoom;
  zoom=Math.max(.01,Math.min(4,zoom*factor));size();
  const after=canvas.getBoundingClientRect();
  stage.scrollLeft+=after.left+x*zoom-clientX;
  stage.scrollTop+=after.top+y*zoom-clientY;
}
stage.addEventListener('wheel',e=>{
  if(!original||!e.deltaY)return;
  e.preventDefault();if(drawing)return;
  const pixels=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?stage.clientHeight:1);
  changeZoom(Math.exp(-Math.max(-400,Math.min(400,pixels))*.002),e.clientX,e.clientY);
},{passive:false});
$('zoomIn').onclick=()=>changeZoom(1.2);$('zoomOut').onclick=()=>changeZoom(1/1.2);$('fit').onclick=fit;
$('download').onclick=()=>{if(!original)return;const output=document.createElement('canvas');output.width=canvas.width;output.height=canvas.height;const result=new ImageData(new Uint8ClampedArray(original.data),canvas.width,canvas.height);for(let i=0;i<mask.length;i++)result.data[i*4+3]=Math.round(original.data[i*4+3]*(1-mask[i]/255));output.getContext('2d').putImageData(result,0,0);output.toBlob(blob=>{if(!blob){status('Não foi possível gerar o PNG.');return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name+'-transparente.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);status('PNG com transparência exportado.');},'image/png');};
$('demo').onclick=()=>{loadId++;const sample=document.createElement('canvas');sample.width=900;sample.height=700;const c=sample.getContext('2d');c.fillStyle='#e5e8dd';c.fillRect(0,0,900,700);c.fillStyle='#b47749';c.beginPath();c.moveTo(340,440);c.lineTo(560,440);c.lineTo(530,610);c.quadraticCurveTo(450,640,370,610);c.closePath();c.fill();c.strokeStyle='#42694b';c.lineWidth=12;c.beginPath();c.moveTo(450,450);c.quadraticCurveTo(420,320,465,160);c.stroke();for(const [x,y,angle] of [[420,340,-.7],[478,280,.6],[424,220,-.5],[477,166,.6]]){c.save();c.translate(x,y);c.rotate(angle);c.fillStyle=y===220?'#73945c':'#416b4b';c.beginPath();c.ellipse(0,0,68,28,0,0,Math.PI*2);c.fill();c.restore();}useImage(sample,'planta-exemplo.png');status('Exemplo carregado. Escolha remoção automática ou por cliques.');};

$('help').onclick=()=>$('help-dialog').showModal();
$('close-help').onclick=()=>$('help-dialog').close();
$('help-dialog').onclick=e=>{if(e.target===$('help-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}};
