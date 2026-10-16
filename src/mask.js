export function makeMask(data,width,height,seed,tolerance,feather,connected=true){
 const offset=seed*4;
 return maskForColor(data,width,height,[data[offset],data[offset+1],data[offset+2]],[seed],tolerance,feather,connected);
}

function maskForColor(data,width,height,color,seeds,tolerance,feather,connected){
 const count=width*height,mask=new Uint8ClampedArray(count),seen=new Uint8Array(count),queue=new Int32Array(count);
 const alpha=i=>{const p=i*4;const d=Math.sqrt(((data[p]-color[0])**2+(data[p+1]-color[1])**2+(data[p+2]-color[2])**2)/3);return d<=tolerance?255:feather>0?Math.round(255*Math.max(0,1-(d-tolerance)/feather)):0;};
 if(!connected){for(let i=0;i<count;i++)mask[i]=alpha(i);return mask;}
 let head=0,tail=0;
 for(const seed of seeds){if(!seen[seed]){queue[tail++]=seed;seen[seed]=1;}}
 while(head<tail){const i=queue[head++],a=alpha(i);mask[i]=a;if(!a)continue;const x=i%width;const visit=n=>{if(!seen[n]){seen[n]=1;queue[tail++]=n;}};if(x>0)visit(i-1);if(x<width-1)visit(i+1);if(i>=width)visit(i-width);if(i<count-width)visit(i+width);}
 return mask;
}

function* borderPixels(width,height){
 for(let x=0;x<width;x++){yield x;if(height>1)yield (height-1)*width+x;}
 for(let y=1;y<height-1;y++){yield y*width;if(width>1)yield y*width+width-1;}
}

// Infer the dominant border color instead of assuming that one corner is background.
export function makeAutoMask(data,width,height,tolerance,feather,connected=true){
 const samples=[],bins=new Map();
 const step=Math.max(1,Math.ceil((2*width+2*height)/2048));
 let position=0,total=0;
 for(const i of borderPixels(width,height)){
  if(position++%step)continue;
  total++;
  if(data[i*4+3]<32)continue;
  const color=[data[i*4],data[i*4+1],data[i*4+2]];
  samples.push(color);
  const key=color.map(c=>c>>5).join(',');
  const bin=bins.get(key)||{count:0,sum:[0,0,0]};
  bin.count++;color.forEach((c,k)=>bin.sum[k]+=c);bins.set(key,bin);
 }
 if(!samples.length||samples.length<total*.1)return {mask:null,reason:'transparent'};
 const dominant=[...bins.values()].sort((a,b)=>b.count-a.count)[0];
 const center=dominant.sum.map(c=>c/dominant.count);
 const distance=(a,b)=>Math.sqrt(a.reduce((sum,c,k)=>sum+(c-b[k])**2,0)/3);
 const similar=samples.filter(c=>distance(c,center)<=Math.max(12,Math.min(tolerance,45)));
 if(similar.length/samples.length<.25)return {mask:null,reason:'complex'};
 const color=[0,1,2].map(k=>Math.round(similar.reduce((sum,c)=>sum+c[k],0)/similar.length));
 return {mask:maskForColor(data,width,height,color,borderPixels(width,height),tolerance,feather,connected),color,reason:null};
}
