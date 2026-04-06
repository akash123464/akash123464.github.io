/* ═══════════════════════════════════════
   WISHWORK – script.js
   Fixes:
   1. Per-user localStorage (keyed by email)
   2. Admin bet approval → portfolio WON/LOST
      via Firestore onSnapshot listener
   3. Real-time sync via storage event
   4. Clean glassmorphism UI rendering
═══════════════════════════════════════ */

/* ── PER-USER localStorage ──
   Key is ww_<sanitized_email> so each user
   has their own isolated saved data.       */
let LS_KEY = 'ww_guest';

const LS = {
  setKey(email){ LS_KEY = 'ww_' + (email||'guest').replace(/[^a-z0-9]/gi,'_'); },
  save(){
    localStorage.setItem(LS_KEY, JSON.stringify({
      bal:      state.bal,
      txList:   state.txList,
      savedUpi: state.savedUpi,
      upi:      state.upi,
      phone:    state.phone
    }));
  },
  load(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      if(!raw) return;
      const d = JSON.parse(raw);
      if(typeof d.bal==='number')  state.bal      = d.bal;
      if(Array.isArray(d.txList)) state.txList   = d.txList;
      if(d.savedUpi!==undefined)  state.savedUpi = d.savedUpi;
      if(d.upi!==undefined)       state.upi      = d.upi;
      if(d.phone!==undefined)     state.phone    = d.phone;
    }catch(e){}
  }
};

/* ── STATE ── */
let state = {
  cat:'INSTAGRAM', bal:500, activePage:'markets',
  betInfo:null, side:'YES', betAmt:'',
  txList:[], upi:'', phone:'', savedUpi:'',
  timer:80, timerInt:null, accountTab:'profile'
};

/* ── DATA ── */
const BETS = {
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

const META = {
  INSTAGRAM:{color:"#00d4ff",label:"Instagram",trend:"Karan Aujla stories — 47% YES",icon:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#f09433"/><stop offset="50%" stop-color="#dc2743"/><stop offset="100%" stop-color="#bc1888"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#ig)" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="4" stroke="url(#ig)" stroke-width="2" fill="none"/><circle cx="17.5" cy="6.5" r="1.2" fill="url(#ig)"/></svg>`},
  CRICKET:  {color:"#22c55e",label:"Cricket",  trend:"Virat Kohli sixes — 67% YES",icon:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><line x1="4" y1="20" x2="16" y2="4" stroke="#22c55e" stroke-width="3" stroke-linecap="round"/><rect x="14" y="2" width="6" height="4" rx="1" fill="#22c55e" opacity="0.8"/><circle cx="19" cy="17" r="3" fill="#22c55e" opacity="0.9"/></svg>`},
  OIL:      {color:"#ffd700",label:"Oil & Gas",trend:"Brent crude — massive volume",icon:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 6 10 6 15a6 6 0 0 0 12 0C18 10 12 2 12 2z" fill="#f59e0b" opacity="0.9"/><line x1="8" y1="3" x2="16" y2="3" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/></svg>`},
  POLITICS: {color:"#00d4ff",label:"Politics", trend:"Arnab debate — 88% YES",icon:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M3 21L12 4L21 21Z" stroke="#00d4ff" stroke-width="2" fill="none" stroke-linejoin="round"/><line x1="2" y1="21" x2="22" y2="21" stroke="#00d4ff" stroke-width="2" stroke-linecap="round"/></svg>`},
  YOUTUBE:  {color:"#ff4444",label:"YouTube",  trend:"T-Series new song — 81% YES",icon:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="4" fill="#ff0000" opacity="0.9"/><polygon points="10,9 10,15 16,12" fill="white"/></svg>`},
  RANDOM:   {color:"#00d4ff",label:"Random",   trend:"Bitcoin +₹2K trending",icon:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="9" height="9" rx="2" stroke="#00d4ff" stroke-width="2" fill="none"/><rect x="13" y="2" width="9" height="9" rx="2" stroke="#00d4ff" stroke-width="2" fill="none"/><rect x="2" y="13" width="9" height="9" rx="2" stroke="#00d4ff" stroke-width="2" fill="none"/><rect x="13" y="13" width="9" height="9" rx="2" stroke="#00d4ff" stroke-width="2" fill="none"/></svg>`},
  NAUGHTY:  {color:"#ffd700",label:"Naughty",  trend:"Bollywood bikini — 84% YES",icon:`<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="fire" x1="50%" y1="100%" x2="50%" y2="0%"><stop offset="0%" stop-color="#ef4444"/><stop offset="50%" stop-color="#f97316"/><stop offset="100%" stop-color="#fbbf24"/></linearGradient></defs><path d="M12 2C12 2 8 7 8 11c0 0 2-2 3-2 0 0-4 5-4 8 0 3.3 2.2 5 5 5s5-1.7 5-5c0-3-4-8-4-8 1 0 3 2 3 2 0-4-4-9-4-9Z" fill="url(#fire)"/></svg>`}
};

const BADGE_COLORS = {
  INSTAGRAM:{bg:"rgba(0,212,255,.08)",color:"#00d4ff",border:"1px solid rgba(0,212,255,.22)"},
  CRICKET:  {bg:"rgba(34,197,94,.08)",color:"#22c55e",border:"1px solid rgba(34,197,94,.22)"},
  OIL:      {bg:"rgba(255,215,0,.08)", color:"#ffd700",border:"1px solid rgba(255,215,0,.22)"},
  POLITICS: {bg:"rgba(0,212,255,.08)",color:"#00d4ff",border:"1px solid rgba(0,212,255,.22)"},
  YOUTUBE:  {bg:"rgba(255,68,68,.08)", color:"#ff4444",border:"1px solid rgba(255,68,68,.22)"},
  RANDOM:   {bg:"rgba(0,212,255,.08)",color:"#00d4ff",border:"1px solid rgba(0,212,255,.22)"},
  NAUGHTY:  {bg:"rgba(255,215,0,.08)", color:"#ffd700",border:"1px solid rgba(255,215,0,.22)"}
};

const VOLS=["2.4K","5.1K","11.8K","3.2K","7.6K","18.4K","9.1K","4.3K","22.1K","1.8K","6.7K"];

/* ── Live market colours ── */
const LB='#00c8ff', LP='#a855f7';

/* ── STATUS NORMALIZER ──
   Maps whatever admin sets → display label + badge class */
function normalizeStatus(raw){
  const s = (raw||'').toString().toUpperCase().trim();
  if(s==='WON'||s==='WIN'||s==='APPROVED'||s==='WIN ✅'||s==='WON ✅') return {label:'WON 🏆', cls:'won'};
  if(s==='LOST'||s==='LOSE'||s==='REJECTED'||s==='LOST ❌')           return {label:'LOST ❌', cls:'lost'};
  if(s==='COMPLETED'||s==='PAID'||s==='SUCCESS')                       return {label:'COMPLETED ✓',cls:'completed'};
  return {label:'PENDING', cls:'pending'};
}

/* ── CSS VAR HELPER ── */
function cc(){ return META[state.cat].color; }
function setCC(c){ document.documentElement.style.setProperty('--cc',c); }

/* ── TOAST ── */
let toastTimer;
function showToast(msg,type='success'){
  const el=document.getElementById('toast');
  el.textContent=msg;el.className='toast show';
  if(type==='success'){
    el.style.cssText='background:linear-gradient(135deg,rgba(34,197,94,.16),rgba(34,197,94,.07));border:1.5px solid rgba(34,197,94,.38);color:#22c55e;box-shadow:0 0 22px rgba(34,197,94,.2),inset 0 1px 0 rgba(255,255,255,.1);display:block';
  } else {
    el.style.cssText='background:linear-gradient(135deg,rgba(0,212,255,.13),rgba(0,212,255,.05));border:1.5px solid rgba(0,212,255,.38);color:#00d4ff;box-shadow:0 0 22px rgba(0,212,255,.18),inset 0 1px 0 rgba(255,255,255,.1);display:block';
  }
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.classList.remove('show'),3000);
}

/* ── CLOSE ALL ── */
function closeAll(){
  ['backdrop','portfolio','betSheet','depSheet','witSheet'].forEach(id=>
    document.getElementById(id).classList.add('hidden')
  );
  clearInterval(state.timerInt);
}

/* ── PAGE NAV ── */
function setPage(page){
  state.activePage=page;
  ['markets','support','account'].forEach(p=>{
    document.getElementById('page'+p[0].toUpperCase()+p.slice(1)).classList.toggle('hidden',p!==page);
    document.getElementById('bnav-'+p).classList.toggle('active',p===page);
    const pip=document.getElementById('pip-'+p);
    if(pip) pip.style.display=p===page?'block':'none';
  });
  document.getElementById('tabsWrap').style.display=page==='markets'?'block':'none';
  if(page==='markets') renderMarkets();
  if(page==='support') renderSupport();
  if(page==='account') renderAccount();
}

/* ── TABS ── */
function renderTabs(){
  const row=document.getElementById('tabsRow');
  row.innerHTML='';
  Object.keys(BETS).forEach(c=>{
    const m=META[c],active=state.cat===c;
    const div=document.createElement('div');
    div.className='tab'+(active?' active':'');
    div.style.setProperty('--cc',m.color);
    div.innerHTML=m.icon+' '+m.label+(active?'<div class="tab-glow"></div>':'');
    if(active) div.style.color='#fff';
    div.onclick=()=>{ state.cat=c; setCC(m.color); renderTabs(); renderMarkets(); updateBlobs(); };
    row.appendChild(div);
  });
}

/* ── BLOBS ── */
function updateBlobs(){
  const c=cc();
  document.getElementById('blob1').style.background=c;
  document.getElementById('blob2').style.background=c;
  document.getElementById('scanline').style.background=`linear-gradient(90deg,transparent,${c}22,transparent)`;
}

/* ── MARKETS PAGE ── */
function renderMarkets(){
  const m=META[state.cat], color=m.color;
  const container=document.getElementById('pageMarkets');
  const OG='#ff6a00';
  const trendItems=[m.trend,'🔥 '+BETS[state.cat].filter(b=>b.hot).map(b=>b.q.slice(0,28)+'…').join(' · '),'⚡ BET NOW · WIN BIG','📈 LIVE PREDICTION MARKET'];
  const trendText=trendItems.join('   ✦   ');

  /* ── TRENDING TICKER ── */
  let html=`
  <div style="margin:12px 14px 0;position:relative;overflow:hidden;border-radius:14px;height:44px;
    background:linear-gradient(135deg,rgba(255,106,0,.22),rgba(14,8,4,.92),rgba(255,106,0,.14));
    backdrop-filter:blur(22px);border:1.5px solid rgba(255,106,0,.6);
    box-shadow:0 0 18px rgba(255,106,0,.35),0 0 36px rgba(255,106,0,.15),inset 0 1px 0 rgba(255,180,80,.28);
    animation:orangePulse 3s ease-in-out infinite;display:flex;align-items:center;">
    <div style="position:absolute;top:0;left:0;right:0;height:1.5px;background:linear-gradient(90deg,transparent,rgba(255,200,80,.9),rgba(255,255,180,.8),rgba(255,200,80,.9),transparent)"></div>
    <div style="position:absolute;top:0;left:-110%;width:45%;height:100%;background:linear-gradient(105deg,transparent,rgba(255,180,80,.1),transparent);animation:shineSwipe 4s ease-in-out infinite;pointer-events:none;z-index:1"></div>
    <!-- TRENDING label -->
    <div style="position:relative;z-index:3;flex-shrink:0;display:flex;align-items:center;gap:6px;height:100%;padding:0 14px;background:linear-gradient(160deg,rgba(255,106,0,.65),rgba(200,50,0,.75));border-right:1px solid rgba(255,140,40,.45);">
      <span style="width:7px;height:7px;border-radius:50%;background:#fff;opacity:.9;animation:liveDot 1.1s infinite;flex-shrink:0"></span>
      <span style="font-family:'Oswald',sans-serif;font-weight:700;font-size:11px;letter-spacing:2px;color:#fff">TRENDING</span>
    </div>
    <!-- scrolling text -->
    <div style="position:relative;z-index:3;flex:1;overflow:hidden;height:100%;display:flex;align-items:center;">
      <div style="position:absolute;left:0;top:0;bottom:0;width:20px;background:linear-gradient(90deg,rgba(14,8,4,.95),transparent);z-index:2;pointer-events:none"></div>
      <div style="position:absolute;right:0;top:0;bottom:0;width:20px;background:linear-gradient(270deg,rgba(14,8,4,.95),transparent);z-index:2;pointer-events:none"></div>
      <div style="display:flex;animation:marquee 24s linear infinite;white-space:nowrap;will-change:transform;padding-left:14px;">
        <span style="font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:700;color:rgba(255,220,160,.88)">${trendText}&nbsp;&nbsp;&nbsp;✦&nbsp;&nbsp;&nbsp;${trendText}&nbsp;&nbsp;&nbsp;✦&nbsp;&nbsp;&nbsp;</span>
      </div>
    </div>
    <!-- hot count -->
    <div style="position:relative;z-index:3;flex-shrink:0;padding:0 12px;height:100%;display:flex;align-items:center;gap:4px;border-left:1px solid rgba(255,106,0,.35)">
      <span style="font-size:13px">🔥</span>
      <span style="font-family:'Oswald',sans-serif;font-weight:700;font-size:13px;color:#ff9a3c">${BETS[state.cat].filter(b=>b.hot).length}</span>
    </div>
  </div>`;

  /* ── BALANCE CARD ── */
  html+=`<div id="balCard" class="shine-card" style="margin:12px 14px 0;border-radius:20px;padding:20px;position:relative;overflow:hidden;
    background:linear-gradient(145deg,rgba(255,255,255,.075),rgba(0,212,255,.035),rgba(255,215,0,.025));
    backdrop-filter:blur(30px);border:1px solid rgba(255,255,255,.11);
    box-shadow:0 14px 40px rgba(0,0,0,.48),inset 0 1px 0 rgba(255,255,255,.14),0 0 0 1px rgba(0,212,255,.04);
    animation:waveRadius 10s ease-in-out infinite">
    <div style="position:absolute;top:-50px;right:-50px;width:180px;height:180px;border-radius:50%;background:${color};filter:blur(70px);opacity:.1;animation:subtleGlow 4s ease-in-out infinite"></div>
    <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,${color}99,rgba(255,215,0,.35),transparent)"></div>
    <div style="position:relative;z-index:1">
      <div class="bal-label">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M8 5H6C4.9 5 4 5.9 4 7V9C4 11.2 5.5 13 7.5 13.5" stroke="#ffd700" stroke-width="2" stroke-linecap="round"/><path d="M16 5H18C19.1 5 20 5.9 20 7V9C20 11.2 18.5 13 16.5 13.5" stroke="#ffd700" stroke-width="2" stroke-linecap="round"/><path d="M8 5C8 5 8 13 12 15C16 13 16 5 16 5H8Z" fill="#ffd700" opacity="0.85"/><line x1="12" y1="15" x2="12" y2="19" stroke="#ffd700" stroke-width="2"/><line x1="8" y1="19" x2="16" y2="19" stroke="#ffd700" stroke-width="2" stroke-linecap="round"/></svg>
        Your Balance
      </div>
      <div class="bal-amount">
        <span class="bal-rupee">₹</span>
        <span class="bal-num" id="balNum">${state.bal}</span>
      </div>
      <div class="bal-btns">
        <button class="dep-btn shine-card" onclick="openDeposit()" style="background:linear-gradient(145deg,${color}28,${color}0f);box-shadow:0 0 22px ${color}38,inset 0 1px 0 rgba(255,255,255,.18)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/></svg>
          Deposit
        </button>
        <button class="wit-btn shine-card" onclick="openWithdraw()">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><line x1="12" y1="19" x2="12" y2="5" stroke="#00d4ff" stroke-width="2.5" stroke-linecap="round"/><line x1="5" y1="8" x2="12" y2="5" stroke="#00d4ff" stroke-width="2.5" stroke-linecap="round"/><line x1="19" y1="8" x2="12" y2="5" stroke="#00d4ff" stroke-width="2.5" stroke-linecap="round"/></svg>
          Withdraw
        </button>
      </div>
    </div>
  </div>`;

  /* ── LIVE MARKETS BAR — neon blue + purple ── */
  html+=`
  <div style="margin:14px 14px 10px;position:relative;overflow:hidden;border-radius:18px;
    background:linear-gradient(160deg,rgba(0,200,255,.14),rgba(160,0,255,.08),rgba(8,8,28,.88),rgba(0,200,255,.1));
    backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);
    border:1.5px solid rgba(0,200,255,.6);
    box-shadow:0 0 0 1px rgba(0,200,255,.1),0 0 22px rgba(0,200,255,.35),0 0 44px rgba(160,0,255,.15),inset 0 1.5px 0 rgba(255,255,255,.22),inset 0 -1.5px 0 rgba(0,0,0,.3),inset 0 0 40px rgba(0,200,255,.04);
    animation:liveBarPulse 3s ease-in-out infinite;">
    <!-- top line gradient -->
    <div style="position:absolute;top:0;left:0;right:0;height:1.5px;background:linear-gradient(90deg,transparent,${LB}cc,rgba(255,255,255,.8),${LP}cc,transparent)"></div>
    <!-- left accent -->
    <div style="position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(180deg,${LB},${LP});box-shadow:2px 0 14px ${LB}88"></div>
    <!-- shine sweep -->
    <div style="position:absolute;top:0;left:-110%;width:50%;height:100%;background:linear-gradient(105deg,transparent,rgba(0,200,255,.07),transparent);animation:shineSwipe 4.5s ease-in-out infinite;pointer-events:none;z-index:1"></div>
    <!-- glass specular -->
    <div style="position:absolute;top:0;left:0;right:0;height:45%;background:linear-gradient(180deg,rgba(255,255,255,.1),transparent);border-radius:18px 18px 60% 60%;pointer-events:none"></div>
    <!-- CONTENT -->
    <div style="position:relative;z-index:3;padding:13px 16px 13px 18px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:9px">
        <div style="display:flex;align-items:center;gap:10px">
          <!-- icon box -->
          <div style="width:38px;height:38px;border-radius:11px;flex-shrink:0;background:linear-gradient(145deg,rgba(0,200,255,.22),rgba(160,0,255,.12),rgba(8,8,28,.55));border:1px solid rgba(0,200,255,.55);display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px rgba(0,200,255,.3),inset 0 1px 0 rgba(255,255,255,.28);filter:brightness(1.6) saturate(1.8)">
            ${m.icon}
          </div>
          <div>
            <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:17px;color:#fff;line-height:1.1">
              ${m.label} <span style="background:linear-gradient(90deg,${LB},${LP});-webkit-background-clip:text;-webkit-text-fill-color:transparent">Markets</span>
            </div>
            <div style="font-family:'Oswald',sans-serif;font-size:8px;font-weight:600;letter-spacing:3.5px;text-transform:uppercase;margin-top:2px;color:rgba(0,200,255,.55)">◆ PREDICTION EXCHANGE ◆</div>
          </div>
        </div>
        <!-- count pill -->
        <div style="font-family:'Oswald',sans-serif;font-weight:700;font-size:14px;letter-spacing:1px;
          background:linear-gradient(90deg,${LB},${LP});-webkit-background-clip:text;-webkit-text-fill-color:transparent;
          border:1.5px solid rgba(0,200,255,.65);padding:6px 14px;border-radius:50px;
          box-shadow:0 0 16px rgba(0,200,255,.3),inset 0 1px 0 rgba(255,255,255,.22);
          animation:liveCountPulse 2.8s ease-in-out infinite;white-space:nowrap">
          ${BETS[state.cat].length} <span style="font-size:10px;opacity:.8;letter-spacing:2px">MARKETS</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap">
        <!-- LIVE -->
        <div style="display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:50px;background:rgba(239,68,68,.18);border:1px solid rgba(239,68,68,.45);box-shadow:0 0 10px rgba(239,68,68,.25)">
          <span style="width:6px;height:6px;border-radius:50%;background:#ef4444;animation:liveDot 1.1s infinite;display:inline-block;flex-shrink:0;box-shadow:0 0 6px #ef4444"></span>
          <span style="font-family:'Oswald',sans-serif;font-weight:700;font-size:10px;letter-spacing:2px;color:#ff6b6b">LIVE</span>
        </div>
        <!-- VOL -->
        <div style="display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:50px;background:rgba(0,200,255,.1);border:1px solid rgba(0,200,255,.35)">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17" stroke="${LB}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span style="font-family:'Oswald',sans-serif;font-weight:700;font-size:10px;letter-spacing:1px;color:${LB}">24H VOL</span>
          <span style="font-family:'Oswald',sans-serif;font-weight:700;font-size:11px;color:#fff;letter-spacing:.5px">₹4.2L+</span>
        </div>
        <!-- HOT -->
        <div style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:50px;background:rgba(0,200,255,.08);border:1px solid rgba(0,200,255,.3)">
          <span style="font-size:10px">🔥</span>
          <span style="font-family:'Oswald',sans-serif;font-weight:700;font-size:10px;background:linear-gradient(90deg,${LB},${LP});-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:1px">${BETS[state.cat].filter(b=>b.hot).length} HOT</span>
        </div>
      </div>
    </div>
  </div>`;

  /* ── MARKET CARDS ── */
  const bc=BADGE_COLORS[state.cat];
  BETS[state.cat].forEach((b,i)=>{
    const barC=b.odds>65?"#22c55e":b.odds>40?color:"#ef4444";
    const numC=b.odds>65?"#22c55e":b.odds>40?"#d1d9e6":"#ef4444";
    const isLive=b.odds>70;
    html+=`<div class="market-card shine-card" style="animation-delay:${i*.04}s">
      <div class="card-glow-top" style="background:linear-gradient(90deg,transparent,${color}bb,rgba(255,215,0,.2),transparent)"></div>
      <div class="card-glow-left" style="background:linear-gradient(180deg,${color},${color}66,transparent);box-shadow:2px 0 10px ${color}44"></div>
      <div class="card-badge-row">
        <span class="badge" style="background:${bc.bg};color:${bc.color};border:${bc.border}">${m.icon} ${m.label}</span>
        ${b.hot?'<span class="hot-badge">🔥 HOT</span>':''}
        ${isLive?'<span class="live-badge"><span class="live-dot"></span>LIVE</span>':''}
        <span style="margin-left:auto;font-family:'Oswald',sans-serif;font-weight:700;font-size:11px;color:#ffd700;background:rgba(255,215,0,.08);border:1px solid rgba(255,215,0,.22);padding:4px 10px;border-radius:50px;letter-spacing:.8px">₹${VOLS[i%11]} VOL</span>
      </div>
      <div class="card-q">${b.q}</div>
      <div class="odds-row">
        <div class="odds-num" style="color:${numC}">${b.odds}%</div>
        <div class="odds-bar-wrap"><div class="odds-bar-fill" style="width:${b.odds}%;background:linear-gradient(90deg,${barC}77,${barC})"></div></div>
        <div class="odds-label">chance</div>
      </div>
      <div class="bet-btns">
        <button class="bet-btn neon-green-btn" onclick="openBet(${i},'YES')">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          YES ₹${b.odds}
        </button>
        <button class="bet-btn neon-red-btn" onclick="openBet(${i},'NO')">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polyline points="22,17 13.5,8.5 8.5,13.5 2,7" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          NO ₹${100-b.odds}
        </button>
      </div>
    </div>`;
  });

  container.innerHTML=html;
  updateBal();
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
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#00d4ff" stroke-width="2"/><path d="M12 8C10.3 8 9 9.3 9 11" stroke="#00d4ff" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16" r="1" fill="#00d4ff"/></svg>
      Support Center
    </div>
    <p style="color:#64748b;font-size:13px;margin-bottom:18px">We're here 24/7 — reach us instantly</p>
    <div class="glass" style="border-radius:16px;padding:18px;margin-bottom:12px;border:1px solid rgba(34,168,255,.18);background:rgba(34,168,255,.04)">
      <div style="display:flex;align-items:center;gap:13px">
        <div style="width:48px;height:48px;border-radius:14px;background:rgba(34,168,255,.12);display:flex;align-items:center;justify-content:center;border:1px solid rgba(34,168,255,.25)">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#229ED9"><path d="M11.994 2a10 10 0 100 20 10 10 0 000-20zm3.18 6.624l-1.67 7.872c-.126.561-.455.698-.919.434l-2.546-1.876-1.228 1.183c-.135.136-.25.25-.513.25l.183-2.59 4.714-4.257c.205-.182-.044-.283-.318-.1L7.809 14.3l-2.5-.78c-.544-.17-.555-.544.113-.806l9.767-3.765c.453-.165.85.11.705.756l-.72-.08z"/></svg>
        </div>
        <div>
          <div style="font-weight:700;font-size:14px;margin-bottom:2px;color:#e8edf5">Telegram Support</div>
          <div style="font-size:12px;color:#94a3b8">@WISHWORKONLINE · Reply in 5 mins</div>
        </div>
      </div>
      <button class="neon-btn" style="margin-top:13px;background:rgba(34,168,255,.1);border:1.5px solid rgba(34,168,255,.45);color:#229ED9;font-size:12px;border-radius:12px" onclick="window.open('https://t.me/WISHWORKONLINE','_blank')">Open Telegram Chat →</button>
    </div>`;
  faqs.forEach(f=>{
    html+=`<div class="glass" style="border-radius:13px;padding:14px;margin-bottom:8px">
      <div style="font-weight:700;font-size:13px;margin-bottom:5px;display:flex;align-items:center;gap:7px;color:#e8edf5">
        <svg width="11" height="11" viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="#ffd700"/></svg>
        ${f.q}</div>
      <div style="font-size:12px;color:#94a3b8;line-height:1.5">${f.a}</div>
    </div>`;
  });
  html+='</div>';
  document.getElementById('pageSupport').innerHTML=html;
}

/* ── ACCOUNT ── */
function renderAccount(){
  document.getElementById('pageAccount').innerHTML=`<div style="padding:20px 14px">
    <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:20px;margin-bottom:4px;display:flex;align-items:center;gap:10px;color:#e8edf5">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#ffd700" stroke-width="2"/><path d="M4 20C4 16.13 7.58 13 12 13s8 3.13 8 7" stroke="#ffd700" stroke-width="2" stroke-linecap="round"/></svg>
      My Account
    </div>
    <p style="color:#64748b;font-size:13px;margin-bottom:18px">Manage your profile and settings</p>
    <div class="acc-tabs">
      <button class="acc-tab ${state.accountTab==='profile'?'active':''}" onclick="switchAccTab('profile')">Profile</button>
      <button class="acc-tab ${state.accountTab==='settings'?'active':''}" onclick="switchAccTab('settings')">Settings</button>
      <button class="acc-tab ${state.accountTab==='security'?'active':''}" onclick="switchAccTab('security')">Security</button>
    </div>
    <div id="accContent"></div>
  </div>`;
  renderAccTab();
}

function switchAccTab(tab){
  state.accountTab=tab;
  document.querySelectorAll('.acc-tab').forEach(el=>el.classList.toggle('active',el.textContent.toLowerCase()===tab));
  renderAccTab();
}

function renderAccTab(){
  const el=document.getElementById('accContent');
  if(!el) return;
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
        <div style="font-size:12px;color:#64748b;margin-top:2px" id="accEmail">user@example.com</div>
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
    el.innerHTML=settings.map(s=>`
      <div class="glass" style="border-radius:13px;padding:13px 15px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">
        <div><div style="font-weight:600;font-size:13px;color:#e8edf5">${s.label}</div><div style="font-size:11px;color:#64748b;margin-top:2px">${s.sub}</div></div>
        <div style="width:42px;height:23px;border-radius:12px;background:${s.on?color:'rgba(255,255,255,.08)'};border:1px solid ${s.on?color:'rgba(255,255,255,.08)'};position:relative;cursor:pointer;transition:all .25s;box-shadow:${s.on?`0 0 10px ${color}44`:'none'}">
          <div style="position:absolute;top:2.5px;left:${s.on?'20px':'2.5px'};width:18px;height:18px;border-radius:50%;background:white;transition:left .25s;box-shadow:0 2px 4px rgba(0,0,0,.3)"></div>
        </div>
      </div>`).join('');
  } else {
    el.innerHTML=`
      <div class="glass" style="border-radius:16px;padding:16px;margin-bottom:10px;border:1px solid rgba(34,197,94,.16);background:rgba(34,197,94,.04)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px"><span style="font-size:18px">🔒</span><div style="font-weight:700;font-size:13px;color:#e8edf5">Account Secure</div></div>
        <div style="font-size:12px;color:#64748b">Your account is protected. Last login: Today</div>
      </div>
      <button class="neon-btn neon-green-btn" style="margin-bottom:9px;font-size:12px" onclick="showToast('Password reset link sent!','success')">Change Password</button>
      <button class="neon-btn neon-gold-btn" style="margin-bottom:9px;font-size:12px" onclick="showToast('2FA setup coming soon!','info')">Enable 2FA (Coming Soon)</button>
      <button class="neon-btn neon-red-btn" style="font-size:12px" onclick="logout()">Logout</button>`;
  }
}

function saveUpi(){
  if(state.upi&&state.phone){
    state.savedUpi=state.upi;
    LS.save();
    showToast('✅ Payment info saved!');
    renderAccTab();
  } else {
    showToast('Enter UPI ID and phone','info');
  }
}

function logout(){
  state.bal=0;state.txList=[];state.savedUpi='';state.upi='';state.phone='';
  LS.save();
  showToast('Logged out','info');
  renderAccTab();
  updateBal();
}

/* ── PORTFOLIO ── */
function openPortfolio(){
  document.getElementById('backdrop').classList.remove('hidden');
  document.getElementById('portfolio').classList.remove('hidden');
  renderPortfolio();
}

function renderPortfolio(){
  const color=cc();
  const wins=state.txList.filter(t=>normalizeStatus(t.status).cls==='won').length;

  document.getElementById('portStats').innerHTML=[
    {label:'Balance',val:`₹${state.bal}`,color:'#22c55e',bg:'rgba(34,197,94,.08)',border:'rgba(34,197,94,.18)'},
    {label:'Bets',val:state.txList.length,color:'#ffd700',bg:'rgba(255,215,0,.08)',border:'rgba(255,215,0,.18)'},
    {label:'Wins',val:wins,color:'#00d4ff',bg:'rgba(0,212,255,.08)',border:'rgba(0,212,255,.18)'}
  ].map(s=>`<div class="glass port-stat" style="background:${s.bg};border-color:${s.border}">
    <div class="port-stat-val" style="color:${s.color}">${s.val}</div>
    <div class="port-stat-lbl">${s.label}</div>
  </div>`).join('');

  /* UPI section */
  const upiEl=document.getElementById('portUpiSection');
  if(state.savedUpi){
    upiEl.innerHTML=`<div class="upi-linked-row">
      <div>
        <div style="font-size:10px;color:#64748b;margin-bottom:2px">Linked UPI ID</div>
        <div style="color:${color};font-weight:700;font-size:13px">${state.savedUpi}</div>
        ${state.phone?`<div style="font-size:10px;color:#64748b;margin-top:1px">${state.phone}</div>`:''}
      </div>
      <button onclick="state.savedUpi='';LS.save();renderPortfolio()" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:#94a3b8;padding:6px 11px;font-size:11px;cursor:pointer;font-weight:600">Edit</button>
    </div>`;
  } else {
    upiEl.innerHTML=`<div style="background:rgba(255,255,255,.03);border-radius:11px;padding:13px;border:1px solid rgba(255,255,255,.06)">
      <input class="text-inp" style="margin-bottom:8px" placeholder="UPI ID (e.g. name@paytm)" id="portUpiInp" value="${state.upi}" oninput="state.upi=this.value"/>
      <input class="text-inp" style="margin-bottom:12px" placeholder="Phone Number" id="portPhoneInp" value="${state.phone}" oninput="state.phone=this.value"/>
      <button class="neon-btn neon-gold-btn" style="font-size:12px;border-radius:12px" onclick="saveUpiPort()">Save Payment Info</button>
    </div>`;
  }

  /* TX list */
  const txEl=document.getElementById('txList');
  if(!state.txList.length){
    txEl.innerHTML=`<div class="tx-empty"><div class="tx-emoji">📭</div><div>No transactions yet</div><div style="font-size:11px;margin-top:4px;color:#374151">Place a bet to get started</div></div>`;
  } else {
    txEl.innerHTML=state.txList.map(tx=>{
      const {label,cls}=normalizeStatus(tx.status);
      return `<div class="tx-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
          <div>
            <div class="tx-type">${tx.type}</div>
            <div class="tx-amt">${tx.amt}</div>
            <div class="tx-desc">${tx.q||''} · ${tx.time}</div>
          </div>
          <div class="tx-badge ${cls}">${label}</div>
        </div>
      </div>`;
    }).join('');
  }
}

function saveUpiPort(){
  if(state.upi&&state.phone){
    state.savedUpi=state.upi;
    LS.save();
    showToast('✅ Payment info saved!');
    renderPortfolio();
  } else {
    showToast('Enter UPI ID and phone','info');
  }
}

/* ── BET SHEET ── */
function openBet(idx,side){
  const b=BETS[state.cat][idx];
  state.betInfo=b; state.side=side; state.betAmt='';
  const color=side==='YES'?'#22c55e':'#ef4444';
  document.getElementById('betSheetLine').style.background=`linear-gradient(90deg,transparent,${color}77,transparent)`;
  document.getElementById('betQ').textContent=b.q;
  const sideIcon=side==='YES'
    ?`<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polyline points="20,6 9,17 4,12" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    :`<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/></svg>`;
  document.getElementById('betSideLine').innerHTML=`${sideIcon} ${side} · 1.9× payout on win`;
  document.getElementById('amtChips').innerHTML=[50,100,250,500,1000].map(v=>`<div class="amt-chip" onclick="selectChip(${v},'${color}')">₹${v>=1000?'1K':v}</div>`).join('');
  const inp=document.getElementById('betAmtInp');
  inp.style.border=`1px solid ${color}66`; inp.value='';
  document.getElementById('payoutAmt').textContent='₹ 0.00';
  const btn=document.getElementById('placeBetBtn');
  btn.innerHTML=`${sideIcon.replace('11','14')} Buy ${side}`;
  btn.style.cssText=`width:100%;padding:15px;border:1.5px solid ${color}88;border-radius:12px;font-weight:700;font-size:13px;cursor:pointer;background:linear-gradient(145deg,${color}28,${color}0f);color:${color};backdrop-filter:blur(14px);box-shadow:0 0 22px ${color}33,inset 0 1px 0 rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;gap:8px;overflow:hidden;position:relative;letter-spacing:.5px`;
  document.getElementById('backdrop').classList.remove('hidden');
  document.getElementById('betSheet').classList.remove('hidden');
}

function selectChip(v,color){
  state.betAmt=String(v);
  document.getElementById('betAmtInp').value=v;
  document.querySelectorAll('.amt-chip').forEach(el=>el.classList.toggle('active',el.textContent===`₹${v>=1000?'1K':v}`));
  updateBetAmt(v);
}

function updateBetAmt(val){
  state.betAmt=val;
  document.getElementById('payoutAmt').textContent=`₹ ${val?(parseFloat(val)*1.9).toFixed(2):'0.00'}`;
}

function placeBet(){
  const a=parseInt(state.betAmt);
  if(!a||a<=0) return showToast('Enter a valid amount','info');
  if(a>state.bal) return showToast('Insufficient balance 💸','info');
  state.bal-=a;
  const now=new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  const txId=Date.now();
  state.txList.unshift({id:txId,type:`BET: ${state.side}`,q:state.betInfo.q.slice(0,35)+'…',amt:`₹${a}`,status:'PENDING',time:now,firestoreId:null});
  LS.save();
  closeAll();
  showToast(`${state.side==='YES'?'✅':'❌'} Bet placed — ₹${a} on ${state.side}`);
  updateBal();
}

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
  if(!a||a<=0) return showToast('Enter deposit amount','info');
  document.getElementById('qrAmt').textContent=`₹${a}`;
  document.getElementById('payAmt').textContent=`Pay ₹${a}`;
  document.getElementById('depStep1').classList.add('hidden');
  document.getElementById('depStep2').classList.remove('hidden');
  document.getElementById('utrInp').value='';
  state.timer=80; updateTimerCircle();
  clearInterval(state.timerInt);
  state.timerInt=setInterval(()=>{ state.timer--; if(state.timer<=0){clearInterval(state.timerInt);state.timer=0;} updateTimerCircle(); },1000);
}
function updateTimerCircle(){
  document.getElementById('timerNum').textContent=state.timer;
  document.getElementById('timerCircle').style.strokeDashoffset=150.8*(1-state.timer/80);
}
function submitUTR(){
  const utr=document.getElementById('utrInp').value;
  if(!utr||utr.length<10) return showToast('Enter valid 12-digit UTR','info');
  const amt=document.getElementById('depAmtInp').value||document.getElementById('qrAmt').textContent.replace('₹','');
  const now=new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  state.txList.unshift({id:Date.now(),type:'DEPOSIT',q:'UPI Payment',amt:`₹${amt}`,status:'PENDING',time:now});
  LS.save();
  clearInterval(state.timerInt);
  closeAll();
  showToast('✅ Deposit submitted! Processing…');
}

/* ── WITHDRAW ── */
function openWithdraw(){
  document.getElementById('witAmtInp').value='';
  document.getElementById('backdrop').classList.remove('hidden');
  document.getElementById('witSheet').classList.remove('hidden');
}
function handleWithdraw(){
  const a=parseInt(document.getElementById('witAmtInp').value);
  if(!a||a<=0) return showToast('Enter a valid amount','info');
  if(a>state.bal) return showToast('Insufficient balance 💸','info');
  state.bal-=a;
  const now=new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  state.txList.unshift({id:Date.now(),type:'WITHDRAW',q:'To UPI',amt:`₹${a}`,status:'PENDING',time:now});
  LS.save();
  closeAll();
  showToast('✅ Withdrawal request sent!');
  updateBal();
}

/* ── BALANCE ── */
function updateBal(){
  document.getElementById('navBal').textContent=state.bal;
  const b=document.getElementById('balNum');
  if(b) b.textContent=state.bal;
}

/* ── REAL-TIME via storage event (cross-tab admin sync) ── */
window.addEventListener('storage',(e)=>{
  if(e.key===LS_KEY){
    LS.load(); updateBal();
    const port=document.getElementById('portfolio');
    if(port&&!port.classList.contains('hidden')) renderPortfolio();
    if(state.activePage==='account') renderAccTab();
  }
});

/* ── ADMIN UPDATE HOOK (called by admin panel JS) ──
   Admin panel should call: window.adminUpdateTx(firestoreDocId, newStatus)
   This finds the matching tx by firestoreId or betQ similarity and updates it. */
window.adminUpdateTx=function(firestoreDocId, newStatus, matchEmail){
  // Find tx by firestoreId if stored, else match by pending bet
  let tx=state.txList.find(t=>t.firestoreId===firestoreDocId);
  if(!tx){
    // fallback: update the first PENDING bet
    tx=state.txList.find(t=>t.type&&t.type.startsWith('BET')&&t.status==='PENDING');
  }
  if(tx){ tx.status=newStatus; LS.save(); }
  const port=document.getElementById('portfolio');
  if(port&&!port.classList.contains('hidden')) renderPortfolio();
};

/* ── INIT ── */
function init(){
  LS.load();
  setCC(META[state.cat].color);
  renderTabs();
  renderMarkets();
  updateBal();
  updateBlobs();
  ['support','account'].forEach(p=>{
    const pip=document.getElementById('pip-'+p);
    if(pip) pip.style.display='none';
  });
}
init();
