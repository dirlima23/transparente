import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeMask,makeAutoMask} from './mask.js';
const pixels=new Uint8ClampedArray([255,255,255,255,0,0,0,255,255,255,255,255]);
test('áreas conectadas preservam fundo separado pelo objeto',()=>{assert.deepEqual([...makeMask(pixels,3,1,0,10,0,true)],[255,0,0]);});
test('seleção global remove as duas regiões da mesma cor',()=>{assert.deepEqual([...makeMask(pixels,3,1,0,10,0,false)],[255,0,255]);});
test('suavização produz transparência parcial para cores próximas',()=>{const data=new Uint8ClampedArray([255,255,255,255,235,235,235,255]);assert.deepEqual([...makeMask(data,2,1,0,10,20,true)],[255,128]);});

function fixture(width,height,pixel){return new Uint8ClampedArray(Array.from({length:width*height},(_,i)=>pixel(i%width,Math.floor(i/width))).flat());}
test('automático preserva objeto no canto e detecta o fundo nas outras bordas',()=>{
 const data=fixture(12,12,(x,y)=>x<4&&y<4?[0,0,0,255]:[245,245,245,255]);
 const {mask}=makeAutoMask(data,12,12,20,0);
 assert.equal(mask[0],0);assert.equal(mask[11],255);assert.equal(mask[143],255);
});
test('automático alcança fundos separados pelo objeto a partir de todas as bordas',()=>{
 const data=fixture(9,9,x=>x>=3&&x<=5?[0,0,0,255]:[240,240,240,255]);
 const {mask}=makeAutoMask(data,9,9,15,0);
 assert.equal(mask[4*9+1],255);assert.equal(mask[4*9+7],255);assert.equal(mask[4*9+4],0);
});
test('conexão preserva o interior da letra; modo global também o remove',()=>{
 const data=fixture(9,9,(x,y)=>x>=2&&x<=6&&y>=2&&y<=6&&(x===2||x===6||y===2||y===6)?[0,0,0,255]:[255,255,255,255]);
 assert.equal(makeAutoMask(data,9,9,10,0,true).mask[40],0);
 assert.equal(makeAutoMask(data,9,9,10,0,false).mask[40],255);
});
test('automático não usa cores ocultas de bordas já transparentes',()=>{
 const data=fixture(9,9,(x,y)=>x===0||y===0||x===8||y===8?[0,0,0,0]:[0,0,0,255]);
 assert.equal(makeAutoMask(data,9,9,20,0).reason,'transparent');
});
