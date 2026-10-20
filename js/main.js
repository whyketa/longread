/* ---- блок 1 ---- */
/* ?debug в адресе показывает ошибки скрипта прямо на странице */
(function(){
  if(!/[?&]debug/.test(location.search)) return;
  var box; function say(t){ if(!box){box=document.createElement('pre'); box.style.cssText='position:fixed;left:0;right:0;bottom:0;max-height:40vh;overflow:auto;margin:0;padding:8px 12px;background:#000;color:#ff8;font:12px/1.4 monospace;z-index:99999;white-space:pre-wrap'; document.body.appendChild(box)} box.textContent+=t+'\n' }
  addEventListener('error',function(e){say('ERROR: '+e.message+' @'+(e.filename||'').split('/').pop()+':'+e.lineno)});
  document.addEventListener('DOMContentLoaded',function(){say('main.js v30 загружен')});
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
  var NBRE=/(^|\s)([А-Яа-яЁё]{1,2}|для|без|над|под|при|про|что|как|или)\s+(?=\S)/gi;
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

  /* Мнения. Положение на шкале — оценка автора проекта по смыслу высказывания. */
  var OPS=[
    {pos:.15,who:'Современник',t:'вспоминает позже',name:'Художник Мильман',text:'«в сущности, хулиган»',src:'о Маяковском на выставке «Бубнового валета»; в пересказе Романа Якобсона, «Устная история»'},
    {pos:.21,who:'Критик',t:'пишет в тот момент',name:'Александр Бенуа',text:'«икона»',src:'так он назвал «Чёрный квадрат» в газете «Речь», январь 1916'},
    {pos:.30,who:'Обычный человек',t:'вспоминает позже',name:'Иван Баженов, офицер',text:'«я воспитывался на Пушкине»',src:'о стихах Маяковского, «Устная история» через «Афишу Daily», 2018'},
    {pos:.66,who:'Современник',t:'вспоминает позже',name:'Евгения Ланг, художница',text:'«молодой гений»',src:'о Маяковском, «Устная история» через «Афишу Daily», 2018'},
    {pos:.76,who:'Современник',t:'вспоминает позже',name:'Роман Якобсон, лингвист',text:'«сразу останавливал на себе внимание»',src:'о Маяковском, «Устная история» через «Афишу Daily», 2018'},
    {pos:.90,who:'Слушатель',t:'вспоминает позже',name:'Владимир Сосинский, литератор',text:'«потрясающей силы»',src:'о чтении Маяковского, «Устная история» через «Афишу Daily», 2018'}
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
      var a=document.createElement('div'); a.className='who'; a.textContent=o.who+' · '+o.t;
      var b=document.createElement('div'); b.className='nm'; b.textContent=o.name;
      var c=document.createElement('div'); c.className='tx'; c.textContent=nb(o.text);
      var s=document.createElement('div'); s.className='src'; s.textContent=nb(o.src);
      d.appendChild(a); d.appendChild(b); d.appendChild(c); d.appendChild(s); qa.appendChild(d);
    });
  }
  var s1=mkSlider($('s1'),{ticks:OPS.map(function(o){return o.pos}),
    onInput:function(v,u){
      if(!u) return;
      S.m1=v; showNear(v);
      [].forEach.call($('s1').querySelectorAll('.tick'),function(t,i){t.classList.toggle('on',Math.abs(OPS[i].pos-v)<=.095)});
      revealAfter(); $('qnote').hidden=false;
    },
    onCommit:function(v){ LS.set('m1',String(v)) }});
  function revealAfter(){
    if($('after').hidden){ $('after').hidden=false }
    s2.mark('m1',S.m1); if(!s2.locked) $('keep').hidden=false;
  }

  function addMk2(v){var i=document.createElement('i'); i.className='mk m2'; i.style.left=(v*100)+'%'; s2.root.appendChild(i)}
  function describe(){
    var t='';
    if(S.m1==null && S.m2!=null) t='Первой метки у вас нет, так что сравнивать пока не с чем.';
    else if(S.m1!=null && S.m2!=null){
      var d=S.m2-S.m1;
      t=Math.abs(d)<.03 ? 'Метка осталась на месте. Это тоже ответ.' : 'Вторая метка стоит '+(Math.abs(d)<.2?'чуть ':'')+'ближе к «'+(d>0?'люблю':'не люблю')+'», чем первая.';
    }
    $('result').textContent=nb(t);
  }
  /* ---------- second slider ---------- */
  var s2=mkSlider($('s2'),{onInput:function(v,u){ if(u && !s2.locked) $('lock2').hidden=false }});
  function finish2(){
    S.m2=s2.value; s2.lock(); $('lock2').hidden=true; $('keep').hidden=true; s2.mark('m2',null); s2.mark('m1',S.m1);
    addMk2(S.m2); LS.set('m2',String(S.m2)); describe(); $('comp').hidden=false;
  }
  $('lock2').onclick=finish2;
  $('keep').onclick=function(){ if(S.m1==null) return; s2.set(S.m1,true); finish2() };
  var und=$('understand');
  und.value=LS.get('u')||'';
  und.addEventListener('input',function(){ LS.set('u',und.value) });

  /* restore marks from a previous visit (per-browser only) */
  var p1=LS.get('m1');
  if(p1!==null && p1!=='' && !isNaN(+p1)){
    S.m1=+p1; s1.set(S.m1,true); revealAfter(); $('qnote').hidden=false;
    var p2=LS.get('m2'); if(p2!==null && p2!=='' && !isNaN(+p2)){
      S.m2=+p2; s2.set(S.m2,true); s2.lock(); addMk2(S.m2);
      $('lock2').hidden=true; $('keep').hidden=true; describe(); $('comp').hidden=false;
    }
  }

  /* ---------- ship scene ---------- */
  var NS='http://www.w3.org/2000/svg';
  var pin=$('pin-ship'), art=$('sc-art'), shipl=$('shipl'), pb=$('p-bust'), scols=[].slice.call(document.querySelectorAll('.sc-text .rev')), pre=$('sc-pre'), pbig=$('pre-big'), pred=$('pre-red'), stx=$('sc-text');
  var RIDE=[0.0, 1.5, 3.1, 4.6, 6.1, 7.7, 9.2, 10.7, 12.2, 13.8, 15.3, 16.8, 18.4, 19.9, 21.4, 23.0, 24.5, 26.0, 27.6, 29.1, 31.3, 34.7, 38.1, 41.4, 44.8, 48.1, 51.5, 54.9, 58.7, 62.5, 66.2, 70.0, 73.8, 77.5, 81.3, 85.0, 88.8, 93.7, 98.6, 103.5, 108.4, 113.3, 129.9, 137.0, 144.9, 151.9, 159.8, 174.0, 181.0, 188.0, 196.8, 202.0, 216.8, 224.8, 232.8], RSTEP=20, DX0=1046;
  function ride(dx){var f=dx/RSTEP,i=Math.floor(f),k=f-i; if(i>=RIDE.length-1) return RIDE[RIDE.length-1]; return RIDE[i]*(1-k)+RIDE[i+1]*k}
  function progressOf(el){var r=el.getBoundingClientRect(),t=r.height-window.innerHeight; return t<=0?0:clamp(-r.top/t,0,1)}
  function drawShip(){
    if(!pin||!art||!pre||!stx||!shipl||!pb) return;
    var p=progressOf(pin), W=window.innerWidth;
    var xa=seg(p,.016,.08), xb=seg(p,.12,.17); if(pbig&&pred){ pbig.style.opacity=String(xa); pred.style.opacity=String(xb) }
    /* горизонтальный переход: подводка уходит влево, слайд с кораблём приходит справа */
    var h=sm(seg(p,.26,.40));
    pre.style.transform='translateX('+(-h*W).toFixed(1)+'px)';
    var tx='translateX('+((1-h)*W).toFixed(1)+'px)';
    stx.style.transform=tx; art.style.transform=tx;
    pre.style.visibility=h>=1?'hidden':'visible';
    /* корабль выезжает по горе справа */
    var q=seg(p,.42,.66), e=1-Math.pow(1-q,3);
    shipl.style.transform='translate('+((1-e)*art.clientWidth*.9).toFixed(1)+'px,'+((1-e)*art.clientHeight*.12).toFixed(1)+'px)';
    var on=p>=.66; scols.forEach(function(el){el.classList.toggle('on',on)});
    /* бюст Пушкина падает с парохода */
    var t=clamp((p-.78)/.2,0,1), x=0, y=0, rot=0;
    if(t>0){ x=-.26*t*art.clientWidth; y=1.05*t*t*art.clientHeight; rot=-t*340 }
    pb.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px) rotate('+rot.toFixed(1)+'deg)';
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
    var g=$(id); g.addEventListener('click',function(){pick(id)});
    g.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pick(id)}});
  });

  function typedText(id){var e=$(id); if(!e) return ''; var d=e.getAttribute('data-d'); return nb(d&&window.matchMedia('(min-width:861px)').matches?d:e.textContent)}
  /* ---------- красный экран: фразы по скроллу и схема дистанции ---------- */
  var rp=$('redpin'), rty=$('rty'), rtr=$('rtr'), rquote=$('rquote'), rfull=typedText('rfull'), rlast=-1, rcar=rty?rty.nextElementSibling:null, rsc=$('rscale'), crowd=$('crowd'), dline=$('dline'), dtick=$('dtick'), dlab=$('dlab');
  function drawRed(){
    if(!rp||!rsc||!crowd||!rfull||!rcar||!document.documentElement.classList.contains('anim')) return;
    var p=progressOf(rp);
    /* текст набирается (.04–.46), держится, стирается (.66–.82), на этом месте всплывает вывод */
    var n=Math.round(rfull.length*(seg(p,.04,.46)-seg(p,.66,.82)));
    if(n!==rlast){ rlast=n; rty.textContent=rfull.slice(0,n); rtr.textContent=rfull.slice(n) }
    rcar.style.visibility=(n===0&&p>.3)?'hidden':'';
    rsc.classList.toggle('on',p>=.16&&p<.7);
    /* когда набрана последняя фраза, большинство сдвигается к Маяковскому, он стоит на месте: расстояние меняется само */
    var q=clamp((p-.47)/.14,0,1), sh=q*q*(3-2*q)*120, x2=300-sh;
    crowd.setAttribute('transform','translate('+(-sh).toFixed(1)+' 0)');
    dline.setAttribute('x2',x2.toFixed(1)); dtick.setAttribute('x1',x2.toFixed(1)); dtick.setAttribute('x2',x2.toFixed(1));
    dlab.setAttribute('x',((106+x2)/2).toFixed(1));
    var qi=seg(p,.86,.94);
    rquote.style.opacity=qi.toFixed(3); rquote.style.transform='translateY(calc(-50% + '+((1-qi)*30).toFixed(1)+'px))';
  }
  var jub=$('jub'), jtrack=$('jtrack'), jps=[].slice.call(document.querySelectorAll('.jp'));
  function drawJub(){
    if(!jub||!jtrack) return;
    var p=progressOf(jub), W=jub.clientWidth;
    var pan=sm(seg(p,.20,.30))+sm(seg(p,.46,.56))+sm(seg(p,.72,.82));
    jtrack.style.transform='translateX('+(-pan*W).toFixed(1)+'px)';
    function T(el,a,b){ if(el) el.style.opacity=String(seg(p,a,b)) }
    var s=jps[0].querySelector.bind(jps[0]);
    var el=function(i,c){return jps[i].querySelector(c)};
    T(el(0,'.js'),.02,.08); T(el(0,'.jq'),.10,.17);
    T(el(1,'.js'),.31,.37); T(el(1,'.jq'),.38,.44);
    T(el(2,'.js'),.57,.63); T(el(2,'.jq'),.64,.70);
    T(el(3,'.jr'),.83,.91); T(el(3,'.srcline'),.9,.96);
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
  }
  var mhz=$('mhz'), mtrack=document.querySelector('.mtrack'), mr1=$('mr1'), mr2=$('mr2'), mr3=$('mr3'), mcross=$('mcross');
  var ms1=$('ms1'), ms2=$('ms2'), ms3=$('ms3');
  function drawMhz(){
    if(!mhz||!mtrack||!mr1) return;
    var p=progressOf(mhz), W=mhz.clientWidth;
    var x=seg(p,.0,.1), a=seg(p,.04,.12), b=seg(p,.12,.2), c=seg(p,.2,.28);
    var h=seg(p,.42,.66); h=h*h*(3-2*h);            // горизонтальный ход: красная панель уезжает влево
    var s1=seg(p,.64,.74), s2=seg(p,.72,.82), s3=seg(p,.8,.9);
    put(mr1,a,(1-a)*30); put(mr2,b,(1-b)*30); put(mr3,c,(1-c)*30);
    mcross.style.transform='translateX('+(Math.pow(1-x,3)*W*.28).toFixed(1)+'px)';
    mtrack.style.transform='translateX('+(-h*W).toFixed(1)+'px)';
    put(ms1,s1,0,(1-s1)*140); put(ms2,s2,0,(1-s2)*120); put(ms3,s3,0,(1-s3)*100);
  }
  var mt=$('mtype'), mf=$('mfield'), mq=$('mq'), tyE=$('ty'), trE=$('tr'), tfull=typedText('mfull'), lastN=-1;
  function drawMtype(){
    if(!mt||!mf||!tfull||!document.documentElement.classList.contains('anim')) return;
    var p=progressOf(mt), fi=seg(p,0,.04), qi=seg(p,.8,.9);
    // печатается (.06–.44), держится, стирается в обратную сторону (.54–.76), на этом же месте появляется вопрос
    var n=Math.round(tfull.length*(seg(p,.06,.44)-seg(p,.54,.76)));
    mf.style.opacity=(fi*(1-seg(p,.74,.8))).toFixed(3); mf.style.visibility=(p>.8)?'hidden':'visible';
    if(n!==lastN){ lastN=n; tyE.textContent=tfull.slice(0,n); trE.textContent=tfull.slice(n) }
    mq.style.opacity=qi.toFixed(3); mq.style.transform='translateY(calc(-50% + '+((1-qi)*30).toFixed(1)+'px))';
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
  var SCENES=[drawShip,drawRed,drawJub,drawMgrey,drawMhz,drawMtype,drawMlead,drawOrd];
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
