/* ---- блок 1 ---- */
(function(){
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function(id){return document.getElementById(id)};
  function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
  var LS={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
  var S={m1:null,m2:null};

  /* Мнения. Положение на шкале — оценка автора проекта по смыслу высказывания. */
  var OPS=[
    {pos:.08,who:'Власть',name:'Ленин',text:'«Как не стыдно голосовать за издание 150 000 000 Маяковского в 5000 экз.?»',src:'записка Луначарскому о поэме Маяковского, около 1921'},
    {pos:.15,who:'Современник',name:'Художник Мильман',text:'«в сущности, хулиган»',src:'о Маяковском на выставке «Бубнового валета»; в пересказе Романа Якобсона, «Устная история»'},
    {pos:.21,who:'Критик',name:'Александр Бенуа',text:'«та икона, которую господа футуристы предлагают взамен мадонн»',src:'о «Чёрном квадрате», 1915–1916'},
    {pos:.30,who:'Обычный человек',name:'Иван Баженов, офицер',text:'«я воспитывался на Пушкине»',src:'о стихах Маяковского, «Устная история» через «Афишу Daily», 2018'},
    {pos:.50,who:'Власть',name:'Ленин',text:'«…насчёт политики ручаюсь, что это совершенно правильно»',src:'о «Прозаседавшихся», 1922'},
    {pos:.66,who:'Современник',name:'Евгения Ланг, художница',text:'«молодой гений»',src:'о Маяковском, «Устная история» через «Афишу Daily», 2018'},
    {pos:.76,who:'Современник',name:'Роман Якобсон, лингвист',text:'«сразу останавливал на себе внимание»',src:'о Маяковском, «Устная история» через «Афишу Daily», 2018'},
    {pos:.90,who:'Слушатель',name:'Владимир Сосинский, литератор',text:'«потрясающей силы»',src:'о чтении Маяковского, «Устная история» через «Афишу Daily», 2018'}
  ];

  /* ---------- slider ---------- */
  function mkSlider(root,opt){
    opt=opt||{};
    var thumb=root.querySelector('.thumb'), bar=root.querySelector('.bar');
    var api={value:null,touched:false,locked:false,root:root,
      set:function(v,fromUser){
        v=clamp(v,0,1); api.value=v;
        if(thumb){thumb.style.left=(v*100)+'%'; if(fromUser){api.touched=true; thumb.classList.remove('fresh')}}
        root.setAttribute('aria-valuenow',Math.round(v*100));
        if(opt.onInput) opt.onInput(v,fromUser);
      },
      lock:function(){api.locked=true; root.classList.add('locked'); root.removeAttribute('tabindex')},
      mark:function(which,v){var el=root.querySelector('.mk.'+which); if(!el) return; if(v==null){el.hidden=true;return} el.hidden=false; el.style.left=(v*100)+'%'}
    };
    if(opt.ticks){ opt.ticks.forEach(function(p){var t=document.createElement('i'); t.className='tick'; t.style.left=(p*100)+'%'; root.insertBefore(t,thumb)}) }
    if(thumb){
      var fromX=function(e){var r=bar.getBoundingClientRect(); return (e.clientX-r.left)/r.width};
      var drag=false;
      root.addEventListener('pointerdown',function(e){ if(api.locked) return; drag=true; try{root.setPointerCapture(e.pointerId)}catch(_){} api.set(fromX(e),true) });
      root.addEventListener('pointermove',function(e){ if(drag&&!api.locked) api.set(fromX(e),true) });
      var up=function(){ if(drag&&opt.onCommit&&api.value!=null) opt.onCommit(api.value); drag=false }; root.addEventListener('pointerup',up); root.addEventListener('pointercancel',up);
      root.addEventListener('keydown',function(e){
        if(api.locked) return; var v=api.value==null?.5:api.value;
        if(e.key==='ArrowLeft'||e.key==='ArrowDown'){api.set(v-.03,true);if(opt.onCommit)opt.onCommit(api.value);e.preventDefault()}
        else if(e.key==='ArrowRight'||e.key==='ArrowUp'){api.set(v+.03,true);if(opt.onCommit)opt.onCommit(api.value);e.preventDefault()}
        else if(e.key==='Home'){api.set(0,true);e.preventDefault()}
        else if(e.key==='End'){api.set(1,true);e.preventDefault()}
      });
      api.set(.5,false);
    }
    return api;
  }

  /* ---------- screen 1: opinions appear near the thumb ---------- */
  var qa=$('qa'), shown='';
  function showNear(v){
    var near=OPS.filter(function(o){return Math.abs(o.pos-v)<=.095}).sort(function(a,b){return Math.abs(a.pos-v)-Math.abs(b.pos-v)}).slice(0,2);
    var key=near.map(function(o){return o.pos}).join(',');
    if(key===shown) return; shown=key;
    qa.textContent='';
    near.forEach(function(o){
      var d=document.createElement('div'); d.className='qc';
      var a=document.createElement('div'); a.className='who'; a.textContent=o.who;
      var b=document.createElement('div'); b.className='nm'; b.textContent=o.name;
      var c=document.createElement('div'); c.className='tx'; c.textContent=o.text;
      var s=document.createElement('div'); s.className='src'; s.textContent=o.src;
      d.appendChild(a); d.appendChild(b); d.appendChild(c); d.appendChild(s); qa.appendChild(d);
    });
  }
  var s1=mkSlider($('s1'),{ticks:OPS.map(function(o){return o.pos}),
    onInput:function(v,u){
      if(!u) return;
      S.m1=v; showNear(v); try{drawGlass(v)}catch(e){}
      [].forEach.call($('s1').querySelectorAll('.tick'),function(t,i){t.classList.toggle('on',Math.abs(OPS[i].pos-v)<=.095)});
      reveal();
    },
    onCommit:function(v){ LS.set('m1',String(v)) }});
  function reveal(){
    if($('after').hidden){ $('after').hidden=false; $('cue').hidden=false }
    s2.mark('m1',S.m1); s3.mark('m1',S.m1);
  }
  $('cue').onclick=function(){ $('after').scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'}) };

  function addMk2(v){var i=document.createElement('i'); i.className='mk m2'; i.style.left=(v*100)+'%'; s2.root.appendChild(i)}
  function describe(){
    var t='';
    if(S.m1==null && S.m2!=null) t='Первой метки у вас нет, так что сравнивать пока не с чем.';
    else if(S.m1!=null && S.m2!=null){
      var d=Math.round((S.m2-S.m1)*100);
      t=Math.abs(d)<5 ? 'Вторая метка почти совпала с первой.' : 'Вторая метка стоит на '+Math.abs(d)+'% '+(d>0?'ближе к «признанному шедевру»':'ближе к «не вижу искусства»')+', чем первая.';
    }
    $('result').textContent=t; $('result2').textContent=t;
  }
  /* ---------- second slider ---------- */
  var s2=mkSlider($('s2'),{onInput:function(v,u){ if(u) $('lock2').hidden=false }});
  var s3=mkSlider($('s3'));
  $('lock2').onclick=function(){
    S.m2=s2.value; s2.lock(); $('lock2').hidden=true; s2.mark('m2',null); s2.mark('m1',S.m1); s3.mark('m1',S.m1);
    addMk2(S.m2);
    s3.mark('m1',S.m1); s3.mark('m2',S.m2); LS.set('m2',String(S.m2)); describe();
  };

  /* restore marks from a previous visit (per-browser only) */
  var p1=LS.get('m1');
  if(p1!==null && p1!=='' && !isNaN(+p1)){
    S.m1=+p1; s1.set(S.m1,true); reveal();
    var p2=LS.get('m2'); if(p2!==null && p2!=='' && !isNaN(+p2)){
      S.m2=+p2; s2.set(S.m2,true); s2.lock(); addMk2(S.m2);
      $('lock2').hidden=true; s3.mark('m2',S.m2); describe();
    }
  }

  /* ---------- ship scene ---------- */
  var NS='http://www.w3.org/2000/svg';
  var pin=$('pin-ship'), art=$('sc-art'), shipl=$('shipl'), pb=$('p-bust'), scp=$('sc-p'), scp2=$('sc-p2'), pre=$('sc-pre'), stx=$('sc-text');
  var RIDE=[0.0, 1.5, 3.1, 4.6, 6.1, 7.7, 9.2, 10.7, 12.2, 13.8, 15.3, 16.8, 18.4, 19.9, 21.4, 23.0, 24.5, 26.0, 27.6, 29.1, 31.3, 34.7, 38.1, 41.4, 44.8, 48.1, 51.5, 54.9, 58.7, 62.5, 66.2, 70.0, 73.8, 77.5, 81.3, 85.0, 88.8, 93.7, 98.6, 103.5, 108.4, 113.3, 129.9, 137.0, 144.9, 151.9, 159.8, 174.0, 181.0, 188.0, 196.8, 202.0, 216.8, 224.8, 232.8], RSTEP=20, DX0=1046;
  function ride(dx){var f=dx/RSTEP,i=Math.floor(f),k=f-i; if(i>=RIDE.length-1) return RIDE[RIDE.length-1]; return RIDE[i]*(1-k)+RIDE[i+1]*k}
  function progressOf(el){var r=el.getBoundingClientRect(),t=r.height-window.innerHeight; return t<=0?0:clamp(-r.top/t,0,1)}
  function drawShip(){
    var p=progressOf(pin); try{drawWords(p)}catch(e){}
    /* предисловие уходит, появляются пощёчина, гора и полосы */
    /* предисловие тает, появляется пощёчина */
    var f=clamp((p-.22)/.07,0,1);
    pre.style.opacity=String(1-clamp((p-.17)/.07,0,1)); pre.style.visibility=p>=.25?'hidden':'visible';
    art.style.opacity=String(f); stx.style.opacity=String(f);
    /* корабль выезжает по горе справа */
    var q=clamp((p-.27)/.3,0,1), e=1-Math.pow(1-q,3), dx=DX0*(1-e);
    var W=art.clientWidth, s=W/1798;
    shipl.style.transform='translate('+(dx*s).toFixed(1)+'px,'+(ride(dx)*s).toFixed(1)+'px)';
    scp.classList.toggle('on',p>=.6); scp2.classList.toggle('on',p>=.88);
    var rel=.66, t=clamp((p-rel)/.2,0,1), H=art.clientHeight, x=0, y=0, rot=0;
    if(p>=rel){ x=-.26*t*W; y=1.05*t*t*H; rot=-t*340 }
    pb.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px) rotate('+rot.toFixed(1)+'deg)';
  }

  /* ---------- timeline ---------- */
  var rows=[].slice.call(document.querySelectorAll('.row'));
  var ro=new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting){e.target.classList.add('on'); $('ms').textContent=e.target.dataset.m; $('ls').textContent=e.target.dataset.l}
  })},{rootMargin:'-42% 0px -42% 0px'});
  rows.forEach(function(r){ro.observe(r)});

  /* ---------- shelf ---------- */
  var plaques={
    'b-push':'<b>Пушкин.</b> В 1912 году манифест предлагал сбросить его с парохода современности. Сегодня он стоит на полке рядом с тем, кто подписал этот манифест.',
    'b-dost':'<b>Достоевский.</b> Третий в списке манифеста 1912 года: «бросить Пушкина, Достоевского, Толстого с парохода современности». Сегодня он тоже стоит на полке «уважаемых людей из прошлого».',
    'b-tol':'<b>Толстой.</b> Его манифест тоже предлагал сбросить с парохода. Теперь он рядом с теми, кто предлагал.',
    'b-maya':'<b>Маяковский.</b> 1913: хулиган. 1921: «как не стыдно». 1935: «лучший, талантливейший». В двух программах 11 класса ему отведено 4 и 7 часов.',
    'b-mal':'<b>Пустое место.</b> В тех же двух программах Малевич упомянут только рядом с кубистами. Слова «авангард» там нет.'
  };
  function pick(id){['b-push','b-dost','b-maya','b-tol','b-mal'].forEach(function(k){$(k).classList.toggle('turn',k===id)}); setPlaque(plaques[id])}
  function setPlaque(h){var pl=$('plaque'); pl.textContent=''; var m=/^<b>(.*?)<\/b>(.*)$/.exec(h); if(m){var b=document.createElement('b'); b.textContent=m[1]; pl.appendChild(b); pl.appendChild(document.createTextNode(m[2]))} else pl.textContent=h}
  Object.keys(plaques).forEach(function(id){
    var g=$(id); g.addEventListener('click',function(){pick(id)});
    g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(id)}});
  });

  /* ---------- text animation: preface words light up with scroll ---------- */
  var words=[];
  try{[].forEach.call(pre.querySelectorAll('p'),function(par){
    var parts=par.textContent.split(/\s+/).filter(Boolean); par.textContent='';
    parts.forEach(function(w,i){var sp=document.createElement('span'); sp.className='wd'; sp.textContent=w; par.appendChild(sp); if(i<parts.length-1) par.appendChild(document.createTextNode(' ')); words.push(sp)});
  })}catch(e){words=[]}
  function drawWords(p){
    var pr=reduce?1:clamp(p/.095,0,1), n=words.length;
    for(var i=0;i<n;i++){var o=.16+.84*clamp(pr*(n+5)-i,0,5)/5; words[i].style.opacity=o.toFixed(2)}
  }

  /* ---------- red screen: sentences; Mayakovsky and Pushkin slide along the scale ---------- */
  var rp=$('redpin'), rsent=[].slice.call($('red-p').children), rsc=$('rscale'), rpair=$('rpair');
  function drawRed(){
    var p=progressOf(rp), th=[.04,.18,.32,.5];
    rsent.forEach(function(sp,i){sp.classList.toggle('on',reduce||p>=th[i])});
    rsc.classList.toggle('on',reduce||p>=.32);
    var q=reduce?0:clamp((p-.45)/.5,0,1), pos=reduce?.5:.5-.5*Math.cos(q*3*Math.PI);
    rpair.style.transform='translateX('+(pos*(rsc.clientWidth-rpair.clientWidth)).toFixed(1)+'px)';
  }

  /* ---------- screen 1: realistic glass over the painting ---------- */
  var NSV='http://www.w3.org/2000/svg', glass=$('glass'), shards=[], GR={x0:25,y0:43,x1:115,y1:133}, gbase;
  function el(n,at,par){var e=document.createElementNS(NSV,n); for(var k in at) e.setAttribute(k,at[k]); if(par) par.appendChild(e); return e}
  try{(function(){
    var seed=77; function rn(){seed=(seed*16807)%2147483647; return seed/2147483647}
    function hash(a,b,c,d){var x=Math.sin(a*12.9898+b*78.233+c*37.719+d*4.581)*43758.5453; return x-Math.floor(x)}
    function onB(p,q){return (Math.abs(p[0]-GR.x0)<1e-6&&Math.abs(q[0]-GR.x0)<1e-6)||(Math.abs(p[0]-GR.x1)<1e-6&&Math.abs(q[0]-GR.x1)<1e-6)||(Math.abs(p[1]-GR.y0)<1e-6&&Math.abs(q[1]-GR.y0)<1e-6)||(Math.abs(p[1]-GR.y1)<1e-6&&Math.abs(q[1]-GR.y1)<1e-6)}
    /* общий для соседних осколков рваный край */
    function jag(p,q){
      if(onB(p,q)) return [];
      var sw=(p[0]>q[0]||(p[0]===q[0]&&p[1]>q[1])), a=sw?q:p, b=sw?p:q, dx=b[0]-a[0], dy=b[1]-a[1], len=Math.sqrt(dx*dx+dy*dy)||1, nx=-dy/len, ny=dx/len, amp=Math.min(len*.2,1.5), out=[];
      [[.28,0],[.52,1],[.76,2]].forEach(function(t){var o=(hash(a[0],a[1],b[0],b[1]+t[1])-.5)*amp*2; out.push([a[0]+dx*t[0]+nx*o, a[1]+dy*t[0]+ny*o])});
      return sw?out.reverse():out;
    }
    function clip(poly){
      [[0,1,GR.x0],[0,-1,GR.x1],[1,1,GR.y0],[1,-1,GR.y1]].forEach(function(e){
        var ax=e[0],sg=e[1],lim=e[2],out=[], inside=function(p){return sg>0?p[ax]>=lim:p[ax]<=lim};
        for(var i=0;i<poly.length;i++){var a=poly[i],b=poly[(i+1)%poly.length],ia=inside(a),ib=inside(b); if(ia) out.push(a); if(ia!==ib){var t=(lim-a[ax])/(b[ax]-a[ax]); out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])}}
        poly=out;
      });
      return poly;
    }
    var N=14, R=[0,5,11,19,30,44,62,86,118], I=[60,76], V=[];
    for(var i=0;i<N;i++){V[i]=[]; var th=(i+(rn()-.5)*.4)*2*Math.PI/N;
      for(var j=0;j<R.length;j++){var r=R[j]*(j?1+(rn()-.5)*.3:0), a=th+(rn()-.5)*.12; V[i][j]=[I[0]+r*Math.cos(a),I[1]+r*Math.sin(a)]}}
    var defs=el('defs',{},glass);
    function lg(id,x1,y1,x2,y2,stops){var g=el('linearGradient',{id:id,x1:x1,y1:y1,x2:x2,y2:y2},defs); stops.forEach(function(t){el('stop',{offset:t[0],'stop-color':t[1],'stop-opacity':t[2]},g)})}
    lg('gl',0,0,1,1,[[0,'#fff',.30],[.5,'#cfe9e2',.04],[1,'#fff',.2]]);
    lg('stk',0,0,1,0,[[0,'#fff',0],[.5,'#fff',.2],[1,'#fff',0]]);
    lg('sky',0,0,.75,1,[[0,'#fff',.2],[.42,'#fff',.05],[1,'#0a2a26',.1]]);
    el('rect',{x:25,y:43,width:90,height:90},el('clipPath',{id:'gclip'},defs));
    el('feGaussianBlur',{stdDeviation:2.2},el('filter',{id:'gblur',x:'-20%',y:'-20%',width:'140%',height:'140%'},defs));
    el('feDropShadow',{dx:.5,dy:1.1,stdDeviation:.7,'flood-color':'#000','flood-opacity':.55},el('filter',{id:'gsh',x:'-20%',y:'-20%',width:'140%',height:'140%'},defs));
    var pane=el('g',{filter:'url(#gsh)'},glass);
    /* целое стекло: блики, фаска, пыль */
    gbase=el('g',{'clip-path':'url(#gclip)'},glass); gbase.id='gbase'; gbase.style.transition='opacity .5s';
    el('rect',{x:25,y:43,width:90,height:90,fill:'url(#sky)'},gbase);
    el('polygon',{points:'27,46 62,46 45,78 27,86',fill:'#fff','fill-opacity':.1,filter:'url(#gblur)'},gbase);
    var st=el('g',{'class':'streak'},gbase); el('polygon',{points:'52,43 70,43 48,133 30,133',fill:'url(#stk)'},st); el('polygon',{points:'84,43 90,43 68,133 62,133',fill:'url(#stk)',opacity:.7},st);
    el('rect',{x:25.35,y:43.35,width:89.3,height:89.3,fill:'none',stroke:'#9fe3cf','stroke-opacity':.38,'stroke-width':.7},gbase);
    el('path',{d:'M25.7 132.3 V43.7 H114.3',fill:'none',stroke:'#fff','stroke-opacity':.7,'stroke-width':.28},gbase);
    el('path',{d:'M114.4 44 V132.4 H26',fill:'none',stroke:'#000','stroke-opacity':.28,'stroke-width':.4},gbase);
    for(var d=0;d<14;d++) el('circle',{cx:(27+rn()*86).toFixed(1),cy:(45+rn()*86).toFixed(1),r:(.12+rn()*.22).toFixed(2),fill:'#fff','fill-opacity':(.25+rn()*.4).toFixed(2)},gbase);
    function addShard(pts,j){
      var poly=clip(pts); if(poly.length<3) return;
      var full=[]; for(var i=0;i<poly.length;i++){var p=poly[i],q=poly[(i+1)%poly.length]; full.push(p); jag(p,q).forEach(function(x){full.push(x)})}
      var cx=0,cy=0; full.forEach(function(p){cx+=p[0];cy+=p[1]}); cx/=full.length; cy/=full.length;
      var pts_s=full.map(function(p){return p[0].toFixed(2)+','+p[1].toFixed(2)}).join(' ');
      var idx=shards.length, cp=el('clipPath',{id:'cp'+idx},defs); el('polygon',{points:pts_s},cp);
      var g=el('g',{'class':'sh'},pane); g.style.transformBox='view-box'; g.style.transformOrigin=cx.toFixed(1)+'px '+cy.toFixed(1)+'px';
      var rg=el('g',{'clip-path':'url(#cp'+idx+')'},g);
      var img=el('image',{href:'img/square.jpg',x:20,y:38,width:100,height:100.6,preserveAspectRatio:'none'},rg);
      var body=el('polygon',{points:pts_s,fill:'url(#gl)','fill-opacity':0},g);
      var tint=el('polygon',{points:pts_s,fill:rn()>.5?'#fff':'#000','fill-opacity':0},g);
      var sh=el('polygon',{points:pts_s,fill:'none',stroke:'#000','stroke-opacity':0,'stroke-width':.34,transform:'translate(.2 .22)'},g);
      var hi=el('polygon',{points:pts_s,fill:'none',stroke:'#f4fffb','stroke-opacity':0,'stroke-width':.2},g);
      var br=null;
      if(rn()<.4){ var k=Math.floor(rn()*poly.length), a=poly[k], b=poly[(k+1)%poly.length], m=[(a[0]+b[0])/2,(a[1]+b[1])/2], tx=cx-m[0], ty=cy-m[1], f=.35+rn()*.45, e2=[m[0]+tx*f+(rn()-.5)*2, m[1]+ty*f+(rn()-.5)*2], mid=[(m[0]+e2[0])/2+(rn()-.5)*1.2,(m[1]+e2[1])/2+(rn()-.5)*1.2];
        br=el('path',{d:'M'+m[0].toFixed(2)+' '+m[1].toFixed(2)+' L'+mid[0].toFixed(2)+' '+mid[1].toFixed(2)+' L'+e2[0].toFixed(2)+' '+e2[1].toFixed(2),fill:'none',stroke:'#f4fffb','stroke-width':.13,'stroke-opacity':0},g) }
      var dx=cx-I[0], dy=cy-I[1], dd=Math.sqrt(dx*dx+dy*dy)||1;
      shards.push({g:g,rg:rg,img:img,body:body,tint:tint,sh:sh,hi:hi,br:br,j:j,thr:Math.max(0,(j-1)/R.length*.85),dx:dx/dd,dy:dy/dd,rot:(rn()-.5)*2,dist:dd,r1:rn(),r2:rn(),r3:rn(),r4:rn()-.5,r5:rn()-.5,chip:(j===1&&rn()<.45)});
    }
    for(var i=0;i<N;i++){var i2=(i+1)%N;
      addShard([I,V[i][1],V[i2][1]],1);
      for(var j=1;j<R.length-1;j++) addShard([V[i][j],V[i2][j],V[i2][j+1],V[i][j+1]],j+1);
    }
  })();}catch(e){shards=[]}
  function drawGlass(v){
    var c=clamp((.42-v)/.30,0,1), fall=v<.1;
    gbase.style.opacity=fall?0:String(1-c*.55);
    shards.forEach(function(s){
      var vis=clamp((c*1.35-s.thr)/.16,0,1), gone=fall||(s.chip&&c>.55);
      var so=(vis*.95).toFixed(2);
      s.hi.setAttribute('stroke-opacity',so); s.sh.setAttribute('stroke-opacity',(vis*.5).toFixed(2));
      if(s.br) s.br.setAttribute('stroke-opacity',(vis*.8).toFixed(2));
      s.body.setAttribute('fill-opacity',(vis*(.5+.4*s.r1)).toFixed(2));
      s.tint.setAttribute('fill-opacity',(vis*.05*(1+s.r2)).toFixed(3));
      /* преломление: картина под осколком чуть смещается */
      var rx=s.r4*1.5*c, ry=s.r5*1.5*c, lift=c*(.2+.9*s.r1), rot=s.rot*c*2.4, tr, d=gone?(fall?0:.05):0;
      s.img.style.transition='transform .6s, opacity .25s'; s.img.style.transform='translate('+rx.toFixed(2)+'px,'+ry.toFixed(2)+'px)';
      s.rg.style.transition='opacity .25s'; s.rg.style.opacity=gone?'0':String(vis);
      if(gone){
        var big=fall?1:.35, fx=s.dx*(6+s.r2*16)*big+(s.r3-.5)*14*big, fy=(fall?70+s.r1*95+(1-s.dist/118)*30:30+s.r1*40), fr=(s.rot>0?1:-1)*(140+s.r2*320);
        tr='translate('+fx.toFixed(1)+'px,'+fy.toFixed(1)+'px) rotate('+fr.toFixed(0)+'deg) scale('+(.8+s.r3*.2).toFixed(2)+')';
        var dl=fall?(s.dist/118*.35+s.r2*.25):s.r2*.1;
        s.g.style.transition='transform '+(1.05+s.r1*.6).toFixed(2)+'s cubic-bezier(.55,.05,.9,.6) '+dl.toFixed(2)+'s, opacity .45s ease-in '+(.7+dl).toFixed(2)+'s';
        s.g.style.opacity='0';
      } else {
        tr='translate('+(s.dx*lift).toFixed(2)+'px,'+(s.dy*lift).toFixed(2)+'px) rotate('+rot.toFixed(2)+'deg)';
        s.g.style.transition='transform .6s cubic-bezier(.3,.8,.3,1), opacity .35s'; s.g.style.opacity='1';
      }
      s.g.style.transform=tr;
    });
  }
  try{drawGlass(.5)}catch(e){}

  var tick=false, rtick=false;
  function onScroll(){if(tick)return;tick=true;requestAnimationFrame(function(){tick=false;drawShip()})}
  addEventListener('scroll',function(){onScroll();if(!rtick){rtick=true;requestAnimationFrame(function(){rtick=false;try{drawRed()}catch(e){}})}},{passive:true}); addEventListener('resize',function(){onScroll();try{drawRed()}catch(e){}}); drawShip(); try{drawRed()}catch(e){}
})();

/* ---- блок 2 ---- */
/* вступление стартует, когда страницу действительно видно */
(function(){
  var f=document.getElementById('first'); if(!f) return;
  f.classList.add('wait');
  var done=false;
  function go(){ if(done) return; done=true; setTimeout(function(){ f.classList.remove('wait') },450) }
  function vis(){ return document.visibilityState!=='hidden' }
  try{
    var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting && vis()) go() }) },{threshold:.3});
    io.observe(f);
  }catch(e){ go() }
  document.addEventListener('visibilitychange',function(){ if(vis()&&f.getBoundingClientRect().top<innerHeight*.7) go() });
  setTimeout(go,6000);
})();
