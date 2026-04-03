/* ═══════════════════════════════════════════════
   WISHWORK – script.js
   Fixes:
   1. localStorage persistence (bets, UPI, txList, balance)
   2. Admin panel → Portfolio sync via localStorage + storage event
   3. Real-time update via window.addEventListener('storage')
   4. Live market color: neon blue+pink gradient (only that bar)
   ═══════════════════════════════════════════════ */

/* ── STORAGE HELPERS ── */
const LS = {
  save(){ localStorage.setItem('ww_state', JSON.stringify({
    bal:      state.bal,
    txList:   state.txList,
    savedUpi: state.savedUpi,
    upi:      state.upi,
    phone:    state.phone
  })); },
  load(){
    try {
      const raw = localStorage.getItem('ww_state');
      if (!raw) return;
      const d = JSON.parse(raw);
      if (typeof d.bal      === 'number') state.bal      = d.bal;
      if (Array.isArray(d.txList))        state.txList   = d.txList;
      if (d.savedUpi !== undefined)       state.savedUpi = d.savedUpi;
      if (d.upi      !== undefined)       state.upi      = d.upi;
      if (d.phone    !== undefined)       state.phone    = d.phone;
    } catch(e){}
  }
};

/* ── STATE ── */
let state = {
  cat: 'INSTAGRAM',
  bal: 500,
  activePage: 'markets',
  betInfo: null,
  side: 'YES',
  betAmt: '',
  txList: [],
  upi: '',
  phone: '',
  savedUpi: '',
  timer: 80,
  timerInt: null,
  accountTab: 'profile'
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
  INSTAGRAM:{color:"#00d4ff",label:"Instagram",trend:"Karan Aujla stories — 47% YES",icon:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#f09433"/><stop offset="25%" stop-color="#e6683c"/><stop offset="50%" stop-color="#dc2743"/><stop offset="75%" stop-color="#cc2366"/><stop offset="100%" stop-color="#bc1888"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="url(#ig)" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="4" stroke="url(#ig)" stroke-width="2" fill="none"/><circle cx="17.5" cy="6.5" r="1.2" fill="url(#ig)"/></svg>`},
  CRICKET:  {color:"#22c55e",label:"Cricket",  trend:"Virat Kohli sixes — 67% YES",icon:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><line x1="4" y1="20" x2="16" y2="4" stroke="#22c55e" stroke-width="3" stroke-linecap="round"/><rect x="14" y="2" width="6" height="4" rx="1" fill="#22c55e" opacity="0.8"/><circle cx="19" cy="17" r="3" fill="#22c55e" opacity="0.9"/><circle cx="19" cy="17" r="1.5" fill="none" stroke="#fff" stroke-width="1"/></svg>`},
  OIL:      {color:"#ffd700",label:"Oil & Gas",trend:"Brent crude ₹7,500/barrel — massive volume",icon:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2 C12 2 6 10 6 15 a6 6 0 0 0 12 0 C18 10 12 2 12 2z" fill="#f59e0b" opacity="0.9"/><path d="M12 8 C12 8 9 13 9 15.5 a3 3 0 0 0 6 0 C15 13 12 8 12 8z" fill="#fbbf24" opacity="0.7"/><line x1="8" y1="3" x2="16" y2="3" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/></svg>`},
  POLITICS: {color:"#00d4ff",label:"Politics", trend:"Arnab debate — 88% YES",icon:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 21 L12 4 L21 21 Z" stroke="#00d4ff" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M6 21 L6 14 L18 14 L18 21" stroke="#00d4ff" stroke-width="2" stroke-linejoin="round" fill="none"/><line x1="2" y1="21" x2="22" y2="21" stroke="#00d4ff" stroke-width="2" stroke-linecap="round"/></svg>`},
  YOUTUBE:  {color:"#ff4444",label:"YouTube",  trend:"T-Series new song — 81% YES",icon:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="4" fill="#ff0000" opacity="0.9"/><polygon points="10,9 10,15 16,12" fill="white"/></svg>`},
  RANDOM:   {color:"#00d4ff",label:"Random",   trend:"Bitcoin +₹2K market trending",icon:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="9" height="9" rx="2" stroke="#00d4ff" stroke-width="2" fill="none"/><rect x="13" y="2" width="9" height="9" rx="2" stroke="#00d4ff" stroke-width="2" fill="none"/><rect x="2" y="13" width="9" height="9" rx="2" stroke="#00d4ff" stroke-width="2" fill="none"/><rect x="13" y="13" width="9" height="9" rx="2" stroke="#00d4ff" stroke-width="2" fill="none"/></svg>`},
  NAUGHTY:  {color:"#ffd700",label:"Naughty",  trend:"Bollywood bikini market — 84% YES",icon:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="fire" x1="50%" y1="100%" x2="50%" y2="0%"><stop offset="0%" stop-color="#ef4444"/><stop offset="50%" stop-color="#f97316"/><stop offset="100%" stop-color="#fbbf24"/></linearGradient></defs><path d="M12 2 C12 2 8 7 8 11 C8 11 10 9 11 9 C11 9 7 14 7 17 C7 20.3 9.2 22 12 22 C14.8 22 17 20.3 17 17 C17 14 13 9 13 9 C14 9 16 11 16 11 C16 7 12 2 12 2Z" fill="url(#fire)"/></svg>`}
};

const BADGE_COLORS = {
  INSTAGRAM:{bg:"rgba(0,212,255,.1)",color:"#00d4ff",border:"1px solid rgba(0,212,255,.3)"},
  CRICKET:  {bg:"rgba(34,197,94,.1)",color:"#22c55e",border:"1px solid rgba(34,197,94,.3)"},
  OIL:      {bg:"rgba(255,215,0,.1)", color:"#ffd700",border:"1px solid rgba(255,215,0,.3)"},
  POLITICS: {bg:"rgba(0,212,255,.1)",color:"#00d4ff",border:"1px solid rgba(0,212,255,.3)"},
  YOUTUBE:  {bg:"rgba(255,68,68,.1)", color:"#ff4444",border:"1px solid rgba(255,68,68,.3)"},
  RANDOM:   {bg:"rgba(0,212,255,.1)",color:"#00d4ff",border:"1px solid rgba(0,212,255,.3)"},
  NAUGHTY:  {bg:"rgba(255,215,0,.1)", color:"#ffd700",border:"1px solid rgba(255,215,0,.3)"}
};

const VOLS=["2.4K","5.1K","11.8K","3.2K","7.6K","18.4K","9.1K","4.3K","22.1K","1.8K","6.7K"];

/* ── LIVE MARKET COLORS (Issue 4: blue+pink neon) ── */
const LIVE_BLUE  = '#00f0ff';
const LIVE_PINK  = '#ff00c8';

/* ── CSS VAR HELPER ── */
function cc(){ return META[state.cat].color; }
function setCC(color){
  document.documentElement.style.setProperty('--cc', color);
}

/* ── TOAST ── */
let toastTimeout;
function showToast(msg, type='success'){
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show';
  if(type==='success'){
    el.style.background='linear-gradient(135deg,rgba(34,197,94,.18),rgba(34,197,94,.08))';
    el.style.border='1.5px solid rgba(34,197,94,.5)';
    el.style.color='#22c55e';
    el.style.boxShadow='0 0 30px rgba(34,197,94,.3),inset 0 1px 0 rgba(255,255,255,0.12)';
    el.style.textShadow='0 0 10px rgba(34,197,94,.8)';
  } else {
    el.style.background='linear-gradient(135deg,rgba(0,212,255,.15),rgba(0,212,255,.06))';
    el.style.border='1.5px solid rgba(0,212,255,.5)';
    el.style.color='#00d4ff';
    el.style.boxShadow='0 0 30px rgba(0,212,255,.25),inset 0 1px 0 rgba(255,255,255,0.12)';
    el.style.textShadow='0 0 10px rgba(0,212,255,.8)';
  }
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(()=>el.classList.remove('show'),3000);
}

/* ── CLOSE ALL ── */
function closeAll(){
  document.getElementById('backdrop').classList.add('hidden');
  document.getElementById('portfolio').classList.add('hidden');
  document.getElementById('betSheet').classList.add('hidden');
  document.getElementById('depSheet').classList.add('hidden');
  document.getElementById('witSheet').classList.add('hidden');
  clearInterval(state.timerInt);
}

/* ── PAGE NAV ── */
function setPage(page){
  state.activePage = page;
  ['markets','support','account'].forEach(p=>{
    document.getElementById('page'+p.charAt(0).toUpperCase()+p.slice(1)).classList.toggle('hidden', p!==page);
    const btn = document.getElementById('bnav-'+p);
    btn.classList.toggle('active', p===page);
    const pip = document.getElementById('pip-'+p);
    if(pip) pip.style.display = p===page ? 'block' : 'none';
  });
  document.getElementById('tabsWrap').style.display = page==='markets' ? 'block' : 'none';
  if(page==='markets') renderMarkets();
  if(page==='support') renderSupport();
  if(page==='account') renderAccount();
}

/* ── TABS ── */
function renderTabs(){
  const row = document.getElementById('tabsRow');
  row.innerHTML = '';
  Object.keys(BETS).forEach(c=>{
    const m = META[c];
    const active = state.cat === c;
    const div = document.createElement('div');
    div.className = 'tab' + (active ? ' active' : '');
    div.style.setProperty('--cc', m.color);
    div.innerHTML = m.icon + ' ' + m.label + (active ? '<div class="tab-glow"></div>' : '');
    if(active) div.style.textShadow = `0 0 10px ${m.color}88`;
    div.onclick = ()=>{ state.cat = c; setCC(m.color); renderTabs(); renderMarkets(); updateBlobs(); };
    row.appendChild(div);
  });
}

/* ── UPDATE BLOBS ── */
function updateBlobs(){
  const color = cc();
  document.getElementById('blob1').style.background = color;
  document.getElementById('blob2').style.background = color;
  document.getElementById('scanline').style.background = `linear-gradient(90deg,transparent,${color}44,transparent)`;
}

/* ── MARKETS PAGE ── */
function renderMarkets(){
  const m = META[state.cat];
  const color = m.color;
  const container = document.getElementById('pageMarkets');

  // ── TRENDING BAR — neon orange ──
  const OG = '#ff6a00';
  const OG2 = '#ff9a3c';
  const trendItems = [m.trend, '🔥 '+BETS[state.cat].filter(b=>b.hot).map(b=>b.q.slice(0,30)+'…').join(' · '),'⚡ BET NOW · WIN BIG · WISHWORK','📈 LIVE PREDICTION MARKET'];
  const trendText = trendItems.join('   ✦   ');

  let html = `
  <div style="margin:12px 14px 0;position:relative;overflow:hidden;border-radius:16px;height:48px;
    background:linear-gradient(135deg,rgba(255,106,0,0.28) 0%,rgba(20,12,4,0.92) 30%,rgba(10,8,4,0.95) 60%,rgba(255,106,0,0.18) 100%);
    backdrop-filter:blur(30px);-webkit-backdrop-filter:blur(30px);
    border:1.5px solid rgba(255,106,0,0.75);
    box-shadow:0 0 0 1px rgba(255,106,0,0.12),0 0 24px rgba(255,106,0,0.60),0 0 48px rgba(255,106,0,0.28),0 0 80px rgba(255,80,0,0.12),inset 0 1px 0 rgba(255,180,80,0.40),inset 0 -1px 0 rgba(0,0,0,0.50),inset 0 0 40px rgba(255,106,0,0.06);
    animation:orangeBarPulse 2.5s ease-in-out infinite;display:flex;align-items:center;">
    <div style="position:absolute;top:0;left:0;right:0;height:50%;background:linear-gradient(180deg,rgba(255,180,80,0.22) 0%,rgba(255,106,0,0.04) 70%,transparent 100%);border-radius:15px 15px 80% 80%;pointer-events:none;z-index:0"></div>
    <div style="position:absolute;top:0;left:0;right:0;height:1.5px;background:linear-gradient(90deg,transparent 0%,rgba(255,106,0,0.5) 10%,rgba(255,180,80,1) 35%,rgba(255,255,200,0.95) 50%,rgba(255,180,80,1) 65%,rgba(255,106,0,0.5) 90%,transparent 100%);box-shadow:0 0 14px ${OG},0 0 28px rgba(255,106,0,0.5);z-index:2"></div>
    <div style="position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,106,0,0.5),transparent);z-index:2"></div>
    <div style="position:absolute;top:0;left:-130%;width:55%;height:100%;background:linear-gradient(105deg,transparent 0%,rgba(255,180,80,0.12) 40%,rgba(255,255,150,0.06) 55%,transparent 100%);animation:goldShine 3s ease-in-out infinite;pointer-events:none;z-index:1"></div>
    <div style="position:relative;z-index:3;flex-shrink:0;display:flex;align-items:center;gap:6px;height:100%;padding:0 16px;background:linear-gradient(160deg,rgba(255,106,0,0.70),rgba(255,60,0,0.85),rgba(180,50,0,0.90));border-right:1.5px solid rgba(255,140,40,0.60);box-shadow:4px 0 20px rgba(255,106,0,0.40),inset -1px 0 0 rgba(255,200,100,0.20),inset 0 1px 0 rgba(255,200,100,0.25);">
      <span style="width:8px;height:8px;border-radius:50%;background:radial-gradient(circle,#fff9 30%,${OG} 100%);animation:ldot 1s ease-in-out infinite;box-shadow:0 0 10px #fff,0 0 20px ${OG},0 0 32px rgba(255,106,0,0.6);flex-shrink:0;display:inline-block"></span>
      <span style="font-family:'Oswald',sans-serif;font-weight:700;font-size:12px;letter-spacing:2.5px;color:#fff;text-shadow:0 0 12px rgba(255,200,80,0.9),0 1px 0 rgba(0,0,0,0.5);">TRENDING</span>
    </div>
    <div style="position:relative;z-index:3;flex:1;overflow:hidden;height:100%;display:flex;align-items:center;">
      <div style="position:absolute;left:0;top:0;bottom:0;width:28px;background:linear-gradient(90deg,rgba(14,8,2,0.95),transparent);z-index:2;pointer-events:none"></div>
      <div style="position:absolute;right:0;top:0;bottom:0;width:28px;background:linear-gradient(270deg,rgba(14,8,2,0.95),transparent);z-index:2;pointer-events:none"></div>
      <div style="display:flex;animation:marquee 22s linear infinite;white-space:nowrap;will-change:transform;padding-left:16px;">
        <span style="display:inline-block;font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:700;">
          <span style="color:rgba(255,200,120,0.55);letter-spacing:3px;font-size:9px;font-family:'Oswald',sans-serif;">▶&nbsp;</span><span style="color:#fff;text-shadow:0 0 8px rgba(255,160,60,0.6)">${trendText}</span>
          &nbsp;&nbsp;&nbsp;<span style="color:${OG};opacity:0.6">✦</span>&nbsp;&nbsp;&nbsp;
          <span style="color:#fff;text-shadow:0 0 8px rgba(255,160,60,0.6)">${trendText}</span>
          &nbsp;&nbsp;&nbsp;<span style="color:${OG};opacity:0.6">✦</span>&nbsp;&nbsp;&nbsp;
        </span>
      </div>
    </div>
    <div style="position:relative;z-index:3;flex-shrink:0;display:flex;align-items:center;gap:5px;padding:0 14px;height:100%;border-left:1.5px solid rgba(255,106,0,0.45);background:linear-gradient(160deg,rgba(255,106,0,0.14),rgba(0,0,0,0.3));box-shadow:inset 1px 0 0 rgba(255,200,100,0.12);">
      <span style="font-size:14px;line-height:1">🔥</span>
      <div>
        <div style="font-family:'Oswald',sans-serif;font-weight:700;font-size:14px;line-height:1;color:${OG2};text-shadow:0 0 12px ${OG},0 0 24px rgba(255,106,0,0.5);">${BETS[state.cat].filter(b=>b.hot).length}</div>
        <div style="font-family:'Oswald',sans-serif;font-size:7px;font-weight:600;letter-spacing:1.5px;color:rgba(255,160,60,0.65);line-height:1;margin-top:1px">HOT</div>
      </div>
    </div>
  </div>`;

  // balance card
  html += `<div id="balCard" class="skeuo-card" style="margin:12px 14px 0;border-radius:24px;padding:22px;position:relative;overflow:hidden;background:linear-gradient(145deg,rgba(255,255,255,0.09) 0%,rgba(0,212,255,0.05) 40%,rgba(255,255,255,0.02) 70%,rgba(255,215,0,0.04) 100%);backdrop-filter:blur(50px);border:1px solid rgba(255,255,255,0.14);box-shadow:0 28px 90px rgba(0,0,0,0.65),inset 0 1px 0 rgba(255,255,255,0.22),inset 0 -1px 0 rgba(0,0,0,0.35),0 0 0 1px rgba(0,212,255,0.08),0 0 40px ${color}22;animation:liquidWave 8s ease-in-out infinite">
    <div style="position:absolute;top:-60px;right:-60px;width:200px;height:200px;border-radius:50%;background:${color};filter:blur(80px);opacity:0.14;animation:glowBreathe 3s ease-in-out infinite"></div>
    <div style="position:absolute;bottom:-40px;left:-20px;width:140px;height:140px;border-radius:50%;background:#ffd700;filter:blur(60px);opacity:0.06;animation:glowBreathe 4s ease-in-out infinite reverse"></div>
    <div style="position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,${color}cc,rgba(255,215,0,0.4),transparent)"></div>
    <div style="position:relative;z-index:1">
      <div class="bal-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="animation:bounceUp 2s infinite"><path d="M8 5H6C4.9 5 4 5.9 4 7V9C4 11.2 5.5 13 7.5 13.5" stroke="#ffd700" stroke-width="2" stroke-linecap="round"/><path d="M16 5H18C19.1 5 20 5.9 20 7V9C20 11.2 18.5 13 16.5 13.5" stroke="#ffd700" stroke-width="2" stroke-linecap="round"/><path d="M8 5C8 5 8 13 12 15C16 13 16 5 16 5H8Z" fill="#ffd700" opacity="0.8"/><line x1="12" y1="15" x2="12" y2="19" stroke="#ffd700" stroke-width="2"/><line x1="8" y1="19" x2="16" y2="19" stroke="#ffd700" stroke-width="2" stroke-linecap="round"/></svg>
        Your Balance
      </div>
      <div class="bal-amount">
        <span class="bal-rupee">₹</span>
        <span class="bal-num" id="balNum">${state.bal}</span>
      </div>
      <div class="bal-btns">
        <button class="dep-btn skeuo-card" onclick="openDeposit()" style="background:linear-gradient(145deg,${color}33,${color}14,${color}22);box-shadow:0 0 32px ${color}55,0 0 64px ${color}22,inset 0 1px 0 rgba(255,255,255,0.22),inset 0 -1px 0 rgba(0,0,0,0.25)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/></svg>
          Deposit
        </button>
        <button class="wit-btn skeuo-card" onclick="openWithdraw()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><line x1="12" y1="19" x2="12" y2="5" stroke="#00d4ff" stroke-width="2.5" stroke-linecap="round"/><line x1="5" y1="8" x2="12" y2="5" stroke="#00d4ff" stroke-width="2.5" stroke-linecap="round"/><line x1="19" y1="8" x2="12" y2="5" stroke="#00d4ff" stroke-width="2.5" stroke-linecap="round"/></svg>
          Withdraw
        </button>
      </div>
    </div>
  </div>`;

  // ── LIVE MARKETS BAR — ISSUE 4: neon blue+pink gradient (replaces gold) ──
  html += `
  <div style="
    margin:16px 14px 10px;position:relative;overflow:hidden;border-radius:20px;
    background:linear-gradient(160deg,
      rgba(0,240,255,0.18) 0%,
      rgba(255,0,200,0.10) 25%,
      rgba(8,8,30,0.88) 55%,
      rgba(0,240,255,0.12) 100%);
    backdrop-filter:blur(40px);-webkit-backdrop-filter:blur(40px);
    border:2px solid rgba(0,240,255,0.75);
    box-shadow:
      0 0 0 1px rgba(0,240,255,0.15),
      0 0 32px rgba(0,240,255,0.55),
      0 0 64px rgba(255,0,200,0.25),
      0 0 100px rgba(0,240,255,0.10),
      inset 0 2px 0 rgba(255,255,255,0.28),
      inset 0 -2px 0 rgba(0,0,0,0.40),
      inset 2px 0 0 rgba(0,240,255,0.20),
      inset -2px 0 0 rgba(255,0,200,0.10),
      inset 0 0 60px rgba(0,240,255,0.05);
    animation:liveBarPulse 2.8s ease-in-out infinite;
  ">
    <!-- TOP SPECULAR HIGHLIGHT -->
    <div style="position:absolute;top:0;left:0;right:0;height:48%;
      background:linear-gradient(180deg,rgba(255,255,255,0.15) 0%,rgba(0,240,255,0.05) 60%,transparent 100%);
      border-radius:20px 20px 60% 60%;pointer-events:none;z-index:0"></div>
    <!-- TOP NEON LINE — blue→pink gradient -->
    <div style="position:absolute;top:0;left:0;right:0;height:2px;
      background:linear-gradient(90deg,transparent 0%,rgba(0,240,255,0.5) 15%,rgba(0,240,255,1) 35%,rgba(255,255,255,0.95) 50%,rgba(255,0,200,1) 65%,rgba(255,0,200,0.5) 85%,transparent 100%);
      box-shadow:0 0 16px ${LIVE_BLUE},0 0 32px rgba(255,0,200,0.5);z-index:2"></div>
    <!-- BOTTOM LINE -->
    <div style="position:absolute;bottom:0;left:0;right:0;height:1px;
      background:linear-gradient(90deg,transparent,rgba(0,240,255,0.5),rgba(255,0,200,0.5),transparent);
      box-shadow:0 0 8px rgba(0,240,255,0.4);z-index:2"></div>
    <!-- LEFT ACCENT PILLAR — blue→pink -->
    <div style="position:absolute;left:0;top:0;bottom:0;width:4px;
      background:linear-gradient(180deg,rgba(0,240,255,0.4),${LIVE_BLUE},${LIVE_PINK},rgba(255,0,200,0.3));
      box-shadow:3px 0 20px ${LIVE_BLUE}aa,6px 0 40px rgba(0,240,255,0.3);z-index:2"></div>
    <!-- SHINE SWEEP — blue shimmer -->
    <div style="position:absolute;top:0;left:-130%;width:60%;height:100%;
      background:linear-gradient(105deg,transparent 0%,rgba(0,240,255,0.10) 40%,rgba(255,0,200,0.07) 55%,transparent 100%);
      animation:liveShine 3.5s ease-in-out infinite;pointer-events:none;z-index:1"></div>
    <!-- CONTENT -->
    <div style="position:relative;z-index:3;padding:14px 16px 14px 20px;">
      <!-- ROW 1 -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:10px">
          <!-- Icon box — blue+pink glow -->
          <div style="
            width:40px;height:40px;border-radius:12px;flex-shrink:0;
            background:linear-gradient(145deg,rgba(0,240,255,0.28),rgba(255,0,200,0.14),rgba(8,8,30,0.6));
            border:1.5px solid rgba(0,240,255,0.70);
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 0 18px rgba(0,240,255,0.50),inset 0 1px 0 rgba(255,255,255,0.35),inset 0 -1px 0 rgba(0,0,0,0.3);
            filter:brightness(1.8) saturate(2.0) drop-shadow(0 0 6px ${LIVE_BLUE});">
            ${m.icon}
          </div>
          <div>
            <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:18px;color:#ffffff;letter-spacing:0.5px;line-height:1.1;
              text-shadow:0 0 20px rgba(0,240,255,0.5),0 2px 4px rgba(0,0,0,0.8);">
              ${m.label}
              <span style="background:linear-gradient(90deg,${LIVE_BLUE},${LIVE_PINK});-webkit-background-clip:text;-webkit-text-fill-color:transparent;
                filter:drop-shadow(0 0 8px ${LIVE_BLUE});">
                Markets
              </span>
            </div>
            <div style="font-family:'Oswald',sans-serif;font-size:8px;font-weight:600;letter-spacing:4px;text-transform:uppercase;margin-top:3px;
              color:rgba(0,240,255,0.65);text-shadow:0 0 8px rgba(0,240,255,0.5);">
              ◆ PREDICTION EXCHANGE ◆
            </div>
          </div>
        </div>
        <!-- RIGHT: count pill — blue+pink gradient -->
        <div style="
          font-family:'Oswald',sans-serif;font-weight:700;font-size:15px;letter-spacing:1px;
          background:linear-gradient(90deg,${LIVE_BLUE},${LIVE_PINK});-webkit-background-clip:text;-webkit-text-fill-color:transparent;
          filter:drop-shadow(0 0 10px ${LIVE_BLUE});
          border:2px solid rgba(0,240,255,0.80);
          padding:7px 16px;border-radius:50px;
          box-shadow:0 0 22px rgba(0,240,255,0.45),0 0 44px rgba(255,0,200,0.20),inset 0 1px 0 rgba(255,255,255,0.30),inset 0 -1px 0 rgba(0,0,0,0.3);
          animation:liveCountPulse 2.5s ease-in-out infinite;white-space:nowrap;
          background-clip:text;">
          ${BETS[state.cat].length}
          <span style="font-size:11px;font-weight:600;opacity:0.85;letter-spacing:2px"> MARKETS</span>
        </div>
      </div>
      <!-- ROW 2 -->
      <div style="display:flex;align-items:center;gap:8px">
        <!-- LIVE indicator — red (kept as is, not live market color) -->
        <div style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:50px;
          background:linear-gradient(135deg,rgba(239,68,68,0.25),rgba(239,68,68,0.10));
          border:1.5px solid rgba(239,68,68,0.70);
          box-shadow:0 0 14px rgba(239,68,68,0.45),0 0 28px rgba(239,68,68,0.20),inset 0 1px 0 rgba(255,255,255,0.15);">
          <span style="width:7px;height:7px;border-radius:50%;background:#ef4444;animation:ldot 1s ease-in-out infinite;box-shadow:0 0 10px #ef4444,0 0 20px rgba(239,68,68,0.6);display:inline-block;flex-shrink:0"></span>
          <span style="font-family:'Oswald',sans-serif;font-weight:700;font-size:11px;letter-spacing:2px;color:#ff6b6b;text-shadow:0 0 8px #ef4444,0 0 16px rgba(239,68,68,0.5);">LIVE</span>
        </div>
        <!-- Volume chip — blue+pink -->
        <div style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:50px;
          background:linear-gradient(135deg,rgba(0,240,255,0.15),rgba(255,0,200,0.08),rgba(0,0,0,0.25));
          border:1.5px solid rgba(0,240,255,0.55);
          box-shadow:0 0 12px rgba(0,240,255,0.28),inset 0 1px 0 rgba(255,255,255,0.18);">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17" stroke="${LIVE_BLUE}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span style="font-family:'Oswald',sans-serif;font-weight:700;font-size:11px;letter-spacing:1px;color:${LIVE_BLUE};text-shadow:0 0 10px ${LIVE_BLUE},0 0 20px rgba(0,240,255,0.5);">24H VOL</span>
          <span style="font-family:'Oswald',sans-serif;font-weight:700;font-size:12px;color:#fff;text-shadow:0 0 8px rgba(255,255,255,0.6);letter-spacing:.5px">₹4.2L+</span>
        </div>
        <!-- Hot chip — blue+pink glow -->
        <div style="display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border-radius:50px;
          background:linear-gradient(135deg,rgba(0,240,255,0.15),rgba(255,0,200,0.10));
          border:1.5px solid rgba(0,240,255,0.50);
          box-shadow:0 0 12px rgba(0,240,255,0.28),inset 0 1px 0 rgba(255,255,255,0.15);">
          <span style="font-size:11px">🔥</span>
          <span style="font-family:'Oswald',sans-serif;font-weight:700;font-size:11px;
            background:linear-gradient(90deg,${LIVE_BLUE},${LIVE_PINK});-webkit-background-clip:text;-webkit-text-fill-color:transparent;
            letter-spacing:1px;filter:drop-shadow(0 0 4px ${LIVE_BLUE});">${BETS[state.cat].filter(b=>b.hot).length} HOT</span>
        </div>
      </div>
    </div>
  </div>`;

  // market cards
  const bc = BADGE_COLORS[state.cat];
  BETS[state.cat].forEach((b,i)=>{
    const barC = b.odds>65?"#22c55e":b.odds>40?color:"#ef4444";
    const numC = b.odds>65?"#22c55e":b.odds>40?"#f1f5f9":"#ef4444";
    const numShadow = b.odds>65?"0 0 14px rgba(34,197,94,.6)":b.odds>40?`0 0 14px ${color}99`:"0 0 14px rgba(239,68,68,.6)";
    const isLive = b.odds>70;
    const hotEl = b.hot ? `<span class="hot-badge">🔥 HOT</span>` : '';
    const liveEl = isLive ? `<span class="live-badge"><span class="live-dot"></span>LIVE</span>` : '';
    html += `<div class="market-card skeuo-card card-hover" style="animation-delay:${i*0.04}s">
      <div class="card-glow-top" style="background:linear-gradient(90deg,transparent,${color}dd,rgba(255,215,0,0.3),transparent);box-shadow:0 0 8px ${color}66"></div>
      <div class="card-glow-bottom" style="background:linear-gradient(90deg,transparent,${color}33,transparent)"></div>
      <div class="card-glow-left" style="background:linear-gradient(180deg,${color},${color}88,transparent);box-shadow:2px 0 12px ${color}66"></div>
      <div class="card-badge-row">
        <span class="badge" style="background:${bc.bg};color:${bc.color};border:${bc.border};box-shadow:0 0 12px ${bc.color}44;font-size:11px;padding:5px 12px">${m.icon} ${m.label}</span>
        ${hotEl}${liveEl}
        <span style="margin-left:auto;display:inline-flex;align-items:center;gap:4px;
          font-family:'Oswald',sans-serif;font-weight:700;font-size:12px;letter-spacing:1px;color:#ffd700;
          background:linear-gradient(135deg,rgba(255,215,0,0.20),rgba(255,165,0,0.10),rgba(0,0,0,0.2));
          border:1.5px solid rgba(255,215,0,0.65);padding:5px 11px;border-radius:50px;
          text-shadow:0 0 12px #ffd700,0 0 24px rgba(255,215,0,0.5);
          box-shadow:0 0 14px rgba(255,215,0,0.35),0 0 28px rgba(255,215,0,0.12),inset 0 1px 0 rgba(255,255,255,0.25);">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17" stroke="#ffd700" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
          ₹${VOLS[i%11]} VOL
        </span>
      </div>
      <div class="card-q">${b.q}</div>
      <div class="odds-row">
        <div class="odds-num" style="color:${numC};text-shadow:${numShadow}">${b.odds}%</div>
        <div class="odds-bar-wrap">
          <div class="odds-bar-fill" style="width:${b.odds}%;background:linear-gradient(90deg,${barC}88,${barC});box-shadow:0 0 10px ${barC}aa,0 0 4px ${barC}"></div>
        </div>
        <div class="odds-label">chance</div>
      </div>
      <div class="bet-btns">
        <button class="bet-btn skeuo-card neon-green-btn" onclick="openBet(${i},'YES')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polyline points="22,7 13.5,15.5 8.5,10.5 2,17" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          YES ₹${b.odds}
        </button>
        <button class="bet-btn skeuo-card neon-red-btn" onclick="openBet(${i},'NO')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polyline points="22,17 13.5,8.5 8.5,13.5 2,7" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          NO ₹${100-b.odds}
        </button>
      </div>
    </div>`;
  });

  container.innerHTML = html;
  updateBal();
}

/* ── SUPPORT PAGE ── */
function renderSupport(){
  const faqs = [
    {q:"How do I deposit?",a:"Tap Deposit → Enter amount → Scan QR with GPay/Paytm → Enter UTR number. Credited within 5–10 minutes."},
    {q:"How do I withdraw?",a:"Save your UPI ID first in Portfolio. Then tap Withdraw → enter amount → our team processes within 30 minutes."},
    {q:"When does my bet resolve?",a:"Bets resolve within 24 hours of the event ending. WIN/LOSE status will update in your Portfolio."},
    {q:"What is the minimum bet?",a:"Minimum bet is ₹10. Maximum is ₹10,000 per market per day."},
    {q:"Is this platform legal?",a:"WISHWORK operates as a skill-based prediction game. Users are responsible for local regulations."}
  ];
  let html = `<div style="padding:20px 14px;animation:fadeUp .4s ease">
    <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:20px;margin-bottom:4px;display:flex;align-items:center;gap:10px">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="animation:pulse 2s infinite"><circle cx="12" cy="12" r="10" stroke="#00d4ff" stroke-width="2"/><path d="M12 8C10.3 8 9 9.3 9 11" stroke="#00d4ff" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16" r="1" fill="#00d4ff"/></svg>
      Support Center
    </div>
    <p style="color:#64748b;font-size:13px;margin-bottom:20px">We're here 24/7 — reach us instantly</p>
    <div class="glass" style="border-radius:18px;padding:20px;margin-bottom:12px;border:1px solid rgba(34,168,255,0.2);background:rgba(34,168,255,0.05)">
      <div style="display:flex;align-items:center;gap:14px">
        <div style="width:52px;height:52px;border-radius:16px;background:rgba(34,168,255,0.15);display:flex;align-items:center;justify-content:center;border:1px solid rgba(34,168,255,0.3)">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="#229ED9" style="animation:pulse 2s infinite"><path d="M11.994 2a10 10 0 100 20 10 10 0 000-20zm3.18 6.624l-1.67 7.872c-.126.561-.455.698-.919.434l-2.546-1.876-1.228 1.183c-.135.136-.25.25-.513.25l.183-2.59 4.714-4.257c.205-.182-.044-.283-.318-.1L7.809 14.3l-2.5-.78c-.544-.17-.555-.544.113-.806l9.767-3.765c.453-.165.85.11.705.756l-.72-.08z"/></svg>
        </div>
        <div>
          <div style="font-weight:800;font-size:15px;margin-bottom:2px">Telegram Support</div>
          <div style="font-size:12px;color:#94a3b8">@WISHWORKONLINE · Average reply in 5 mins</div>
        </div>
      </div>
      <button class="neon-btn skeuo-card" style="margin-top:14px;background:linear-gradient(145deg,rgba(34,168,255,0.18),rgba(34,168,255,0.06));border:1.5px solid rgba(34,168,255,0.6);color:#229ED9;font-size:13px;border-radius:14px" onclick="window.open('https://t.me/WISHWORKONLINE','_blank')">Open Telegram Chat →</button>
    </div>`;
  faqs.forEach(f=>{
    html += `<div class="glass" style="border-radius:14px;padding:16px;margin-bottom:10px">
      <div style="font-weight:700;font-size:13px;margin-bottom:6px;display:flex;align-items:center;gap:8px">
        <svg width="12" height="12" viewBox="0 0 24 24" style="animation:twinkle 1.5s ease-in-out infinite"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="#ffd700" stroke="#ffd700" stroke-width="1"/></svg>
        ${f.q}
      </div>
      <div style="font-size:12px;color:#94a3b8;line-height:1.5">${f.a}</div>
    </div>`;
  });
  html += '</div>';
  document.getElementById('pageSupport').innerHTML = html;
}

/* ── ACCOUNT PAGE ── */
function renderAccount(){
  let html = `<div style="padding:20px 14px;animation:fadeUp .4s ease">
    <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:20px;margin-bottom:4px;display:flex;align-items:center;gap:10px">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#ffd700" stroke-width="2"/><path d="M4 20C4 16.13 7.58 13 12 13s8 3.13 8 7" stroke="#ffd700" stroke-width="2" stroke-linecap="round"/></svg>
      My Account
    </div>
    <p style="color:#64748b;font-size:13px;margin-bottom:20px">Manage your profile and settings</p>
    <div class="acc-tabs">
      <button class="acc-tab ${state.accountTab==='profile'?'active':''}" onclick="switchAccTab('profile')">Profile</button>
      <button class="acc-tab ${state.accountTab==='settings'?'active':''}" onclick="switchAccTab('settings')">Settings</button>
      <button class="acc-tab ${state.accountTab==='security'?'active':''}" onclick="switchAccTab('security')">Security</button>
    </div>
    <div id="accContent"></div>
  </div>`;
  document.getElementById('pageAccount').innerHTML = html;
  renderAccTab();
}

function switchAccTab(tab){
  state.accountTab = tab;
  document.querySelectorAll('.acc-tab').forEach(el=>{
    el.classList.toggle('active', el.textContent.toLowerCase()===tab);
  });
  renderAccTab();
}

function renderAccTab(){
  const el = document.getElementById('accContent');
  if(!el) return;
  const color = cc();
  if(state.accountTab==='profile'){
    const wins = state.txList.filter(t=>t.status==='WIN'||t.status==='WON').length;
    const upiSection = state.savedUpi
      ? `<div style="display:flex;align-items:center;justify-content:space-between"><div><div style="font-size:11px;color:#64748b;margin-bottom:3px">Linked UPI</div><div style="color:${color};font-weight:700">${state.savedUpi}</div></div><button onclick="state.savedUpi='';LS.save();renderAccTab()" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#94a3b8;padding:6px 12px;font-size:11px;cursor:pointer;font-weight:600">Edit</button></div>`
      : `<input class="text-inp" style="margin-bottom:8px" placeholder="UPI ID (e.g. name@paytm)" id="accUpiInp" value="${state.upi}" oninput="state.upi=this.value"/>
         <input class="text-inp" style="margin-bottom:12px" placeholder="Phone Number" id="accPhoneInp" value="${state.phone}" oninput="state.phone=this.value"/>
         <button class="neon-btn skeuo-card neon-gold-btn" onclick="saveUpi()" style="font-size:13px;border-radius:14px">Save Payment Info</button>`;
    el.innerHTML = `
      <div class="glass" style="border-radius:18px;padding:20px;margin-bottom:14px;text-align:center">
        <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,${color},#ffd700);margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:28px;box-shadow:0 0 30px ${color}66;border:3px solid rgba(255,255,255,0.15)">👤</div>
        <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:18px">User</div>
        <div style="font-size:12px;color:#64748b;margin-top:2px">user@example.com</div>
        <div style="margin-top:12px;display:flex;justify-content:center;gap:12px">
          <div style="text-align:center;padding:10px 16px;background:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(255,255,255,0.08)"><div style="font-weight:800;font-size:18px;color:#22c55e">₹${state.bal}</div><div style="font-size:10px;color:#64748b;margin-top:2px">Balance</div></div>
          <div style="text-align:center;padding:10px 16px;background:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(255,255,255,0.08)"><div style="font-weight:800;font-size:18px;color:#ffd700">${state.txList.length}</div><div style="font-size:10px;color:#64748b;margin-top:2px">Total Bets</div></div>
          <div style="text-align:center;padding:10px 16px;background:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(255,255,255,0.08)"><div style="font-weight:800;font-size:18px;color:#00d4ff">${wins}</div><div style="font-size:10px;color:#64748b;margin-top:2px">Wins</div></div>
        </div>
      </div>
      <div class="glass" style="border-radius:18px;padding:16px;margin-bottom:12px">
        <div style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:14px">Withdrawal Method</div>
        ${upiSection}
      </div>`;
  } else if(state.accountTab==='settings'){
    const settings=[{label:"Push Notifications",sub:"Bet updates and results",def:true},{label:"Dark Mode",sub:"Always on",def:true},{label:"Sound Effects",sub:"Bet placement sounds",def:false},{label:"Auto-logout",sub:"After 30 minutes of inactivity",def:false}];
    el.innerHTML = settings.map(s=>`
      <div class="glass" style="border-radius:14px;padding:14px 16px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between">
        <div><div style="font-weight:600;font-size:13px">${s.label}</div><div style="font-size:11px;color:#64748b;margin-top:2px">${s.sub}</div></div>
        <div style="width:44px;height:24px;border-radius:12px;background:${s.def?color:'rgba(255,255,255,0.1)'};border:1px solid ${s.def?color:'rgba(255,255,255,0.1)'};position:relative;cursor:pointer;transition:all .3s">
          <div style="position:absolute;top:3px;left:${s.def?'20px':'3px'};width:18px;height:18px;border-radius:50%;background:white;transition:left .3s;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>
        </div>
      </div>`).join('');
  } else {
    el.innerHTML = `
      <div class="glass" style="border-radius:18px;padding:18px;margin-bottom:12px;border:1px solid rgba(34,197,94,0.2);background:rgba(34,197,94,0.04)">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px"><span style="font-size:20px">🔒</span><div style="font-weight:700;font-size:14px">Account Secure</div></div>
        <div style="font-size:12px;color:#64748b">Your account is protected. Last login: Today, 8:17 AM</div>
      </div>
      <button class="neon-btn skeuo-card neon-green-btn" style="margin-bottom:10px;font-size:13px;border-radius:14px" onclick="showToast('Password reset link sent!','success')">Change Password</button>
      <button class="neon-btn skeuo-card neon-gold-btn" style="margin-bottom:10px;font-size:13px;border-radius:14px" onclick="showToast('2FA setup coming soon!','info')">Enable 2FA (Coming Soon)</button>
      <button class="neon-btn skeuo-card neon-red-btn" style="font-size:13px;border-radius:14px" onclick="logout()">Logout</button>`;
  }
}

function saveUpi(){
  if(state.upi && state.phone){
    state.savedUpi = state.upi;
    LS.save();
    showToast('✅ Payment info saved!');
    renderAccTab();
  }
}

function logout(){
  state.bal=0; state.txList=[];
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
  const color = cc();
  // Count wins — support both WIN and WON status from admin
  const wins = state.txList.filter(t=>t.status==='WIN'||t.status==='WON').length;
  document.getElementById('portStats').innerHTML = [
    {label:'Balance',val:`₹${state.bal}`,color:'#22c55e'},
    {label:'Bets',val:state.txList.length,color:'#ffd700'},
    {label:'Wins',val:wins,color:'#00d4ff'}
  ].map(s=>`<div class="glass port-stat" style="border-radius:12px;padding:12px">
    <div class="port-stat-val" style="color:${s.color}">${s.val}</div>
    <div class="port-stat-lbl">${s.label}</div>
  </div>`).join('');

  // UPI
  const upiEl = document.getElementById('portUpiSection');
  if(state.savedUpi){
    upiEl.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between"><div><div style="font-size:11px;color:#64748b;margin-bottom:3px">Linked UPI</div><div style="color:${color};font-weight:700">${state.savedUpi}</div></div><button onclick="state.savedUpi='';LS.save();renderPortfolio()" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#94a3b8;padding:6px 12px;font-size:11px;cursor:pointer;font-weight:600">Edit</button></div>`;
  } else {
    upiEl.innerHTML=`<input class="text-inp" style="margin-bottom:8px" placeholder="UPI ID (e.g. name@paytm)" id="portUpiInp" value="${state.upi}" oninput="state.upi=this.value"/>
      <input class="text-inp" style="margin-bottom:12px" placeholder="Phone Number" id="portPhoneInp" value="${state.phone}" oninput="state.phone=this.value"/>
      <button class="neon-btn skeuo-card neon-gold-btn" style="font-size:13px;border-radius:14px" onclick="saveUpiPort()">Save Payment Info</button>`;
  }

  // TX list
  const txEl = document.getElementById('txList');
  if(state.txList.length===0){
    txEl.innerHTML=`<div class="tx-empty"><div class="tx-emoji">📭</div>No transactions yet</div>`;
  } else {
    txEl.innerHTML = state.txList.map(tx=>{
      const s = tx.status ? tx.status.toUpperCase() : 'PENDING';
      let sc='#ffd700', sbg='rgba(245,158,11,.1)';
      if(s==='WIN'||s==='WON'||s==='COMPLETED'){sc='#22c55e';sbg='rgba(34,197,94,.1)';}
      else if(s==='LOST'||s==='LOSE'){sc='#ef4444';sbg='rgba(239,68,68,.1)';}
      return `<div class="glass" style="border-radius:14px;padding:13px;margin-bottom:8px;border:1px solid rgba(255,255,255,0.06)">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
          <div>
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:2px">${tx.type}</div>
            <div style="font-size:15px;font-weight:800">${tx.amt}</div>
            <div style="font-size:10px;color:#475569;margin-top:2px">${tx.q||''} · ${tx.time}</div>
          </div>
          <div style="padding:5px 10px;border-radius:8px;font-size:10px;font-weight:700;text-transform:uppercase;background:${sbg};color:${sc};white-space:nowrap">${s}</div>
        </div>
      </div>`;
    }).join('');
  }
}

function saveUpiPort(){
  if(state.upi && state.phone){
    state.savedUpi=state.upi;
    LS.save();
    showToast('✅ Payment info saved!');
    renderPortfolio();
  }
}

/* ── BET SHEET ── */
function openBet(idx, side){
  const b = BETS[state.cat][idx];
  state.betInfo = b;
  state.side = side;
  state.betAmt = '';

  const color = side==='YES'?'#22c55e':'#ef4444';
  document.getElementById('betSheetLine').style.background = `linear-gradient(90deg,transparent,${color}88,transparent)`;
  document.getElementById('betQ').textContent = b.q;

  const sideIcon = side==='YES'
    ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><polyline points="20,6 9,17 4,12" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/></svg>`;
  document.getElementById('betSideLine').innerHTML = `${sideIcon} ${side} · 1.9× payout on win`;

  const chipsEl = document.getElementById('amtChips');
  chipsEl.innerHTML = [50,100,250,500,1000].map(v=>`<div class="amt-chip" onclick="selectChip(${v},'${color}')">₹${v>=1000?'1K':v}</div>`).join('');

  document.getElementById('betAmtInp').style.border = `1.5px solid ${color}99`;
  document.getElementById('betAmtInp').style.boxShadow = `0 0 0 3px ${color}18,inset 0 2px 10px rgba(0,0,0,0.4)`;
  document.getElementById('betAmtInp').value = '';
  document.getElementById('payoutAmt').textContent = '₹ 0.00';

  const btn = document.getElementById('placeBetBtn');
  const btnIcon = side==='YES'
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polyline points="20,6 9,17 4,12" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18" stroke="white" stroke-width="3" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="white" stroke-width="3" stroke-linecap="round"/></svg>`;
  btn.innerHTML = `${btnIcon} Buy ${side}`;
  if(side==='YES'){
    btn.style.cssText = `width:100%;padding:16px;border:1.5px solid rgba(34,197,94,0.7);border-radius:14px;font-weight:800;font-size:14px;cursor:pointer;background:linear-gradient(145deg,rgba(34,197,94,0.3),rgba(34,197,94,0.15),rgba(34,197,94,0.25));color:#22c55e;backdrop-filter:blur(20px);box-shadow:0 0 30px rgba(34,197,94,0.5),0 0 60px rgba(34,197,94,0.2),inset 0 1px 0 rgba(255,255,255,0.2);text-shadow:0 0 14px #22c55e,0 0 28px rgba(34,197,94,0.6);display:flex;align-items:center;justify-content:center;gap:8px;overflow:hidden;position:relative`;
  } else {
    btn.style.cssText = `width:100%;padding:16px;border:1.5px solid rgba(239,68,68,0.7);border-radius:14px;font-weight:800;font-size:14px;cursor:pointer;background:linear-gradient(145deg,rgba(239,68,68,0.3),rgba(239,68,68,0.15),rgba(239,68,68,0.25));color:#ef4444;backdrop-filter:blur(20px);box-shadow:0 0 30px rgba(239,68,68,0.5),0 0 60px rgba(239,68,68,0.2),inset 0 1px 0 rgba(255,255,255,0.2);text-shadow:0 0 14px #ef4444;display:flex;align-items:center;justify-content:center;gap:8px;overflow:hidden;position:relative`;
  }

  document.getElementById('backdrop').classList.remove('hidden');
  document.getElementById('betSheet').classList.remove('hidden');
}

function selectChip(v, color){
  state.betAmt = String(v);
  document.getElementById('betAmtInp').value = v;
  document.querySelectorAll('.amt-chip').forEach(el=>{
    el.classList.toggle('active', el.textContent === `₹${v>=1000?'1K':v}`);
  });
  updateBetAmt(v);
}

function updateBetAmt(val){
  state.betAmt = val;
  const p = val?(parseFloat(val)*1.9).toFixed(2):'0.00';
  document.getElementById('payoutAmt').textContent = `₹ ${p}`;
}

function placeBet(){
  const a = parseInt(state.betAmt);
  if(!a||a<=0) return showToast('Enter a valid amount','info');
  if(a>state.bal) return showToast('Insufficient balance 💸','info');
  state.bal -= a;
  const now = new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  state.txList.unshift({
    id: Date.now(),
    type: `BET: ${state.side}`,
    q: state.betInfo.q.slice(0,35)+'…',
    amt: `₹${a}`,
    status: 'PENDING',
    time: now
  });
  LS.save(); // persist immediately
  closeAll();
  showToast(`${state.side==='YES'?'✅':'❌'} Bet placed — ₹${a} on ${state.side}`);
  updateBal();
}

/* ── DEPOSIT ── */
function openDeposit(){
  document.getElementById('depStep1').classList.remove('hidden');
  document.getElementById('depStep2').classList.add('hidden');
  document.getElementById('depAmtInp').value = '';
  document.getElementById('backdrop').classList.remove('hidden');
  document.getElementById('depSheet').classList.remove('hidden');
}
function generateQR(){
  const a = parseInt(document.getElementById('depAmtInp').value);
  if(!a||a<=0) return showToast('Enter deposit amount','info');
  document.getElementById('qrAmt').textContent = `₹${a}`;
  document.getElementById('payAmt').textContent = `Pay ₹${a}`;
  document.getElementById('depStep1').classList.add('hidden');
  document.getElementById('depStep2').classList.remove('hidden');
  document.getElementById('utrInp').value = '';
  state.timer = 80;
  updateTimerCircle();
  clearInterval(state.timerInt);
  state.timerInt = setInterval(()=>{
    state.timer--;
    if(state.timer<=0){ clearInterval(state.timerInt); state.timer=0; }
    updateTimerCircle();
  },1000);
}
function updateTimerCircle(){
  document.getElementById('timerNum').textContent = state.timer;
  const offset = 150.8*(1-state.timer/80);
  document.getElementById('timerCircle').style.strokeDashoffset = offset;
}
function submitUTR(){
  const utr = document.getElementById('utrInp').value;
  if(!utr||utr.length<10) return showToast('Enter valid 12-digit UTR','info');
  const amt = document.getElementById('depAmtInp').value || document.getElementById('qrAmt').textContent.replace('₹','');
  const now = new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  state.txList.unshift({
    id: Date.now(),
    type: 'DEPOSIT',
    q: 'UPI Payment',
    amt: `₹${amt}`,
    status: 'PENDING',
    time: now
  });
  LS.save();
  clearInterval(state.timerInt);
  closeAll();
  showToast('✅ Deposit submitted! Processing…');
}

/* ── WITHDRAW ── */
function openWithdraw(){
  document.getElementById('witAmtInp').value = '';
  document.getElementById('backdrop').classList.remove('hidden');
  document.getElementById('witSheet').classList.remove('hidden');
}
function handleWithdraw(){
  const a = parseInt(document.getElementById('witAmtInp').value);
  if(!a||a<=0) return showToast('Enter a valid amount','info');
  if(a>state.bal) return showToast('Insufficient balance 💸','info');
  state.bal -= a;
  const now = new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  state.txList.unshift({
    id: Date.now(),
    type: 'WITHDRAW',
    q: 'To UPI',
    amt: `₹${a}`,
    status: 'PENDING',
    time: now
  });
  LS.save();
  closeAll();
  showToast('✅ Withdrawal request sent!');
  updateBal();
}

/* ── UPDATE BALANCE ── */
function updateBal(){
  document.getElementById('navBal').textContent = state.bal;
  const balNum = document.getElementById('balNum');
  if(balNum) balNum.textContent = state.bal;
}

/* ── REAL-TIME SYNC: listen for admin changes via storage event (Issue 2 & 3) ──
   Admin panel writes updated tx statuses back to localStorage under ww_state.
   This fires in all tabs/windows immediately. */
window.addEventListener('storage', (e) => {
  if (e.key === 'ww_state') {
    LS.load();
    updateBal();
    // If portfolio is open, re-render it immediately
    const portfolio = document.getElementById('portfolio');
    if (portfolio && !portfolio.classList.contains('hidden')) {
      renderPortfolio();
    }
    // If account page is open, refresh stats
    if (state.activePage === 'account') {
      renderAccTab();
    }
  }
});

/* ── ADMIN PANEL HELPER (Issue 2: admin updates tx status then persists) ──
   The admin page calls window.adminUpdateTx(id, newStatus) then LS.save()
   which triggers the storage event above in the user tab. */
window.adminUpdateTx = function(txId, newStatus) {
  const tx = state.txList.find(t => t.id === txId);
  if (tx) {
    tx.status = newStatus;
    LS.save();
    // Also re-render if portfolio open
    const portfolio = document.getElementById('portfolio');
    if (portfolio && !portfolio.classList.contains('hidden')) {
      renderPortfolio();
    }
  }
};

/* ── INIT ── */
function init(){
  LS.load(); // restore persisted state before anything renders
  setCC(META[state.cat].color);
  renderTabs();
  renderMarkets();
  updateBal();
  // hide all pips except markets
  ['support','account'].forEach(p=>{
    const pip = document.getElementById('pip-'+p);
    if(pip) pip.style.display='none';
  });
}
init();
