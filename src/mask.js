export function makeMask(data,width,height,seed,tolerance,feather,connected=true){
 const count=width*height,mask=new Uint8ClampedArray(count),seen=new Uint8Array(count),queue=new Int32Array(count);
 const offset=seed*4, color=[data[offset],data[offset+1],data[offset+2]];
 const alpha=i=>{const p=i*4;const d=Math.sqrt(((data[p]-color[0])**2+(data[p+1]-color[1])**2+(data[p+2]-color[2])**2)/3);return d<=tolerance?255:feather>0?Math.round(255*Math.max(0,1-(d-tolerance)/feather)):0;};
 if(!connected){for(let i=0;i<count;i++)mask[i]=alpha(i);return mask;}
 let head=0,tail=1;queue[0]=seed;seen[seed]=1;
 while(head<tail){const i=queue[head++],a=alpha(i);mask[i]=a;if(!a)continue;const x=i%width;const visit=n=>{if(!seen[n]){seen[n]=1;queue[tail++]=n;}};if(x>0)visit(i-1);if(x<width-1)visit(i+1);if(i>=width)visit(i-width);if(i<count-width)visit(i+width);}
 return mask;
}
