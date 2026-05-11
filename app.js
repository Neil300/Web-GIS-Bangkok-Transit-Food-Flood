let distLine = null;

/* BADGE */
function setBadge(s, f, fl) {
  document.getElementById('b-s').textContent  = s;
  document.getElementById('b-t').textContent  = STATIONS.length;
  document.getElementById('b-f').textContent  = f;
  document.getElementById('b-fl').textContent = fl;
  document.getElementById('hd-s').textContent = s;
  document.getElementById('hd-t').textContent = STATIONS.length;
  document.getElementById('hd-f').textContent = f;
  document.getElementById('hd-fl').textContent= fl;
}

/* TOGGLE */
function toggleLyr(line, show) {
  show ? LG[line].addTo(map) : map.removeLayer(LG[line]);
  countBadge();
}
function countBadge() {
  const vs  = STATIONS.filter(s => map.hasLayer(LG[s.line])).length;
  const vf  = FOOD_DATA.filter(f => map.hasLayer(LG[f.type])).length;
  const vfl = FLOOD_DATA.filter(f => map.hasLayer(LG[f.type])).length;
  setBadge(vs, vf, vfl);
}

/* FILTER */
function applyFilter() {
  const q    = document.getElementById('f-search').value.toLowerCase().trim();
  const type = document.getElementById('f-type').value;
  const sub  = document.getElementById('f-sub').value;
  const prov = document.getElementById('f-prov').value;

  const fSt = STATIONS.filter(s =>
    (type==='all'||type==='transit') &&
    (sub==='all'||s.line===sub) &&
    (!q||s.name.toLowerCase().includes(q)||s.loc.toLowerCase().includes(q)) &&
    (prov==='all'||s.province===prov)
  );
  const fFd = FOOD_DATA.filter(f =>
    (type==='all'||type==='food') &&
    (sub==='all'||f.type===sub) &&
    (!q||f.name.toLowerCase().includes(q)) &&
    (prov==='all'||f.province===prov)
  );
  const fFl = FLOOD_DATA.filter(f =>
    (type==='all'||type==='flood') &&
    (sub==='all'||f.type===sub) &&
    (!q||f.name.toLowerCase().includes(q)||f.district.toLowerCase().includes(q))
  );

  buildMarkers(fSt, fFd, fFl);
  Object.keys(LG).forEach(k => {
    const cb = document.getElementById(`l-${k}`);
    (cb && cb.checked) ? LG[k].addTo(map) : map.removeLayer(LG[k]);
  });
  setBadge(fSt.length, fFd.length, fFl.length);
}

function resetFilter() {
  document.getElementById('f-search').value = '';
  ['f-type','f-sub','f-prov'].forEach(id => {
    document.getElementById(id).value = 'all';
  });
  document.querySelectorAll('#lyrs input[type=checkbox]')
    .forEach(cb => { cb.checked = true; });
  buildMarkers(STATIONS, FOOD_DATA, FLOOD_DATA);
  Object.values(LG).forEach(lg => lg.addTo(map));
  setBadge(STATIONS.length, FOOD_DATA.length, FLOOD_DATA.length);
}

/* ZOOM */
function zoomTo(val) {
  if (!val) return;
  const [la, lo] = val.split(',').map(Number);
  flyTo(la, lo);
}
function flyTo(lat, lng) {
  map.flyTo([lat, lng], 16, { animate:true, duration:1.2 });
}

/* DISTANCE */
function haversine(a, b, c, d) {
  const R  = 6371;
  const dL = (c-a)*Math.PI/180;
  const dO = (d-b)*Math.PI/180;
  const x  = Math.sin(dL/2)**2
            + Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dO/2)**2;
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
function calcDist() {
  const fv = document.getElementById('c-from').value;
  const tv = document.getElementById('c-to').value;
  if (!fv||!tv) { alert('กรุณาเลือกต้นทางและปลายทาง'); return; }
  if (fv===tv)  { alert('ต้นทางและปลายทางต้องไม่เหมือนกัน'); return; }
  const [a,b] = fv.split(',').map(Number);
  const [c,d] = tv.split(',').map(Number);
  const km    = haversine(a,b,c,d);
  if (distLine) map.removeLayer(distLine);
  distLine = L.polyline([[a,b],[c,d]],{
    color:'#e94560',weight:3,dashArray:'8,5',opacity:.9
  }).addTo(map);
  map.fitBounds([[a,b],[c,d]],{padding:[60,60]});
  const fo = document.getElementById('c-from');
  const to = document.getElementById('c-to');
  document.getElementById('c-km').textContent   = `${km.toFixed(2)} km`;
  document.getElementById('c-desc').textContent =
    `${fo.options[fo.selectedIndex].text} → ${to.options[to.selectedIndex].text}`;
  document.getElementById('c-res').style.display = 'block';
}

/* INIT DROPDOWNS */
function initDDs() {
  const all = [
    ...STATIONS.map(s=>({name:s.name,lat:s.lat,lng:s.lng,province:s.province})),
    ...FOOD_DATA.map(f=>({name:f.name,lat:f.lat,lng:f.lng,province:f.province})),
    ...FLOOD_DATA.map(f=>({name:f.name,lat:f.lat,lng:f.lng,province:'กรุงเทพมหานคร'})),
  ];
  const provs = [...new Set(all.map(x=>x.province).filter(Boolean))].sort();
  provs.forEach(p => {
    document.getElementById('f-prov').innerHTML += `<option value="${p}">${p}</option>`;
  });
  all.forEach(x => {
    const v = `${x.lat},${x.lng}`;
    const o = `<option value="${v}">${x.name}</option>`;
    document.getElementById('z-sel').innerHTML  += o;
    document.getElementById('c-from').innerHTML += o;
    document.getElementById('c-to').innerHTML   += o;
  });
}

/* ★ START ★ */
buildMarkers(STATIONS, FOOD_DATA, FLOOD_DATA);
initDDs();
setBadge(STATIONS.length, FOOD_DATA.length, FLOOD_DATA.length);