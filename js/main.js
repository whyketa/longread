/* параллакс фото на первом экране: за мышью сдвигается влево-вправо, чуть вверх-вниз */
(function(){
  var im=document.getElementById('fphoto'), im2=document.getElementById('mcross'); if(!im) return;
  if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var tx=0,ty=0,cx=0,cy=0,run=false;
  function frame(){ cx+=(tx-cx)*.08; cy+=(ty-cy)*.08; var t='translate3d('+cx.toFixed(1)+'px,'+cy.toFixed(1)+'px,0)'; im.style.transform=t; if(im2) im2.style.transform=t;
    if(Math.abs(tx-cx)>.1||Math.abs(ty-cy)>.1) requestAnimationFrame(frame); else run=false }
  addEventListener('pointermove',function(e){
    if(e.pointerType==='touch') return;
    var nx=(e.clientX/innerWidth-.5)*2, ny=(e.clientY/innerHeight-.5)*2;
    tx=-nx*innerWidth*.05; ty=-ny*innerHeight*.035;
    if(!run){ run=true; requestAnimationFrame(frame) }
  },{passive:true});
})();
/* высота окна: svh в части браузеров не обновляется при смене масштаба, считаем сами */
(function(){function f(){document.documentElement.style.setProperty('--sv',(window.innerHeight/100)+'px')} f(); addEventListener('resize',f); addEventListener('orientationchange',f); if(window.visualViewport) visualViewport.addEventListener('resize',f)})();
/* ---- блок 1 ---- */
/* ?debug в адресе показывает ошибки скрипта прямо на странице */
(function(){
  if(!/[?&]debug/.test(location.search)) return;
  var box; function say(t){ if(!box){box=document.createElement('pre'); box.style.cssText='position:fixed;left:0;right:0;bottom:0;max-height:40vh;overflow:auto;margin:0;padding:8px 12px;background:#000;color:#ff8;font:12px/1.4 monospace;z-index:99999;white-space:pre-wrap'; document.body.appendChild(box)} box.textContent+=t+'\n' }
  addEventListener('error',function(e){say('ERROR: '+e.message+' @'+(e.filename||'').split('/').pop()+':'+e.lineno)});
  document.addEventListener('DOMContentLoaded',function(){say('main.js v41 загружен')});
})();
(function(){
  /* анимации привязаны к скроллу читателя, поэтому системная настройка «уменьшить движение» их не отключает */
  var reduce = false;
  var $ = function(id){return document.getElementById(id)};
  function clamp(x,a,b){return Math.max(a,Math.min(b,x))}
  var LS={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
  var S={m1:null,m2:null};

  /* Неразрывные пробелы: после предлогов и союзов из 1–2 букв, после коротких служебных слов и перед тире.
     Два прохода, чтобы цепочки вроде «и в доме» тоже склеивались. */
  var NBRE=/(^|[\s«„"(\[—–])([А-Яа-яЁё]{1,2}|для|без|над|под|при|про|что|как|или|из-за|из-под|через|между|перед|после|около|среди|ради|кроме)[ \t\n\u00a0]+(?=[^\s])/gi;
  function nb(t){
    for(var i=0;i<2;i++) t=t.replace(NBRE,'$1$2\u00a0');
    return t.replace(/\s+([—–])/g,'\u00a0$1');
  }
  try{
    var tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:function(n){
      var p=n.parentNode&&n.parentNode.nodeName; return (p==='SCRIPT'||p==='STYLE'||p==='TEXTAREA')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}});
    var nodes=[]; while(tw.nextNode()) nodes.push(tw.currentNode);
    nodes.forEach(function(n){ var v=nb(n.nodeValue); if(v!==n.nodeValue) n.nodeValue=v });
  }catch(e){}


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

  /* ---------- первый экран: после движения шкалы печатается мой текст ---------- */
  var TXA=nb('Я всегда считала, что это нечто советское и безликое… в смысле, лишённое индивидуальности.');
  var TXB=nb('Как может выражать протест то, что принадлежит всем?\nНо в этом я ошиблась. Так было не всегда, а вернее никогда так не было.');
  var TXC=nb('Сейчас расскажу, как поняла авангард я.');
  var ftE=$('fty'), frE=$('ftr'), ftBox=$('ftext'), ftWrap=$('ftbox'), tState=0, restoring=false;
  function setT(t,n){ if(!ftE||!frE) return; ftE.textContent=t.slice(0,n); frE.textContent=t.slice(n) }
  function typeT(t,done){ var i=0; (function step(){ i++; setT(t,i); if(i<t.length) setTimeout(step,24+Math.random()*26); else if(done) setTimeout(done,2400) })() }
  function eraseT(t,done){ var i=t.length; (function step(){ i=Math.max(0,i-2); setT(t,i); if(i>0) setTimeout(step,12); else setTimeout(done,350) })() }
  /* блок под шкалой растёт плавно, колонка с вопросом и шкалой сдвигается вверх сама */
  function growTo(t){ if(!ftWrap||!ftBox) return; setT(t,0); ftWrap.style.height=ftBox.offsetHeight+'px' }
  /* место под оба текста освобождаем сразу: вопрос и шкала поднимаются один раз, потом печатаем */
  function reserve(){ if(!ftWrap||!ftBox) return; setT(TXA,0); var a=ftBox.offsetHeight; setT(TXB,0); var b=ftBox.offsetHeight; setT(TXC,0); var c=ftBox.offsetHeight; ftWrap.style.height=Math.max(a,b,c)+'px'; setT(TXA,0) }
  function startTyping(){
    if(tState||!ftE||!ftBox) return; tState=1;
    setTimeout(function(){ reserve() },900);
    setTimeout(function(){ typeT(TXA,function(){ eraseT(TXA,function(){ setT(TXB,0); typeT(TXB,function(){ eraseT(TXB,function(){ setT(TXC,0); typeT(TXC,function(){ ftBox.classList.add('done'); tState=2 }) }) }) }) }) },2900);
  }
  var s1=mkSlider($('s1'),{
    onInput:function(v,u){ if(!u) return; S.m1=v; revealAfter() },
    onCommit:function(){ startTyping() },
    });
  function revealAfter(){
    if($('after').hidden){ $('after').hidden=false }
  }

  /* метки прошлых визитов не восстанавливаем: каждый заход начинается с чистого первого экрана */

  /* ---------- ship scene ---------- */
  var NS='http://www.w3.org/2000/svg';
  var pin=$('pin-ship'), art=$('sc-art'), shipl=$('shipl'), pb=$('p-bust'), scols=[].slice.call(document.querySelectorAll('.sc-text .rev')), pre=$('sc-pre'), pbig=$('pre-big'), pred=$('pre-red'), stx=$('sc-text');
  var RIDE=[0.0, 1.5, 3.1, 4.6, 6.1, 7.7, 9.2, 10.7, 12.2, 13.8, 15.3, 16.8, 18.4, 19.9, 21.4, 23.0, 24.5, 26.0, 27.6, 29.1, 31.3, 34.7, 38.1, 41.4, 44.8, 48.1, 51.5, 54.9, 58.7, 62.5, 66.2, 70.0, 73.8, 77.5, 81.3, 85.0, 88.8, 93.7, 98.6, 103.5, 108.4, 113.3, 129.9, 137.0, 144.9, 151.9, 159.8, 174.0, 181.0, 188.0, 196.8, 202.0, 216.8, 224.8, 232.8], RSTEP=20, DX0=1046;
  function ride(dx){var f=dx/RSTEP,i=Math.floor(f),k=f-i; if(i>=RIDE.length-1) return RIDE[RIDE.length-1]; return RIDE[i]*(1-k)+RIDE[i+1]*k}
  function progressOf(el){var r=el.getBoundingClientRect(),t=r.height-window.innerHeight; return t<=0?0:clamp(-r.top/t,0,1)}
  function drawShip(){
    if(!pin||!art||!pre||!stx||!shipl||!pb) return;
    var pr=pin.getBoundingClientRect(), p=clamp(-pr.top/Math.max(1,pr.height-2*window.innerHeight),0,1), W=window.innerWidth;
    var xa=seg(p,.016,.08), xb=seg(p,.08,.12); if(pbig&&pred){ pbig.style.opacity=String(xa); var fog=sm(seg(p,.14,.2)), fsh=sm(seg(p,.21,.255)); pred.style.opacity=String(xb*(1-fog*.62)); pred.style.filter='blur('+(fog*6).toFixed(2)+'px)'; pbig.style.setProperty('--fog',fog.toFixed(3)); pbig.style.setProperty('--fogu',(fog*(1-fsh)).toFixed(3)) }
    /* горизонтальный переход: подводка уходит влево, слайд с кораблём приходит справа */
    var h=sm(seg(p,.26,.40));
    pre.style.transform='translateX('+(-h*W).toFixed(1)+'px)';
    var tx='translateX('+((1-h)*W).toFixed(1)+'px)';
    stx.style.transform=tx; art.style.transform=tx;
    pre.style.visibility=h>=1?'hidden':'visible';
    shipl.style.transform='none';
    var on=p>=.66; scols.forEach(function(el){el.classList.toggle('on',on)});
    /* рука берёт бюст Пушкина двумя пальцами, поднимает и выбрасывает */
    var hd=$('p-hand'); if(!hd) return;
    var bw=pb.offsetWidth, bh=pb.offsetHeight, hw=hd.offsetWidth, hh=hd.offsetHeight, AW=art.clientWidth, AH=art.clientHeight;
    var hx=pb.offsetLeft+bw*.5-.32*hw, hy=pb.offsetTop+bh*.03-.85*hh;
    var ein=1-Math.pow(1-seg(p,.70,.78),3), lift=sm(seg(p,.80,.85)), fl=sm(seg(p,.86,.90)), th=seg(p,.89,1), ex=sm(seg(p,.94,1)); pb.style.opacity=sm(seg(p,.66,.70)).toFixed(3);
    var sw=Math.sin(Math.PI*clamp(th/.4,0,1)), fa=sm(clamp((th-.2)/.8,0,1)), fy=Math.pow(clamp((th-.2)/.8,0,1),2);
    var ox=(1-ein)*.3*AW+fl*.03*AW+.06*AW*sw+ex*.25*AW, oy=-(1-ein)*(hy+hh+40)-lift*.3*bh-fl*.07*AH-ex*.6*AH;
    hd.style.transform='translate('+(hx+ox).toFixed(1)+'px,'+(hy+oy).toFixed(1)+'px) rotate('+(-fl*7).toFixed(2)+'deg)';
    var bx=.12*AW*sw-.46*AW*fa, by=-lift*.3*bh-.04*AH*sw+1.3*AH*fy, rot=-lift*7+25*sw-340*fa;
    pb.style.transform='translate('+bx.toFixed(1)+'px,'+by.toFixed(1)+'px) rotate('+rot.toFixed(1)+'deg)';
  }

  /* ---------- экраны героев: фигура справа, «сам», свайп, «решили другие» ---------- */
  function fitList(pane,items){
    var last=null; items.forEach(function(it){if(it.classList.contains('on'))last=it});
    var ol=pane.firstElementChild, off=0;
    if(last){ off=Math.max(0,last.offsetTop+last.offsetHeight-pane.clientHeight) }
    ol.style.transform='translateY('+(-off)+'px)';
  }
  function reveal(items,t0,t1,p){
    var n=items.length, k=-1;
    items.forEach(function(it,i){ var on=p>=t0+(t1-t0)*i/n; it.classList.toggle('on',on); if(on)k=i });
    items.forEach(function(it,i){it.classList.toggle('past',i<k)});
  }
  var ordsEl=$('ords'), otrack=$('otrack'), pfm=$('pf-m'), pfl=$('pf-l'), hnm=$('hn-m'), hnl=$('hn-l');
  var opanels=ordsEl?[].slice.call(ordsEl.querySelectorAll('.opanel')):[];
  var OP=opanels.map(function(el){var pn=el.querySelector('.pane');
    return {el:el, pane:pn, items:pn?[].slice.call(pn.querySelectorAll('.it')):[], q:el.querySelector('.qbig'), n:el.querySelector('.note')}});
  var PANS=[[.17,.21],[.37,.41],[.48,.54],[.66,.70],[.89,.93]];
  function sm(t){return t*t*(3-2*t)}
  function drawOrd(){
    if(!ordsEl||!otrack||!document.documentElement.classList.contains('anim')) return;
    var p=progressOf(ordsEl), W=ordsEl.clientWidth, idx=0;
    PANS.forEach(function(r){ idx+=sm(seg(p,r[0],r[1])) });
    otrack.style.transform='translateX('+(-idx*W).toFixed(1)+'px)';
    var en=1-Math.pow(1-seg(p,0,.04),3), sw=sm(seg(p,.48,.54));
    pfm.style.transform='translate('+((1-en)*110).toFixed(1)+'%,'+(sw*window.innerHeight).toFixed(1)+'px)';
    pfl.style.transform='translate(0,'+(-(1-sw)*window.innerHeight).toFixed(1)+'px)';
    var hm=seg(p,0,.04)*(1-seg(p,.46,.52)), hl=seg(p,.5,.56);
    put(hnm,hm,-(1-hm)*14+0); put(hnl,hl,(1-hl)*-24);
    reveal(OP[0].items,.04,.16,p); reveal(OP[1].items,.21,.36,p);
    reveal(OP[3].items,.54,.65,p); reveal(OP[4].items,.7,.88,p);
    [0,1,3,4].forEach(function(k){ fitList(OP[k].pane,OP[k].items) });
    var q1=seg(p,.41,.46), q2=seg(p,.93,.97);
    put(OP[2].q,q1,(1-q1)*24); put(OP[2].n,seg(p,.45,.5),0); put(OP[5].q,q2,(1-q2)*24);
  }

  /* ---------- shelf ---------- */
  var plaques={
    'b-push':'<b>Пушкин.</b> 1912: предложено сбросить с парохода современности. 1924: собеседник, который «живой, а не мумия».',
    'b-maya':'<b>Маяковский.</b> 1924: спорит с превращением поэта в памятник. 1935: «лучший, талантливейший». После этого его стихи входят в школьные и вузовские программы.'
  };
  function pick(id){['b-push','b-maya'].forEach(function(k){$(k).classList.toggle('turn',k===id)}); setPlaque(plaques[id])}
  function setPlaque(h){var pl=$('plaque'); pl.textContent=''; var m=/^<b>(.*?)<\/b>(.*)$/.exec(h); if(m){var b=document.createElement('b'); b.textContent=m[1]; pl.appendChild(b); pl.appendChild(document.createTextNode(nb(m[2])))} else pl.textContent=nb(h)}
  Object.keys(plaques).forEach(function(id){
    var g=$(id); if(!g) return; g.addEventListener('click',function(){pick(id)});
    g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(id)}});
  });

  function typedText(id){var e=$(id); if(!e) return ''; return nb(e.textContent)}
  /* ---------- красный экран: фразы по скроллу и схема дистанции ---------- */
  var rp=$('redpin'), rty=$('rty'), rtr=$('rtr'), rfull=typedText('rfull'), rlast=-1, rcar=rty?rty.nextElementSibling:null, rsc=$('rscale'), crowd=$('crowd'), dline=$('dline'), dtick=$('dtick');
  var RQ=nb(window.matchMedia('(min-width:861px)').matches?'Чтобы сбросить Пушкина, манифесту\nпришлось сначала назвать его по имени.':'Чтобы сбросить Пушкина, манифесту пришлось сначала назвать его по имени.');
  var rsc2=rp?rp.querySelector('.redsc'):null;
  function drawRed(){
    if(!rp||!rsc||!crowd||!rfull||!rcar||!document.documentElement.classList.contains('anim')) return;
    /* вход: красный слайд приезжает справа поверх закреплённого предыдущего экрана */
    var rr=rp.getBoundingClientRect(), vhh=window.innerHeight;
    if(rsc2){ if(rr.top>0){ var ent=seg(clamp(1-rr.top/vhh,0,1),.2,.52); rsc2.style.transform='translate('+((1-sm(ent))*window.innerWidth).toFixed(1)+'px,'+(-rr.top).toFixed(1)+'px)' } else rsc2.style.transform='' }
    var p=clamp(-rr.top/Math.max(1,rr.height-2*vhh),0,1);
    /* текст набирается (.04–.46), держится, стирается (.66–.82), потом набирается вывод */
    var inQ=p>=.83, n=inQ?Math.round(RQ.length*seg(p,.84,.92)):Math.round(rfull.length*(seg(p,.04,.46)-seg(p,.66,.82))), key=(inQ?'q':'a')+n;
    if(key!==rlast){ rlast=key; var src=inQ?RQ:rfull; rty.textContent=src.slice(0,n); rtr.textContent=src.slice(n) }
    rcar.style.visibility=(n===0&&p>.3&&p<.83)?'hidden':'';
    rsc.classList.toggle('on',p>=.16&&p<.7);
    /* когда набрана последняя фраза, большинство сдвигается к Маяковскому, он стоит на месте: расстояние меняется само */
    var q=clamp((p-.47)/.14,0,1), sh=q*q*(3-2*q)*80, x2=360-sh;
    crowd.setAttribute('transform','translate('+(-sh).toFixed(1)+' 0)');
    dline.setAttribute('x2',x2.toFixed(1)); dtick.setAttribute('x1',x2.toFixed(1)); dtick.setAttribute('x2',x2.toFixed(1));
    
    /* в конце красный фон плавно становится серым, а цитата гаснет: дальше идёт серый экран */
    var g=sm(seg(p,.95,1)), rt=$('rtype');
    if(rsc2) rsc2.style.background='';
    if(rt) rt.style.opacity='';
  }
  /* ---------- 1917: корабль налетает на гору, Маяковский падает ---------- */
  var fp=$('fallpin'), ftx=$('ftx'), fheap=$('fheap'), fship=$('fship'), fmaya=$('fmaya');
  function drawFall(){
    if(!fp||!ftx||!fheap||!fship||!fmaya||!document.documentElement.classList.contains('anim')) return;
    var fr=fp.getBoundingClientRect(), fsc=fp.querySelector('.fallsc');
    if(fsc){ if(fr.top>0){ var fe=seg(clamp(1-fr.top/window.innerHeight,0,1),.2,.52); fsc.style.transform='translate('+((1-sm(fe))*window.innerWidth).toFixed(1)+'px,'+(-fr.top).toFixed(1)+'px)' } else fsc.style.transform='' }
    var p=progressOf(fp), vw=window.innerWidth/100, vh=window.innerHeight/100;
    var eH=sm(seg(p,0,.05)), eS=sm(seg(p,0,.2)), st=seg(p,.36,.6), stE=st*st*(3-2*st), fl=seg(p,.6,.84), W=window.innerWidth, H=window.innerHeight;
    ftx.style.opacity=sm(seg(p,0,.06)).toFixed(3);
    var fh=fheap.offsetHeight, peek=Math.max(0,fh-(parseFloat(getComputedStyle(fheap).bottom)*-1)-0.1*window.innerHeight), rise=sm(seg(p,.32,.6));
    fheap.style.transform='translateY('+(((1-eH)*fh*.95)+(1-rise)*peek).toFixed(1)+'px)';
    var ang=((1-eS)*5)-stE*54, th=ang*Math.PI/180;
    fship.style.transform='translate('+(((1-eS)*60*vw)-stE*(vw*100>860?10:6)*vw).toFixed(1)+'px,'+((stE*1*vh)+(1-rise)*(11.5*vh+76)).toFixed(1)+'px) rotate('+ang.toFixed(2)+'deg)';
    /* Маяковский слетает с палубы по дуге в левый угол; путь считаем в экранных осях и переводим в оси корабля */
    var wx=-fl*(W>860?.46:.6)*W, wy=fl*.42*H-4*.12*H*fl*(1-fl), lx=wx*Math.cos(th)+wy*Math.sin(th), ly=-wx*Math.sin(th)+wy*Math.cos(th);
    fmaya.style.transform='translate('+lx.toFixed(1)+'px,'+ly.toFixed(1)+'px) rotate('+(-fl*430).toFixed(1)+'deg)';
  }
  var jub=$('jub'), jtrack=$('jtrack'), jps=[].slice.call(document.querySelectorAll('.jp'));
  var jtext='', jlast=-1;
  function drawJub(){
    if(!jub||!jtrack) return;
    var jr0=jub.getBoundingClientRect(), jtot=Math.max(1,jr0.height-window.innerHeight), jext=Math.min(jtot*.45,2.2*window.innerHeight), jraw=-jr0.top;
    var p=clamp(jraw/Math.max(1,jtot-jext),0,1), jq=clamp((jraw-(jtot-jext))/Math.max(1,jext),0,1), W=jub.clientWidth;
    var pan=sm(seg(p,.20,.30))+sm(seg(p,.46,.56))+sm(seg(p,.72,.82));
    jtrack.style.transform='translateX('+(-pan*W).toFixed(1)+'px)';
    function T(el,a,b){ if(el) el.style.opacity=String(seg(p,a,b)) }
    var s=jps[0].querySelector.bind(jps[0]);
    var el=function(i,c){return jps[i].querySelector(c)};
    T(el(0,'.js'),.02,.08);
    var q0=el(0,'.jq');
    if(!q0._t){ q0._t=nb(q0.textContent.replace(/\s+/g,' ').trim()); q0.innerHTML='<span class="ty"></span><i class="caret"></i><span class="rest"></span>' }
    var qn=Math.round(q0._t.length*seg(p,.085,.15));
    if(q0._n!==qn){ q0._n=qn; q0.querySelector('.ty').textContent=q0._t.slice(0,qn); q0.querySelector('.rest').textContent=q0._t.slice(qn) }
    q0.querySelector('.caret').style.display=(qn>=q0._t.length||qn<=0)?'none':'';
    q0.style.opacity=qn>0?'1':'0';
    T(el(1,'.js'),.31,.37); T(el(1,'.jq'),.38,.44);
    T(el(2,'.js'),.57,.63); T(el(2,'.jq'),.64,.70);
    var jo=1-seg(jq,0,.15);
    T(el(3,'.jr'),.83,.91); T(el(3,'.srcline'),.9,.96);
    el(3,'.jr').style.opacity=(seg(p,.83,.91)*jo).toFixed(3); el(3,'.srcline').style.opacity=(seg(p,.9,.96)*.7*jo).toFixed(3);
    var jt=$('jt'), jty=$('jty'), jtr=$('jtr');
    if(jt&&jty&&jtr){ var JT=jtext||(jtext=nb($('jfull').textContent)), jn=Math.round(JT.length*seg(jq,.2,.92)); jt.style.opacity=seg(jq,.15,.2).toFixed(3);
      if(jn!==jlast){ jlast=jn; jty.textContent=JT.slice(0,jn); jtr.textContent=JT.slice(jn) } }
  }

  /* Каждая сцена обновляется сама по себе и в своём try, поэтому сбой в одной
     не останавливает остальные. Идёт от геометрии на экране, а не от события scroll,
     чтобы работать и там, где scroll до страницы не доходит (встроенный просмотр, iframe). */
  /* ---------- Малевич: экраны по макету, всё по скроллу ---------- */
  function seg(p,a,b){return clamp((p-a)/(b-a),0,1)}
  function put(el,o,dy,dx){ if(!el) return; el.style.opacity=o.toFixed(3); el.style.transform='translate('+((dx||0)).toFixed(1)+'px,'+(dy||0).toFixed(1)+'px)' }
  var mg=$('mgrey'), mg1=$('mg1'), mg2=$('mg2');
  function drawMgrey(){
    if(!mg||!mg1||!mg2) return;
    var p=progressOf(mg), i1=seg(p,.04,.16), o1=seg(p,.42,.52), i2=seg(p,.58,.7);
    put(mg1,i1*(1-o1),0);
    put(mg2,i2,0);
    var blk=sm(seg(p,.74,.87)), stk=sm(seg(p,.9,.98)), shd=$('mshade');
    if(shd) shd.style.opacity=blk.toFixed(3);
    mg2.style.setProperty('--blk',blk.toFixed(3)); mg2.style.setProperty('--strike',stk.toFixed(3));
  }
  var mhz=$('mhz'), mtrack=document.querySelector('.mtrack'), mr1=$('mr1'), mr2=$('mr2'), mr3=$('mr3'), mcross=$('mcross');
  var ms1=$('ms1'), ms2=$('ms2'), ms3=$('ms3'), ms4=$('ms4'), ms5=$('ms5');
  function drawMhz(){
    if(!mhz||!mtrack||!mr1) return;
    var p=progressOf(mhz), W=mhz.clientWidth;
    var x=seg(p,.0,.1), a=seg(p,.04,.12), b=seg(p,.12,.2), c=seg(p,.2,.28);
    var h=seg(p,.42,.66); h=h*h*(3-2*h);            // горизонтальный ход: красная панель уезжает влево
    var s1=seg(p,.62,.7), s2=seg(p,.68,.76), s3=seg(p,.74,.82), s4=seg(p,.8,.9);
    put(mr1,a,(1-a)*30); put(mr2,b,(1-b)*30); put(mr3,c,(1-c)*30);
    mtrack.style.transform='translateX('+(-h*W).toFixed(1)+'px)';
    put(ms1,s1,0,(1-s1)*140); put(ms2,s2,0,(1-s2)*120); put(ms3,s3,0,(1-s3)*100); put(ms4,s4,0,(1-s4)*90); put(ms5,s4,0,(1-s4)*90);
  }
  var mt=$('mtype'), mf=$('mfield'), mq=$('mq'), tyE=$('ty'), trE=$('tr'), tfull=typedText('mfull'), tfull2=typedText('mfull2'), tfull3=typedText('mfull3'), lastN=-1;
  function drawMtype(){
    if(!mt||!mf||!tfull||!tfull2||!tfull3||!document.documentElement.classList.contains('anim')) return;
    var p=progressOf(mt), fi=seg(p,0,.04), qi=seg(p,.66,.72)*(1-seg(p,.8,.84));
    /* абзац 1 печатается и стирается, на его месте печатается абзац 2, он гаснет, появляется фраза про Бога, она гаснет, печатается абзац 3 */
    var ph=p>=.7?2:(p>=.4?1:0), src=ph===2?tfull3:(ph===1?tfull2:tfull), n;
    if(ph===0) n=Math.round(tfull.length*(seg(p,.04,.24)-seg(p,.3,.4)));
    else if(ph===1) n=Math.round(tfull2.length*seg(p,.42,.56));
    else n=Math.round(tfull3.length*seg(p,.86,.97));
    var op=ph===2?seg(p,.84,.86):(1-seg(p,.62,.66));
    mf.style.opacity=(fi*op).toFixed(3); mf.style.visibility=(p>.66&&p<.84)?'hidden':'visible';
    var key=ph+':'+n; if(key!==lastN){ lastN=key; tyE.textContent=src.slice(0,n); trE.textContent=src.slice(n) }
    if(mq){ mq.style.opacity=qi.toFixed(3); mq.style.transform='translateY(calc(-50% + '+((1-seg(p,.66,.72))*30).toFixed(1)+'px))' }
  }
  var mld=$('mlead'), mlh=$('ml-h'), mlp=$('ml-p'), mlt=$('ml-t');
  function drawMlead(){
    if(!mld||!mlh) return;
    var p=progressOf(mld), W=mld.clientWidth, d=Math.min(W*.18,260);
    var a=seg(p,.04,.2), b=seg(p,.14,.32), o=seg(p,.5,.62), t=seg(p,.6,.76);
    var ea=1-Math.pow(1-a,3), eb=1-Math.pow(1-b,3);
    put(mlh,a*(1-o),-o*18,-(1-ea)*d-o*d*.4);
    put(mlp,b*(1-o),-o*18,(1-eb)*d+o*d*.4);
    put(mlt,t,(1-t)*30,0);
  }
  /* ---------- открывающий блок: серый кадр, горизонтальный переход, фраза, затем картина со шкалой ---------- */
  var fst=$('first'), ftk=$('ftrack'), fq1=$('fq1'), fmain=$('fmain');
  function drawFirst(){
    if(!fst||!ftk||!fq1||!fmain) return;
    var p=progressOf(fst), W=fst.clientWidth;
    var h=sm(seg(p,.1,.3));
    ftk.style.transform='translateX('+(-h*W).toFixed(1)+'px)';
    var a=seg(p,.3,.38), b=seg(p,.48,.56), c=seg(p,.54,.64);
    put(fq1,a*(1-b),-b*18);
    put(fmain,c,(1-c)*24);
    fmain.style.pointerEvents=c>.5?'auto':'none';
  }
  var csec=$('shelf-sec'), ctrack=$('ctrack');
  var cc1=$('c1'), cc2=$('c2'), cty=$('cty'), ctr=$('ctr'), ctFull=ctr?ctr.textContent:'';
  function drawConc(){
    if(!csec||!ctrack||!document.documentElement.classList.contains('anim')) return;
    var p=progressOf(csec), W=csec.clientWidth, d=Math.min(W*.18,260);
    var a=seg(p,.03,.15), b=seg(p,.1,.22), h=sm(seg(p,.38,.52)), tp=seg(p,.56,.94);
    var ea=1-Math.pow(1-a,3), eb=1-Math.pow(1-b,3);
    put(cc1,a,0,-(1-ea)*d); put(cc2,b,0,(1-eb)*d);
    ctrack.style.transform='translateX('+(-h*W).toFixed(1)+'px)';
    if(cty&&ctr){ var n=Math.round(ctFull.length*tp); cty.textContent=ctFull.slice(0,n); ctr.textContent=ctFull.slice(n) }
  }
  var SCENES=[drawFirst,drawShip,drawRed,drawFall,drawJub,drawMgrey,drawMhz,drawMtype,drawMlead,drawOrd,drawConc];
  function drawAll(){ for(var i=0;i<SCENES.length;i++){ try{SCENES[i]()}catch(e){} } }
  /* перерисовываем только когда что-то сдвинулось: иначе каждый кадр лишние чтения/записи стилей и лаги */
  var lastSig='';
  function loop(){
    var sig=(pin?pin.getBoundingClientRect().top.toFixed(1):'')+'|'+window.innerWidth+'|'+window.innerHeight;
    if(sig!==lastSig){ lastSig=sig; drawAll(); }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  addEventListener('scroll',drawAll,{passive:true});
  addEventListener('resize',drawAll);
  drawAll();
  document.documentElement.classList.add('anim');
})();
