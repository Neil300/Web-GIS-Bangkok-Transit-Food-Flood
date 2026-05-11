/* ============================================================
   MAP INIT
============================================================ */
const map = L.map('map', {
  center: [13.76, 100.54],
  zoom: 11,
  preferCanvas: true,
});

const tileDark = L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  { attribution: '© CartoDB', maxZoom: 19 }
);
tileDark.addTo(map);

L.control.layers({
  '🌙 Dark (CartoDB)': tileDark,
  '🗺️ OpenStreetMap' : L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution: '© OpenStreetMap', maxZoom: 19 }
  ),
}).addTo(map);

/* ★ FIX: บอก Leaflet คำนวณ size ใหม่หลัง DOM พร้อม ★ */
setTimeout(() => { map.invalidateSize(); }, 150);
window.addEventListener('resize', () => { map.invalidateSize(); });

/* ============================================================
   LAYER GROUPS
============================================================ */
const LG = {
  btsSukhumvit: L.layerGroup().addTo(map),
  btsSilom    : L.layerGroup().addTo(map),
  btsGold     : L.layerGroup().addTo(map),
  mrtBlue     : L.layerGroup().addTo(map),
  mrtPurple   : L.layerGroup().addTo(map),
  mrtYellow   : L.layerGroup().addTo(map),
  foodProd    : L.layerGroup().addTo(map),
  foodMarket  : L.layerGroup().addTo(map),
  foodRisk    : L.layerGroup().addTo(map),
  foodStore   : L.layerGroup().addTo(map),
  floodHigh   : L.layerGroup().addTo(map),
  floodWatch  : L.layerGroup().addTo(map),
  floodDrain  : L.layerGroup().addTo(map),
};

/* ============================================================
   ICONS
============================================================ */
function mkTrainIcon(color, sys) {
  const light = color === '#FFD700' || color === '#F9A825';
  const tc = light ? '#333' : '#fff';
  const lb = sys === 'bts' ? 'BTS' : 'MRT';
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};color:${tc};
      width:28px;height:28px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:7px;font-weight:800;font-family:Sarabun,sans-serif;
      border:2px solid rgba(255,255,255,.85);
      box-shadow:0 2px 8px rgba(0,0,0,.5),0 0 6px ${color}66;
      cursor:pointer;">${lb}</div>`,
    iconSize:[28,28],iconAnchor:[14,14],popupAnchor:[0,-16],
  });
}

const FOOD_CFG = {
  foodProd  : { bg:'#22c55e', icon:'🌾' },
  foodMarket: { bg:'#f97316', icon:'🏪' },
  foodRisk  : { bg:'#ef4444', icon:'⚠️' },
  foodStore : { bg:'#3b82f6', icon:'🏭' },
};

function mkFoodIcon(type, sev) {
  const c  = FOOD_CFG[type] || { bg:'#888', icon:'📍' };
  const rc = sev==='high'?'#ef4444':sev==='medium'?'#f97316':'#22c55e';
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:32px;height:32px;">
      <div style="background:${c.bg};width:32px;height:32px;border-radius:8px;
        display:flex;align-items:center;justify-content:center;font-size:15px;
        border:2.5px solid rgba(255,255,255,.8);
        box-shadow:0 3px 10px rgba(0,0,0,.5),0 0 8px ${c.bg}55;
        cursor:pointer;">${c.icon}</div>
      ${type==='foodRisk'?`<div style="position:absolute;top:-3px;right:-3px;
        width:10px;height:10px;border-radius:50%;
        background:${rc};border:2px solid #fff;"></div>`:''}
    </div>`,
    iconSize:[32,32],iconAnchor:[16,16],popupAnchor:[0,-18],
  });
}

const FLOOD_CFG = {
  floodHigh : { bg:'#ef4444', border:'#fca5a5', icon:'🌊' },
  floodWatch: { bg:'#f97316', border:'#fdba74', icon:'👁️' },
  floodDrain: { bg:'#facc15', border:'#fde68a', icon:'💧' },
};

function mkFloodIcon(type) {
  const c = FLOOD_CFG[type] || { bg:'#888', border:'#aaa', icon:'📍' };
  const anim = type==='floodHigh' ? 'animation:pulse 2s infinite;' : '';
  return L.divIcon({
    className: '',
    html: `<div style="background:${c.bg};width:32px;height:32px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;font-size:14px;
      border:2.5px solid ${c.border};
      box-shadow:0 3px 10px rgba(0,0,0,.5),0 0 10px ${c.bg}88;
      cursor:pointer;${anim}">${c.icon}</div>`,
    iconSize:[32,32],iconAnchor:[16,16],popupAnchor:[0,-18],
  });
}

/* ============================================================
   POPUPS
============================================================ */
const LINE_NAME = {
  btsSukhumvit:'BTS สายสุขุมวิท', btsSilom:'BTS สายสีลม',
  btsGold:'BTS สายสีทอง', mrtBlue:'MRT สายสีน้ำเงิน',
  mrtPurple:'MRT สายสีม่วง', mrtYellow:'MRT สายสีเหลือง',
};

function mkTrainPopup(s) {
  const light = s.color==='#FFD700'||s.color==='#F9A825';
  const tc = light?'#333':'#fff';
  const lb = s.sys==='bts'?'BTS':'MRT';
  return `
    <div class="pu-head">
      <div class="pu-icon" style="background:${s.color};color:${tc}">
        <i class="fas fa-train-subway"></i>
      </div>
      <div>
        <div class="pu-name">${s.name}</div>
        <div class="pu-line">${LINE_NAME[s.line]||s.line}</div>
      </div>
    </div>
    <table class="pu-table">
      <tr><td>รหัส</td>   <td>${s.id}</td></tr>
      <tr><td>ที่ตั้ง</td> <td>${s.loc}</td></tr>
      <tr><td>เขต</td>    <td>${s.district}</td></tr>
      <tr><td>จังหวัด</td><td>${s.province}</td></tr>
      <tr><td>พิกัด</td>  <td>${s.lat.toFixed(5)}, ${s.lng.toFixed(5)}</td></tr>
    </table>
    <div class="pu-foot">
      <span class="pbadge" style="background:${s.color};color:${tc}">${lb}</span>
      <button class="pzoom" onclick="flyTo(${s.lat},${s.lng})">
        <i class="fas fa-location-crosshairs"></i> Zoom
      </button>
    </div>`;
}

function mkFoodPopup(f) {
  const c   = FOOD_CFG[f.type] || { bg:'#888', icon:'📍' };
  const sev = f.severity || f.risk;
  const rc  = sev==='high'?'#ef4444':sev==='medium'?'#f97316':'#22c55e';
  const st  = sev==='high'?'สูง':sev==='medium'?'ปานกลาง':'ต่ำ';
  let rows = '';
  if (f.type==='foodProd')
    rows=`<tr><td>พื้นที่</td><td>${f.area} ไร่</td></tr>
          <tr><td>ผลผลิต</td><td>${f.product}</td></tr>
          <tr><td>กำลังผลิต</td><td>${f.capacity}</td></tr>`;
  if (f.type==='foodMarket')
    rows=`<tr><td>จำนวนแผง</td><td>${f.stalls} แผง</td></tr>
          <tr><td>ผู้ใช้บริการ</td><td>${f.daily}</td></tr>
          <tr><td>ครอบคลุม</td><td>${f.coverage}</td></tr>`;
  if (f.type==='foodRisk')
    rows=`<tr><td>ประชากร</td><td>${f.population?.toLocaleString()} คน</td></tr>
          <tr><td>ขาดอาหาร</td>
              <td style="color:${rc};font-weight:700">${f.insecurity}%</td></tr>`;
  if (f.type==='foodStore')
    rows=`<tr><td>ความจุ</td><td>${f.capacity}</td></tr>
          <tr><td>ประเภท</td><td>${f.type_store}</td></tr>`;
  return `
    <div class="food-head">
      <div class="food-icon" style="background:${c.bg}22;border:2px solid ${c.bg}">
        <span style="font-size:18px">${c.icon}</span>
      </div>
      <div>
        <div class="food-title">${f.name}</div>
        <div class="food-sub">${f.district} · ${f.province}</div>
      </div>
    </div>
    <table class="food-table">
      ${rows}
      <tr><td>จังหวัด</td><td>${f.province}</td></tr>
    </table>
    ${f.type==='foodRisk'?`
      <div class="food-bar-wrap">
        <div class="food-bar-lbl">ระดับความเสี่ยง ${f.insecurity}%</div>
        <div class="food-bar-bg">
          <div class="food-bar-fill"
               style="width:${Math.min(f.insecurity*5,100)}%;background:${rc}">
          </div>
        </div>
      </div>
      <span class="risk-badge"
            style="background:${rc}22;color:${rc};border:1px solid ${rc}">
        ⚠️ ความเสี่ยง${st}
      </span>`:''}
    <div style="font-size:10px;color:#888;margin-top:7px;
                padding-top:7px;border-top:1px solid #2a2a4a">
      ${f.desc}
    </div>
    <div style="text-align:right;margin-top:6px">
      <button class="pzoom" onclick="flyTo(${f.lat},${f.lng})">
        <i class="fas fa-location-crosshairs"></i> Zoom
      </button>
    </div>`;
}

function mkFloodPopup(f) {
  const c      = FLOOD_CFG[f.type] || { bg:'#888', icon:'📍' };
  const rc     = f.severity==='high'?'#ef4444':f.severity==='medium'?'#f97316':'#22c55e';
  const sevTxt = f.severity==='high'?'⚠️ สูง':f.severity==='medium'?'🔶 ปานกลาง':'✅ ต่ำ';
  let rows = '';
  if (f.type==='floodHigh'||f.type==='floodWatch') {
    rows=`<tr><td>ถนน</td>    <td>${f.road||'-'}</td></tr>
          <tr><td>สาเหตุ</td>  <td>${f.cause||'-'}</td></tr>
          <tr><td>ความลึก</td>
              <td style="color:#60a5fa;font-weight:700">${f.depth||'-'}</td></tr>
          <tr><td>ระยะเวลา</td><td>${f.duration||'-'}</td></tr>`;
  } else {
    rows=`<tr><td>กำลังสูบ</td>
              <td style="color:#4ade80;font-weight:700">${f.pump_cap||'-'}</td></tr>
          <tr><td>สถานะ</td>
              <td style="color:${f.status==='ใช้งานได้ปกติ'?'#4ade80':'#f97316'};font-weight:700">
                ${f.status==='ใช้งานได้ปกติ'?'✅ ':'⚠️ '}${f.status}
              </td></tr>`;
  }
  return `
    <div class="fl-head">
      <div class="fl-icon" style="background:${c.bg}22;border:2px solid ${c.bg}">
        <span style="font-size:18px">${c.icon}</span>
      </div>
      <div>
        <div class="fl-title">${f.name}</div>
        <div class="fl-sub">${f.district} · ปี ${f.year}</div>
      </div>
    </div>
    <table class="fl-table">
      <tr><td>เขต</td><td>${f.district}</td></tr>
      ${rows}
    </table>
    <div style="margin-top:7px;padding:5px 9px;border-radius:6px;
                background:${rc}22;border:1px solid ${rc};
                font-size:11px;font-weight:700;color:${rc};
                display:flex;justify-content:space-between;">
      <span>ระดับ: ${sevTxt}</span>
      <span style="font-size:10px;font-weight:400;color:#888">ปี ${f.year}</span>
    </div>
    <div style="text-align:right;margin-top:7px">
      <button class="pzoom" onclick="flyTo(${f.lat},${f.lng})">
        <i class="fas fa-location-crosshairs"></i> Zoom
      </button>
    </div>`;
}

/* ============================================================
   BUILD MARKERS
============================================================ */
function buildMarkers(sts, fds, fls) {
  Object.values(LG).forEach(lg => lg.clearLayers());
  sts.forEach(s => {
    if (!LG[s.line]) return;
    L.marker([s.lat,s.lng],{icon:mkTrainIcon(s.color,s.sys),title:s.name})
     .bindPopup(mkTrainPopup(s),{className:'cp',maxWidth:260,minWidth:210})
     .addTo(LG[s.line]);
  });
  fds.forEach(f => {
    if (!LG[f.type]) return;
    L.marker([f.lat,f.lng],{icon:mkFoodIcon(f.type,f.risk||f.severity),title:f.name})
     .bindPopup(mkFoodPopup(f),{className:'fp',maxWidth:280,minWidth:230})
     .addTo(LG[f.type]);
  });
  fls.forEach(f => {
    if (!LG[f.type]) return;
    L.marker([f.lat,f.lng],{icon:mkFloodIcon(f.type),title:f.name})
     .bindPopup(mkFloodPopup(f),{className:'flp',maxWidth:270,minWidth:225})
     .addTo(LG[f.type]);
  });
}