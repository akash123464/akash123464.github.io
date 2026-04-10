/* ═══════════════════════════════════════
   WISHWORK – script.js  v5
   Shimmer bet card popup replaces sheet
   All other functionality identical
═══════════════════════════════════════ */

/* ── PER-USER localStorage ── */
let LS_KEY = 'ww_guest';
const LS = {
  setKey(email){ LS_KEY = 'ww_' + (email||'guest').replace(/[^a-z0-9]/gi,'_'); },
  save(){
    localStorage.setItem(LS_KEY, JSON.stringify({
      bal:state.bal, txList:state.txList,
      savedUpi:state.savedUpi, upi:state.upi, phone:state.phone,
      totalDeposit:state.totalDeposit,
      totalWithdraw:state.totalWithdraw,
      userEmail:state.userEmail
    }));
  },
  load(){
    try{
      const d=JSON.parse(localStorage.getItem(LS_KEY)||'{}');
      if(typeof d.bal==='number')          state.bal          =d.bal;
      if(Array.isArray(d.txList))          state.txList       =d.txList;
      if(d.savedUpi!==undefined)           state.savedUpi     =d.savedUpi;
      if(d.upi!==undefined)                state.upi          =d.upi;
      if(d.phone!==undefined)              state.phone        =d.phone;
      if(typeof d.totalDeposit==='number') state.totalDeposit =d.totalDeposit;
      if(typeof d.totalWithdraw==='number')state.totalWithdraw=d.totalWithdraw;
      if(d.userEmail)                      state.userEmail    =d.userEmail;
    }catch(e){}
  }
};

/* ── STATE ── */
let state={
  cat:'INSTAGRAM',bal:500,activePage:'markets',
  betInfo:null,side:'YES',betAmt:'',
  txList:[],upi:'',phone:'',savedUpi:'',
  timer:80,timerInt:null,accountTab:'profile',
  totalDeposit:0,totalWithdraw:0,userEmail:''
};

let jellyRAF=null;

/* ── DATA ── */
const BETS={
  INSTAGRAM:[
    {q:"Karan Aujla posts more than 5 stories on Instagram today?",id:"I1",odds:47,hot:true},
    {q:"Modi Ji posts more than 3 stories on Instagram today?",id:"I2",odds:62},
    {q:"Deepaliarora10 posts story in brown/white/grey outfit today?",id:"I3",odds:55},
    {q:"Shaanayakatiyan_official posts more than 4 stories today?",id:"I4",odds:38},
    {q:"Shambhavi1997 posts a story in red outfit today?",id:"I5",odds:44},
    {q:"Rajat Dalal posts more than 4 stories today?",id:"I6",odds:71},
    {q:"Uorfi Javed posts a bold reel on Instagram today?",id:"I7",odds:83,hot:true},
    {q:"Elvish Yadav goes Instagram LIVE for 30+ minutes today?",id:"I8",odds:52},
    {q:"Rohit Zinjurke posts a gym/workout reel today?",id:"I9",odds:68},
    {q:"Guru Randhawa posts a new music story on Instagram today?",id:"I10",odds:34},
    {q:"Priyanka Chopra posts more than 2 stories on Instagram today?",id:"I11",odds:59}
  ],
  CRICKET:[
    {q:"Hyderabad will hit 5+ runs in the 7th over today?",id:"C1",odds:58},
    {q:"Second wicket of Hyderabad falls in the 6th over today?",id:"C2",odds:33},
    {q:"Virat Kohli will hit more than 2 sixes today?",id:"C3",odds:67,hot:true},
    {q:"Pat Cummins will touch his hair 6+ times during the match?",id:"C4",odds:52},
    {q:"Virat Kohli will get run out today?",id:"C5",odds:28},
    {q:"India wins by more than 50 runs today?",id:"C6",odds:61},
    {q:"Rohit Sharma scores a half century (50+ runs) today?",id:"C7",odds:49,hot:true},
    {q:"Jasprit Bumrah takes 3+ wickets in today's match?",id:"C8",odds:44},
    {q:"First ball of the match will be a dot ball?",id:"C9",odds:71},
    {q:"Total match score will cross 350 runs today?",id:"C10",odds:38},
    {q:"Man of the Match will be a bowler, not a batsman?",id:"C11",odds:42}
  ],
  OIL:[
    {q:"Petrol price reaches ₹107.50 in MP today?",id:"O1",odds:34},
    {q:"Diesel price reaches ₹92.70 in MP today?",id:"O2",odds:41},
    {q:"Petrol price hits ₹112 in Delhi by 10 April?",id:"O3",odds:22},
    {q:"Diesel price hits ₹94 in Delhi by 10 May?",id:"O4",odds:38},
    {q:"Gasoline tax increases by 2% by 29 March?",id:"O5",odds:18},
    {q:"Global oil price drops 2%+ today?",id:"O6",odds:55},
    {q:"Brent crude crosses $90/barrel this week?",id:"O7",odds:47,hot:true},
    {q:"OPEC announces a production cut before April 2026?",id:"O8",odds:31},
    {q:"CNG price increases in Delhi NCR this week?",id:"O9",odds:26},
    {q:"EV subsidy announced by government before April 2026?",id:"O10",odds:19},
    {q:"Reliance Industries shares rise 2%+ this week?",id:"O11",odds:53}
  ],
  POLITICS:[
    {q:"Republic TV Arnab debate — someone says 'Pakistan' 3+ times?",id:"P1",odds:88,hot:true},
    {q:"Aaj Tak Dangal — someone says 'cylinder' 5+ times?",id:"P2",odds:74},
    {q:"Lallantop posts 5+ videos about BJP government today?",id:"P3",odds:81},
    {q:"Raghav Chadha posts a YouTube video today?",id:"P4",odds:63},
    {q:"Modi Ji broadcasts live 45+ minutes (28 Mar – 2 May)?",id:"P5",odds:57},
    {q:"Rahul Gandhi broadcasts live 65+ minutes (28 Mar – 2 May)?",id:"P6",odds:49},
    {q:"BJP wins more than 200 seats in upcoming state elections?",id:"P7",odds:61},
    {q:"Arvind Kejriwal tweets about Delhi govt 5+ times today?",id:"P8",odds:77,hot:true},
    {q:"New cabinet reshuffle announced before 15 April 2026?",id:"P9",odds:23},
    {q:"India-Pakistan peace talks resume before June 2026?",id:"P10",odds:14},
    {q:"Congress holds press conference about inflation today?",id:"P11",odds:82}
  ],
  YOUTUBE:[
    {q:"Lallantop posts a video about LPG crisis today?",id:"Y1",odds:76,hot:true},
    {q:"Passenger Paramveer 'Shocked Japan' video hits 30k+ likes today?",id:"Y2",odds:52},
    {q:"Dhruv Rathi 'Dhurandhar Expose' hits 58k+ likes today?",id:"Y3",odds:65},
    {q:"Lallantop video mentions Modi Ji 3+ times today?",id:"Y4",odds:83},
    {q:"Raj Shamani Clips posts 5+ videos today?",id:"Y5",odds:71},
    {q:"Modi Ji posts a video on YouTube today?",id:"Y6",odds:44},
    {q:"Carry Minati posts a new roast/reaction video today?",id:"Y7",odds:29},
    {q:"BB Ki Vines uploads a new sketch video today?",id:"Y8",odds:38},
    {q:"Technical Guruji uploads 2+ tech videos today?",id:"Y9",odds:67,hot:true},
    {q:"T-Series releases a new song on YouTube today?",id:"Y10",odds:81},
    {q:"Any Indian YouTuber crosses 10M views in a single video today?",id:"Y11",odds:22}
  ],
  RANDOM:[
    {q:"Gold price gains ₹300+ today — goal ₹1,47,375?",id:"R1",odds:42},
    {q:"Rain in Delhi today?",id:"R2",odds:31},
    {q:"Bitcoin gains +₹2,000 today — goal ₹62,63,727?",id:"R3",odds:58,hot:true},
    {q:"A famous celebrity MMS gets leaked today?",id:"R4",odds:12},
    {q:"Delhi temperature breaks yesterday's record today?",id:"R5",odds:67},
    {q:"Rain in Mumbai today?",id:"R6",odds:48},
    {q:"Sensex closes 500+ points up today?",id:"R7",odds:39},
    {q:"A viral animal video trends on X/Twitter today?",id:"R8",odds:88},
    {q:"IndiGo announces a new flight route today?",id:"R9",odds:21},
    {q:"Any big IPL-related news drops today?",id:"R10",odds:55},
    {q:"Earthquake 5.0+ magnitude hits anywhere in India today?",id:"R11",odds:8}
  ],
  NAUGHTY:[
    {q:"Ika Dauria posts in red bikini on Instagram by 3 April?",id:"N1",odds:38},
    {q:"Johnny Sins new video released by 3 April?",id:"N2",odds:72,hot:true},
    {q:"Lilykoti posts a new video on her platform by 3 April?",id:"N3",odds:55},
    {q:"Vadapav girl makes a viral bold statement by 3 April?",id:"N4",odds:44},
    {q:"Lilykoti drops OnlyFans subscription price by 3 April?",id:"N5",odds:29},
    {q:"Major OnlyFans platform update announced by 3 May?",id:"N6",odds:61},
    {q:"Anjali Arora posts a bold reel on Instagram by 5 April?",id:"N7",odds:67,hot:true},
    {q:"Urfi Javed's reel crosses 2M views in 24 hours this week?",id:"N8",odds:73},
    {q:"A top Bollywood actress posts a bikini photo this week?",id:"N9",odds:84},
    {q:"A bold/viral music video goes #1 on YouTube this week?",id:"N10",odds:78},
    {q:"Adult content ban gets discussed in Parliament this month?",id:"N11",odds:19}
  ]
};

const META={
  INSTAGRAM:{color:"#00d4ff",label:"Instagram",trend:"Karan Aujla stories — 47% YES",icon:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#f09433"/><stop offset="50%" stop-color="#dc2743"/><stop offset="100%" stop-color="#bc1888"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#ig)" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="4" stroke="url(#ig)" stroke-width="2" fill="none"/><circle cx="17.5" cy="6.5" r="1.2" fill="url(#ig)"/></svg>`},
  CRICKET:  {color:"#22c55e",label:"Cricket",  trend:"Virat Kohli sixes — 67% YES",icon:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><line x1="4" y1="20" x2="16" y2="4" stroke="#22c55e" stroke-width="3" stroke-linecap="round"/><rect x="14" y="2" width="6" height="4" rx="1" fill="#22c55e" opacity="0.8"/><circle cx="19" cy="17" r="3" fill="#22c55e" opacity="0.9"/></svg>`},
  OIL:      {color:"#ffd700",label:"Oil & Gas",trend:"Brent crude — massive volume",icon:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 6 10 6 15a6 6 0 0 0 12 0C18 10 12 2 12 2z" fill="#f59e0b" opacity="0.9"/><line x1="8" y1="3" x2="16" y2="3" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/></svg>`},
  POLITICS: {color:"#00d4ff",label:"Politics", trend:"Arnab debate — 88% YES",icon:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M3 21L12 4L21 21Z" stroke="#00d4ff" stroke-width="2" fill="none" stroke-linejoin="round"/><line x1="2" y1="21" x2="22" y2="21" stroke="#00d4ff" stroke-width="2" stroke-linecap="round"/></svg>`},
  YOUTUBE:  {color:"#ff4444",label:"YouTube",  trend:"T-Series new song — 81% YES",icon:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="4" fill="#ff0000" opacity="0.9"/><polygon points="10,9 10,15 16,12" fill="white"/></svg>`},
  RANDOM:   {color:"#00d4ff",label:"Random",   trend:"Bitcoin +₹2K trending",icon:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="9" height="9" rx="2" stroke="#00d4ff" stroke-width="2" fill="none"/><rect x="13" y="2" width="9" height="9" rx="2" stroke="#00d4ff" stroke-width="2" fill="none"/><rect x="2" y="13" width="9" height="9" rx="2" stroke="#00d4ff" stroke-width="2" fill="none"/><rect x="13" y="13" width="9" height="9" rx="2" stroke="#00d4ff" stroke-width="2" fill="none"/></svg>`},
  NAUGHTY:  {color:"#ffd700",label:"Naughty",  trend:"Bollywood bikini — 84% YES",icon:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="fire" x1="50%" y1="100%" x2="50%" y2="0%"><stop offset="0%" stop-color="#ef4444"/><stop offset="50%" stop-color="#f97316"/><stop offset="100%" stop-color="#fbbf24"/></linearGradient></defs><path d="M12 2C12 2 8 7 8 11c0 0 2-2 3-2 0 0-4 5-4 8 0 3.3 2.2 5 5 5s5-1.7 5-5c0-3-4-8-4-8 1 0 3 2 3 2 0-4-4-9-4-9Z" fill="url(#fire)"/></svg>`}
};

const BADGE_COLORS={
  INSTAGRAM:{bg:"rgba(0,212,255,.08)",color:"#00d4ff",border:"1px solid rgba(0,212,255,.22)"},
  CRICKET:  {bg:"rgba(34,197,94,.08)",color:"#22c55e",border:"1px solid rgba(34,197,94,.22)"},
  OIL:      {bg:"rgba(255,215,0,.08)", color:"#ffd700",border:"1px solid rgba(255,215,0,.22)"},
  POLITICS: {bg:"rgba(0,212,255,.08)",color:"#00d4ff",border:"1px solid rgba(0,212,255,.22)"},
  YOUTUBE:  {bg:"rgba(255,68,68,.08)", color:"#ff4444",border:"1px solid rgba(255,68,68,.22)"},
  RANDOM:   {bg:"rgba(0,212,255,.08)",color:"#00d4ff",border:"1px solid rgba(0,212,255,.22)"},
  NAUGHTY:  {bg:"rgba(255,215,0,.08)", color:"#ffd700",border:"1px solid rgba(255,215,0,.22)"}
};
const VOLS=["2.4K","5.1K","11.8K","3.2K","7.6K","18.4K","9.1K","4.3K","22.1K","1.8K","6.7K"];

function normalizeStatus(raw){
  const s=(raw||'').toString().toUpperCase().replace(/[^A-Z]/g,'');
  if(s.includes('WIN')||s.includes('WON')||s.includes('APPROV'))    return{label:'WON 🏆',cls:'won'};
  if(s.includes('LOST')||s.includes('LOSE')||s.includes('REJECT'))  return{label:'LOST ❌',cls:'lost'};
  if(s.includes('COMPLET')||s.includes('PAID')||s.includes('SUCC')) return{label:'COMPLETED ✓',cls:'completed'};
  return{label:'PENDING',cls:'pending'};
}
function cc(){return META[state.cat].color;}
function setCC(c){document.documentElement.style.setProperty('--cc',c);}
function jellyTapBalCard(){
  const card=document.getElementById('balCard');if(!card)return;
  card.classList.remove('bal-jelly');void card.offsetWidth;card.classList.add('bal-jelly');
  card.addEventListener('animationend',()=>card.classList.remove('bal-jelly'),{once:true});
}
function fmtCur(n){return '₹'+(Number(n)||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});}

/* ── TOAST ── */
let toastTimer;
function showToast(msg,type='success'){
  requestAnimationFrame(()=>{
    const el=document.getElementById('toast');
    el.textContent=msg;el.className='toast show';
    if(type==='success'){el.style.cssText='background:linear-gradient(135deg,rgba(34,197,94,.16),rgba(34,197,94,.07));border:1.5px solid rgba(34,197,94,.38);color:#22c55e;box-shadow:0 0 22px rgba(34,197,94,.2);display:block';}
    else{el.style.cssText='background:linear-gradient(135deg,rgba(0,212,255,.13),rgba(0,212,255,.05));border:1.5px solid rgba(0,212,255,.38);color:#00d4ff;box-shadow:0 0 22px rgba(0,212,255,.18);display:block';}
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3000);
  });
}

/* ── CLOSE ALL ── */
function closeAll(){
  /* close backdrop */
  const bd=document.getElementById('backdrop');
  bd.classList.add('hidden');bd.classList.remove('bet-open');
  /* close portfolio */
  document.getElementById('portfolio').classList.add('hidden');
  /* close shimmer bet card */
  const bc=document.getElementById('betCard');
  if(bc){bc.classList.remove('open');setTimeout(()=>{bc.style.display='none';},380);}
  /* close sheets */
  document.getElementById('depSheet').classList.add('hidden');
  document.getElementById('witSheet').classList.add('hidden');
  clearInterval(state.timerInt);
}

/* ── PAGE NAV ── */
function setPage(page){
  state.activePage=page;
  ['markets','support','account'].forEach(p=>{
    document.getElementById('page'+p[0].toUpperCase()+p.slice(1)).classList.toggle('hidden',p!==page);
    document.getElementById('bnav-'+p).classList.toggle('active',p===page);
    const pip=document.getElementById('pip-'+p);if(pip)pip.style.display=p===page?'block':'none';
  });
  document.getElementById('pageGames').classList.toggle('hidden',page!=='games');
  document.getElementById('tabsWrap').style.display=page==='markets'?'block':'none';
  if(page==='markets')renderMarkets();
  if(page==='support')renderSupport();
  if(page==='account')renderAccount();
  if(page==='games'){stopGameTimer();renderGames();}
  else stopGameTimer();
}

/* ── TABS ── */
function renderTabs(){
  const row=document.getElementById('tabsRow');row.innerHTML='';
  /* GAMES tab — always first */
  const gDiv=document.createElement('div');
  gDiv.className='tab'+(state.activePage==='games'?' active':'');
  gDiv.style.setProperty('--cc','#ff4d6d');
  gDiv.innerHTML=`<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="3" stroke="#ff4d6d" stroke-width="2"/><circle cx="8" cy="14" r="2" fill="#ff4d6d"/><circle cx="16" cy="14" r="2" fill="#ff4d6d"/><path d="M12 2v5" stroke="#ff4d6d" stroke-width="2" stroke-linecap="round"/></svg> GAMES`+(state.activePage==='games'?'<div class="tab-glow"></div>':'');
  if(state.activePage==='games')gDiv.style.color='#fff';
  gDiv.onclick=()=>{setPage('games');renderTabs();};
  row.appendChild(gDiv);
  /* Market category tabs */
  document.getElementById('tabsWrap').style.display='block';
  Object.keys(BETS).forEach(c=>{
    const m=META[c],active=state.cat===c&&state.activePage==='markets';
    const div=document.createElement('div');
    div.className='tab'+(active?' active':'');div.style.setProperty('--cc',m.color);
    div.innerHTML=m.icon+' '+m.label+(active?'<div class="tab-glow"></div>':'');
    if(active)div.style.color='#fff';
    div.onclick=()=>{state.cat=c;setCC(m.color);setPage('markets');renderTabs();updateBlobs();};
    row.appendChild(div);
  });
}
function updateBlobs(){
  const c=cc();
  document.getElementById('blob1').style.background=c;
  document.getElementById('blob2').style.background=c;
  document.getElementById('scanline').style.background=`linear-gradient(90deg,transparent,${c}22,transparent)`;
}

/* ═══════════════════════════════════════
   JELLY SLIDER (unchanged)
═══════════════════════════════════════ */
function initJellySlider(){
  if(jellyRAF){cancelAnimationFrame(jellyRAF);jellyRAF=null;}
  const wrap=document.getElementById('jellyTrackWrap');
  const canvas=document.getElementById('jellyCanvas');
  const betsEl=document.getElementById('betsContainer');
  if(!wrap||!canvas||!betsEl)return;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const W_CSS=wrap.offsetWidth,H_CSS=wrap.offsetHeight;
  canvas.width=W_CSS*dpr;canvas.height=H_CSS*dpr;
  canvas.style.width=W_CSS+'px';canvas.style.height=H_CSS+'px';
  const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  const W=W_CSS,H=H_CSS,PAD=9,TR=(H-PAD*2)/2,RANGE=W-PAD*2-TR*2;
  let targetPos=0,displayPos=0,springVel=0,pointerVel=0;
  let isDragging=false,dragStartX=0,dragStartPos=0,lastMoveX=0;
  const posToX=p=>PAD+TR+p*RANGE;
  function pillPath(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath();}
  function jellyFillPath(lx,rx,cy,r){
    if(rx-lx<2){ctx.beginPath();ctx.arc(lx,cy,Math.max(r,3),0,Math.PI*2);return;}
    ctx.beginPath();ctx.moveTo(lx,cy-r);ctx.lineTo(rx,cy-r);ctx.arc(rx,cy,r,-Math.PI/2,Math.PI/2);ctx.lineTo(lx,cy+r);ctx.arc(lx,cy,r,Math.PI/2,-Math.PI/2,true);ctx.closePath();
  }
  function drawTrack(){
    const TX=PAD,TY=PAD,TW=W-PAD*2,TH=H-PAD*2;
    pillPath(TX,TY,TW,TH,TR);
    const tg=ctx.createLinearGradient(TX,TY,TX,TY+TH);tg.addColorStop(0,'rgba(0,0,0,.60)');tg.addColorStop(.45,'rgba(8,14,32,.74)');tg.addColorStop(1,'rgba(18,26,52,.64)');
    ctx.fillStyle=tg;ctx.shadowColor='rgba(0,0,0,.6)';ctx.shadowBlur=8;ctx.shadowOffsetY=3;ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    pillPath(TX,TY,TW,TH*.5,TR);const is=ctx.createLinearGradient(TX,TY,TX,TY+TH*.45);is.addColorStop(0,'rgba(0,0,0,.38)');is.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=is;ctx.fill();
    pillPath(TX+1,TY+TH*.74,TW-2,TH*.26,TR*.5);const bs=ctx.createLinearGradient(TX,TY+TH*.74,TX,TY+TH);bs.addColorStop(0,'rgba(255,255,255,0)');bs.addColorStop(1,'rgba(255,255,255,.05)');ctx.fillStyle=bs;ctx.fill();
    pillPath(TX,TY,TW,TH,TR);ctx.strokeStyle='rgba(255,255,255,.07)';ctx.lineWidth=1;ctx.stroke();
  }
  function drawJelly(cx,pv){
    const cy=H/2,lx=PAD+TR,fillW=cx-lx;if(fillW<3)return;
    const trackH=H-PAD*2,r=trackH/2-2,topY=cy-r,botY=cy+r;
    const vel=Math.max(-12,Math.min(12,pv)),absPv=Math.abs(vel);
    ctx.save();pillPath(PAD+1,PAD+1,W-PAD*2-2,H-PAD*2-2,TR-1);ctx.clip();
    jellyFillPath(lx,cx,cy,r+7);const ambG=ctx.createLinearGradient(lx,cy,cx+r,cy);ambG.addColorStop(0,'rgba(120,30,0,0.06)');ambG.addColorStop(.55,'rgba(200,80,0,0.16)');ambG.addColorStop(1,'rgba(255,140,0,0.28)');ctx.fillStyle=ambG;ctx.fill();
    ctx.shadowColor='rgba(0,0,0,0.58)';ctx.shadowBlur=10;ctx.shadowOffsetY=5;
    jellyFillPath(lx,cx,cy,r);const bodyG=ctx.createLinearGradient(lx,topY,lx,botY);bodyG.addColorStop(0,'#ffe085');bodyG.addColorStop(0.10,'#ffb830');bodyG.addColorStop(0.35,'#ff7200');bodyG.addColorStop(0.70,'#cc4400');bodyG.addColorStop(1,'#7a1e00');ctx.fillStyle=bodyG;ctx.fill();
    ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    /* Outer orange neon glow ring */
    jellyFillPath(lx,cx,cy,r);ctx.save();ctx.shadowColor='rgba(255,120,0,0.9)';ctx.shadowBlur=18;ctx.strokeStyle='rgba(255,160,40,0.5)';ctx.lineWidth=2.5;ctx.stroke();ctx.restore();
    ctx.beginPath();ctx.moveTo(lx+3,topY+1.5);ctx.lineTo(cx-3,topY+1.5);ctx.strokeStyle='rgba(255,240,160,0.65)';ctx.lineWidth=2;ctx.lineCap='round';ctx.stroke();
    const spFrac=Math.min(0.58,Math.max(0.2,fillW*0.0035)),spCX=lx+fillW*0.24,spCY=topY+r*0.25,spRX=fillW*spFrac,spRY=r*0.32;
    ctx.beginPath();ctx.ellipse(spCX,spCY,Math.max(spRX,4),Math.max(spRY,3),-0.06,0,Math.PI*2);
    const specG=ctx.createRadialGradient(spCX-spRX*0.22,spCY-spRY*0.28,0,spCX,spCY,Math.max(spRX,spRY));specG.addColorStop(0,'rgba(255,255,220,0.97)');specG.addColorStop(0.20,'rgba(255,240,180,0.88)');specG.addColorStop(0.52,'rgba(255,200,80,0.42)');specG.addColorStop(0.80,'rgba(255,150,20,0.10)');specG.addColorStop(1,'rgba(255,100,0,0)');ctx.fillStyle=specG;ctx.fill();
    const s2X=cx-r*0.20,s2Y=cy-r*0.42;ctx.beginPath();ctx.ellipse(s2X,s2Y,r*0.13,r*0.09,-0.22,0,Math.PI*2);const s2G=ctx.createRadialGradient(s2X-r*.04,s2Y-r*.03,0,s2X,s2Y,r*.14);s2G.addColorStop(0,'rgba(255,255,200,0.82)');s2G.addColorStop(1,'rgba(255,200,80,0)');ctx.fillStyle=s2G;ctx.fill();
    const lgG=ctx.createRadialGradient(lx+r*0.22,cy-r*0.20,0,lx+r*0.28,cy,r*0.58);lgG.addColorStop(0,'rgba(255,200,100,0.30)');lgG.addColorStop(1,'rgba(255,120,0,0)');ctx.beginPath();ctx.arc(lx,cy,r,0,Math.PI*2);ctx.fillStyle=lgG;ctx.fill();
    jellyFillPath(lx,cx,cy,r);const depG=ctx.createLinearGradient(lx,cy+r*0.32,lx,botY);depG.addColorStop(0,'rgba(40,5,0,0)');depG.addColorStop(1,'rgba(30,4,0,0.45)');ctx.fillStyle=depG;ctx.fill();
    /* Neon edge glow on moving side */
    if(absPv>1.5){const sA=Math.min(absPv/14,0.55),sX=cx-r*0.18;const sG=ctx.createRadialGradient(sX,cy-r*0.28,0,sX,cy,r*0.65);sG.addColorStop(0,`rgba(255,200,50,${sA})`);sG.addColorStop(0.5,`rgba(255,120,0,${sA*0.6})`);sG.addColorStop(1,'rgba(255,80,0,0)');ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=sG;ctx.fill();}
    /* Drip edge highlight */
    const dripG=ctx.createRadialGradient(cx,cy,r*0.82,cx,cy,r+4);dripG.addColorStop(0,'rgba(255,130,0,0)');dripG.addColorStop(1,`rgba(255,110,0,${Math.min(absPv*0.04+0.12,0.35)})`);ctx.beginPath();ctx.arc(cx,cy,r+2,0,Math.PI*2);ctx.fillStyle=dripG;ctx.fill();
    ctx.restore();
  }
  function drawTicks(){ctx.save();ctx.font='700 8.5px "Space Grotesk",sans-serif';ctx.fillStyle='rgba(255,255,255,.22)';ctx.textAlign='left';ctx.fillText('▲ TOP',PAD+TR+4,H-PAD-3);ctx.textAlign='right';ctx.fillText('BOTTOM ▼',W-PAD-TR-4,H-PAD-3);ctx.restore();}
  function loop(){
    const diff=targetPos-displayPos;springVel=springVel*0.72+diff*0.22;displayPos+=springVel;
    if(Math.abs(diff)<.0004&&Math.abs(springVel)<.0004){displayPos=targetPos;springVel=0;}
    if(!isDragging)pointerVel*=0.76;
    ctx.clearRect(0,0,W,H);drawTrack();drawJelly(posToX(displayPos),pointerVel);drawTicks();
    jellyRAF=requestAnimationFrame(loop);
  }
  function getLocalX(e){const r=canvas.getBoundingClientRect();return(e.touches?e.touches[0].clientX:e.clientX)-r.left;}
  function onStart(e){isDragging=true;dragStartX=getLocalX(e);dragStartPos=targetPos;lastMoveX=dragStartX;pointerVel=0;if(e.cancelable)e.preventDefault();}
  function getBetsRange(){return null;}// unused
  function onMove(e){
    if(!isDragging)return;
    const x=getLocalX(e);
    pointerVel=(x-lastMoveX)*1.15;lastMoveX=x;
    const raw=dragStartPos+(x-dragStartX)/RANGE;
    targetPos=Math.max(0,Math.min(1,raw));
    /* Scroll ONLY the bets list, not the page */
    const maxS=betsEl.scrollHeight-betsEl.clientHeight;
    if(maxS>0)betsEl.scrollTop=targetPos*maxS;
  }
  function onEnd(){isDragging=false;}
  canvas.addEventListener('mousedown',onStart,{passive:false});
  canvas.addEventListener('touchstart',onStart,{passive:false,capture:false});
  window.addEventListener('mousemove',onMove);
  window.addEventListener('touchmove',(e)=>{if(!isDragging)return;onMove(e);},{passive:true});
  window.addEventListener('mouseup',onEnd);
  window.addEventListener('touchend',onEnd);
  /* Sync slider when user finger-scrolls inside betsContainer */
  betsEl.addEventListener('scroll',()=>{
    if(isDragging)return;
    const maxS=betsEl.scrollHeight-betsEl.clientHeight;
    if(maxS>0)targetPos=betsEl.scrollTop/maxS;
  },{passive:true});
  loop();
}
function setBetsHeight(){
  const betsEl=document.getElementById('betsContainer');if(!betsEl)return;
  /* Use a fixed height: full viewport minus bottom nav (82px) minus jelly section height */
  const jellySection=document.querySelector('.jelly-section');
  const jellyH=jellySection?jellySection.offsetHeight:200;
  const avail=window.innerHeight-jellyH-82;
  betsEl.style.height=Math.max(200,avail)+'px';
  betsEl.style.overflowY='scroll';
  betsEl.style.overflowX='hidden';
  betsEl.style.webkitOverflowScrolling='touch';
  betsEl.style.touchAction='pan-y';
}

/* ── MARKETS PAGE ── */
function renderMarkets(){
  const m=META[state.cat],color=m.color;
  const container=document.getElementById('pageMarkets');
  const trendItems=[m.trend,'🔥 '+BETS[state.cat].filter(b=>b.hot).map(b=>b.q.slice(0,28)+'…').join(' · '),'⚡ BET NOW · WIN BIG','📈 LIVE PREDICTION'];
  const trendText=trendItems.join('   ✦   ');

  let html=`
  <div style="margin:12px 14px 0;position:relative;overflow:hidden;border-radius:14px;height:44px;
    background:linear-gradient(135deg,rgba(255,100,0,.82),rgba(20,8,0,.94),rgba(255,90,0,.72));
    backdrop-filter:blur(22px);border:1.5px solid rgba(255,120,0,.75);
    box-shadow:0 0 18px rgba(255,100,0,.4),0 0 6px rgba(255,130,0,.3),inset 0 1px 0 rgba(255,200,80,.32);
    animation:orangePulse 3s ease-in-out infinite;display:flex;align-items:center;">
    <div style="position:absolute;top:0;left:0;right:0;height:1.5px;background:linear-gradient(90deg,transparent,rgba(255,180,60,.95),rgba(255,220,100,.7),rgba(255,180,60,.95),transparent)"></div>
    <div style="position:absolute;top:0;left:-110%;width:45%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,160,60,.12),transparent);animation:shineSwipe 4s ease-in-out infinite;pointer-events:none;z-index:1"></div>
    <div style="position:relative;z-index:3;flex-shrink:0;display:flex;align-items:center;gap:6px;height:100%;padding:0 14px;background:linear-gradient(160deg,rgba(255,100,0,.88),rgba(200,55,0,.92));border-right:1px solid rgba(255,140,40,.5);">
      <span style="width:9px;height:9px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#ff6666,#ff0000 55%,#cc0000);flex-shrink:0;animation:redBreath 1.4s ease-in-out infinite;box-shadow:0 0 10px #ff0000,0 0 22px #ff0000,0 0 38px rgba(255,0,0,.5)"></span>
      <span class="trending-word">TRENDING</span>
    </div>
    <div style="position:relative;z-index:3;flex:1;overflow:hidden;height:100%;display:flex;align-items:center;">
      <div style="position:absolute;left:0;top:0;bottom:0;width:20px;background:linear-gradient(90deg,rgba(20,8,0,.95),transparent);z-index:2;pointer-events:none"></div>
      <div style="position:absolute;right:0;top:0;bottom:0;width:20px;background:linear-gradient(270deg,rgba(20,8,0,.95),transparent);z-index:2;pointer-events:none"></div>
      <div style="display:flex;animation:marquee 24s linear infinite;white-space:nowrap;will-change:transform;padding-left:14px;">
        <span style="font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:700;color:rgba(255,210,150,.9)">${trendText}&nbsp;&nbsp;&nbsp;✦&nbsp;&nbsp;&nbsp;${trendText}&nbsp;&nbsp;&nbsp;✦&nbsp;&nbsp;&nbsp;</span>
      </div>
    </div>
    <div style="position:relative;z-index:3;flex-shrink:0;padding:0 12px;height:100%;display:flex;align-items:center;gap:4px;border-left:1px solid rgba(255,100,0,.45)">
      <svg width="16" height="20" viewBox="0 0 18 22" fill="none" style="overflow:visible;filter:drop-shadow(0 0 4px #ff6600) drop-shadow(0 0 8px #ff3300);animation:fireGlow 1.2s ease-in-out infinite">
        <defs>
          <radialGradient id="fg1" cx="50%" cy="75%" r="65%">
            <stop offset="0%" stop-color="#fff200"/>
            <stop offset="35%" stop-color="#ff7700"/>
            <stop offset="100%" stop-color="#cc1100" stop-opacity="0.1"/>
          </radialGradient>
          <radialGradient id="fg2" cx="50%" cy="80%" r="55%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="25%" stop-color="#ffe600"/>
            <stop offset="100%" stop-color="#ff5500" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <path d="M9 1 C9 1 13 5 13 9 C14 7 14 5 13 3 C16 5 17 9 16 13 C17 11 17.5 9 17 7 C18 10 18 14 16 17 C15 19.5 12.5 21 9 21 C5.5 21 3 19.5 2 17 C0 14 0 10 1 7 C0.5 9 1 11 2 13 C1 9 2 5 5 3 C4 5 4 7 5 9 C5 5 7 1 9 1Z" fill="url(#fg1)" style="transform-origin:9px 11px;animation:fireFlicker1 1.4s ease-in-out infinite"/>
        <path d="M9 7 C9 7 11 10 11 13 C11.5 11.5 11.5 10 11 9 C12 10 12 13 11 15 C10.5 16.5 9.8 17 9 17 C8.2 17 7.5 16.5 7 15 C6 13 6 10 7 9 C6.5 10 6.5 11.5 7 13 C7 10 8 7 9 7Z" fill="url(#fg2)" style="transform-origin:9px 13px;animation:fireFlicker2 1s ease-in-out infinite 0.15s"/>
        <ellipse cx="9" cy="16.5" rx="2.5" ry="1.4" fill="#ffffff" opacity="0.92" style="animation:fireCoreBreath 0.8s ease-in-out infinite 0.05s"/>
      </svg>
      <span style="font-family:'Oswald',sans-serif;font-weight:700;font-size:13px;color:#ff9a3c">${BETS[state.cat].filter(b=>b.hot).length}</span>
    </div>
  </div>`;

  const uidDisplay=state.userEmail||'Login required';
  html+=`
  <div id="balCard" onclick="jellyTapBalCard()" style="position:relative">
    <div class="bc-sweep"></div><div class="bc-topline"></div>
    <div style="position:relative;z-index:3">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:2px">
        <div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1">
          <span style="font-size:11px;font-weight:800;color:rgba(255,255,255,.65);text-transform:uppercase;letter-spacing:.8px;white-space:nowrap">Total Balance</span>
          <span class="bal-uid-chip" id="balUidChip" title="${uidDisplay}">${uidDisplay}</span>
        </div>
        <button class="bal-view-btn" onclick="event.stopPropagation();openPortfolio()">View &rsaquo;</button>
      </div>
      <div class="bal-main-row">
        <span class="bal-rupee-lg">₹</span><span class="bal-num-lg" id="balNum">${state.bal}</span><span class="bal-inr">INR</span>
      </div>
      <div class="bal-btns">
        <button class="dep-btn" onclick="event.stopPropagation();openDeposit()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>+ Deposit
        </button>
        <button class="wit-btn" onclick="event.stopPropagation();openWithdraw()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5V19M5 12L12 5L19 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>↑ Withdraw
        </button>
      </div>
      <div class="bal-stats-row">
        <div class="bal-stat-box"><div class="bal-stat-lbl">Total Deposit</div><div class="bal-stat-val" id="totalDepositEl">${fmtCur(state.totalDeposit)}</div></div>
        <div class="bal-stat-box" style="border-left:1px solid rgba(255,255,255,.1)"><div class="bal-stat-lbl">Total Withdrawal</div><div class="bal-stat-val" id="totalWithdrawEl">${fmtCur(state.totalWithdraw)}</div></div>
      </div>
    </div>
  </div>`;

  html+=`
  <div id="marketSticky">
  <div class="jelly-section">
    <div class="jelly-header">
      <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
        <div class="jelly-icon-box" style="filter:brightness(1.5) saturate(1.6)">${m.icon}</div>
        <div style="min-width:0">
          <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:17px;color:#fff;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:.2px">
            ${m.label} <span style="font-family:'Syne',sans-serif;font-weight:900;color:#00e5cc;text-shadow:0 0 12px rgba(0,229,204,.8),0 0 28px rgba(0,200,180,.5);letter-spacing:.5px">Markets</span>
          </div>
          <div class="jelly-chips">
            <div class="chip-live"><span style="width:5px;height:5px;border-radius:50%;background:#ef4444;animation:liveDot 1.1s infinite;display:inline-block;flex-shrink:0"></span><span class="chip-text" style="color:#ff6b6b;font-size:9px">LIVE</span></div>
            <div class="chip-vol"><span class="chip-text" style="color:#00c8ff;font-size:9px">₹4.2L+ VOL</span></div>
            <div class="chip-hot" style="position:relative;overflow:visible">
              <span class="fire-emoji-wrap" style="position:relative;display:inline-block;width:18px;height:22px;flex-shrink:0">
                <svg class="fire-svg" width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id="fg1" cx="50%" cy="80%" r="60%"><stop offset="0%" stop-color="#fff7a0"/><stop offset="30%" stop-color="#ffcc00"/><stop offset="60%" stop-color="#ff6600"/><stop offset="100%" stop-color="#cc1100" stop-opacity="0"/></radialGradient>
                    <radialGradient id="fg2" cx="50%" cy="70%" r="55%"><stop offset="0%" stop-color="#fffde0"/><stop offset="40%" stop-color="#ffaa00"/><stop offset="100%" stop-color="#ff3300" stop-opacity="0"/></radialGradient>
                    <filter id="ff1"><feGaussianBlur stdDeviation="0.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  </defs>
                  <path class="fire-outer" d="M9 1 C9 1 13 5 13 9 C14 7 14 5 13 3 C16 5 17 9 16 13 C17 11 17.5 9 17 7 C18 10 18 14 16 17 C15 19.5 12.5 21 9 21 C5.5 21 3 19.5 2 17 C0 14 0 10 1 7 C0.5 9 1 11 2 13 C1 9 2 5 5 3 C4 5 4 7 5 9 C5 5 7 1 9 1Z" fill="url(#fg1)" filter="url(#ff1)"/>
                  <path class="fire-inner" d="M9 7 C9 7 11.5 10 11 13 C12 11.5 12 10 11.5 8.5 C13 10 13 13 12 15.5 C11 17.5 10 18.5 9 18.5 C8 18.5 7 17.5 6 15.5 C5 13 5 10 6.5 8.5 C6 10 6 11.5 7 13 C6.5 10 7 7 9 7Z" fill="url(#fg2)"/>
                  <ellipse class="fire-core" cx="9" cy="17" rx="2.5" ry="2" fill="#fffde0" opacity="0.9"/>
                </svg>
              </span>
              <span class="chip-text" style="color:#ffa040;font-size:9px">${BETS[state.cat].filter(b=>b.hot).length} HOT</span>
            </div>
          </div>
        </div>
      </div>
      <div class="count-pill">${BETS[state.cat].length}<span style="font-size:9px;opacity:.75;letter-spacing:1.5px"> MKT</span></div>
    </div>
    <div class="jelly-track-wrap" id="jellyTrackWrap"><canvas id="jellyCanvas"></canvas></div>
    <div class="jelly-hints">
      <span class="jelly-hint">◀ TOP</span>
      <span class="jelly-hint" style="color:rgba(255,150,50,.25);font-size:8px;align-self:center">DRAG TO NAVIGATE</span>
      <span class="jelly-hint">BOTTOM ▶</span>
    </div>
  </div>`;

  const bc=BADGE_COLORS[state.cat];
  let cardsHtml='';
  BETS[state.cat].forEach((b,i)=>{
    const barC=b.odds>65?"#22c55e":b.odds>40?color:"#ef4444";
    const numC=b.odds>65?"#22c55e":b.odds>40?"#d1d9e6":"#ef4444";
    const isLive=b.odds>70;
    cardsHtml+=`<div class="market-card shine-card" style="animation-delay:${Math.min(i,.04)*0.04}s">
      <div class="card-glow-top" style="background:linear-gradient(90deg,transparent,${color}bb,rgba(255,215,0,.2),transparent)"></div>
      <div class="card-glow-left" style="background:linear-gradient(180deg,${color},${color}66,transparent);box-shadow:2px 0 10px ${color}44"></div>
      <div class="card-badge-row">
        <span class="badge" style="background:${bc.bg};color:${bc.color};border:${bc.border}">${m.icon} ${m.label}</span>
        ${b.hot?'<span class="hot-badge">🔥 HOT</span>':''}
        ${isLive?'<span class="live-badge"><span class="live-dot"></span>LIVE</span>':''}
        <span style="margin-left:auto;font-family:'Oswald',sans-serif;font-weight:700;font-size:11px;color:#ffd700;background:rgba(255,215,0,.08);border:1px solid rgba(255,215,0,.22);padding:4px 10px;border-radius:50px;letter-spacing:.8px">₹${VOLS[i%11]} VOL</span>
      </div>
      <div class="card-q" style="font-size:17px;font-weight:700;line-height:1.55;color:#dde4f0">${b.q}</div>
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-top:4px">
        <div class="bet-btns" style="flex:1">
        <button class="bet-btn neon-green-btn" onclick="openBet(${i},'YES')">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>YES ₹${b.odds}
        </button>
        <button class="bet-btn neon-red-btn" onclick="openBet(${i},'NO')">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polyline points="22,17 13.5,8.5 8.5,13.5 2,7" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>NO ₹${100-b.odds}
        </button>
        </div>
        <!-- Circular chance gauge -->
        <div style="flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;width:72px;height:72px">
          <svg width="72" height="72" viewBox="0 0 72 72" style="position:absolute;top:0;left:0;transform:rotate(-220deg)">
            <circle cx="36" cy="36" r="27" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="5" stroke-linecap="round" stroke-dasharray="169.6" stroke-dashoffset="0"/>
            <circle cx="36" cy="36" r="27" fill="none" stroke="${barC}" stroke-width="5.5" stroke-linecap="round"
              stroke-dasharray="169.6"
              stroke-dashoffset="${(169.6*(1-(b.odds/100)*(240/360))).toFixed(1)}"
              style="filter:drop-shadow(0 0 5px ${barC})"/>
          </svg>
          <div style="position:relative;z-index:2;text-align:center;line-height:1.1">
            <div style="font-family:'Oswald',sans-serif;font-weight:700;font-size:16px;color:${barC};text-shadow:0 0 10px ${barC}88">${b.odds}%</div>
            <div style="font-size:9px;font-weight:700;color:rgba(150,180,220,.7);letter-spacing:.5px">chance</div>
          </div>
        </div>
      </div>
    </div>`;
  });
  html+=`<div id="betsContainer" style="padding:0 14px;padding-bottom:20px">${cardsHtml}</div>
  </div>`;
  container.innerHTML=html;
  updateBal();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{setBetsHeight();initJellySlider();}));
}

/* ── SUPPORT ── */
function renderSupport(){
  const faqs=[
    {q:"How do I deposit?",a:"Tap Deposit → Enter amount → Scan QR → Enter UTR. Credited within 5–10 minutes."},
    {q:"How do I withdraw?",a:"Save your UPI ID in Portfolio first, then tap Withdraw. Processed within 30 minutes."},
    {q:"When does my bet resolve?",a:"Bets resolve within 24 hours of the event. WIN/LOST status will appear in your Portfolio."},
    {q:"What is the minimum bet?",a:"Minimum bet is ₹10. Maximum is ₹10,000 per market per day."},
    {q:"Is this platform legal?",a:"WISHWORK operates as a skill-based prediction game. Users are responsible for local regulations."}
  ];
  let html=`<div style="padding:20px 14px">
    <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:20px;margin-bottom:4px;display:flex;align-items:center;gap:10px;color:#e8edf5">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#00d4ff" stroke-width="2"/><path d="M12 8C10.3 8 9 9.3 9 11" stroke="#00d4ff" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16" r="1" fill="#00d4ff"/></svg>Support Center</div>
    <p style="color:#64748b;font-size:13px;margin-bottom:18px">We're here 24/7 — reach us instantly</p>
    <div class="glass" style="border-radius:16px;padding:18px;margin-bottom:12px;border:1px solid rgba(34,168,255,.18);background:rgba(34,168,255,.04)">
      <div style="display:flex;align-items:center;gap:13px">
        <div style="width:48px;height:48px;border-radius:14px;background:rgba(34,168,255,.12);display:flex;align-items:center;justify-content:center;border:1px solid rgba(34,168,255,.25)">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#229ED9"><path d="M11.994 2a10 10 0 100 20 10 10 0 000-20zm3.18 6.624l-1.67 7.872c-.126.561-.455.698-.919.434l-2.546-1.876-1.228 1.183c-.135.136-.25.25-.513.25l.183-2.59 4.714-4.257c.205-.182-.044-.283-.318-.1L7.809 14.3l-2.5-.78c-.544-.17-.555-.544.113-.806l9.767-3.765c.453-.165.85.11.705.756l-.72-.08z"/></svg>
        </div>
        <div><div style="font-weight:700;font-size:14px;margin-bottom:2px;color:#e8edf5">Telegram Support</div><div style="font-size:12px;color:#94a3b8">@WISHWORKONLINE · Reply in 5 mins</div></div>
      </div>
      <button class="neon-btn" style="margin-top:13px;background:rgba(34,168,255,.1);border:1.5px solid rgba(34,168,255,.45);color:#229ED9;font-size:12px;border-radius:12px" onclick="window.open('https://t.me/WISHWORKONLINE','_blank')">Open Telegram Chat →</button>
    </div>`;
  faqs.forEach(f=>{html+=`<div class="glass" style="border-radius:13px;padding:14px;margin-bottom:8px"><div style="font-weight:700;font-size:13px;margin-bottom:5px;display:flex;align-items:center;gap:7px;color:#e8edf5"><svg width="11" height="11" viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="#ffd700"/></svg>${f.q}</div><div style="font-size:12px;color:#94a3b8;line-height:1.5">${f.a}</div></div>`;});
  html+='</div>';document.getElementById('pageSupport').innerHTML=html;
}

/* ── ACCOUNT ── */
function renderAccount(){
  document.getElementById('pageAccount').innerHTML=`<div style="padding:20px 14px">
    <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:20px;margin-bottom:4px;display:flex;align-items:center;gap:10px;color:#e8edf5">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#ffd700" stroke-width="2"/><path d="M4 20C4 16.13 7.58 13 12 13s8 3.13 8 7" stroke="#ffd700" stroke-width="2" stroke-linecap="round"/></svg>My Account</div>
    <p style="color:#64748b;font-size:13px;margin-bottom:18px">Manage your profile and settings</p>
    <div class="acc-tabs">
      <button class="acc-tab ${state.accountTab==='profile'?'active':''}" onclick="switchAccTab('profile')">Profile</button>
      <button class="acc-tab ${state.accountTab==='settings'?'active':''}" onclick="switchAccTab('settings')">Settings</button>
      <button class="acc-tab ${state.accountTab==='security'?'active':''}" onclick="switchAccTab('security')">Security</button>
    </div>
    <div id="accContent"></div>
  </div>`;renderAccTab();
}
function switchAccTab(tab){state.accountTab=tab;document.querySelectorAll('.acc-tab').forEach(el=>el.classList.toggle('active',el.textContent.toLowerCase()===tab));renderAccTab();}
function renderAccTab(){
  const el=document.getElementById('accContent');if(!el)return;
  const color=cc();
  if(state.accountTab==='profile'){
    const wins=state.txList.filter(t=>normalizeStatus(t.status).cls==='won').length;
    const upiSection=state.savedUpi
      ?`<div class="upi-linked-row"><div><div style="font-size:10px;color:#64748b;margin-bottom:2px">Linked UPI ID</div><div style="color:${color};font-weight:700;font-size:13px">${state.savedUpi}</div>${state.phone?`<div style="font-size:10px;color:#64748b;margin-top:1px">${state.phone}</div>`:''}</div><button onclick="state.savedUpi='';LS.save();renderAccTab()" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#94a3b8;padding:6px 11px;font-size:11px;cursor:pointer;font-weight:600">Edit</button></div>`
      :`<input class="text-inp" style="margin-bottom:8px" placeholder="UPI ID (e.g. name@paytm)" id="accUpiInp" value="${state.upi}" oninput="state.upi=this.value"/>
        <input class="text-inp" style="margin-bottom:12px" placeholder="Phone Number" id="accPhoneInp" value="${state.phone}" oninput="state.phone=this.value"/>
        <button class="neon-btn neon-gold-btn" onclick="saveUpi()" style="font-size:12px;border-radius:12px">Save Payment Info</button>`;
    el.innerHTML=`
      <div class="glass" style="border-radius:16px;padding:18px;margin-bottom:12px;text-align:center">
        <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,${color},#ffd700);margin:0 auto 11px;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 0 22px ${color}44;border:2.5px solid rgba(255,255,255,.12)">👤</div>
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:17px;color:#e8edf5">User</div>
        <div style="font-size:12px;color:#64748b;margin-top:2px" id="accEmail">${state.userEmail||'user@example.com'}</div>
        <div style="margin-top:12px;display:flex;justify-content:center;gap:10px">
          <div style="text-align:center;padding:9px 14px;background:rgba(255,255,255,.04);border-radius:11px;border:1px solid rgba(255,255,255,.07)"><div style="font-weight:800;font-size:17px;color:#22c55e">₹${state.bal}</div><div style="font-size:10px;color:#64748b;margin-top:2px">Balance</div></div>
          <div style="text-align:center;padding:9px 14px;background:rgba(255,255,255,.04);border-radius:11px;border:1px solid rgba(255,255,255,.07)"><div style="font-weight:800;font-size:17px;color:#ffd700">${state.txList.length}</div><div style="font-size:10px;color:#64748b;margin-top:2px">Bets</div></div>
          <div style="text-align:center;padding:9px 14px;background:rgba(255,255,255,.04);border-radius:11px;border:1px solid rgba(255,255,255,.07)"><div style="font-weight:800;font-size:17px;color:#00d4ff">${wins}</div><div style="font-size:10px;color:#64748b;margin-top:2px">Wins</div></div>
        </div>
      </div>
      <div class="glass" style="border-radius:16px;padding:15px;margin-bottom:12px">
        <div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:12px">Withdrawal Method</div>
        ${upiSection}
      </div>`;
  } else if(state.accountTab==='settings'){
    const settings=[{label:"Push Notifications",sub:"Bet updates and results",on:true},{label:"Dark Mode",sub:"Always on",on:true},{label:"Sound Effects",sub:"Bet placement sounds",on:false},{label:"Auto-logout",sub:"After 30 min inactivity",on:false}];
    el.innerHTML=settings.map(s=>`<div class="glass" style="border-radius:13px;padding:13px 15px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between"><div><div style="font-weight:600;font-size:13px;color:#e8edf5">${s.label}</div><div style="font-size:11px;color:#64748b;margin-top:2px">${s.sub}</div></div><div style="width:42px;height:23px;border-radius:12px;background:${s.on?cc():'rgba(255,255,255,.08)'};border:1px solid ${s.on?cc():'rgba(255,255,255,.08)'};position:relative;cursor:pointer"><div style="position:absolute;top:2.5px;left:${s.on?'20px':'2.5px'};width:18px;height:18px;border-radius:50%;background:white;box-shadow:0 2px 4px rgba(0,0,0,.3)"></div></div></div>`).join('');
  } else {
    el.innerHTML=`<div class="glass" style="border-radius:16px;padding:16px;margin-bottom:10px;border:1px solid rgba(34,197,94,.16);background:rgba(34,197,94,.04)"><div style="display:flex;align-items:center;gap:10px;margin-bottom:4px"><span style="font-size:18px">🔒</span><div style="font-weight:700;font-size:13px;color:#e8edf5">Account Secure</div></div><div style="font-size:12px;color:#64748b">Your account is protected. Last login: Today</div></div>
      <button class="neon-btn neon-green-btn" style="margin-bottom:9px;font-size:12px" onclick="showToast('Password reset link sent!','success')">Change Password</button>
      <button class="neon-btn neon-gold-btn" style="margin-bottom:9px;font-size:12px" onclick="showToast('2FA setup coming soon!','info')">Enable 2FA (Coming Soon)</button>
      <button class="neon-btn neon-red-btn" style="font-size:12px" onclick="logout()">Logout</button>`;
  }
}
function saveUpi(){
  if(state.upi&&state.phone){state.savedUpi=state.upi;LS.save();showToast('✅ Payment info saved!');renderAccTab();}
  else showToast('Enter UPI ID and phone','info');
}
function logout(){
  /* Save txList to localStorage BEFORE clearing state so history is preserved */
  LS.save();
  /* Clear in-memory session only — do NOT wipe localStorage so portfolio survives */
  state.bal=0;state.txList=[];state.savedUpi='';state.upi='';state.phone='';
  state.totalDeposit=0;state.totalWithdraw=0;state.userEmail='';
  showToast('Logged out','info');renderAccTab();updateBal();
}

/* ── PORTFOLIO ── */
function openPortfolio(){
  document.getElementById('backdrop').classList.remove('hidden');
  document.getElementById('portfolio').classList.remove('hidden');
  renderPortfolio();
}
function renderPortfolio(){
  const color=cc();const wins=state.txList.filter(t=>normalizeStatus(t.status).cls==='won').length;
  document.getElementById('portStats').innerHTML=[
    {label:'Balance',val:`₹${state.bal}`,color:'#22c55e',bg:'rgba(34,197,94,.08)',border:'rgba(34,197,94,.18)'},
    {label:'Bets',val:state.txList.length,color:'#ffd700',bg:'rgba(255,215,0,.08)',border:'rgba(255,215,0,.18)'},
    {label:'Wins',val:wins,color:'#00d4ff',bg:'rgba(0,212,255,.08)',border:'rgba(0,212,255,.18)'}
  ].map(s=>`<div class="glass port-stat" style="background:${s.bg};border-color:${s.border}"><div class="port-stat-val" style="color:${s.color}">${s.val}</div><div class="port-stat-lbl">${s.label}</div></div>`).join('');
  const upiEl=document.getElementById('portUpiSection');
  if(state.savedUpi){
    upiEl.innerHTML=`<div class="upi-linked-row"><div><div style="font-size:10px;color:#64748b;margin-bottom:2px">Linked UPI ID</div><div style="color:${color};font-weight:700;font-size:13px">${state.savedUpi}</div>${state.phone?`<div style="font-size:10px;color:#64748b;margin-top:1px">${state.phone}</div>`:''}</div><button onclick="state.savedUpi='';LS.save();renderPortfolio()" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#94a3b8;padding:6px 11px;font-size:11px;cursor:pointer;font-weight:600">Edit</button></div>`;
  } else {
    upiEl.innerHTML=`<div style="background:rgba(255,255,255,.03);border-radius:11px;padding:13px;border:1px solid rgba(255,255,255,.06)"><input class="text-inp" style="margin-bottom:8px" placeholder="UPI ID (e.g. name@paytm)" id="portUpiInp" value="${state.upi}" oninput="state.upi=this.value"/><input class="text-inp" style="margin-bottom:12px" placeholder="Phone Number" id="portPhoneInp" value="${state.phone}" oninput="state.phone=this.value"/><button class="neon-btn neon-gold-btn" style="font-size:12px;border-radius:12px" onclick="saveUpiPort()">Save Payment Info</button></div>`;
  }
  const txEl=document.getElementById('txList');
  if(!state.txList.length){txEl.innerHTML=`<div class="tx-empty"><div class="tx-emoji">📭</div><div>No transactions yet</div></div>`;}
  else{txEl.innerHTML=state.txList.map(tx=>{const{label,cls}=normalizeStatus(tx.status);return`<div class="tx-card"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><div><div class="tx-type">${tx.type}</div><div class="tx-amt">${tx.amt}</div><div class="tx-desc">${tx.q||''} · ${tx.time}</div></div><div class="tx-badge ${cls}">${label}</div></div></div>`;}).join('');}
}
function saveUpiPort(){
  if(state.upi&&state.phone){state.savedUpi=state.upi;LS.save();showToast('✅ Payment info saved!');renderPortfolio();}
  else showToast('Enter UPI ID and phone','info');
}

/* ════════════════════════════════════════════
   BET CARD — shimmer glassmorphism popup
   Replaces the old bottom sheet entirely
════════════════════════════════════════════ */
function openBet(idx, side){
  const b = BETS[state.cat][idx];
  state.betInfo = b;
  state.side    = side;
  state.betAmt  = '';

  const isYes  = side === 'YES';
  const color  = isYes ? '#00e5cc' : '#8b0040';
  const colorR = isYes ? '0,229,204' : '139,0,64';
  const glow   = isYes ? 'rgba(0,229,204,.65)' : 'rgba(160,0,80,.75)';
  const glow2  = isYes ? 'rgba(0,229,204,.30)' : 'rgba(130,0,60,.40)';
  const sideLabel = isYes ? '✅ YES' : '❌ NO';
  const btnBg  = isYes
    ? 'linear-gradient(145deg,#007a6e,#00c4ae,#00e5cc)'
    : 'linear-gradient(145deg,#4a0020,#8b0040,#c0005a)';
  const topLine = isYes
    ? `linear-gradient(90deg,transparent,rgba(0,229,204,.95),rgba(180,255,245,.85),rgba(0,229,204,.95),transparent)`
    : `linear-gradient(90deg,transparent,rgba(160,0,80,.95),rgba(255,180,220,.75),rgba(160,0,80,.95),transparent)`;
  const catM   = META[state.cat];
  const barC   = b.odds > 65 ? '#22c55e' : b.odds > 40 ? catM.color : '#ef4444';
  const chipVals = [50,100,250,500,1000];

  /* Build card HTML */
  const chipsHtml = chipVals.map(v =>
    `<div class="bc-chip" onclick="bcSelectChip(${v},'${colorR}')" id="bcchip${v}">₹${v>=1000?'1K':v}</div>`
  ).join('');

  const cardHtml = `
  <div class="bet-card" id="betCard"
    style="--card-color:${color};
           --card-glow:${glow};
           --card-glow2:${glow2};
           --card-topline:${topLine};">

    <div class="bc-topline"></div>

    <div class="bc-inner">

      <!-- Header row: category badge + side badge -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:7px;padding:5px 11px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:50px;backdrop-filter:blur(8px)">
          ${catM.icon}
          <span style="font-family:'Oswald',sans-serif;font-weight:700;font-size:11px;color:rgba(255,255,255,.8);letter-spacing:1px">${catM.label.toUpperCase()}</span>
        </div>
        <div class="bc-side-badge" style="--card-color:${color};--card-glow:${glow}">
          ${isYes
            ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="20,6 9,17 4,12" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`
            : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18" stroke="${color}" stroke-width="3" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="${color}" stroke-width="3" stroke-linecap="round"/></svg>`
          }
          ${sideLabel} · 1.9×
        </div>
      </div>

      <!-- Question -->
      <div class="bc-question">${b.q}</div>

      <!-- Odds bar -->
      <div class="bc-odds-row">
        <div class="bc-odds-pct" style="color:${barC}">${b.odds}%</div>
        <div class="bc-bar-wrap"><div class="bc-bar-fill" style="width:${b.odds}%;background:${barC};box-shadow:0 0 10px ${barC}88"></div></div>
        <div class="bc-odds-lbl">chance</div>
      </div>

      <!-- Amount chips -->
      <div class="bc-chips">${chipsHtml}</div>

      <!-- Amount input -->
      <input class="bc-input" id="bcAmtInput" type="number" placeholder="₹ 0"
        style="border-color:rgba(${colorR},.35);"
        oninput="bcUpdateAmt(this.value,'${colorR}')"/>

      <!-- Payout row -->
      <div class="bc-payout-box">
        <div class="bc-payout-lbl">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M8 5H6C4.9 5 4 5.9 4 7V9C4 11.2 5.5 13 7.5 13.5" stroke="#ffd700" stroke-width="2" stroke-linecap="round"/><path d="M16 5H18C19.1 5 20 5.9 20 7V9C20 11.2 18.5 13 16.5 13.5" stroke="#ffd700" stroke-width="2" stroke-linecap="round"/><path d="M8 5C8 5 8 13 12 15C16 13 16 5 16 5H8Z" fill="#ffd700" opacity="0.85"/><line x1="12" y1="15" x2="12" y2="19" stroke="#ffd700" stroke-width="2"/><line x1="8" y1="19" x2="16" y2="19" stroke="#ffd700" stroke-width="2" stroke-linecap="round"/></svg>
          Potential Return
        </div>
        <div class="bc-payout-val" id="bcPayoutAmt">₹ 0.00</div>
      </div>

      <!-- Buy button -->
      <button class="bc-btn" id="bcPlaceBtn"
        style="background:${btnBg};box-shadow:0 0 30px ${glow},0 0 60px ${glow2},inset 0 1px 0 rgba(255,255,255,.3),inset 0 -1px 0 rgba(0,0,0,.3);"
        onclick="bcPlaceBet()">
        ${isYes
          ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="margin-right:6px"><polyline points="20,6 9,17 4,12" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`
          : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="margin-right:6px"><line x1="18" y1="6" x2="6" y2="18" stroke="white" stroke-width="3" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="white" stroke-width="3" stroke-linecap="round"/></svg>`
        }
        Buy ${side} — Place Bet
      </button>

      <!-- Cancel -->
      <div class="bc-cancel" onclick="closeAll()">✕ Cancel</div>

    </div>
  </div>`;

  /* Inject card into DOM (replace if already there) */
  const existing = document.getElementById('betCard');
  if(existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', cardHtml);

  /* Open backdrop with extra blur */
  const bd = document.getElementById('backdrop');
  bd.classList.remove('hidden');
  bd.classList.add('bet-open');

  /* Trigger entrance animation next frame */
  requestAnimationFrame(()=>{
    const card = document.getElementById('betCard');
    if(card){ card.style.display=''; card.classList.add('open'); }
  });
}

/* Chip selection for bet card */
function bcSelectChip(v, colorR){
  state.betAmt = String(v);
  const inp = document.getElementById('bcAmtInput');
  if(inp) inp.value = v;
  document.querySelectorAll('.bc-chip').forEach(el=>{
    const active = el.id === 'bcchip'+v;
    el.classList.toggle('active', active);
  });
  bcUpdateAmt(v, colorR);
}

/* Amount update for bet card */
function bcUpdateAmt(val, colorR){
  state.betAmt = val;
  const p = val ? (parseFloat(val)*1.9).toFixed(2) : '0.00';
  const el = document.getElementById('bcPayoutAmt');
  if(el) el.textContent = `₹ ${p}`;
  /* Highlight input border when typed */
  const inp = document.getElementById('bcAmtInput');
  if(inp && colorR) inp.style.borderColor = `rgba(${colorR},.65)`;
}

/* Place bet from shimmer card — calls Firebase override if available */
function bcPlaceBet(){
  /* If Firebase override exists, use it (writes to Firestore) */
  if(typeof window.placeBet === 'function' && window.placeBet !== bcPlaceBet){
    window.placeBet();
    return;
  }
  /* Local fallback (no Firebase) */
  const a = parseInt(state.betAmt);
  if(!a||a<=0) return showToast('Enter a valid amount','info');
  if(a>state.bal) return showToast('Insufficient balance 💸','info');
  state.bal -= a;
  const now = new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  state.txList.unshift({
    id:Date.now(), firestoreId:null,
    type:`BET: ${state.side}`,
    q:state.betInfo.q.slice(0,35)+'…',
    amt:`₹${a}`,status:'PENDING',time:now
  });
  LS.save();
  closeAll();
  showToast(`${state.side==='YES'?'✅':'❌'} Bet placed — ₹${a} on ${state.side}`);
  updateBal();
}

/* Legacy placeBet kept for Firebase override compatibility */
function placeBet(){ bcPlaceBet(); }

/* ── DEPOSIT ── */
function openDeposit(){
  document.getElementById('depStep1').classList.remove('hidden');
  document.getElementById('depStep2').classList.add('hidden');
  document.getElementById('depAmtInp').value='';
  document.getElementById('backdrop').classList.remove('hidden');
  document.getElementById('depSheet').classList.remove('hidden');
}
function generateQR(){
  const a=parseInt(document.getElementById('depAmtInp').value);
  if(!a||a<=0)return showToast('Enter deposit amount','info');
  document.getElementById('qrAmt').textContent=`₹${a}`;document.getElementById('payAmt').textContent=`Pay ₹${a}`;
  document.getElementById('depStep1').classList.add('hidden');document.getElementById('depStep2').classList.remove('hidden');document.getElementById('utrInp').value='';
  state.timer=80;updateTimerCircle();clearInterval(state.timerInt);
  state.timerInt=setInterval(()=>{state.timer--;if(state.timer<=0){clearInterval(state.timerInt);state.timer=0;}updateTimerCircle();},1000);
}
function updateTimerCircle(){
  document.getElementById('timerNum').textContent=state.timer;
  document.getElementById('timerCircle').style.strokeDashoffset=150.8*(1-state.timer/80);
}
function submitUTR(){
  const utr=document.getElementById('utrInp').value;
  if(!utr||utr.length<10)return showToast('Enter valid 12-digit UTR','info');
  const rawAmt=document.getElementById('depAmtInp').value||document.getElementById('qrAmt').textContent.replace('₹','');
  const a=parseFloat(rawAmt)||0;
  const now=new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  state.txList.unshift({id:Date.now(),type:'DEPOSIT',q:'UPI Payment',amt:`₹${a}`,status:'PENDING',time:now});
  state.totalDeposit+=a;LS.save();clearInterval(state.timerInt);closeAll();
  showToast('✅ Deposit submitted! Processing…');updateBal();
}


/* ── UPI POPUP ── */
function showUpiPopup(){
  const existing=document.getElementById('upiPopup');
  if(existing)existing.remove();
  const el=document.createElement('div');
  el.id='upiPopup';
  el.innerHTML=`
    <div style="position:absolute;top:0;left:0;right:0;height:1.5px;background:linear-gradient(90deg,transparent,rgba(255,215,0,.8),transparent);border-radius:22px 22px 0 0"></div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <div style="width:38px;height:38px;border-radius:12px;background:rgba(255,215,0,.1);border:1.5px solid rgba(255,215,0,.3);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="3" stroke="#ffd700" stroke-width="2"/><path d="M16 7V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V7" stroke="#ffd700" stroke-width="2"/><line x1="12" y1="12" x2="12" y2="16" stroke="#ffd700" stroke-width="2" stroke-linecap="round"/><line x1="10" y1="14" x2="14" y2="14" stroke="#ffd700" stroke-width="2" stroke-linecap="round"/></svg>
      </div>
      <div>
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:15px;color:#e8edf5">UPI ID Required</div>
        <div style="font-size:11px;color:#64748b;margin-top:1px">Add your UPI to withdraw</div>
      </div>
      <button onclick="closeUpiPopup()" style="margin-left:auto;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:8px;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#94a3b8;font-size:14px;flex-shrink:0;transition:background .2s ease">✕</button>
    </div>
    <div style="font-size:12px;color:#94a3b8;line-height:1.6;margin-bottom:16px">Please submit your <span style="color:#ffd700;font-weight:700">UPI ID</span> and <span style="color:#ffd700;font-weight:700">phone number</span> in your Portfolio before making a withdrawal.</div>
    <button onclick="closeUpiPopup();openPortfolio();" style="width:100%;padding:13px;border-radius:50px;background:linear-gradient(145deg,rgba(255,215,0,.15),rgba(255,215,0,.07));border:1.5px solid rgba(255,215,0,.5);color:#ffd700;font-weight:800;font-size:13px;cursor:pointer;letter-spacing:.4px;box-shadow:0 0 18px rgba(255,215,0,.18),inset 0 1px 0 rgba(255,255,255,.12);transition:all .22s ease">Go to Portfolio →</button>
  `;
  document.body.appendChild(el);
  /* backdrop */
  const bd=document.getElementById('backdrop');
  bd.classList.remove('hidden');
  requestAnimationFrame(()=>el.classList.add('open'));
}
function closeUpiPopup(){
  const el=document.getElementById('upiPopup');
  if(el){el.style.opacity='0';el.style.transform='translate(-50%,-50%) scale(.88)';el.style.transition='opacity .25s ease,transform .25s ease';setTimeout(()=>el.remove(),260);}
  const bd=document.getElementById('backdrop');
  if(bd&&!document.getElementById('portfolio')?.classList.contains('hidden')===false&&
     document.getElementById('depSheet')?.classList.contains('hidden')!==false&&
     document.getElementById('witSheet')?.classList.contains('hidden')!==false){
    bd.classList.add('hidden');
  }
}

/* ── WITHDRAW ── */
function openWithdraw(){
  if(!state.savedUpi){showUpiPopup();return;}
  document.getElementById('witAmtInp').value='';
  document.getElementById('backdrop').classList.remove('hidden');
  document.getElementById('witSheet').classList.remove('hidden');
}
function handleWithdraw(){
  const a=parseInt(document.getElementById('witAmtInp').value);
  if(!a||a<=0)return showToast('Enter a valid amount','info');
  if(a>state.bal)return showToast('Insufficient balance 💸','info');
  state.bal-=a;
  const now=new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  state.txList.unshift({id:Date.now(),type:'WITHDRAW',q:'To UPI',amt:`₹${a}`,status:'PENDING',time:now,withdrawAmt:a});
  LS.save();closeAll();showToast('✅ Withdrawal request sent!');updateBal();
}

/* ── UPDATE BALANCE + STATS ── */
function updateBal(){
  requestAnimationFrame(()=>{
    document.getElementById('navBal').textContent=state.bal;
    const balNum=document.getElementById('balNum');if(balNum)balNum.textContent=state.bal;
    const uidChip=document.getElementById('balUidChip');
    if(uidChip){const u=state.userEmail||'Login required';uidChip.textContent=u;uidChip.title=u;}
    const depEl=document.getElementById('totalDepositEl');const witEl=document.getElementById('totalWithdrawEl');
    if(depEl)depEl.textContent=fmtCur(state.totalDeposit);
    if(witEl)witEl.textContent=fmtCur(state.totalWithdraw);
  });
}

/* ── CROSS-TAB SYNC ── */
window.addEventListener('storage',(e)=>{
  if(e.key===LS_KEY){LS.load();updateBal();
    const port=document.getElementById('portfolio');if(port&&!port.classList.contains('hidden'))renderPortfolio();
    if(state.activePage==='account')renderAccTab();}
});

/* ── ADMIN UPDATE ── */
window.adminUpdateTx=function(docId,newStatus,actionType,rawAmt){
  let tx=state.txList.find(t=>t.firestoreId===docId);
  if(!tx&&actionType==='BET') tx=state.txList.find(t=>t.type&&t.type.startsWith('BET')&&t.status==='PENDING'&&!t.firestoreId);
  if(!tx&&actionType==='WITHDRAW') tx=state.txList.find(t=>t.type==='WITHDRAW'&&t.status==='PENDING'&&!t.firestoreId);
  if(tx){
    if(!tx.firestoreId)tx.firestoreId=docId;
    const prevStatus=tx.status;tx.status=newStatus;
    const up=newStatus.toUpperCase();
    if(tx.type==='WITHDRAW'&&(up==='COMPLETED'||up==='APPROVED'||up==='PAID')){
      const wasOK=prevStatus.toUpperCase()==='COMPLETED'||prevStatus.toUpperCase()==='APPROVED'||prevStatus.toUpperCase()==='PAID';
      if(!wasOK){const amt=tx.withdrawAmt||parseFloat((tx.amt||'').replace('₹',''))||0;state.totalWithdraw+=amt;}
    }
    LS.save();
  }
  updateBal();
  const port=document.getElementById('portfolio');if(port&&!port.classList.contains('hidden'))renderPortfolio();
};

/* ── INIT ── */
function init(){
  /* Restore the correct per-user LS key from any previously saved email */
  const guestData=JSON.parse(localStorage.getItem('ww_guest')||'{}');
  const savedEmail=guestData.userEmail||localStorage.getItem('userEmail')||'';
  if(savedEmail){LS.setKey(savedEmail);}
  LS.load();setCC(META[state.cat].color);renderTabs();renderMarkets();updateBal();updateBlobs();
  ['support','account'].forEach(p=>{const pip=document.getElementById('pip-'+p);if(pip)pip.style.display='none';});
}
/* ══════════════════════════════════════════════════════
   COLOUR PREDICTION GAME ENGINE  v6
   - Instant timer restart at 0
   - Multiple bets per round (array)
   - Number bet = 8x, size/colour = 1.9x
   - Win/loss popup auto-closes in 3s at period end
   - All users see same 20 rounds
══════════════════════════════════════════════════════ */

/* ─── Shared clock: same for every user/device/refresh ─── */
const GAME_PERIOD_MS = 60000;
const GAME_EPOCH     = 1700000000000;

function getSharedTimer(){
  const elapsed = (Date.now() - GAME_EPOCH) % GAME_PERIOD_MS;
  return Math.max(0, Math.floor((GAME_PERIOD_MS - elapsed) / 1000));
}
function getSharedPeriod(){
  return Math.floor((Date.now() - GAME_EPOCH) / GAME_PERIOD_MS);
}
function fmtPeriod(p){ return String(p).padStart(10,'0'); }

/* ─── Number colour/size mapping ─── */
const N_COLOUR = ['violet','green','red','green','red','violet','red','green','red','green'];
const N_SIZE   = n => n >= 6 ? 'big' : 'small';
const COL_HEX  = {green:'#22c55e', red:'#ef4444', violet:'#a855f7'};

/* ─── Deterministic result per period (same for all users) ─── */
const WIN_PAT = [1,1,0,0,1,1,1,0,0,1,0,1,0,0,1,1,0,1,0,0]; // 1=big,0=small
function resultForPeriod(p){
  const isBig = WIN_PAT[p % WIN_PAT.length] === 1;
  const pool  = isBig ? [6,7,8,9] : [0,1,2,3,4,5];
  const num   = pool[p % pool.length];
  return { num, colour: N_COLOUR[num], result: isBig ? 'big' : 'small' };
}

/* ─── State ─── */
const GAME = {
  timerInt:           null,
  displayTimer:       60,        // what we show (updates via rAF)
  lastDisplayPeriod:  -1,
  history:            [],        // shared 20 rounds
  betHistory:         [],        // user's permanent log
  bets:               [],        // ARRAY — multiple bets this round [{type,side,num,amt,mult}]
  betAmt:             10,
  lastResolvedPeriod: -1,
  resultAnimating:    false,
  showBetHistory:     false
};

/* ─── Storage: shared history (same key = same data for all users) ─── */
const SH_KEY = 'ww_gh_v6';
function loadShared(){
  try{ const s=JSON.parse(localStorage.getItem(SH_KEY)||'{}'); if(Array.isArray(s.h)) GAME.history=s.h.slice(0,20); }catch(e){}
}
function saveShared(){
  try{ localStorage.setItem(SH_KEY,JSON.stringify({h:GAME.history.slice(0,20)})); }catch(e){}
}

/* ─── Storage: per-user bets/history ─── */
function uKey(){ return 'ww_gu_'+(state.userEmail||'guest').replace(/[^a-z0-9]/gi,'_'); }
function loadUser(){
  try{
    const s=JSON.parse(localStorage.getItem(uKey())||'{}');
    if(Array.isArray(s.bh)) GAME.betHistory=s.bh;
    if(typeof s.lrp==='number') GAME.lastResolvedPeriod=s.lrp;
    if(Array.isArray(s.bets) && s.bp===getSharedPeriod()) GAME.bets=s.bets;
  }catch(e){}
}
function saveUser(){
  try{
    localStorage.setItem(uKey(),JSON.stringify({
      bh:GAME.betHistory, lrp:GAME.lastResolvedPeriod,
      bets:GAME.bets, bp:getSharedPeriod()
    }));
  }catch(e){}
}

/* Init */
loadShared(); loadUser();

/* ─── Timer ─── */
function stopGameTimer(){ clearInterval(GAME.timerInt); GAME.timerInt=null; }

function startGameTimer(){
  stopGameTimer();
  /* Poll every 200ms for snappy response */
  GAME.timerInt = setInterval(gameTick, 200);
  gameTick();
}

function gameTick(){
  const t   = getSharedTimer();
  const cur = getSharedPeriod();

  /* Update display */
  updateTimerUI(t);

  /* Detect period boundary: resolve when timer wraps back to 59-60 */
  if(cur !== GAME.lastResolvedPeriod && t >= 58){
    GAME.lastResolvedPeriod = cur;
    resolveGameRound(cur - 1);   // settle the period that just ended
  }
}

function updateTimerUI(t){
  const el = document.getElementById('gameTimerNum');
  if(!el) return;
  const isLow = t <= 10;
  el.textContent = String(Math.floor(t/60)).padStart(2,'0') + ':' + String(t%60).padStart(2,'0');
  el.style.color      = isLow ? '#ff4d6d' : '#00e5cc';
  el.style.textShadow = isLow ? '0 0 22px #ff4d6d' : '0 0 18px rgba(0,229,204,.8)';
  const card = document.getElementById('gameTimerCard');
  if(card) card.style.borderColor = isLow ? 'rgba(255,77,109,.95)' : 'rgba(255,77,109,.4)';
  const area = document.getElementById('gameBetArea');
  const lock = document.getElementById('gameLock');
  if(area){ area.style.opacity=isLow?'.32':'1'; area.style.pointerEvents=isLow?'none':'auto'; }
  if(lock) lock.style.display=isLow?'flex':'none';
}

/* ─── Resolve round ─── */
function resolveGameRound(period){
  if(GAME.resultAnimating) return;
  const {num, colour, result} = resultForPeriod(period);

  /* Push to shared history */
  GAME.history.unshift({period:fmtPeriod(period), num, result, colour});
  if(GAME.history.length>20) GAME.history.pop();
  saveShared();

  /* Settle all user bets for this period */
  let totalWin = 0, totalLost = 0, hadBet = false;
  const settledBets = [];

  GAME.bets.forEach(bet => {
    hadBet = true;
    let won = false;
    let payout = 0;
    if(bet.type === 'number'){
      won = bet.num === num;
      payout = won ? bet.amt * 8 : 0;
    } else {
      won = bet.side === result;
      payout = won ? Math.floor(bet.amt * 1.9) : 0;
    }
    if(won) { state.bal += payout; totalWin += payout; }
    else    { totalLost += bet.amt; }
    settledBets.push({...bet, won, payout, num, colour, result});
  });

  if(hadBet){
    /* Single portfolio entry summarising all bets */
    const netChange = totalWin - totalLost;
    state.txList.unshift({
      id:Date.now(), type: netChange>=0?'GAME WIN':'GAME LOSS',
      q:`Colour Prediction – ${result.toUpperCase()} (${num}) · ${GAME.bets.length} bet(s)`,
      amt: netChange>=0 ? `+₹${netChange}` : `-₹${Math.abs(netChange)}`,
      status: netChange>=0?'WON 🏆':'LOST ❌',
      time: new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})
    });
    /* Detailed bet history entry per bet */
    settledBets.forEach(b => {
      GAME.betHistory.unshift({
        period:fmtPeriod(period), type:b.type,
        side:b.side, betNum:b.num, amt:b.amt,
        num, colour, result, won:b.won, payout:b.payout,
        time:new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})
      });
    });
    if(GAME.betHistory.length>100) GAME.betHistory.length=100;
    LS.save(); updateBal();
  }

  GAME.bets = [];
  saveUser();

  /* Show popup ONLY when user placed bets this round */
  if(hadBet){
    const winMsg = {totalWin, totalLost, net:totalWin-totalLost, count:settledBets.length, num, colour, result};
    showGameResult(num, colour, result, winMsg);
  } else {
    /* No bets — silently refresh UI, no popup */
    renderGames();
  }
}

/* ─── Result popup — appended to <body> for true screen-center on Chrome Android ─── */
function showGameResult(num, colour, result, winMsg){
  GAME.resultAnimating = true;

  /* Always remove any stale popup first */
  const stale = document.getElementById('wwResultPop');
  if(stale) stale.remove();

  const ballCol  = COL_HEX[colour] || '#fff';
  const isWin    = winMsg.net >= 0;
  const accent   = isWin ? '#fb923c' : '#ef4444';
  const accentBg = isWin ? 'rgba(251,146,60,.15)' : 'rgba(239,68,68,.13)';
  const accentBdr= isWin ? 'rgba(251,146,60,.55)'  : 'rgba(239,68,68,.5)';
  const title    = isWin ? '🎉 CONGRATULATIONS!' : '😔 BETTER LUCK NEXT TIME';

  /*
   * CENTERING STRATEGY — Chrome Android safe:
   * position:fixed on an element DIRECTLY inside <body> (no transformed/overflow ancestor).
   * Use top:50% left:50% + translateX(-50%) translateY(-50%) on the CARD (not the backdrop)
   * so the card is always perfectly centred regardless of scroll or viewport quirks.
   */

  /* Backdrop — full screen, z-index 9999 */
  const backdrop = document.createElement('div');
  backdrop.id = 'wwResultPop';
  backdrop.style.cssText = [
    'position:fixed',
    'top:0','left:0',
    'width:100vw','height:100vh',
    'z-index:99999',
    'background:rgba(0,0,0,.87)',
    'backdrop-filter:blur(14px)',
    '-webkit-backdrop-filter:blur(14px)',
    'pointer-events:all'
  ].join(';');

  /* Card — translate-centred */
  const card = document.createElement('div');
  card.style.cssText = [
    'position:absolute',
    'top:50%','left:50%',
    'transform:translateX(-50%) translateY(-50%)',
    'width:min(88vw,320px)',
    `background:linear-gradient(145deg,rgba(8,12,30,.99),rgba(4,7,18,.99))`,
    `border:2.5px solid ${accent}`,
    'border-radius:30px',
    'padding:28px 22px 20px',
    'text-align:center',
    `box-shadow:0 0 70px ${accent}55,0 0 140px ${accent}1a,0 30px 70px rgba(0,0,0,.9)`,
    'animation:betCardPop .35s cubic-bezier(.16,1,.3,1) forwards',
    'overflow:hidden',
    'box-sizing:border-box'
  ].join(';');

  card.innerHTML = `
    <div style="position:absolute;top:0;left:0;right:0;height:2.5px;background:linear-gradient(90deg,transparent,${accent},transparent)"></div>
    <div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:rgba(255,255,255,.08);border-radius:0 0 30px 30px">
      <div id="gBarInner" style="height:100%;background:${accent};border-radius:inherit;width:100%;transition:width 3s linear"></div>
    </div>

    <div style="display:inline-block;padding:7px 18px;border-radius:50px;background:${accentBg};border:1.5px solid ${accentBdr};font-family:'Syne',sans-serif;font-weight:800;font-size:13px;color:${accent};letter-spacing:.5px;margin-bottom:14px">${title}</div>

    <div style="width:100px;height:100px;border-radius:50%;background:radial-gradient(circle at 33% 26%,rgba(255,255,255,.42),rgba(255,255,255,.12) 40%,transparent 62%),linear-gradient(145deg,${ballCol},${ballCol}88);border:3.5px solid ${ballCol};box-shadow:0 0 44px ${ballCol}aa,0 0 90px ${ballCol}44;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;font-family:'Oswald',sans-serif;font-weight:700;font-size:52px;color:#fff;text-shadow:0 2px 18px rgba(0,0,0,.65)">${num}</div>

    <div style="font-family:'Oswald',sans-serif;font-weight:700;font-size:24px;color:${ballCol};text-transform:uppercase;letter-spacing:3px;margin-bottom:2px">${result.toUpperCase()}</div>
    <div style="font-size:11px;color:rgba(255,255,255,.35);text-transform:capitalize;letter-spacing:1px;margin-bottom:14px">${colour}</div>

    <div style="padding:14px;border-radius:16px;background:${accentBg};border:2px solid ${accentBdr};margin-bottom:14px">
      <div style="font-family:'Oswald',sans-serif;font-weight:700;font-size:38px;color:${accent};letter-spacing:1px;line-height:1">${isWin?'+₹'+winMsg.net:'-₹'+Math.abs(winMsg.net)}</div>
      <div style="font-size:12px;color:rgba(255,255,255,.55);margin-top:6px;font-weight:700">${isWin?'🎉 You Won!':'💸 You Lost'} · ${winMsg.count} bet${winMsg.count>1?'s':''}</div>
      <div style="font-size:10px;color:rgba(255,255,255,.28);margin-top:3px">Won ₹${winMsg.totalWin} / Lost ₹${winMsg.totalLost}</div>
    </div>

    <div style="font-size:11px;color:rgba(255,255,255,.25);letter-spacing:.5px">Closing in <span id="gPopCount" style="color:${accent};font-weight:700">3</span>s</div>`;

  backdrop.appendChild(card);
  document.body.appendChild(backdrop);   /* direct child of <body> — no overflow/transform ancestors */

  /* Shrink progress bar over 3s */
  requestAnimationFrame(()=>{
    const bar = document.getElementById('gBarInner');
    if(bar) bar.style.width = '0%';
  });

  /* Countdown */
  let c = 3;
  const ci = setInterval(()=>{
    c--;
    const cn = document.getElementById('gPopCount');
    if(cn) cn.textContent = c;
    if(c <= 0){ clearInterval(ci); closeGameResult(); }
  }, 1000);

  /* Failsafe hard-close */
  setTimeout(()=>{ clearInterval(ci); closeGameResult(); }, 3400);
}

window.closeGameResult = function(){
  if(!GAME.resultAnimating) return;
  GAME.resultAnimating = false;
  const pop = document.getElementById('wwResultPop');
  if(pop) pop.remove();
  /* Also wipe the inline overlay inside page DOM */
  const ov = document.getElementById('gameResultOverlay');
  if(ov) ov.innerHTML = '';
  renderGames();
};

/* ─── Add a bet (multiple allowed) ─── */
function addBet(type, side, num, amt){
  if(GAME.resultAnimating){ showToast('Wait for next round','info'); return false; }
  if(getSharedTimer()<=10){ showToast('Betting closed — last 10 seconds!','info'); return false; }
  if(amt > state.bal){ showToast('Insufficient balance 💸','info'); return false; }
  state.bal -= amt;
  LS.save(); updateBal();
  GAME.bets.push({type, side, num, amt, mult: type==='number'?8:1.9});
  saveUser();
  return true;
}

/* ─── Bet sheet ─── */
function openBetSheet(type, side, num){
  if(GAME.resultAnimating){ showToast('Wait for next round','info'); return; }
  if(getSharedTimer()<=10){ showToast('Betting closed!','info'); return; }

  const isNum  = type==='number';
  const numCol = isNum ? (COL_HEX[N_COLOUR[num]]||'#fff') : null;
  const sCol   = isNum ? '#ffd700' : (side==='big' ? '#fb923c' : '#60a5fa');
  const sBg    = isNum ? 'rgba(255,215,0,.14)' : (side==='big'?'rgba(251,146,60,.14)':'rgba(96,165,250,.14)');
  const sBdr   = isNum ? 'rgba(255,215,0,.5)'  : (side==='big'?'rgba(251,146,60,.5)' :'rgba(96,165,250,.5)');
  const mult   = isNum ? 8 : 1.9;
  const label  = isNum ? `Number ${num} · 8×` : (side==='big'?'BIG · 1.9×':'SMALL · 1.9×');

  const ex=document.getElementById('gameBetSheet'); if(ex) ex.remove();
  const sheet=document.createElement('div');
  sheet.id='gameBetSheet';
  sheet.style.cssText='position:fixed;inset:0;z-index:1100;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.75);backdrop-filter:blur(8px)';

  sheet.innerHTML=`
  <div style="background:linear-gradient(180deg,rgba(8,12,28,.99),rgba(4,7,18,.99));border:1.5px solid ${sBdr};border-bottom:none;border-radius:26px 26px 0 0;padding:20px 18px 34px;width:100%;max-width:480px;box-shadow:0 -24px 60px rgba(0,0,0,.7);animation:slideUp .3s cubic-bezier(.16,1,.3,1) forwards;position:relative">
    <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,${sCol},transparent);border-radius:26px 26px 0 0"></div>
    <div style="width:40px;height:4px;background:rgba(255,255,255,.14);border-radius:2px;margin:0 auto 16px"></div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:10px">
        ${isNum?`<div style="width:42px;height:42px;border-radius:50%;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.3),transparent 55%),${numCol};border:2px solid ${numCol};display:flex;align-items:center;justify-content:center;font-family:'Oswald',sans-serif;font-weight:700;font-size:20px;color:#fff">${num}</div>`:''}
        <div>
          <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:17px;color:#fff">Place Bet</div>
          <div style="font-size:12px;font-weight:700;color:${sCol};margin-top:2px">${label}</div>
        </div>
      </div>
      <div id="sheetTimer" style="padding:6px 14px;border-radius:50px;background:${sBg};border:1.5px solid ${sBdr};font-family:'Oswald',sans-serif;font-weight:700;font-size:14px;color:${sCol}">⏱ ${String(Math.floor(getSharedTimer()/60)).padStart(2,'0')}:${String(getSharedTimer()%60).padStart(2,'0')}</div>
    </div>

    <!-- Pending bets summary -->
    ${GAME.bets.length>0?`<div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px 12px;margin-bottom:12px;font-size:12px;color:rgba(255,255,255,.5)">${GAME.bets.length} bet${GAME.bets.length>1?'s':''} placed this round · ₹${GAME.bets.reduce((s,b)=>s+b.amt,0)} total</div>`:''}

    <!-- Chips -->
    <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px">
      ${[10,50,100,500,1000].map(a=>`<button onclick="setGameBetAmt(${a})" data-amt="${a}" class="gbs-chip" style="padding:8px 14px;border-radius:50px;background:${GAME.betAmt===a?sBg:'rgba(255,255,255,.05)'};border:1.5px solid ${GAME.betAmt===a?sBdr:'rgba(255,255,255,.1)'};color:${GAME.betAmt===a?sCol:'#94a3b8'};font-weight:700;font-size:12px;cursor:pointer;transition:all .18s">₹${a>=1000?'1K':a}</button>`).join('')}
    </div>

    <!-- Manual input -->
    <div style="margin-bottom:12px">
      <div style="font-size:10px;color:rgba(255,255,255,.28);font-weight:700;letter-spacing:1.5px;margin-bottom:7px">OR TYPE AMOUNT</div>
      <input id="gBetInp" type="number" min="1" placeholder="₹ Enter amount" value="${GAME.betAmt}"
        style="width:100%;background:rgba(0,0,0,.45);border:1.5px solid ${sBdr};border-radius:14px;padding:14px;color:#fff;font-size:26px;font-weight:700;text-align:center;outline:none;font-family:'Oswald',sans-serif;letter-spacing:2px"/>
    </div>

    <!-- Payout row -->
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:rgba(255,255,255,.04);border-radius:12px;border:1px solid rgba(255,255,255,.07);margin-bottom:14px">
      <div><div style="font-size:11px;color:rgba(255,255,255,.4);font-weight:600">Potential Win (${mult}×)</div><div style="font-size:10px;color:rgba(255,255,255,.22);margin-top:2px">${isNum?'Exact number match':'Correct side'}</div></div>
      <span id="gPayLbl" style="font-family:'Oswald',sans-serif;font-weight:700;font-size:22px;color:#22c55e">₹${isNum?GAME.betAmt*8:Math.floor(GAME.betAmt*1.9)}</span>
    </div>

    <button id="gConfBtn" onclick="confirmGameBet('${type}','${side}',${num===null?'null':num})" style="width:100%;padding:16px;border-radius:50px;background:linear-gradient(145deg,${sCol}55,${sCol}33);border:2px solid ${sCol};color:${sCol};font-weight:800;font-size:15px;cursor:pointer;letter-spacing:.8px;box-shadow:0 0 26px ${sCol}44;margin-bottom:10px">
      + Add Bet — ₹${GAME.betAmt}
    </button>
    <button onclick="document.getElementById('gameBetSheet')?.remove()" style="width:100%;padding:11px;border-radius:50px;background:transparent;border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.28);font-weight:700;font-size:13px;cursor:pointer">Close</button>
  </div>`;

  /* Input live update */
  const inp=sheet.querySelector('#gBetInp');
  inp.addEventListener('input',function(){
    const v=Math.max(1,parseInt(this.value)||1);
    GAME.betAmt=v;
    const pl=document.getElementById('gPayLbl'); if(pl) pl.textContent='₹'+(isNum?v*8:Math.floor(v*1.9));
    const cb=document.getElementById('gConfBtn'); if(cb) cb.textContent=`+ Add Bet — ₹${v}`;
    document.querySelectorAll('.gbs-chip').forEach(c=>{c.style.background='rgba(255,255,255,.05)';c.style.borderColor='rgba(255,255,255,.1)';c.style.color='#94a3b8';});
  });

  /* Live countdown in sheet */
  const sti=setInterval(()=>{
    const b=document.getElementById('sheetTimer'); if(!b){clearInterval(sti);return;}
    const tt=getSharedTimer();
    b.textContent=`⏱ ${String(Math.floor(tt/60)).padStart(2,'0')}:${String(tt%60).padStart(2,'0')}`;
    if(tt<=10){clearInterval(sti);b.style.color='#ff4d6d';sheet.remove();showToast('Betting closed!','info');}
  },400);

  document.body.appendChild(sheet);
  sheet.addEventListener('click',e=>{if(e.target===sheet){clearInterval(sti);sheet.remove();}});
}

window.confirmGameBet = function(type, side, num){
  const inp=document.getElementById('gBetInp');
  if(inp) GAME.betAmt=Math.max(1,parseInt(inp.value)||GAME.betAmt);
  const amt=GAME.betAmt;
  const numVal = (num===null||num==='null'||num===undefined) ? null : parseInt(num);
  if(addBet(type, side, numVal, amt)){
    showToast(`✅ ₹${amt} on ${type==='number'?'No.'+numVal:side.toUpperCase()} added!`);

    /* ── Slide the sheet DOWN and remove it ── */
    const sheet = document.getElementById('gameBetSheet');
    if(sheet){
      const inner = sheet.querySelector('div');
      if(inner){
        inner.style.transition = 'transform .28s cubic-bezier(.4,0,1,1)';
        inner.style.transform  = 'translateY(110%)';
      }
      setTimeout(()=> sheet.remove(), 300);
    }

    /* ── Immediately update the "active bets" summary on the game page ── */
    updateGameBetSummary();
  }
};

/* Patch the bets summary + lock bar in-place without full renderGames() */
function updateGameBetSummary(){
  const totalBetAmt = GAME.bets.reduce((s,b)=>s+b.amt,0);

  /* Bets summary inside timer card */
  const sumEl = document.getElementById('gameBetSummary');
  if(sumEl && GAME.bets.length > 0){
    sumEl.innerHTML = `
      <div style="margin-top:12px;padding:10px 14px;background:rgba(255,215,0,.07);border-radius:12px;border:1px solid rgba(255,215,0,.22)">
        <div style="font-size:10px;color:rgba(255,215,0,.7);font-weight:700;letter-spacing:1px;margin-bottom:6px">${GAME.bets.length} BET${GAME.bets.length>1?'S':''} PLACED · ₹${totalBetAmt} TOTAL</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px">
          ${GAME.bets.map(b=>`<div style="padding:4px 10px;border-radius:50px;background:${b.type==='number'?'rgba(255,215,0,.12)':b.side==='big'?'rgba(251,146,60,.12)':'rgba(96,165,250,.12)'};border:1px solid ${b.type==='number'?'rgba(255,215,0,.3)':b.side==='big'?'rgba(251,146,60,.3)':'rgba(96,165,250,.3)'};font-size:11px;font-weight:700;color:${b.type==='number'?'#ffd700':b.side==='big'?'#fb923c':'#60a5fa'}">${b.type==='number'?'No.'+b.num:b.side.toUpperCase()} ₹${b.amt}</div>`).join('')}
        </div>
      </div>`;
    sumEl.style.display = '';
  }
}

window.setGameBetAmt = function(amt){
  GAME.betAmt=amt;
  const isNum=GAME.bets.length>0&&false; // chips always neutral after set
  document.querySelectorAll('.gbs-chip').forEach(el=>{
    const a=parseInt(el.dataset.amt),active=a===amt;
    el.style.background =active?'rgba(251,146,60,.14)':'rgba(255,255,255,.05)';
    el.style.borderColor=active?'rgba(251,146,60,.5)':'rgba(255,255,255,.1)';
    el.style.color      =active?'#fb923c':'#94a3b8';
  });
  const inp=document.getElementById('gBetInp'); if(inp) inp.value=amt;
  /* determine current mult from sheet context */
  const pl=document.getElementById('gPayLbl');
  const cb=document.getElementById('gConfBtn');
  /* Check if number bet by inspecting confirm button */
  if(pl) pl.textContent='₹'+amt; // updated by sheet re-open
  if(cb) cb.textContent=`+ Add Bet — ₹${amt}`;
};

/* Entry points */
function placeBetGame(side)    { openBetSheet('size', side, null); }
function placeBetOnNumber(n)   { openBetSheet('number', N_SIZE(n), n); }

/* ─── Render ─── */
function renderGames(){
  const el=document.getElementById('pageGames');
  if(!el) return;
  const t      = getSharedTimer();
  const isLow  = t <= 10;
  const cur    = getSharedPeriod();
  const totalBetAmt = GAME.bets.reduce((s,b)=>s+b.amt,0);

  /* BET HISTORY VIEW */
  if(GAME.showBetHistory){
    el.innerHTML=`
    <div style="padding:14px 14px 100px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
        <button onclick="GAME.showBetHistory=false;renderGames()" style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:10px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;font-size:18px;flex-shrink:0">←</button>
        <div><div style="font-family:'Syne',sans-serif;font-weight:800;font-size:18px;color:#fff">Bet History</div><div style="font-size:10px;color:rgba(255,77,109,.7);font-weight:700;letter-spacing:1px">SAVED PERMANENTLY · ${GAME.betHistory.length} BETS</div></div>
      </div>
      ${GAME.betHistory.length===0
        ?`<div style="text-align:center;padding:60px 20px;color:#475569"><div style="font-size:40px;margin-bottom:12px">🎮</div><div style="font-size:14px;font-weight:600">No bets yet</div></div>`
        :GAME.betHistory.map(b=>`
          <div style="background:linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018));border:1px solid ${b.won?'rgba(251,146,60,.25)':'rgba(239,68,68,.2)'};border-radius:14px;padding:13px;margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span style="font-family:'Oswald',sans-serif;font-size:11px;color:rgba(255,255,255,.35)">Period ${b.period}</span>
              <span style="font-size:10px;color:rgba(255,255,255,.3)">${b.time}</span>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div style="display:flex;align-items:center;gap:10px">
                <div style="width:36px;height:36px;border-radius:50%;background:${COL_HEX[b.colour]};border:2px solid ${COL_HEX[b.colour]};display:flex;align-items:center;justify-content:center;font-family:'Oswald',sans-serif;font-weight:700;font-size:16px;color:#fff;box-shadow:0 0 12px ${COL_HEX[b.colour]}55">${b.num}</div>
                <div>
                  <div style="font-family:'Oswald',sans-serif;font-weight:700;font-size:13px;color:${b.type==='number'?'#ffd700':b.side==='big'?'#fb923c':'#60a5fa'}">${b.type==='number'?'No.'+b.betNum+' (8×)':b.side.toUpperCase()+' (1.9×)'}</div>
                  <div style="font-size:11px;color:rgba(255,255,255,.38);margin-top:1px">Result: <strong style="color:${b.result==='big'?'#fb923c':'#60a5fa'}">${b.result.toUpperCase()} (${b.num})</strong></div>
                </div>
              </div>
              <div style="text-align:right">
                <div style="font-family:'Oswald',sans-serif;font-weight:700;font-size:16px;color:${b.won?'#fb923c':'#ef4444'}">${b.won?'+₹'+b.payout:'-₹'+b.amt}</div>
                <div style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:50px;background:${b.won?'rgba(251,146,60,.12)':'rgba(239,68,68,.1)'};border:1px solid ${b.won?'rgba(251,146,60,.3)':'rgba(239,68,68,.25)'};color:${b.won?'#fb923c':'#ef4444'};margin-top:3px;display:inline-block">${b.won?'WON':'LOST'}</div>
              </div>
            </div>
          </div>`).join('')
      }
    </div>`;
    return;
  }

  /* MAIN GAME VIEW */
  el.innerHTML=`
  <div style="padding:14px 14px 100px;min-height:100vh">

    <!-- Header -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
      <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,rgba(255,77,109,.2),rgba(255,77,109,.08));border:1.5px solid rgba(255,77,109,.5);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="3" stroke="#ff4d6d" stroke-width="2"/><circle cx="8" cy="14" r="1.8" fill="#ff4d6d"/><circle cx="16" cy="14" r="1.8" fill="#ff4d6d"/><path d="M12 2v5" stroke="#ff4d6d" stroke-width="2" stroke-linecap="round"/></svg>
      </div>
      <div>
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:18px;color:#fff">Colour Prediction</div>
        <div style="font-size:10px;color:rgba(255,77,109,.7);font-weight:700;letter-spacing:1px">WIN GO · 60 SEC</div>
      </div>
      <div style="margin-left:auto;display:flex;align-items:center;gap:5px;font-family:'Oswald',sans-serif;font-weight:800;font-size:12px;color:#ff1a1a;background:rgba(255,26,26,.13);border:1.5px solid rgba(255,26,26,.55);padding:5px 13px;border-radius:50px;text-shadow:0 0 10px rgba(255,26,26,.9);box-shadow:0 0 16px rgba(255,26,26,.28)">
        <span style="width:7px;height:7px;border-radius:50%;background:#ff1a1a;animation:liveDot 1s infinite;display:inline-block;box-shadow:0 0 8px #ff1a1a"></span>LIVE
      </div>
    </div>

    <!-- Timer Card -->
    <div id="gameTimerCard" style="background:linear-gradient(135deg,rgba(255,77,109,.1),rgba(12,8,28,.97));border:1.5px solid ${isLow?'rgba(255,77,109,.95)':'rgba(255,77,109,.4)'};border-radius:20px;padding:16px;margin-bottom:12px;position:relative;overflow:hidden;transition:border-color .2s">
      <div style="position:absolute;top:0;left:0;right:0;height:1.5px;background:linear-gradient(90deg,transparent,rgba(255,77,109,.9),transparent)"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
        <div>
          <div style="font-size:9px;color:rgba(255,255,255,.3);font-weight:700;letter-spacing:1.5px;margin-bottom:2px">PERIOD</div>
          <div style="font-family:'Oswald',sans-serif;font-size:11px;color:rgba(255,255,255,.38);margin-bottom:6px">${fmtPeriod(cur)}</div>
          <div style="font-size:9px;color:rgba(255,255,255,.3);font-weight:700;letter-spacing:1.5px;margin-bottom:4px">TIME REMAINING</div>
          <div id="gameTimerNum" style="font-family:'Oswald',sans-serif;font-weight:700;font-size:52px;color:${isLow?'#ff4d6d':'#00e5cc'};letter-spacing:3px;line-height:1;text-shadow:0 0 20px ${isLow?'#ff4d6d':'rgba(0,229,204,.8)'}">${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:9px;color:rgba(255,255,255,.3);font-weight:700;letter-spacing:1px;margin-bottom:8px">LAST RESULTS</div>
          <div style="display:flex;gap:5px;justify-content:flex-end;flex-wrap:wrap;max-width:155px">
            ${GAME.history.slice(0,6).map(h=>`<div style="width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.3),transparent 55%),${COL_HEX[h.colour]};border:2px solid ${COL_HEX[h.colour]};display:flex;align-items:center;justify-content:center;font-family:'Oswald',sans-serif;font-weight:700;font-size:13px;color:#fff;box-shadow:0 0 10px ${COL_HEX[h.colour]}66">${h.num}</div>`).join('')||`<span style="font-size:11px;color:rgba(255,255,255,.2)">—</span>`}
          </div>
          <div style="margin-top:5px;display:flex;gap:4px;justify-content:flex-end">
            ${GAME.history.slice(0,6).map(h=>`<span style="font-size:9px;font-weight:700;color:${h.result==='big'?'#fb923c':'#60a5fa'}">${h.result==='big'?'B':'S'}</span>`).join('')}
          </div>
        </div>
      </div>

      <!-- Active bets summary — id allows in-place update after bet confirm -->
      <div id="gameBetSummary" style="${GAME.bets.length===0?'display:none':''}">
      ${GAME.bets.length>0?`
      <div style="margin-top:12px;padding:10px 14px;background:rgba(255,215,0,.07);border-radius:12px;border:1px solid rgba(255,215,0,.22)">
        <div style="font-size:10px;color:rgba(255,215,0,.7);font-weight:700;letter-spacing:1px;margin-bottom:6px">${GAME.bets.length} BET${GAME.bets.length>1?'S':''} PLACED · ₹${totalBetAmt} TOTAL</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px">
          ${GAME.bets.map(b=>`<div style="padding:4px 10px;border-radius:50px;background:${b.type==='number'?'rgba(255,215,0,.12)':b.side==='big'?'rgba(251,146,60,.12)':'rgba(96,165,250,.12)'};border:1px solid ${b.type==='number'?'rgba(255,215,0,.3)':b.side==='big'?'rgba(251,146,60,.3)':'rgba(96,165,250,.3)'};font-size:11px;font-weight:700;color:${b.type==='number'?'#ffd700':b.side==='big'?'#fb923c':'#60a5fa'}">${b.type==='number'?'No.'+b.num:b.side.toUpperCase()} ₹${b.amt}</div>`).join('')}
        </div>
      </div>`:''}
      </div>
      ${isLow?`<div style="margin-top:10px;padding:8px 14px;background:rgba(255,77,109,.12);border-radius:10px;border:1px solid rgba(255,77,109,.35);text-align:center;font-size:12px;font-weight:700;color:#ff4d6d">🔒 Betting closed — last 10 seconds</div>`:''}
    </div>

    <!-- Bet area -->
    <div id="gameBetArea" style="opacity:${isLow?.32:1};pointer-events:${isLow?'none':'auto'};transition:opacity .25s">

      <!-- Colour buttons -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
        <button onclick="placeBetGame('small')" style="padding:15px 0;border-radius:14px;background:linear-gradient(145deg,rgba(34,197,94,.18),rgba(34,197,94,.06));border:1.5px solid rgba(34,197,94,.6);color:#22c55e;font-weight:800;font-size:14px;cursor:pointer;box-shadow:0 0 14px rgba(34,197,94,.18)">Green<div style="font-size:9px;opacity:.55;margin-top:2px">1.9×</div></button>
        <button onclick="placeBetGame('small')" style="padding:15px 0;border-radius:14px;background:linear-gradient(145deg,rgba(168,85,247,.18),rgba(168,85,247,.06));border:1.5px solid rgba(168,85,247,.6);color:#a855f7;font-weight:800;font-size:14px;cursor:pointer;box-shadow:0 0 14px rgba(168,85,247,.18)">Violet<div style="font-size:9px;opacity:.55;margin-top:2px">1.9×</div></button>
        <button onclick="placeBetGame('big')" style="padding:15px 0;border-radius:14px;background:linear-gradient(145deg,rgba(239,68,68,.18),rgba(239,68,68,.06));border:1.5px solid rgba(239,68,68,.6);color:#ef4444;font-weight:800;font-size:14px;cursor:pointer;box-shadow:0 0 14px rgba(239,68,68,.18)">Red<div style="font-size:9px;opacity:.55;margin-top:2px">1.9×</div></button>
      </div>

      <!-- Number Grid 8× -->
      <div style="background:rgba(255,215,0,.04);border:1px solid rgba(255,215,0,.18);border-radius:16px;padding:10px;margin-bottom:10px">
        <div style="font-size:9px;color:rgba(255,215,0,.65);font-weight:700;letter-spacing:1.5px;text-align:center;margin-bottom:8px">🎯 NUMBER BET — EXACT MATCH = 8× PAYOUT</div>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px">
          ${[0,1,2,3,4,5,6,7,8,9].map(n=>{
            const col=n===0||n===5?'#a855f7':n%2===0?'#ef4444':'#22c55e';
            const bdr=n===0||n===5?'rgba(168,85,247,.65)':n%2===0?'rgba(239,68,68,.6)':'rgba(34,197,94,.6)';
            return `<button onclick="placeBetOnNumber(${n})" style="height:58px;border-radius:50%;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.25),rgba(255,255,255,.08) 44%,transparent 64%),linear-gradient(145deg,${col}55,${col}22);border:2.5px solid ${bdr};color:${col};font-family:'Oswald',sans-serif;font-weight:700;font-size:21px;cursor:pointer;box-shadow:0 0 14px ${col}44;display:flex;align-items:center;justify-content:center;width:100%">${n}</button>`;
          }).join('')}
        </div>
      </div>

      <!-- Big / Small + amount chips -->
      <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:12px;margin-bottom:10px">
        <div style="font-size:9px;color:rgba(255,255,255,.28);font-weight:700;letter-spacing:1.5px;margin-bottom:10px">BET AMOUNT (tap to change)</div>
        <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px">
          ${[10,50,100,500,1000].map(a=>`<button class="game-chip ${GAME.betAmt===a?'active':''}" data-amt="${a}" onclick="GAME.betAmt=${a};document.querySelectorAll('.game-chip').forEach(c=>c.classList.toggle('active',parseInt(c.dataset.amt)===${a}))" style="padding:8px 14px;border-radius:50px;background:${GAME.betAmt===a?'rgba(255,77,109,.18)':'rgba(255,255,255,.05)'};border:1.5px solid ${GAME.betAmt===a?'rgba(255,77,109,.7)':'rgba(255,255,255,.1)'};color:${GAME.betAmt===a?'#ff4d6d':'#94a3b8'};font-weight:700;font-size:12px;cursor:pointer;transition:all .18s">₹${a>=1000?'1K':a}</button>`).join('')}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <button onclick="placeBetGame('small')" style="padding:17px 10px;border-radius:16px;background:linear-gradient(145deg,rgba(96,165,250,.2),rgba(96,165,250,.07));border:2px solid rgba(96,165,250,.7);color:#60a5fa;font-weight:800;font-size:16px;cursor:pointer;box-shadow:0 0 18px rgba(96,165,250,.2)">
            <div>SMALL</div><div style="font-size:10px;opacity:.5;margin-top:3px">0–5 · 1.9×</div>
          </button>
          <button onclick="placeBetGame('big')" style="padding:17px 10px;border-radius:16px;background:linear-gradient(145deg,rgba(251,146,60,.2),rgba(251,146,60,.07));border:2px solid rgba(251,146,60,.7);color:#fb923c;font-weight:800;font-size:16px;cursor:pointer;box-shadow:0 0 18px rgba(251,146,60,.2)">
            <div>BIG</div><div style="font-size:10px;opacity:.5;margin-top:3px">6–9 · 1.9×</div>
          </button>
        </div>
      </div>
    </div>

    <div id="gameLock" style="display:${isLow?'flex':'none'};align-items:center;justify-content:center;gap:8px;padding:14px;background:rgba(255,77,109,.1);border:1.5px solid rgba(255,77,109,.35);border-radius:14px;margin-bottom:12px;font-size:13px;font-weight:700;color:#ff4d6d">🔒 Betting closed — last 10 seconds</div>

    <!-- Bet History button -->
    <button onclick="GAME.showBetHistory=true;renderGames()" style="width:100%;padding:14px;border-radius:16px;background:rgba(255,215,0,.06);border:1.5px solid rgba(255,215,0,.3);color:#ffd700;font-weight:700;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:14px;letter-spacing:.3px">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 8V12L15 15" stroke="#ffd700" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="9" stroke="#ffd700" stroke-width="2"/></svg>
      My Bet History (${GAME.betHistory.length} bets)
    </button>

    <!-- ✦ LEDGER BOOK TRIGGER ✦ -->
    <div id="betLedgerTrigger" onclick="toggleLedger()" role="button" aria-label="Open Bet History Ledger">
      <div class="ledger-book-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="14" height="18" rx="2" fill="rgba(180,140,60,.15)" stroke="rgba(180,140,60,.8)" stroke-width="1.5"/>
          <line x1="7" y1="8" x2="13" y2="8" stroke="rgba(180,140,60,.7)" stroke-width="1.2" stroke-linecap="round"/>
          <line x1="7" y1="11" x2="13" y2="11" stroke="rgba(180,140,60,.7)" stroke-width="1.2" stroke-linecap="round"/>
          <line x1="7" y1="14" x2="11" y2="14" stroke="rgba(180,140,60,.7)" stroke-width="1.2" stroke-linecap="round"/>
          <rect x="15" y="5" width="6" height="14" rx="1" fill="rgba(140,100,30,.3)" stroke="rgba(180,140,60,.5)" stroke-width="1"/>
        </svg>
      </div>
      <div class="ledger-trigger-text">
        <div class="ledger-trigger-title">My Bet History</div>
        <div class="ledger-trigger-sub">Tap to open ledger · last 10 rounds &amp; bets</div>
      </div>
      <div class="ledger-arrow">▲</div>
    </div>

    <!-- Last 20 rounds -->
    <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:14px">
      <div style="font-size:10px;color:rgba(255,255,255,.3);font-weight:700;letter-spacing:1.5px;margin-bottom:12px">LAST 20 ROUNDS · SAME FOR ALL USERS</div>
      ${GAME.history.length===0
        ?`<div style="text-align:center;color:#475569;padding:24px;font-size:13px">Waiting for first round…</div>`
        :`<div style="display:grid;grid-template-columns:auto 1fr auto auto;gap:10px;font-size:9px;color:rgba(255,255,255,.22);font-weight:700;letter-spacing:.8px;padding:0 4px 8px;border-bottom:1px solid rgba(255,255,255,.05);margin-bottom:4px"><span>#</span><span>PERIOD</span><span style="text-align:center">NO.</span><span style="text-align:right">RESULT</span></div>`+
        GAME.history.slice(0,20).map((h,i)=>`
          <div style="display:grid;grid-template-columns:auto 1fr auto auto;gap:10px;align-items:center;padding:9px 4px;border-bottom:1px solid rgba(255,255,255,.04)">
            <div style="font-size:10px;color:rgba(255,255,255,.18);font-family:'Oswald',sans-serif">${i+1}</div>
            <div style="font-size:11px;color:rgba(255,255,255,.35);font-family:'Oswald',sans-serif">${h.period}</div>
            <div style="width:32px;height:32px;border-radius:50%;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.28),transparent 55%),${COL_HEX[h.colour]};border:2px solid ${COL_HEX[h.colour]};display:flex;align-items:center;justify-content:center;font-family:'Oswald',sans-serif;font-weight:700;font-size:15px;color:#fff;box-shadow:0 0 10px ${COL_HEX[h.colour]}55">${h.num}</div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px">
              <div style="font-family:'Oswald',sans-serif;font-weight:700;font-size:13px;color:${h.result==='big'?'#fb923c':'#60a5fa'}">${h.result.toUpperCase()}</div>
              <div style="font-size:9px;color:${COL_HEX[h.colour]};font-weight:700;text-transform:capitalize">${h.colour}</div>
            </div>
          </div>`).join('')
      }
    </div>

  </div>
  <div id="gameResultOverlay"></div>`;

  if(!GAME.timerInt) startGameTimer();
}

/* ── RESIZE: debounced setBetsHeight ── */
let _resizeTimer;
window.addEventListener('resize',()=>{
  clearTimeout(_resizeTimer);
  _resizeTimer=setTimeout(setBetsHeight,120);
},{passive:true});

/* ═══════════════════════════════════════════════
   BET HISTORY LEDGER BOOK
═══════════════════════════════════════════════ */
(function(){
  let ledgerOpen = false;
  let ledgerTab  = 'game'; // 'game' | 'mybets'
  let animRows   = false;

  function createLedgerDOM(){
    /* backdrop */
    const bd = document.createElement('div');
    bd.id = 'betLedgerBackdrop';
    bd.onclick = closeLedger;
    document.body.appendChild(bd);

    /* panel */
    const panel = document.createElement('div');
    panel.id = 'betLedgerPanel';
    panel.innerHTML = `
      <div class="ledger-header">
        <div class="ledger-header-top">
          <div class="ledger-title">📖 Bet History Ledger</div>
          <div class="ledger-close-btn" onclick="closeLedger()">✕</div>
        </div>
        <div class="ledger-rings">
          <div class="ledger-ring"></div>
          <div class="ledger-ring"></div>
          <div class="ledger-ring"></div>
          <div class="ledger-ring"></div>
          <div class="ledger-ring"></div>
        </div>
        <div class="ledger-tabs">
          <button class="ledger-tab active" id="ltab-game" onclick="switchLedgerTab('game')">🎲 Game Rounds</button>
          <button class="ledger-tab" id="ltab-mybets" onclick="switchLedgerTab('mybets')">📝 My Bets</button>
        </div>
      </div>
      <div class="ledger-content" id="ledgerContent"></div>
    `;
    document.body.appendChild(panel);
  }

  function renderLedgerContent(){
    const el = document.getElementById('ledgerContent');
    if(!el) return;
    animRows = true;

    if(ledgerTab === 'game'){
      const rows = GAME.history.slice(0,10);
      if(rows.length === 0){
        el.innerHTML = `<div class="ledger-empty">✍️ No rounds yet...<br>Waiting for first result</div>`;
        return;
      }
      el.innerHTML = `
        <div class="ledger-col-header">
          <span>#</span><span>Period</span><span style="text-align:center">No.</span><span style="text-align:right">Result</span>
        </div>
        ${rows.map((h,i) => {
          const colHex = COL_HEX[h.colour]||'#888';
          return `
          <div class="ledger-row" style="animation-delay:${i*40}ms">
            <div class="ledger-row-num">${i+1}.</div>
            <div class="ledger-row-period">
              ${h.period.slice(-6)}
              <small>${h.colour}</small>
            </div>
            <div style="display:flex;justify-content:center">
              <div class="ledger-ball" style="background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.32),transparent 55%),${colHex};border:2px solid ${colHex};box-shadow:0 0 10px ${colHex}55,0 2px 8px rgba(0,0,0,.5),inset 0 -2px 4px rgba(0,0,0,.3)">${h.num}</div>
            </div>
            <div class="ledger-result-wrap">
              <div class="ledger-result-text" style="color:${h.result==='big'?'#fb923c':'#60a5fa'}">${h.result.toUpperCase()}</div>
              <div class="ledger-result-colour" style="color:${colHex}">${h.colour}</div>
            </div>
          </div>`;
        }).join('')}
        <div class="ledger-divider"></div>
        <div style="text-align:center;padding:10px;font-family:'Caveat',cursive;font-size:13px;color:rgba(180,140,60,.4)">~ Last 10 rounds ~</div>
      `;
    } else {
      /* My Bets tab */
      const bets = GAME.betHistory.slice(0,10);
      if(bets.length === 0){
        el.innerHTML = `<div class="ledger-empty">✍️ No bets placed yet...<br>Place your first bet!</div>`;
        return;
      }
      el.innerHTML = `
        <div class="ledger-col-header" style="grid-template-columns:40px 1fr 70px 70px">
          <span>#</span><span>Bet</span><span style="text-align:right">Amount</span><span style="text-align:right">Result</span>
        </div>
        ${bets.map((b,i) => {
          const colHex = COL_HEX[b.colour]||'#888';
          const typeLabel = b.type==='number' ? `No.${b.betNum} (8×)` : (b.side||'').toUpperCase()+' (1.9×)';
          const typeColor = b.type==='number' ? '#d4a855' : (b.side==='big'?'#fb923c':'#60a5fa');
          const stampCls  = b.won ? 'won' : 'lost';
          const stampTxt  = b.won ? 'WON' : 'LOST';
          const payout    = b.won ? `+₹${b.payout}` : `-₹${b.amt}`;
          const payColor  = b.won ? '#22c55e' : '#ef4444';
          return `
          <div class="ledger-row ledger-row-bet" style="animation-delay:${i*45}ms">
            <div class="ledger-row-num">${i+1}.</div>
            <div>
              <div class="ledger-bet-type" style="color:${typeColor}">${typeLabel}</div>
              <div style="font-family:'Caveat',cursive;font-size:12px;color:rgba(180,140,60,.45)">Period ${(b.period||'').slice(-6)}</div>
            </div>
            <div class="ledger-bet-amt">₹${b.amt}</div>
            <div class="ledger-payout" style="color:${payColor}">
              ${payout}
              <div class="ledger-stamp ${stampCls}" style="position:relative;right:auto;top:auto;transform:rotate(-5deg);display:inline-block;margin-top:2px">${stampTxt}</div>
            </div>
          </div>`;
        }).join('')}
        <div class="ledger-divider"></div>
        <div style="text-align:center;padding:10px;font-family:'Caveat',cursive;font-size:13px;color:rgba(180,140,60,.4)">~ Last 10 bets ~</div>
      `;
    }
  }

  window.openLedger = function(){
    if(!document.getElementById('betLedgerPanel')) createLedgerDOM();
    ledgerOpen = true;
    renderLedgerContent();
    document.getElementById('betLedgerBackdrop').classList.add('open');
    requestAnimationFrame(()=>{
      document.getElementById('betLedgerPanel').classList.add('open');
    });
    const trig = document.getElementById('betLedgerTrigger');
    if(trig) trig.classList.add('open');
  };

  window.closeLedger = function(){
    ledgerOpen = false;
    const panel = document.getElementById('betLedgerPanel');
    const bd    = document.getElementById('betLedgerBackdrop');
    const trig  = document.getElementById('betLedgerTrigger');
    if(panel) panel.classList.remove('open');
    if(bd)    bd.classList.remove('open');
    if(trig)  trig.classList.remove('open');
  };

  window.switchLedgerTab = function(tab){
    ledgerTab = tab;
    document.querySelectorAll('.ledger-tab').forEach(el=>{
      el.classList.toggle('active', el.id === 'ltab-'+tab);
    });
    renderLedgerContent();
  };

  window.toggleLedger = function(){
    if(ledgerOpen) closeLedger(); else openLedger();
  };

  /* Refresh ledger content live if open */
  const _origResolve = window.resolveGameRound;
  const origRender   = window.renderGames;
  setInterval(()=>{
    if(ledgerOpen) renderLedgerContent();
  }, 2000);

})();

init();
