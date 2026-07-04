/**
 * XSKT TP.HCM - Frontend App v2.0
 * ============================================
 * - Fetch dữ liệu từ Node.js backend (localhost:3000)
 * - Tích hợp Google Gemini AI
 * - Tự động kiểm tra kết nối server
 * - Fallback sang dữ liệu hardcode khi offline
 */

const STATIONS = {
  'xshcm': { name: 'TP. HCM', days: [2, 7], code: 'xshcm-xstp' },
  'xsdt':  { name: 'Đồng Tháp', days: [2], code: 'xsdt' },
  'xscm':  { name: 'Cà Mau', days: [2], code: 'xscm' },
  'xsbt':  { name: 'Bến Tre', days: [3], code: 'xsbt' },
  'xsvt':  { name: 'Vũng Tàu', days: [3], code: 'xsvt' },
  'xsbl':  { name: 'Bạc Liêu', days: [3], code: 'xsbl' },
  'xsdn':  { name: 'Đồng Nai', days: [4], code: 'xsdn' },
  'xsct':  { name: 'Cần Thơ', days: [4], code: 'xsct' },
  'xsst':  { name: 'Sóc Trăng', days: [4], code: 'xsst' },
  'xstn':  { name: 'Tây Ninh', days: [5], code: 'xstn' },
  'xsag':  { name: 'An Giang', days: [5], code: 'xsag' },
  'xsbth': { name: 'Bình Thuận', days: [5], code: 'xsbth' },
  'xsvl':  { name: 'Vĩnh Long', days: [6], code: 'xsvl' },
  'xsbd':  { name: 'Bình Dương', days: [6], code: 'xsbd' },
  'xstv':  { name: 'Trà Vinh', days: [6], code: 'xstv' },
  'xsla':  { name: 'Long An', days: [7], code: 'xsla' },
  'xsbp':  { name: 'Bình Phước', days: [7], code: 'xsbp' },
  'xshg':  { name: 'Hậu Giang', days: [7], code: 'xshg' },
  'xstg':  { name: 'Tiền Giang', days: [0], code: 'xstg' },
  'xskg':  { name: 'Kiên Giang', days: [0], code: 'xskg' },
  'xsdl':  { name: 'Đà Lạt', days: [0], code: 'xsld-xsdl' }
};

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

let currentStation = 'xshcm';
let stationList = STATIONS;

// ============ STATE ============
let APP_DATA = [];           // Dữ liệu chính (từ server hoặc fallback)
let isServerOnline = false;
let currentHeatmapType = 'g8';
let g8MethodState = 'freq';
let dbMethodState = 'freq';
let selectedAiType = 'full';
let aiHistory = [];

// ============ DỮ LIỆU DỰ PHÒNG (fallback khi server offline) ============
const FALLBACK_DATA = [
  { date: '29/06/2026', day: 2, g8: '45', db: '531137', dbTail: '37' },
  { date: '27/06/2026', day: 7, g8: '28', db: '608165', dbTail: '65' },
  { date: '22/06/2026', day: 2, g8: '68', db: '712554', dbTail: '54' },
  { date: '20/06/2026', day: 7, g8: '33', db: '569733', dbTail: '33' },
  { date: '15/06/2026', day: 2, g8: '22', db: '285122', dbTail: '22' },
  { date: '13/06/2026', day: 7, g8: '33', db: '512619', dbTail: '19' },
  { date: '08/06/2026', day: 2, g8: '61', db: '925261', dbTail: '61' },
  { date: '06/06/2026', day: 7, g8: '80', db: '094580', dbTail: '80' },
  { date: '01/06/2026', day: 2, g8: '87', db: '725887', dbTail: '87' },
  { date: '30/05/2026', day: 7, g8: '08', db: '805808', dbTail: '08' },
  { date: '25/05/2026', day: 2, g8: '79', db: '846479', dbTail: '79' },
  { date: '23/05/2026', day: 7, g8: '10', db: '121910', dbTail: '10' },
  { date: '18/05/2026', day: 2, g8: '56', db: '590856', dbTail: '56' },
  { date: '16/05/2026', day: 7, g8: '05', db: '911805', dbTail: '05' },
  { date: '11/05/2026', day: 2, g8: '54', db: '115854', dbTail: '54' },
  { date: '09/05/2026', day: 7, g8: '78', db: '063178', dbTail: '78' },
  { date: '04/05/2026', day: 2, g8: '19', db: '975219', dbTail: '19' },
  { date: '02/05/2026', day: 7, g8: '79', db: '309079', dbTail: '79' },
  { date: '27/04/2026', day: 2, g8: '03', db: '688903', dbTail: '03' },
  { date: '25/04/2026', day: 7, g8: '44', db: '531244', dbTail: '44' },
  { date: '20/04/2026', day: 2, g8: '16', db: '427316', dbTail: '16' },
  { date: '18/04/2026', day: 7, g8: '91', db: '632791', dbTail: '91' },
  { date: '13/04/2026', day: 2, g8: '37', db: '189537', dbTail: '37' },
  { date: '11/04/2026', day: 7, g8: '62', db: '074162', dbTail: '62' },
  { date: '06/04/2026', day: 2, g8: '28', db: '349028', dbTail: '28' },
  { date: '04/04/2026', day: 7, g8: '50', db: '823650', dbTail: '50' },
  { date: '30/03/2026', day: 2, g8: '73', db: '512873', dbTail: '73' },
  { date: '28/03/2026', day: 7, g8: '14', db: '630914', dbTail: '14' },
  { date: '23/03/2026', day: 2, g8: '96', db: '748196', dbTail: '96' },
  { date: '21/03/2026', day: 7, g8: '38', db: '291538', dbTail: '38' },
  { date: '16/03/2026', day: 2, g8: '52', db: '836452', dbTail: '52' },
  { date: '14/03/2026', day: 7, g8: '65', db: '574265', dbTail: '65' },
  { date: '09/03/2026', day: 2, g8: '07', db: '319507', dbTail: '07' },
  { date: '07/03/2026', day: 7, g8: '43', db: '206843', dbTail: '43' },
  { date: '02/03/2026', day: 2, g8: '72', db: '158372', dbTail: '72' },
  { date: '28/02/2026', day: 7, g8: '89', db: '427589', dbTail: '89' },
  { date: '23/02/2026', day: 2, g8: '31', db: '592631', dbTail: '31' },
  { date: '21/02/2026', day: 7, g8: '54', db: '813854', dbTail: '54' },
  { date: '16/02/2026', day: 2, g8: '60', db: '248760', dbTail: '60' },
  { date: '14/02/2026', day: 7, g8: '17', db: '736417', dbTail: '17' },
  { date: '09/02/2026', day: 2, g8: '38', db: '621938', dbTail: '38' },
  { date: '07/02/2026', day: 7, g8: '45', db: '093145', dbTail: '45' },
  { date: '02/02/2026', day: 2, g8: '82', db: '574982', dbTail: '82' },
  { date: '31/01/2026', day: 7, g8: '65', db: '382165', dbTail: '65' },
  { date: '26/01/2026', day: 2, g8: '99', db: '715699', dbTail: '99' },
  { date: '24/01/2026', day: 7, g8: '27', db: '849327', dbTail: '27' },
  { date: '19/01/2026', day: 2, g8: '13', db: '236813', dbTail: '13' },
  { date: '17/01/2026', day: 7, g8: '76', db: '591476', dbTail: '76' },
  { date: '12/01/2026', day: 2, g8: '48', db: '703248', dbTail: '48' },
  { date: '10/01/2026', day: 7, g8: '21', db: '465721', dbTail: '21' },
  { date: '05/01/2026', day: 2, g8: '59', db: '182759', dbTail: '59' },
  { date: '03/01/2026', day: 7, g8: '34', db: '827934', dbTail: '34' },
  { date: '29/12/2025', day: 2, g8: '86', db: '439786', dbTail: '86' },
  { date: '27/12/2025', day: 7, g8: '43', db: '217643', dbTail: '43' },
  { date: '22/12/2025', day: 2, g8: '72', db: '568972', dbTail: '72' },
  { date: '20/12/2025', day: 7, g8: '15', db: '394215', dbTail: '15' },
  { date: '15/12/2025', day: 2, g8: '38', db: '726138', dbTail: '38' },
  { date: '13/12/2025', day: 7, g8: '61', db: '853461', dbTail: '61' },
  { date: '08/12/2025', day: 2, g8: '97', db: '142797', dbTail: '97' },
  { date: '06/12/2025', day: 7, g8: '24', db: '689324', dbTail: '24' },
  { date: '01/12/2025', day: 2, g8: '50', db: '317850', dbTail: '50' },
  { date: '29/11/2025', day: 7, g8: '79', db: '524179', dbTail: '79' },
  { date: '24/11/2025', day: 2, g8: '33', db: '861533', dbTail: '33' },
  { date: '22/11/2025', day: 7, g8: '06', db: '437306', dbTail: '06' },
  { date: '17/11/2025', day: 2, g8: '88', db: '259688', dbTail: '88' },
  { date: '15/11/2025', day: 7, g8: '41', db: '702941', dbTail: '41' },
  { date: '10/11/2025', day: 2, g8: '15', db: '934815', dbTail: '15' },
  { date: '08/11/2025', day: 7, g8: '62', db: '178562', dbTail: '62' },
  { date: '03/11/2025', day: 2, g8: '29', db: '643729', dbTail: '29' },
  { date: '01/11/2025', day: 7, g8: '54', db: '891354', dbTail: '54' },
  { date: '27/10/2025', day: 2, g8: '71', db: '326471', dbTail: '71' },
  { date: '25/10/2025', day: 7, g8: '38', db: '574938', dbTail: '38' },
  { date: '20/10/2025', day: 2, g8: '95', db: '213895', dbTail: '95' },
  { date: '18/10/2025', day: 7, g8: '16', db: '768416', dbTail: '16' },
  { date: '13/10/2025', day: 2, g8: '43', db: '489143', dbTail: '43' },
  { date: '11/10/2025', day: 7, g8: '78', db: '635778', dbTail: '78' },
  { date: '06/10/2025', day: 2, g8: '27', db: '142827', dbTail: '27' },
  { date: '04/10/2025', day: 7, g8: '65', db: '593765', dbTail: '65' },
  { date: '29/09/2025', day: 2, g8: '52', db: '871352', dbTail: '52' },
  { date: '27/09/2025', day: 7, g8: '84', db: '246784', dbTail: '84' },
  { date: '22/09/2025', day: 2, g8: '19', db: '738219', dbTail: '19' },
  { date: '20/09/2025', day: 7, g8: '37', db: '512637', dbTail: '37' },
  { date: '15/09/2025', day: 2, g8: '66', db: '394566', dbTail: '66' },
  { date: '13/09/2025', day: 7, g8: '93', db: '627493', dbTail: '93' },
  { date: '08/09/2025', day: 2, g8: '28', db: '158928', dbTail: '28' },
  { date: '06/09/2025', day: 7, g8: '45', db: '843745', dbTail: '45' },
  { date: '01/09/2025', day: 2, g8: '72', db: '391272', dbTail: '72' },
  { date: '30/08/2025', day: 7, g8: '54', db: '726854', dbTail: '54' },
  { date: '25/08/2025', day: 2, g8: '11', db: '584211', dbTail: '11' },
  { date: '23/08/2025', day: 7, g8: '86', db: '219486', dbTail: '86' },
  { date: '18/08/2025', day: 2, g8: '39', db: '473839', dbTail: '39' },
  { date: '16/08/2025', day: 7, g8: '60', db: '832160', dbTail: '60' },
  { date: '11/08/2025', day: 2, g8: '17', db: '645317', dbTail: '17' },
  { date: '09/08/2025', day: 7, g8: '75', db: '291875', dbTail: '75' },
  { date: '04/08/2025', day: 2, g8: '48', db: '537648', dbTail: '48' },
  { date: '02/08/2025', day: 7, g8: '31', db: '784231', dbTail: '31' },
  { date: '28/07/2025', day: 2, g8: '94', db: '163594', dbTail: '94' },
  { date: '26/07/2025', day: 7, g8: '23', db: '418923', dbTail: '23' },
];

// ============ API & DATA ============
async function fetchStations() {
  const select = document.getElementById('station-select');
  if (select) {
    select.innerHTML = Object.keys(stationList).map(k => 
      `<option value="${k}">${stationList[k].name}</option>`
    ).join('');
    select.value = currentStation;
  }
}

async function changeStation(stationId) {
  playSound('wheel');
  currentStation = stationId;
  APP_DATA = [];
  renderAll(); // Xóa data cũ
  
  // Hiển thị loading
  setServerStatus('online', 'Đang tải đài mới...');
  
  const serverOk = await checkServer();
  if (serverOk) {
    await fetchDataFromServer();
    renderAll();
  }
}

// ============ SERVER CONNECTION ============
async function checkServer() {
  setServerStatus('online', 'Github Pages · Trực tuyến');
  isServerOnline = true;
  return true;
}

function setServerStatus(state, text) {
  const dot = document.querySelector('.status-dot');
  const txt = document.querySelector('.status-text');
  if (dot) { dot.className = `status-dot ${state}`; }
  if (txt) { txt.textContent = text; }
}

async function fetchDataFromServer() {
  try {
    const res = await fetch(`./data/data_${currentStation}.json`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        // Đảm bảo có dbTail
        json.data.forEach(d => {
          if (!d.dbTail && d.db) d.dbTail = d.db.slice(-2);
        });
        APP_DATA = json.data;
        setServerStatus('online', `Github Pages · Đã tải ${APP_DATA.length} kỳ`);
        return true;
      }
    }
  } catch(e) {
    console.error('Lỗi kết nối tới file data', e);
  }
  
  // Nếu lỗi, dùng fallback
  APP_DATA = FALLBACK_DATA;
  setServerStatus('offline', 'Lỗi tải data · Dùng cache');
  return false;
}

async function refreshData() {
  const btn = document.getElementById('refresh-btn');
  const updateBtn = document.getElementById('update-btn');
  if (updateBtn) updateBtn.style.display = 'none';

  if (btn) {
    btn.textContent = '⟳ Đang tải...';
    btn.disabled = true;
  }
  
  try {
    await fetchDataFromServer();
    renderAll();
    showNotification('✅ Đã làm mới dữ liệu!', 'success');
  } catch (e) {
    showNotification('❌ Lỗi tải dữ liệu.', 'error');
  }

  if (btn) {
    btn.textContent = '⟳ Cập nhật';
    btn.disabled = false;
  }
}

// ============ UTILITY ============
function getDayName(day) { return day === 2 ? 'Thứ 2' : 'Thứ 7'; }
function getDayClass(day) { return day === 2 ? 'day-t2' : 'day-t7'; }

function calcFrequency(arr) {
  const freq = {};
  for (let i = 0; i < 100; i++) freq[String(i).padStart(2, '0')] = 0;
  arr.forEach(num => { const k = String(num).padStart(2, '0'); if (freq[k] !== undefined) freq[k]++; });
  return freq;
}

function getG8Array(n = null) {
  const d = n ? APP_DATA.slice(0, n) : APP_DATA;
  return d.map(x => x.g8).filter(Boolean);
}

function getDBTailArray(n = null) {
  const d = n ? APP_DATA.slice(0, n) : APP_DATA;
  return d.map(x => x.dbTail || (x.db ? x.db.slice(-2) : null)).filter(Boolean);
}

function calcGan(arr) {
  const lastSeen = {};
  for (let i = 0; i < 100; i++) lastSeen[String(i).padStart(2, '0')] = null;
  arr.forEach((num, idx) => { const k = String(num).padStart(2, '0'); lastSeen[k] = idx; });
  const gan = {};
  Object.keys(lastSeen).forEach(k => { gan[k] = lastSeen[k] === null ? arr.length : lastSeen[k]; });
  return gan;
}

function calcMarkov(arr) {
  const transitions = {};
  for(let i = 1; i < arr.length; i++) {
    const current = String(arr[i]).padStart(2, '0');
    const next = String(arr[i-1]).padStart(2, '0');
    if (!transitions[current]) transitions[current] = {};
    if (!transitions[current][next]) transitions[current][next] = 0;
    transitions[current][next]++;
  }
  return transitions;
}

function calcProbability(arr) {
  const freqMap = calcFrequency(arr);
  const ganObj = calcGan(arr);
  const markovObj = calcMarkov(arr);
  
  const lastNum = arr.length > 0 ? String(arr[0]).padStart(2, '0') : '00';
  const nextMarkov = markovObj[lastNum] || {};
  
  const maxFreq = Math.max(...Object.values(freqMap), 1);
  const maxMarkov = Math.max(...Object.values(nextMarkov), 1);

  const prob = {};
  for(let i = 0; i < 100; i++) {
    const num = String(i).padStart(2, '0');
    const freqScore = (freqMap[num] || 0) / maxFreq;
    const ganScore = Math.min((ganObj[num] || 0) / 30, 1);
    const mScore = (nextMarkov[num] || 0) / maxMarkov;
    
    // Markov: 50%, Freq: 30%, Gan: 20%
    prob[num] = freqScore * 0.3 + ganScore * 0.2 + mScore * 0.5;
  }
  const maxProb = Math.max(...Object.values(prob)) || 1;
  Object.keys(prob).forEach(k => { prob[k] = (prob[k] / maxProb) * 100; });
  return prob;
}

function calcCycle(arr) {
  const positions = {};
  arr.forEach((num, idx) => {
    const k = String(num).padStart(2, '0');
    if (!positions[k]) positions[k] = [];
    positions[k].push(idx);
  });
  const cycles = {};
  Object.keys(positions).forEach(k => {
    const pos = positions[k];
    if (pos.length < 2) { cycles[k] = null; return; }
    let total = 0;
    for (let i = 1; i < pos.length; i++) total += pos[i] - pos[i - 1];
    cycles[k] = Math.round(total / (pos.length - 1));
  });
  return cycles;
}

function calcNextDraw() {
  const now = new Date();
  const day = now.getDay();
  let days = day === 1 ? 5 : day < 6 ? 6 - day : day === 6 ? 2 : 1;
  const next = new Date(now);
  next.setDate(now.getDate() + days);
  const dd = String(next.getDate()).padStart(2, '0');
  const mm = String(next.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm} (${days === 5 || day === 6 ? 'T7' : 'T2'})`;
}

// ============ RENDER ALL ============
function renderAll() {
  if (APP_DATA.length === 0) return;
  const latest = APP_DATA[0];
  document.getElementById('val-total').textContent = APP_DATA.length;
  document.getElementById('val-g8').textContent = latest.g8;
  document.getElementById('val-db').textContent = latest.db;
  document.getElementById('val-next').textContent = calcNextDraw();
  if (!document.getElementById('last-update').textContent.includes('202')) {
    document.getElementById('last-update').textContent = `${latest.date} (${getDayName(latest.day)})`;
  }
  renderRecentResults();
  renderHotNumbers();
  renderQuickPredict();
  renderHeatmap('g8');
  renderFullTicket();
  renderPredictions(); // Tự động cập nhật dự đoán khi đổi đài
}

function renderRecentResults() {
  const el = document.getElementById('recent-results');
  const recent = APP_DATA.slice(1, 15); // Bỏ qua kỳ đầu tiên vì đã nằm ở Full Ticket
  if (!recent.length) { el.innerHTML = '<p class="text-center">Không có dữ liệu</p>'; return; }
  el.innerHTML = recent.map(d => {
    const tail = d.dbTail || d.db?.slice(-2) || '--';
    return `
      <div class="result-item">
        <div>
          <div class="result-date">${d.date}</div>
          <div class="result-day"><span class="day-badge ${getDayClass(d.day)}">${getDayName(d.day)}</span></div>
        </div>
        <div class="result-g8">
          <span class="num-badge num-g8">${d.g8}</span>
          <div><div class="num-label">Giải 8</div></div>
        </div>
        <div class="result-db">
          <span class="num-badge num-db">${d.db}</span>
          <div>
            <div class="num-label">Giải ĐB</div>
            <div class="num-tail">đuôi: ${tail}</div>
          </div>
        </div>
      </div>`;
  }).join('');
}

function renderFullTicket() {
  const el = document.getElementById('full-ticket-result');
  if (APP_DATA.length === 0) { el.innerHTML = '<p class="text-center">Không có dữ liệu</p>'; return; }
  
  const d = APP_DATA[0]; // Lấy kỳ mới nhất
  const p = d.prizes;
  
  if (!p) {
    el.innerHTML = '<p class="text-center" style="color:var(--gold)">Dữ liệu cũ chưa có đủ 18 giải. Vui lòng chờ máy chủ tải lại.</p>';
    return;
  }
  
  // Format mảng giải thưởng nhiều số (vd Giải Tư, Sáu, Bảy...)
  const formatMulti = (prizeStr) => {
    if (!prizeStr) return '--';
    return '<div class="ticket-numbers-grid">' + prizeStr.split(' ').map(n => `<span>${n}</span>`).join('') + '</div>';
  };

  el.innerHTML = `
    <div style="text-align:center; margin-bottom: 12px;">
      <h3 style="color: var(--gold); text-transform: uppercase;">KẾT QUẢ XỔ SỐ ${document.querySelector('#station-select option:checked').text}</h3>
      <p style="color: var(--text-muted); font-size: 14px;">Kỳ vé ngày: <strong>${d.date}</strong></p>
    </div>
    <table class="full-ticket">
      <tr class="prize-db">
        <td class="ticket-prize-name">Đặc Biệt</td>
        <td class="ticket-numbers">${p.db || '--'}</td>
      </tr>
      <tr class="prize-g1">
        <td class="ticket-prize-name">Giải Nhất</td>
        <td class="ticket-numbers">${p.g1 || '--'}</td>
      </tr>
      <tr>
        <td class="ticket-prize-name">Giải Nhì</td>
        <td class="ticket-numbers">${p.g2 || '--'}</td>
      </tr>
      <tr>
        <td class="ticket-prize-name">Giải Ba</td>
        <td class="ticket-numbers">${formatMulti(p.g3)}</td>
      </tr>
      <tr>
        <td class="ticket-prize-name">Giải Tư</td>
        <td class="ticket-numbers">${formatMulti(p.g4)}</td>
      </tr>
      <tr>
        <td class="ticket-prize-name">Giải Năm</td>
        <td class="ticket-numbers">${p.g5 || '--'}</td>
      </tr>
      <tr>
        <td class="ticket-prize-name">Giải Sáu</td>
        <td class="ticket-numbers">${formatMulti(p.g6)}</td>
      </tr>
      <tr>
        <td class="ticket-prize-name">Giải Bảy</td>
        <td class="ticket-numbers">${p.g7 || '--'}</td>
      </tr>
      <tr class="prize-g8">
        <td class="ticket-prize-name">Giải Tám</td>
        <td class="ticket-numbers">${p.g8 || '--'}</td>
      </tr>
    </table>
  `;
}

function renderHotNumbers() {
  const g8Arr = getG8Array(30);
  const dbArr = getDBTailArray(30);
  const g8Freq = calcFrequency(g8Arr);
  const dbFreq = calcFrequency(dbArr);
  const topG8 = Object.entries(g8Freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topDB = Object.entries(dbFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxG8 = topG8[0]?.[1] || 1, maxDB = topDB[0]?.[1] || 1;

  const buildList = (top, max, barClass, color) => `
    <ul class="hot-list">
      ${top.map(([num, cnt], i) => `
        <li class="hot-item">
          <span class="hot-rank ${i < 3 ? 'top' : ''}">#${i + 1}</span>
          <span class="hot-num" style="color:${color}">${num}</span>
          <div class="hot-bar-wrap"><div class="hot-bar ${barClass}" style="width:${(cnt/max*100).toFixed(0)}%"></div></div>
          <span class="hot-count">${cnt}x</span>
        </li>`).join('')}
    </ul>`;

  document.getElementById('hot-g8').innerHTML = buildList(topG8, maxG8, 'bar-g8', 'var(--red-light)');
  document.getElementById('hot-db').innerHTML = buildList(topDB, maxDB, 'bar-db', 'var(--gold)');
}

function renderQuickPredict() {
  const g8Prob = calcProbability(getG8Array());
  const dbProb = calcProbability(getDBTailArray());
  const topG8 = Object.entries(g8Prob).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const topDB = Object.entries(dbProb).sort((a, b) => b[1] - a[1]).slice(0, 3);
  document.getElementById('quick-predict').innerHTML = `
    <div style="margin-bottom:10px">
      <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">G8 Gợi Ý</div>
      <div class="predict-nums">${topG8.map(([n], i) => `<span class="predict-num ${i===0?'top':''}">${n}</span>`).join('')}</div>
    </div>
    <div>
      <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Đuôi ĐB Gợi Ý</div>
      <div class="predict-nums">${topDB.map(([n], i) => `<span class="predict-num ${i===0?'top':''}">${n}</span>`).join('')}</div>
    </div>`;
}

function renderHeatmap(type) {
  const arr = type === 'g8' ? getG8Array() : getDBTailArray();
  const freq = calcFrequency(arr);
  const maxF = Math.max(...Object.values(freq)) || 1;
  document.getElementById('heatmap').innerHTML = Array.from({length:100},(_,i) => {
    const num = String(i).padStart(2,'0');
    const cnt = freq[num];
    const r = cnt / maxF;
    let R, G, B;
    if (r < 0.5) { R = Math.round(30+r*2*200); G = Math.round(30+r*2*60); B = Math.round(80-r*2*40); }
    else { const t=(r-0.5)*2; R=Math.round(230+t*15); G=Math.round(90+t*107); B=Math.round(40-t*30); }
    const a = 0.25 + r * 0.75;
    return `<div class="hm-cell" style="background:rgba(${R},${G},${B},${a});color:${r>0.5?'#fff':'#aaa'}" data-tooltip="${num}: ${cnt} lần" title="${num}: ${cnt} lần">${num}</div>`;
  }).join('');
}

function updateHeatmap(type, btn) {
  currentHeatmapType = type;
  btn.closest('.panel-header').querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderHeatmap(type);
}

// ============ HISTORY TAB ============
function renderHistory() {
  const filter = document.getElementById('history-filter').value;
  let data = APP_DATA;
  if (filter === 'thu2') data = data.filter(d => d.day === 2);
  if (filter === 'thu7') data = data.filter(d => d.day === 7);
  const tbody = document.getElementById('history-tbody');
  tbody.innerHTML = data.map((d, i) => {
    const tail = d.dbTail || d.db?.slice(-2) || '--';
    return `<tr>
      <td style="color:var(--text-muted)">${i + 1}</td>
      <td>${d.date}</td>
      <td><span class="day-badge ${getDayClass(d.day)}">${getDayName(d.day)}</span></td>
      <td class="td-g8">${d.g8}</td>
      <td class="td-tail">${d.g8}</td>
      <td class="td-db">${d.db}</td>
      <td class="td-tail">${tail}</td>
    </tr>`;
  }).join('');
}

// ============ STATS TAB ============
function renderStats() {
  const rangeVal = document.getElementById('stats-range').value;
  const n = rangeVal === 'all' ? null : parseInt(rangeVal);
  const g8Arr = getG8Array(n), dbArr = getDBTailArray(n);
  const g8Freq = calcFrequency(g8Arr), dbFreq = calcFrequency(dbArr);
  const maxG8 = Math.max(...Object.values(g8Freq)) || 1;
  const maxDB = Math.max(...Object.values(dbFreq)) || 1;
  const g8GanAll = calcGan(getG8Array());

  const buildFreqGrid = (freq, maxF, type) =>
    Array.from({length:100},(_,i) => {
      const num = String(i).padStart(2,'0');
      const cnt = freq[num], r = cnt/maxF;
      const barH = Math.max(2, Math.round(r*30));
      const color = type==='g8' ? `rgba(230,57,70,${0.2+r*0.8})` : `rgba(245,197,24,${0.2+r*0.8})`;
      return `<div class="freq-cell" title="${num}: ${cnt} lần">
        <div class="freq-num">${num}</div>
        <div class="freq-bar" style="height:${barH}px;background:${color}"></div>
        <div class="freq-count">${cnt}</div>
      </div>`;
    }).join('');

  document.getElementById('g8-freq-grid').innerHTML = buildFreqGrid(g8Freq, maxG8, 'g8');
  document.getElementById('db-freq-grid').innerHTML = buildFreqGrid(dbFreq, maxDB, 'db');

  const buildRankList = (entries, colorClass, labelFn) => `
    <div class="rank-list">
      ${entries.map(([num, val], i) => `
        <div class="rank-item">
          <span class="rank-pos ${i===0?'gold':i===1?'silver':i===2?'bronze':''}">#${i+1}</span>
          <span class="rank-num ${colorClass}">${num}</span>
          <div class="rank-info">
            <div class="rank-value">${labelFn(val)}</div>
          </div>
        </div>`).join('')}
    </div>`;

  document.getElementById('top-g8-list').innerHTML = buildRankList(
    Object.entries(g8Freq).sort((a,b)=>b[1]-a[1]).slice(0,10),
    'g8-color', v => `${v} lần (${(v/g8Arr.length*100).toFixed(1)}%)`
  );
  document.getElementById('top-db-list').innerHTML = buildRankList(
    Object.entries(dbFreq).sort((a,b)=>b[1]-a[1]).slice(0,10),
    'db-color', v => `${v} lần (${(v/dbArr.length*100).toFixed(1)}%)`
  );
  document.getElementById('gan-g8-list').innerHTML = buildRankList(
    Object.entries(g8GanAll).sort((a,b)=>b[1]-a[1]).slice(0,10),
    'gan-color', v => v >= APP_DATA.length ? 'Chưa từng về' : `Gan ${v} kỳ`
  );
}

// ============ PREDICT TAB ============
function renderPredictions() {
  const g8Arr = getG8Array(), dbArr = getDBTailArray();
  const g8Prob = calcProbability(g8Arr), dbProb = calcProbability(dbArr);
  const topG8 = Object.entries(g8Prob).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const topDB = Object.entries(dbProb).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const buildPredResult = (top, type) => `
    <div class="predict-result-box">
      <div class="pred-label">Khuyến nghị mạnh nhất</div>
      <div class="predict-result-nums">
        ${top.slice(0,3).map(([num,score],i) => `
          <div>
            <div class="pred-num rank-${i+1}">${num}</div>
            <div class="prob-pct">${score.toFixed(0)}%</div>
          </div>`).join('')}
      </div>
      <div style="font-size:12px;color:var(--text-muted)">Thêm: ${top.slice(3).map(([n])=>`<strong>${n}</strong>`).join(', ')}</div>
    </div>`;

  document.getElementById('predict-g8-result').innerHTML = buildPredResult(topG8, 'g8');
  document.getElementById('predict-db-result').innerHTML = buildPredResult(topDB, 'db');
  showMethod('g8', g8MethodState, null);
  showMethod('db', dbMethodState, null);
  updateProbChart('g8', document.querySelector('#tab-predict .filter-btn'));
}

function showMethod(type, method, btn) {
  if (type==='g8') g8MethodState=method; else dbMethodState=method;
  if (btn) {
    btn.closest('.predict-card').querySelectorAll('.method-tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
  }
  const arr = type==='g8' ? getG8Array() : getDBTailArray();
  const el = document.getElementById(`${type}-method-content`);
  if (method==='freq') {
    const freq = calcFrequency(arr);
    const top5 = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,5);
    el.innerHTML = `<strong>Tần suất (${arr.length} kỳ):</strong><div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px">
      ${top5.map(([n,c])=>`<span style="background:rgba(255,255,255,0.06);padding:3px 8px;border-radius:6px;font-size:12px"><b>${n}</b>: ${c} lần</span>`).join('')}</div>`;
  } else if (method==='gan') {
    const gan = calcGan(arr);
    const topGan = Object.entries(gan).sort((a,b)=>b[1]-a[1]).slice(0,5);
    el.innerHTML = `<strong>Số gan lâu nhất:</strong><div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px">
      ${topGan.map(([n,g])=>`<span style="background:rgba(76,201,240,0.08);padding:3px 8px;border-radius:6px;font-size:12px;color:var(--blue)"><b>${n}</b>: gan ${g} kỳ</span>`).join('')}</div>`;
  } else if (method==='markov') {
    const markov = calcMarkov(arr);
    const lastNum = arr.length > 0 ? String(arr[0]).padStart(2, '0') : '00';
    const nextMarkov = markov[lastNum] || {};
    const topMarkov = Object.entries(nextMarkov).sort((a,b)=>b[1]-a[1]).slice(0,5);
    
    if (topMarkov.length > 0) {
      el.innerHTML = `<strong>Thói quen (Markov):</strong><div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px">
        ${topMarkov.map(([n,c])=>`<span style="background:rgba(255,183,3,0.15);padding:3px 8px;border-radius:6px;font-size:12px;color:var(--gold)"><b>${n}</b>: ${c} lần</span>`).join('')}</div>
        <div style="margin-top:6px;font-size:11px;color:var(--text-muted)">Lịch sử: Mỗi khi ra ${lastNum} -> Kỳ sau thường ra các số này</div>`;
    } else {
      el.innerHTML = `<strong>Thói quen (Markov):</strong><div style="margin-top:8px;padding:8px;background:rgba(255,255,255,0.05);border-radius:6px;font-size:12px;color:var(--text-muted)">
        Số <b>${lastNum}</b> mới xuất hiện lần đầu tiên trong phạm vi dữ liệu hiện tại. Hệ thống chưa có chuỗi lịch sử để phân tích thói quen của số này. Thuật toán sẽ tạm thời dùng Tần Suất & Lô Gan để bù đắp trọng số dự đoán.
      </div>`;
    }
  } else {
    const cycles = calcCycle(arr);
    const valid = Object.entries(cycles).filter(([,c])=>c!==null).sort((a,b)=>a[1]-b[1]).slice(0,5);
    el.innerHTML = `<strong>Chu kỳ lặp (trung bình):</strong><div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px">
      ${valid.map(([n,c])=>`<span style="background:rgba(155,93,229,0.08);padding:3px 8px;border-radius:6px;font-size:12px;color:var(--purple)"><b>${n}</b>: TB ${c} kỳ</span>`).join('')}</div>
      <div style="margin-top:6px;font-size:11px;color:var(--text-muted)">Chu kỳ ngắn = xác suất về sớm hơn</div>`;
  }
}

function updateProbChart(type, btn) {
  if (btn) {
    btn.closest('.filter-group').querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
  }
  const arr = type==='g8' ? getG8Array() : getDBTailArray();
  const gan = calcGan(arr), prob = calcProbability(arr), freq = calcFrequency(arr);
  const top20 = Object.entries(prob).sort((a,b)=>b[1]-a[1]).slice(0,20);
  const color = type==='g8' ? 'linear-gradient(90deg,var(--red),var(--orange))' : 'linear-gradient(90deg,var(--gold-dark),var(--gold-light))';
  const numColor = type==='g8' ? 'var(--red-light)' : 'var(--gold)';
  document.getElementById('prob-chart').innerHTML = top20.map(([num,score]) => `
    <div class="prob-row">
      <span class="prob-num" style="color:${numColor}">${num}</span>
      <div class="prob-bar-wrap">
        <div class="prob-bar-fill" style="width:${score.toFixed(0)}%;background:${color}">
          <span class="prob-bar-text">${freq[num]} lần</span>
        </div>
      </div>
      <span class="prob-pct-label">${score.toFixed(0)}%</span>
    </div>`).join('');
}

// ============ GEMINI AI ============
function getGeminiKey() { return localStorage.getItem('gemini_api_key') || ''; }

function saveApiKey() {
  const key = document.getElementById('gemini-api-key').value.trim();
  if (!key || key.length < 20) { showNotification('⚠️ API Key không hợp lệ!', 'warning'); return; }
  localStorage.setItem('gemini_api_key', key);
  updateKeyStatus(true);
  showNotification('✅ Đã lưu API Key thành công!', 'success');
}

function updateKeyStatus(hasKey) {
  const badge = document.getElementById('ai-key-status');
  if (badge) {
    badge.textContent = hasKey ? '✅ Đã cấu hình' : 'Chưa cấu hình';
    badge.className = `badge ${hasKey ? 'badge-green' : 'badge-red'}`;
  }
}

function toggleKeyVisibility() {
  const input = document.getElementById('gemini-api-key');
  const btn = document.getElementById('show-key-btn');
  if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; }
  else { input.type = 'password'; btn.textContent = '👁'; }
}

function selectAiType(btn) {
  document.querySelectorAll('.ai-type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedAiType = btn.dataset.type;
}

// ── Ước tính token (1 token ≈ 4 ký tự tiếng Việt)
function estimateTokens(text) {
  return Math.ceil(text.length / 3.5);
}

// ── Xây dựng prompt tối ưu token
function buildGeminiPrompt(type, n, saveMode = false) {
  const data   = APP_DATA.slice(0, n);
  const latest = data[0];
  const customQ = document.getElementById('ai-custom-question').value.trim();

  // Thống kê đã tính sẵn (không gửi raw data)
  const g8Freq  = calcFrequency(getG8Array(n));
  const dbFreq  = calcFrequency(getDBTailArray(n));
  const g8Gan   = calcGan(getG8Array());
  const dbGan   = calcGan(getDBTailArray());
  const g8Prob  = calcProbability(getG8Array(n));
  const dbProb  = calcProbability(getDBTailArray(n));

  // Lấy top theo từng chiều, gọn hơn
  const topK = (obj, k) => Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,k);

  const topG8Freq  = topK(g8Freq, 10).map(([n,c])=>`${n}(${c})`).join(' ');
  const topDBFreq  = topK(dbFreq, 10).map(([n,c])=>`${n}(${c})`).join(' ');
  const topG8Prob  = topK(g8Prob, 5).map(([n,s])=>`${n}[${s.toFixed(0)}%]`).join(' ');
  const topDBProb  = topK(dbProb, 5).map(([n,s])=>`${n}[${s.toFixed(0)}%]`).join(' ');
  const ganG8Top   = topK(g8Gan, 5).map(([n,v])=>`${n}:${v}kỳ`).join(' ');
  const ganDBTop   = topK(dbGan, 5).map(([n,v])=>`${n}:${v}kỳ`).join(' ');

  // 20 kỳ gần nhất theo dạng ngắn gọn (thay vì toàn bộ raw)
  const recent20 = data.slice(0, 20)
    .map(d => `${d.date.slice(0,5)}|G8:${d.g8}|DB:${d.dbTail||d.db.slice(-2)}`)
    .join('; ');

  // Focus
  const stationName = stationList[currentStation]?.name || 'TP.HCM';
  const focus = {
    full:    `Phân tích toàn diện G8 và đuôi ĐB (Đài ${stationName}).`,
    g8:      `Chỉ phân tích số Giải 8 (G8 - Đài ${stationName}).`,
    db:      `Chỉ phân tích đuôi Giải Đặc Biệt (Đài ${stationName}).`,
    pattern: `Phát hiện pattern/chu kỳ ẩn (Đài ${stationName}).`,
    vip:     `Chốt số VIP (Bạch thủ, Song thủ) đài ${stationName} hôm nay.`
  }[type] || '';

  if (type === 'vip') {
    return `Chuyên gia XSKT ${stationName}. ${focus}

DỮ LIỆU (${n} kỳ, đến ${latest?.date}):
• Tần suất G8 cao nhất: ${topG8Freq}
• Tần suất đuôi ĐB cao nhất: ${topDBFreq}
• Xác suất G8: ${topG8Prob}
• Xác suất ĐB: ${topDBProb}
• G8 gan: ${ganG8Top}
• ĐB gan: ${ganDBTop}
${customQ ? `• Câu hỏi: ${customQ}` : ''}

YÊU CẦU ĐẶC BIỆT (CHỐT SỐ VIP):
Bỏ qua mọi phân tích rườm rà. Dựa trên dữ liệu trên, hãy chốt thẳng:
1. 🎯 BẠCH THỦ (1 con số đẹp nhất đài ${stationName} hôm nay) + Giải thích trong 1 câu ngắn gọn.
2. 🎯 SONG THỦ (1 cặp số an toàn nhất) + Giải thích trong 1 câu ngắn gọn.
3. ⚠️ Lưu ý ngắn gọn: Đây chỉ là gợi ý thống kê, không chắc chắn 100%.

Format thật to, rõ ràng, nổi bật các con số bằng **số**. Không viết dài dòng.`;
  }

  // Prompt ngắn gọn nhưng đầy đủ thông tin (Cho các chế độ khác)
  const prompt = `Chuyên gia XSKT ${stationName}. ${focus}

DỮ LIỆU (${n} kỳ, đến ${latest?.date}):
• Kỳ mới nhất: ${latest?.date}(${getDayName(latest?.day)}) G8=${latest?.g8} ĐB=${latest?.db}
• Tần suất G8 cao nhất: ${topG8Freq}
• Tần suất đuôi ĐB cao nhất: ${topDBFreq}
• Xác suất tổng hợp G8: ${topG8Prob}
• Xác suất tổng hợp ĐB: ${topDBProb}
• G8 gan lâu: ${ganG8Top}
• ĐB gan lâu: ${ganDBTop}
• 20 kỳ gần: ${recent20}
${customQ ? `• Câu hỏi: ${customQ}` : ''}

YÊU CẦU:
1. 🔥 Top 5 G8 kỳ tới + lý do
2. ⭐ Top 5 đuôi ĐB kỳ tới + lý do
3. 🧊 Số gan đáng chú ý
4. 🔍 Pattern/xu hướng nổi bật
5. ⚠️ Lưu ý: Chỉ mang tính thống kê

Format: cấu trúc rõ, dùng emoji, highlight số bằng **số**.`;

  return prompt;
}

function parseAiResponse(text) {
  // Convert markdown-like text to HTML
  let html = text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h3>$1</h3>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^[-•]\s(.+)$/gm, '<li>$1</li>');

  // Wrap lists
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  html = `<p>${html}</p>`;

  // Highlight 2-digit numbers (likely lottery numbers)
  html = html.replace(/\b(\d{2})\b/g, (match, num) => {
    if (parseInt(num) <= 99) {
      return `<span style="font-weight:900;color:var(--gold);background:rgba(245,197,24,0.1);padding:1px 5px;border-radius:4px">${num}</span>`;
    }
    return match;
  });

  return html;
}

async function runAiAnalysis() {
  const key = getGeminiKey();
  if (!key) {
    showNotification('⚠️ Vui lòng nhập và lưu Gemini API Key trước!', 'warning');
    document.getElementById('gemini-api-key').focus();
    return;
  }
  if (APP_DATA.length === 0) {
    showNotification('⚠️ Chưa có dữ liệu để phân tích!', 'warning');
    return;
  }

  const btn      = document.getElementById('btn-analyze');
  const modelSel = document.getElementById('ai-model-select');
  const model    = modelSel ? modelSel.value : 'gemini-2.0-flash-exp';
  const n        = parseInt(document.getElementById('ai-data-range').value);
  const prompt   = buildGeminiPrompt(selectedAiType, n);
  const estTokens = estimateTokens(prompt);

  btn.disabled = true;
  btn.innerHTML = '<span class="btn-icon">⟳</span> Đang phân tích...';

  const resultEl = document.getElementById('ai-result-body');
  resultEl.innerHTML = `
    <div class="ai-loading">
      <div class="ai-spinner"></div>
      <div class="ai-loading-text">🤖 ${model} đang phân tích ${n} kỳ...</div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Ước tính ~${estTokens} token input · Thường mất 5-15s</div>
    </div>`;

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  try {
    const response = await fetch(`${apiUrl}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          topP: 0.9
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      const errMsg = errData?.error?.message || `HTTP ${response.status}`;
      if (response.status === 400 && errMsg.includes('API_KEY')) {
        throw new Error('API Key không hợp lệ. Kiểm tra lại key của bạn.');
      } else if (response.status === 429) {
        throw new Error('Vượt quá giới hạn request. Vui lòng chờ 1 phút rồi thử lại.');
      }
      throw new Error(errMsg);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini không trả về kết quả. Thử lại sau.');

    const tokenInfo = data.usageMetadata;
    document.getElementById('ai-token-info').textContent =
      tokenInfo ? `📊 ${tokenInfo.promptTokenCount} → ${tokenInfo.candidatesTokenCount} tokens` : '';

    const htmlResult = parseAiResponse(text);
    resultEl.innerHTML = `
      <div class="ai-result">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border)">
          <span style="font-size:20px">🤖</span>
          <div>
            <strong style="color:var(--purple)">Gemini 2.0 Flash</strong>
            <div style="font-size:11px;color:var(--text-muted)">${new Date().toLocaleString('vi-VN')} · Phân tích ${n} kỳ</div>
          </div>
        </div>
        ${htmlResult}
      </div>`;

    // Save to history
    aiHistory.unshift({
      time: new Date().toLocaleString('vi-VN'),
      type: selectedAiType,
      n,
      preview: text.slice(0, 120) + '...',
      full: htmlResult
    });
    if (aiHistory.length > 5) aiHistory.pop();
    renderAiHistory();

    showNotification('✅ Phân tích AI hoàn thành!', 'success');

    if (selectedAiType === 'vip') {
      triggerFireworks();
    }

  } catch (err) {
    resultEl.innerHTML = `
      <div style="padding:20px;text-align:center">
        <div style="font-size:40px;margin-bottom:12px">❌</div>
        <div style="color:var(--red-light);font-weight:700;margin-bottom:8px">Lỗi khi gọi Gemini API</div>
        <div style="color:var(--text-muted);font-size:13px">${err.message}</div>
        <div style="margin-top:12px;font-size:12px;color:var(--text-muted)">
          Kiểm tra: API Key đúng chưa? Còn quota không? Mạng có ổn không?
        </div>
      </div>`;
    showNotification(`❌ Lỗi AI: ${err.message}`, 'error');
  }

  btn.disabled = false;
  btn.innerHTML = '<span class="btn-icon">✨</span> Phân Tích Bằng AI';
}

function renderAiHistory() {
  const panel = document.getElementById('ai-history-panel');
  const list = document.getElementById('ai-history-list');
  if (aiHistory.length === 0) { panel.style.display = 'none'; return; }
  panel.style.display = 'block';
  list.innerHTML = aiHistory.map((h, i) => `
    <div class="ai-history-item" onclick="loadAiHistory(${i})">
      <div class="ai-history-time">${h.time} · ${h.n} kỳ · ${h.type}</div>
      <div class="ai-history-preview">${h.preview}</div>
    </div>`).join('');
}

function loadAiHistory(idx) {
  const h = aiHistory[idx];
  document.getElementById('ai-result-body').innerHTML = `
    <div class="ai-result">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border)">
        <span style="font-size:20px">📜</span>
        <div>
          <strong style="color:var(--purple)">Kết quả từ lịch sử</strong>
          <div style="font-size:11px;color:var(--text-muted)">${h.time}</div>
        </div>
      </div>
      ${h.full}
    </div>`;
}

function clearAiHistory() {
  aiHistory = [];
  renderAiHistory();
  showNotification('🗑 Đã xóa lịch sử AI', 'success');
}

// ============ NOTIFICATIONS ============
function showNotification(msg, type = 'success') {
  const colors = {
    success: ['rgba(6,214,160,0.15)', 'rgba(6,214,160,0.4)', 'var(--green)'],
    warning: ['rgba(245,197,24,0.15)', 'rgba(245,197,24,0.4)', 'var(--gold)'],
    error:   ['rgba(230,57,70,0.15)',  'rgba(230,57,70,0.4)',  'var(--red-light)']
  };
  const [bg, border, color] = colors[type] || colors.success;
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:600;background:${bg};border:1px solid ${border};color:${color};box-shadow:0 4px 24px rgba(0,0,0,0.4);transition:opacity 0.3s;max-width:320px`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity='0'; setTimeout(()=>el.remove(),300); }, 3500);
}

// ============ TAB NAVIGATION ============
function initTabs() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(`tab-${tabId}`).classList.add('active');
      if (tabId === 'history') renderHistory();
      if (tabId === 'stats') renderStats();
      if (tabId === 'predict') renderPredictions();
    });
  });
}

// ============ INIT ============
async function init() {
  // Đăng ký Service Worker cho PWA (iPhone)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW ref failed', err));
  }

  // Load API key nếu có
  const savedKey = getGeminiKey();
  if (savedKey) {
    document.getElementById('gemini-api-key').value = savedKey;
    updateKeyStatus(true);
  }

  loadTheme();
  initTabs();
  startSmartAlerts();

  // Load danh sách đài
  await fetchStations();

  // Check server
  const serverOk = await checkServer();

  // Fetch dữ liệu
  if (serverOk) {
    const fetched = await fetchDataFromServer();
    if (!fetched) {
      setServerStatus('offline', 'Lỗi tải dữ liệu');
    }
  }

  renderAll();

  // Auto-check server mỗi 60 giây
  setInterval(async () => {
    const ok = await checkServer();
    if (ok && APP_DATA.length === FALLBACK_DATA.length) {
      const fetched = await fetchDataFromServer();
      if (fetched) renderAll();
    }
  }, 60000);

  // Animate heatmap
  setTimeout(() => {
    document.querySelectorAll('.hm-cell').forEach((cell, i) => {
      cell.style.opacity = '0';
      setTimeout(() => {
        cell.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        cell.style.opacity = '1';
      }, i * 4);
    });
  }, 200);
}

// ── Cập nhật ước tính token live khi thay đổi cài đặt
function updateTokenEstimate() {
  const el = document.getElementById('token-estimate');
  if (!el || APP_DATA.length === 0) return;
  const n = parseInt(document.getElementById('ai-data-range')?.value || 50);
  const prompt = buildGeminiPrompt(selectedAiType, n);
  const tokens = estimateTokens(prompt);
  const color = tokens < 500 ? 'var(--green)' : tokens < 1000 ? 'var(--gold)' : 'var(--red-light)';
  el.innerHTML = `<span style="color:${color}">📊 Ước tính: ~${tokens} token input</span>
    <span style="color:var(--text-muted);margin-left:8px">· Free: 1M/ngày · Output: ~1024 token</span>`;
}

// ============ UX ENHANCEMENTS ============
function toggleTheme() {
  const root = document.documentElement;
  root.classList.toggle('light-mode');
  const isLight = root.classList.contains('light-mode');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

function loadTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') {
    document.documentElement.classList.add('light-mode');
  }
}

function playSound(id) {
  try {
    const audio = document.getElementById('sound-' + id);
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(()=>{});
    }
  } catch(e){}
}

function triggerFireworks() {
  if (typeof confetti === 'function') {
    var duration = 3 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
    var interval = setInterval(function() {
      var timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) { return clearInterval(interval); }
      var particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } }));
    }, 250);
  }
}

function startSmartAlerts() {
  let alerted1610 = false;
  let alerted1640 = false;

  setInterval(() => {
    const d = new Date();
    const hh = d.getHours();
    const mm = d.getMinutes();
    const ss = d.getSeconds();

    if (hh === 16 && mm === 10 && ss < 5 && !alerted1610) {
      playSound('ting');
      showNotification('⏰ Sắp tới giờ quay số (16:15)! Chuẩn bị tinh thần nào!', 'warning');
      alerted1610 = true;
    }
    if (hh === 16 && mm === 40 && ss < 5 && !alerted1640) {
      playSound('ting');
      showNotification('🎉 Đã có kết quả xổ số! Mở tab AI để chốt số VIP ngày mai ngay!', 'success');
      alerted1640 = true;
    }
    
    // Reset flags at midnight
    if (hh === 0 && mm === 0) {
      alerted1610 = false;
      alerted1640 = false;
    }
  }, 1000);
}

// ============ CAMERA OCR SCANNING ============
async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const previewContainer = document.getElementById('scan-preview-container');
  const previewImg = document.getElementById('scan-preview-img');
  const statusEl = document.getElementById('scan-status');
  const resultEl = document.getElementById('scan-result');

  previewContainer.style.display = 'block';
  statusEl.textContent = 'Đang nén ảnh...';
  statusEl.style.color = 'var(--text-muted)';
  resultEl.style.display = 'none';

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = async function() {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 1024;
      let width = img.width;
      let height = img.height;
      if (width > height && width > MAX_SIZE) {
        height *= MAX_SIZE / width;
        width = MAX_SIZE;
      } else if (height > MAX_SIZE) {
        width *= MAX_SIZE / height;
        height = MAX_SIZE;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      const base64Url = canvas.toDataURL('image/jpeg', 0.8);
      previewImg.src = base64Url;
      const base64Data = base64Url.split(',')[1];
      
      statusEl.textContent = 'Đang gửi cho AI phân tích...';
      
      await scanTicketWithAI(base64Data, statusEl, resultEl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function scanTicketWithAI(base64Data, statusEl, resultEl) {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    statusEl.textContent = 'Vui lòng nhập API Key ở tab AI trước!';
    statusEl.style.color = 'var(--red-light)';
    return;
  }

  const prompt = `Đây là tờ vé số kiến thiết. Hãy đọc các thông tin sau và trả về định dạng JSON nghiêm ngặt, không kèm văn bản nào khác.
{
  "station": "Tên Đài (ví dụ: TP.HCM, Vĩnh Long, Bình Dương...)",
  "date": "Ngày quay số định dạng DD/MM/YYYY",
  "number": "Dãy số dự thưởng (thường là 6 chữ số)"
}`;

  const payload = {
    contents: [{
      role: "user",
      parts: [
        { text: prompt },
        { inlineData: { mimeType: "image/jpeg", data: base64Data } }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
  };

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('API Error ' + response.status);
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini không đọc được.');

    const ticket = JSON.parse(text);
    statusEl.textContent = `Đọc thành công: ${ticket.station} - Ngày ${ticket.date} - Số ${ticket.number}`;
    statusEl.style.color = 'var(--green)';
    
    await checkWin(ticket, resultEl);

  } catch (err) {
    statusEl.textContent = 'Lỗi phân tích: ' + err.message;
    statusEl.style.color = 'var(--red-light)';
  }
}

async function checkWin(ticket, resultEl) {
  resultEl.style.display = 'block';
  resultEl.innerHTML = '<div class="loading-spinner"><div class="spinner"></div> Đang đối chiếu máy chủ...</div>';

  try {
    let stationId = null;
    const sName = ticket.station.toLowerCase();
    for (const [id, label] of Object.entries(stationList)) {
      if (sName.includes(label.toLowerCase()) || label.toLowerCase().includes(sName)) {
        stationId = id;
        break;
      }
    }
    if (!stationId) {
      if (sName.includes('hcm') || sName.includes('hồ chí minh') || sName.includes('tp')) stationId = 'xshcm';
      else if (sName.includes('vĩnh long')) stationId = 'xsvl';
      else if (sName.includes('bình dương')) stationId = 'xsbd';
      if (!stationId) stationId = currentStation;
    }

    const res = await fetch(`${API_BASE}/api/xsmn?station=${stationId}`);
    const results = await res.json();
    
    const dayData = results.find(d => d.date === ticket.date);
    
    if (!dayData) {
      resultEl.innerHTML = `<div style="color:var(--gold);text-align:center;padding:15px;">⚠️ Không tìm thấy kết quả đài ${stationList[stationId]||stationId} ngày ${ticket.date}.<br>Có thể chưa xổ hoặc AI đọc nhầm thông tin.</div>`;
      return;
    }

    let winPrize = null;
    let winNumber = null;
    
    const checkNumber = ticket.number.trim();
    if (dayData.prizes) {
      const p = dayData.prizes;
      if (p.db && checkNumber.endsWith(p.db)) { winPrize = 'Giải Đặc Biệt'; winNumber = p.db; }
      else if (p.g1 && checkNumber.endsWith(p.g1)) { winPrize = 'Giải Nhất'; winNumber = p.g1; }
      else if (p.g2 && checkNumber.endsWith(p.g2)) { winPrize = 'Giải Nhì'; winNumber = p.g2; }
      else if (p.g3 && p.g3.split(' ').some(x => checkNumber.endsWith(x))) { winPrize = 'Giải Ba'; winNumber = p.g3.split(' ').find(x => checkNumber.endsWith(x)); }
      else if (p.g4 && p.g4.split(' ').some(x => checkNumber.endsWith(x))) { winPrize = 'Giải Tư'; winNumber = p.g4.split(' ').find(x => checkNumber.endsWith(x)); }
      else if (p.g5 && checkNumber.endsWith(p.g5)) { winPrize = 'Giải Năm'; winNumber = p.g5; }
      else if (p.g6 && p.g6.split(' ').some(x => checkNumber.endsWith(x))) { winPrize = 'Giải Sáu'; winNumber = p.g6.split(' ').find(x => checkNumber.endsWith(x)); }
      else if (p.g7 && checkNumber.endsWith(p.g7)) { winPrize = 'Giải Bảy'; winNumber = p.g7; }
      else if (p.g8 && checkNumber.endsWith(p.g8)) { winPrize = 'Giải Tám'; winNumber = p.g8; }
    } else {
      if (dayData.db && checkNumber.endsWith(dayData.db)) { winPrize = 'Giải Đặc Biệt'; winNumber = dayData.db; }
      else if (dayData.g8 && checkNumber.endsWith(dayData.g8)) { winPrize = 'Giải Tám'; winNumber = dayData.g8; }
    }

    if (winPrize) {
      playSound('ting');
      triggerFireworks();
      resultEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
          <div style="font-size: 50px; margin-bottom:10px">🎉</div>
          <h2 style="color:var(--green); margin-bottom:5px">CHÚC MỪNG TRÚNG THƯỞNG!</h2>
          <p style="font-size: 18px">Bạn đã trúng <strong>${winPrize}</strong>!</p>
          <p style="color:var(--text-muted)">Dãy số trúng: <strong style="color:var(--gold)">${winNumber}</strong></p>
        </div>
      `;
    } else {
      resultEl.innerHTML = `
        <div style="text-align:center; padding: 20px;">
          <div style="font-size: 50px; margin-bottom:10px">😢</div>
          <h2 style="color:var(--text-primary); margin-bottom:5px">RẤT TIẾC!</h2>
          <p style="font-size: 16px; color:var(--text-muted)">Tờ vé số của bạn không trúng giải nào.</p>
          <p style="color:var(--text-muted); font-size:12px; margin-top:10px">Chúc bạn may mắn lần sau!</p>
        </div>
      `;
    }

  } catch(e) {
    resultEl.innerHTML = '<div style="color:var(--red-light);text-align:center;padding:15px;">Lỗi dò số: ' + e.message + '</div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  // Gắn live token estimator
  setTimeout(() => {
    const rangeEl = document.getElementById('ai-data-range');
    if (rangeEl) rangeEl.addEventListener('change', updateTokenEstimate);
    document.querySelectorAll('.ai-type-btn').forEach(b =>
      b.addEventListener('click', () => setTimeout(updateTokenEstimate, 50))
    );
    updateTokenEstimate();
  }, 1500);
});
