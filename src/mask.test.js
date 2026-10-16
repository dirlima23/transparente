import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeMask} from './mask.js';
const pixels=new Uint8ClampedArray([255,255,255,255,0,0,0,255,255,255,255,255]);
test('áreas conectadas preservam fundo separado pelo objeto',()=>{assert.deepEqual([...makeMask(pixels,3,1,0,10,0,true)],[255,0,0]);});
test('seleção global remove as duas regiões da mesma cor',()=>{assert.deepEqual([...makeMask(pixels,3,1,0,10,0,false)],[255,0,255]);});
test('suavização produz transparência parcial para cores próximas',()=>{const data=new Uint8ClampedArray([255,255,255,255,235,235,235,255]);assert.deepEqual([...makeMask(data,2,1,0,10,20,true)],[255,128]);});
