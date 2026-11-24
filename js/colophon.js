(function(){
  var root=document.documentElement, S=window.__SITE__||{};
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  // ---- theme ----
  window.setTheme=function(t){root.dataset.theme=t;try{localStorage.setItem('theme',t)}catch(e){};window.dispatchEvent(new Event('themechange'))};
  var mb=document.querySelector('.mode');
  mb&&mb.addEventListener('click',function(){setTheme(root.dataset.theme==='light'?'dark':'light')});
  // ---- reading progress ----
  var pg=document.querySelector('.progress');
  if(pg&&document.querySelector('.post')){var tk=0;addEventListener('scroll',function(){if(tk)return;tk=1;requestAnimationFrame(function(){var h=root.scrollHeight-innerHeight;pg.style.transform='scaleX('+(h>0?scrollY/h:0)+')';tk=0})},{passive:true})}

  // ---- jitter: 字不完全对齐，像铅字排得不太齐 ----
  function rnd(seed){var x=Math.sin(seed*12.9898)*43758.5453;return x-Math.floor(x)}
  function jitter(el,amp){
    var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode:function(n){
      var p=n.parentNode; if(!n.nodeValue.trim())return 2;
      while(p&&p!==el){if(/^(CODE|PRE|SCRIPT|KBD)$/.test(p.nodeName))return 2;p=p.parentNode}return 1}});
    var nodes=[],n,k=0;while(n=w.nextNode())nodes.push(n);
    nodes.forEach(function(t){
      var f=document.createDocumentFragment();
      t.nodeValue.split(/([A-Za-z0-9'’\-]+)/).forEach(function(part){
        if(!part)return;
        var latin=/^[A-Za-z0-9'’\-]+$/.test(part), host=f;
        if(latin){host=document.createElement('span');host.className='w';f.appendChild(host)}
        Array.from(part).forEach(function(ch){
          if(ch===' '){host.appendChild(document.createTextNode(' '));return}
          var s=document.createElement('span');s.className='c';s.textContent=ch;k++;
          s.style.setProperty('--y',((rnd(k)-.5)*amp).toFixed(3)+'px');
          s.style.setProperty('--r',((rnd(k+99)-.5)*amp*.6).toFixed(2)+'deg');
          host.appendChild(s)});
      });
      t.parentNode.replaceChild(f,t)});
  }
  window.jitterAll=function(){
    document.querySelectorAll('.jt').forEach(function(e){if(!e.dataset.j){e.dataset.j=1;jitter(e,1.1)}});
    document.querySelectorAll('.jt-soft').forEach(function(e){if(!e.dataset.j){e.dataset.j=1;jitter(e,.5)}});
  };
  jitterAll();

  // ---- rotating quotes ----
  var fig=document.querySelector('.quote');
  if(fig&&S.quotes&&S.quotes.length>1){
    var qi=0,bq=fig.querySelector('blockquote'),fc=fig.querySelector('figcaption'),tr=fig.querySelector('.tr');
    window.showQuote=function(i){
      qi=(i+S.quotes.length)%S.quotes.length;fig.classList.add('out');
      setTimeout(function(){var q=S.quotes[qi];bq.textContent=q[0];fc.textContent='— '+q[1];tr.textContent=q[2]||'';
        delete bq.dataset.j;delete fc.dataset.j;bq.classList.add('jt');jitterAll();fig.classList.remove('out')},900)};
    var timer=setInterval(function(){if(!document.hidden)showQuote(qi+1)},8000);
    fig.addEventListener('click',function(){clearInterval(timer);showQuote(qi+1);timer=setInterval(function(){if(!document.hidden)showQuote(qi+1)},8000)});
  }

  // ---- particles: "Glory Ruin" written in ink dust ----
  var cv=document.querySelector('.dust'); if(!cv)return;
  var ctx=cv.getContext('2d'),P=[],W,H,dpr=Math.min(devicePixelRatio||1,2),mouse={x:-1e4,y:-1e4},running=false,visible=true,gold,ink,t0=0,x0=0,x1=1,glint=-1;
  function colors(){var cs=getComputedStyle(root);gold=cs.getPropertyValue('--gold').trim();ink=cs.getPropertyValue('--soft').trim()}
  function build(){
    colors();
    var r=cv.getBoundingClientRect();W=r.width;H=r.height;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    var off=document.createElement('canvas'),o=off.getContext('2d');off.width=W;off.height=H;
    o.textAlign='center';o.textBaseline='middle';o.fillStyle='#000';
    var fs,small=W<480;
    if(small){fs=Math.min(W/3,H*.4);o.font=fs+'px "Pinyon Script", cursive';o.fillText('Glory',W*.42,H*.27);o.fillText('Ruin',W*.6,H*.75)}
    else{fs=Math.min(W/4.2,H*.78);o.font=fs+'px "Pinyon Script", cursive';o.fillText('Glory Ruin',W/2,H/2)}
    var d=o.getImageData(0,0,W,H).data,a0=W,a1=0,b0=H,b1=0;
    for(var yy=0;yy<H;yy+=2)for(var xx=0;xx<W;xx+=2)if(d[(yy*W+xx)*4+3]>128){if(xx<a0)a0=xx;if(xx>a1)a1=xx;if(yy<b0)b0=yy;if(yy>b1)b1=yy}
    var ox=Math.round((W-a0-a1)/2),oy=Math.round((H-b0-b1)/2),step=small?1.9:Math.max(2.2,W/340),fresh=!P.length;P=[];
    x0=a0+ox;x1=a1+ox;
    for(var y=0;y<H;y+=step)for(var x=0;x<W;x+=step){var al=d[(Math.round(y)*W+Math.round(x))*4+3];if(al<110)continue;
      var hx=x+ox+(Math.random()-.5)*step*.8,hy=y+oy+(Math.random()-.5)*step*.8;
      // 像墨点：大多细小，少数稍大；边缘的点更淡（像纸吸墨的晕）
      var big=Math.random();P.push({hx:hx,hy:hy,x:hx,y:hy,vx:0,vy:0,
        s:big<.06?2.1:big<.3?1.45:1.1, a:(al/255)*(.65+Math.random()*.35),
        g:Math.random()<.16, ph:Math.random()*6.28,
        // 书写：按横坐标依次落墨，同一列内从上到下
        delay:((hx-x0)/(x1-x0||1))*1500+(hy/H)*120+Math.random()*90})}
    t0=performance.now(); if(!fresh)P.forEach(function(p){p.delay=0});
    kick();
  }
  function frame(t){
    var el=t-t0;ctx.clearRect(0,0,W,H);var busy=el<2200,R=26;
    // 每隔一段时间，一道细光扫过字面
    if(glint<0&&!reduce&&Math.random()<.002)glint=x0-40;
    if(glint>=0){glint+=6;if(glint>x1+40)glint=-1;busy=true}
    for(var i=0;i<P.length;i++){var p=P[i];
      if(el<p.delay){continue}
      var k=Math.min(1,(el-p.delay)/260);
      var dx=p.x-mouse.x,dy=p.y-mouse.y,d2=dx*dx+dy*dy;
      if(d2<R*R){var f=(1-d2/(R*R))*1.6,d=Math.sqrt(d2)||1;p.vx+=dx/d*f;p.vy+=dy/d*f}
      var bx=reduce?0:Math.sin(t*.0007+p.ph)*.35,by=reduce?0:Math.cos(t*.0006+p.ph)*.35;
      p.vx+=(p.hx+bx-p.x)*.06;p.vy+=(p.hy+by-p.y)*.06;p.vx*=.8;p.vy*=.8;p.x+=p.vx;p.y+=p.vy;
      if(Math.abs(p.vx)+Math.abs(p.vy)>.08)busy=true;
      var a=p.a*k*(p.g?.5:1);
      if(glint>=0){var gd=Math.abs(p.hx-glint-(p.hy-H/2)*.35);if(gd<26)a=Math.min(1,a+(1-gd/26)*.6)}
      ctx.globalAlpha=a;ctx.fillStyle=p.g?ink:gold;
      var sz=p.s*(k<1?1+(1-k)*1.5:1);ctx.fillRect(p.x-sz/2,p.y-sz/2,sz,sz)}
    ctx.globalAlpha=1;
    if(visible&&!document.hidden&&(busy||mouse.x>-1e3||!reduce))requestAnimationFrame(frame);else running=false;
  }
  function kick(){if(!running&&visible){running=true;requestAnimationFrame(frame)}}
  window.scatterDust=function(){P.forEach(function(p){p.vx+=(Math.random()-.5)*40;p.vy+=(Math.random()-.5)*40});kick()};
  function at(e){var r=cv.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}}
  // mouse: dots part around the cursor; click scatters
  cv.addEventListener('pointermove',function(e){if(e.pointerType!=='mouse')return;var q=at(e);mouse.x=q.x;mouse.y=q.y;kick()});
  cv.addEventListener('pointerleave',function(){mouse.x=mouse.y=-1e4});
  cv.addEventListener('click',function(e){if(e.pointerType==='mouse'||!e.pointerType)scatterDust()});
  // touch: a tap sends one soft ripple outward from the finger, then the ink settles
  cv.addEventListener('pointerdown',function(e){if(e.pointerType==='mouse')return;var q=at(e);
    P.forEach(function(p){var dx=p.x-q.x,dy=p.y-q.y,d=Math.sqrt(dx*dx+dy*dy)||1;if(d<90){var f=(1-d/90)*7;p.vx+=dx/d*f;p.vy+=dy/d*f}});kick()});
  new IntersectionObserver(function(es){visible=es[0].isIntersecting;kick()}).observe(cv);
  document.addEventListener('visibilitychange',kick);
  window.addEventListener('themechange',colors);
  var rt,lw=innerWidth;addEventListener('resize',function(){if(innerWidth===lw)return;lw=innerWidth;clearTimeout(rt);rt=setTimeout(build,200)});
  (document.fonts?document.fonts.load('40px "Pinyon Script"'):Promise.resolve()).then(build,build);
})();
