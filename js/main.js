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
(function(){var lw=0;function f(){var w=window.innerWidth;if(w===lw)return;lw=w;document.documentElement.style.setProperty('--sv',(window.innerHeight/100)+'px')} f(); addEventListener('resize',f); addEventListener('orientationchange',function(){lw=0;f()})})();
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
  var NBRE=/(^|[\s«„"(\[—–])((?:[А-Яа-яЁё]{1,2}|для|без|над|под|при|про|что|как|или|чем|так|оба|уже|ещё|еще|тоже|из-за|из-под|через|между|перед|после|около|среди|ради|кроме),?)[ \t\n\u00a0]+(?=[^\s])/gi;
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

  /* ---------- первый экран: фото → красный «Авангард»; под заголовком по скроллу печатается текст, потом «Я (не) всегда буду против» ---------- */
  var fst=$('first'), otk=$('o1track'), OS3=$('os3'), OS4=$('os4');
  var oty=$('oty'), otr=$('otr'), OT=[typedText('ot1'),typedText('ot2'),typedText('ot3')], olast='', neE=$('ne'), ohE=$('oh'), onamesE=$('onames');
  /* [начало печати, конец печати, начало стирания, конец стирания] — в vh прокрутки */
  var OTS=[[80,190,205,225],[232,300,315,330],[337,450,465,485]];
  function drawOpen(){
    if(!fst||!otk||!document.documentElement.classList.contains('anim')) return;
    var vh=window.innerHeight/100, s=Math.max(0,-fst.getBoundingClientRect().top/vh);
    otk.style.transform='translateX('+(-sm(seg(s,30,65))*fst.clientWidth).toFixed(1)+'px)';
    if(ohE) ohE.style.opacity=seg(s,62,78).toFixed(3);
    var idx=0; for(var i=0;i<OT.length;i++){ if(s>=OTS[i][0]-6) idx=i }
    var r=OTS[idx], src=OT[idx], n=Math.round(src.length*(seg(s,r[0],r[1])-seg(s,r[2],r[3])));
    var key=idx+':'+n; if(key!==olast){ olast=key; var k=idx===2?src.search(/Он\s+начинался/):-1, pre=src.slice(0,n); if(k>=0&&n>k){ oty.innerHTML=''; oty.appendChild(document.createTextNode(pre.slice(0,k))); var hs=document.createElement('span'); hs.className='ohl'; hs.textContent=pre.slice(k); oty.appendChild(hs) } else oty.textContent=pre; otr.textContent=src.slice(n) }
    var typing=s<490;
    OS3.style.display=typing?'block':'none'; OS3.style.opacity=seg(s,72,80).toFixed(3);
    OS4.style.display=typing?'none':'block'; OS4.style.opacity=seg(s,490,515).toFixed(3);
    if(neE){ var kk=sm(seg(s,560,625)); neE.style.maxWidth=(kk*neE.firstChild.offsetWidth).toFixed(1)+'px'; neE.firstChild.style.opacity=sm(seg(s,580,635)).toFixed(3) }
    if(onamesE){ onamesE.style.opacity=seg(s,4,11).toFixed(3); onamesE.style.transform='translateY('+((1-sm(seg(s,4,22)))*10).toFixed(1)+'px)' }
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
    if(W<=860){ /* телефон: бюст занимает всё место под текстом, рука крупнее вместе с ним */
      var fr=art.getBoundingClientRect().bottom-stx.getBoundingClientRect().bottom-window.innerHeight*.05, nbw=Math.max(.32*W,Math.min(.56*W,fr/1.388));
      pb.style.width=nbw.toFixed(1)+'px'; pb.style.left=(W*.5-nbw*.3).toFixed(1)+'px'; hd.style.width=Math.min(1.12*W,nbw*2.17).toFixed(1)+'px';
    } else { pb.style.width=''; pb.style.left=''; hd.style.width='' }
    var bw=pb.offsetWidth, bh=pb.offsetHeight, hw=hd.offsetWidth, hh=hd.offsetHeight, AW=art.clientWidth, AH=art.clientHeight;
    var hx=pb.offsetLeft+bw*.5-.32*hw, hy=pb.offsetTop+bh*.03-.85*hh;
    /* рука входит сверху и берёт бюст, поднимает, замахивается назад и бросает влево: бюст летит по дуге за край экрана */
    var ein=1-Math.pow(1-seg(p,.70,.78),3), lift=sm(seg(p,.785,.82)), wind=sm(seg(p,.82,.86)), t0=seg(p,.86,.905), thr=t0*t0, fly=seg(p,.905,1), ex=sm(seg(p,.91,1));
    pb.style.opacity=sm(seg(p,.66,.70)).toFixed(3);
    var cx=(wind*.10-thr*.40)*AW, cy=-(lift*.22+wind*.05-thr*.04)*AH, cr=-lift*4+wind*14-thr*34;
    var ox=(1-ein)*.3*AW+cx-ex*.25*AW, oy=-(1-ein)*(hy+hh+40)+cy-ex*.8*AH;
    hd.style.transform='translate('+(hx+ox).toFixed(1)+'px,'+(hy+oy).toFixed(1)+'px) rotate('+(cr-ex*20).toFixed(2)+'deg)';
    var bx=cx-fly*1.0*AW, by=cy-fly*.35*AH+fly*fly*1.6*AH, rot=cr-fly*420;
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
    var fl=pfl.offsetTop+pfl.offsetHeight; pfl.style.transform='translate(0,'+(-(1-sw)*Math.max(fl,window.innerHeight)).toFixed(1)+'px)';
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
    if(rsc2){ if(window.innerWidth>860&&rr.top>0){ var ent=seg(clamp(1-rr.top/vhh,0,1),.2,.52); rsc2.style.transform='translate('+((1-sm(ent))*window.innerWidth).toFixed(1)+'px,'+(-rr.top).toFixed(1)+'px)' } else rsc2.style.transform='' }
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
    if(fsc){ if(window.innerWidth>860&&fr.top>0){ var fe=seg(clamp(1-fr.top/window.innerHeight,0,1),.2,.52); fsc.style.transform='translate('+((1-sm(fe))*window.innerWidth).toFixed(1)+'px,'+(-fr.top).toFixed(1)+'px)' } else fsc.style.transform='' }
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
  var mt=$('mtype'), mf=$('mfield'), mq=$('mq'), tyE=$('ty'), trE=$('tr'), tfull=typedText('mfull'), tfull2=typedText('mfull2'), tfull3=typedText('mfull3'), lastN=-1, mpyE=$('mpy'), mprE=$('mpr'), mpFull=mprE?nb(mprE.textContent):'';
  function drawMtype(){
    if(!mt||!mf||!tfull||!tfull2||!tfull3||!document.documentElement.classList.contains('anim')) return;
    var p=progressOf(mt), fi=seg(p,0,.04), qi=seg(p,.66,.72)*(1-seg(p,.88,.92));
    /* абзац 1 печатается и стирается, на его месте печатается абзац 2, он гаснет, появляется фраза про Бога, она гаснет, печатается абзац 3 */
    var ph=p>=.7?2:(p>=.4?1:0), src=ph===2?tfull3:(ph===1?tfull2:tfull), n;
    if(ph===0) n=Math.round(tfull.length*(seg(p,.04,.24)-seg(p,.3,.4)));
    else if(ph===1) n=Math.round(tfull2.length*seg(p,.42,.56));
    else n=Math.round(tfull3.length*seg(p,.94,.995));
    var op=ph===2?seg(p,.92,.94):(1-seg(p,.62,.66));
    mf.style.opacity=(fi*op).toFixed(3); mf.style.visibility=(p>.66&&p<.92)?'hidden':'visible';
    var key=ph+':'+n; if(key!==lastN){ lastN=key; tyE.textContent=src.slice(0,n); trE.textContent=src.slice(n) }
    if(mpyE&&mpFull){ var k2=Math.round(mpFull.length*seg(p,.73,.84)); mpyE.textContent=mpFull.slice(0,k2); mprE.textContent=mpFull.slice(k2) }
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
  var csec=$('shelf-sec'), ctrack=$('ctrack');
  var cc2=$('c2'), c3y=$('c3y'), c3r=$('c3r'), c3Full=c3r?nb(c3r.textContent):'', cty=$('cty'), ctr=$('ctr'), ctFull=ctr?ctr.textContent:'';
  function drawConc(){
    if(!csec||!ctrack||!document.documentElement.classList.contains('anim')) return;
    var p=progressOf(csec), W=csec.clientWidth, d=Math.min(W*.18,260);
    var b=seg(p,.02,.1), t3=seg(p,.14,.3), h1=sm(seg(p,.38,.46)), dd=seg(p,.48,.56), h2=sm(seg(p,.68,.76)), tp=seg(p,.78,.96);
    var eb=1-Math.pow(1-b,3), ed=1-Math.pow(1-dd,3);
    put(cc2,b,0,(1-eb)*d); put($('c4'),dd,0,(1-ed)*d);
    if(c3y){ var k3=Math.round(c3Full.length*t3); c3y.textContent=c3Full.slice(0,k3); c3r.textContent=c3Full.slice(k3) }
    ctrack.style.transform='translateX('+(-(h1+h2)*W).toFixed(1)+'px)';
    if(cty&&ctr){ var n=Math.round(ctFull.length*tp); cty.textContent=ctFull.slice(0,n); ctr.textContent=ctFull.slice(n) }
  }
  /* ---------- новые горизонтальные экраны: панели сменяются по скроллу, текст появляется по очереди ---------- */
  var HSECS=[].slice.call(document.querySelectorAll('.hsec')).map(function(s){
    var ps=[].slice.call(s.querySelectorAll('.hp')); return {end:parseFloat(s.getAttribute('data-end')||'1'),s:s,t:s.querySelector('.htrack'),ps:ps,xs:ps.map(function(p){return [].slice.call(p.querySelectorAll('.hx'))}),fg:ps.map(function(p){return p.querySelector('.hfig')})};
  });
  function drawH(){
    if(!document.documentElement.classList.contains('anim')) return;
    HSECS.forEach(function(o){
      var p=Math.min(1,progressOf(o.s)/o.end), n=o.ps.length, W=o.s.clientWidth, span=1/n, idx=0;
      for(var i=1;i<n;i++) idx+=sm(seg(p,i*span-.08,i*span+.02));
      o.t.style.transform='translateX('+(-idx*W).toFixed(1)+'px)';
      o.xs.forEach(function(xs,i){
        var a=i*span+(i?.03:0), b=(i+1)*span-.1, m=xs.length;
        xs.forEach(function(x,k){ var q=seg(p,a+(b-a)*k/m,a+(b-a)*(k+.8)/m); put(x,q,(1-q)*18) });
        /* выделенные слова в конце панели краснеют */
        var dyw=o.ps[i].querySelectorAll('[data-dy]'); if(dyw.length){ var dq=sm(seg(p,a+(b-a)*.55,a+(b-a)*.9)); for(var z2=0;z2<dyw.length;z2++){ dyw[z2].style.transform='translateY('+(parseFloat(dyw[z2].getAttribute('data-dy'))*dq).toFixed(3)+'em)' } }
        var hls=o.ps[i].querySelectorAll('.hl'); if(hls.length){ var hq=seg(p,a+(b-a)*.92,a+(b-a)*1.08), c0=[12,12,12], c1=[97,3,13];
          var col='rgb('+c0.map(function(v,t){return Math.round(v+(c1[t]-v)*hq)}).join(',')+')'; for(var z=0;z<hls.length;z++) hls[z].style.color=col }
        var fg=o.fg[i]; if(fg){ var q=seg(p,a,a+(b-a)*.5); fg.style.opacity=q.toFixed(3); fg.style.transform='translateY('+((1-q)*40).toFixed(1)+'px)' }
      });
    });
  }
  /* ---------- поздний Малевич: цитата переплывает с серого экрана на красный и растёт ---------- */
  var lmS=$('latemal'), lmBlk=$('lblack'), lmCol=$('lcol'), lmQ=$('lq'), lmSrc=$('lsrc'), lmTy=$('lty'), lmTr=$('ltr'), LMT=[typedText('lt1'),typedText('lt2')], lmLast='';
  function lerp(a,b,t){return a+(b-a)*t}
  function drawLate(){
    if(!lmS||!lmBlk||!document.documentElement.classList.contains('anim')) return;
    var p=progressOf(lmS), pl=lmS.querySelector('.lplate');
    [].slice.call(lmS.querySelectorAll('.lx')).forEach(function(e,i){ var q=seg(p,.02+i*.05,.1+i*.05); put(e,q,(1-q)*18) });
    var blk=sm(seg(p,.34,.46)); lmBlk.style.opacity=blk.toFixed(3); pl.style.opacity=(1-blk).toFixed(3); pl.style.visibility=blk>=1?'hidden':'visible';
    var qi=seg(p,.44,.52), si=seg(p,.5,.57); put(lmQ,qi,(1-qi)*14); put(lmSrc,si,(1-si)*10);
    /* прочтение Пащенко печатается и стирается, потом — про гроб */
    var idx=p<.8?0:1, src=LMT[idx], n=idx===0?Math.round(src.length*(seg(p,.58,.72)-seg(p,.74,.79))):Math.round(src.length*seg(p,.82,.95));
    var key=idx+':'+n; if(key!==lmLast){ lmLast=key; lmTy.textContent=src.slice(0,n); lmTr.textContent=src.slice(n) }
    var lt=lmS.querySelector('.ltype'); if(lt) lt.style.opacity=seg(p,.57,.59).toFixed(3);
  }

  var SCENES=[drawOpen,drawLate,drawH,drawShip,drawRed,drawFall,drawJub,drawMgrey,drawMhz,drawMtype,drawMlead,drawOrd,drawConc];
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
