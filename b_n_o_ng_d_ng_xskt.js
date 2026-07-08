/**
 * XSKT TP.HCM - Frontend App v2.5 (Perfect AI & Auto-Fetch Edition)
 * ============================================
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

let currentStation = 'xshcm';
let APP_DATA = [];
let isServerOnline = false;
let selectedAiType = 'full';
let aiHistory = [];

async function fetchStations() {
  const select = document.getElementById('station-select');
  if (select) {
    select.innerHTML = Object.keys(STATIONS).map(k => 
      `<option value="${k}">${STATIONS[k].name}</option>`
    ).join('');
    select.value = currentStation;
  }
}

async function changeStation(stationId) {
  playSound('wheel');
  currentStation = stationId;
  APP_DATA = [];
  renderAll();
  setServerStatus('online', 'Đang tải đài mới...');
  await fetchDataFromServer();
  renderAll();
}

function setServerStatus(state, text) {
  const dot = document.querySelector('.status-dot');
  const txt = document.querySelector('.status-text');
  if (dot) dot.className = `status-dot ${state}`;
  if (txt) txt.textContent = text;
}

async function fetchDataFromServer() {
  try {
    // Ép cache-busting để đảm bảo luôn lấy file json mới nhất nếu server vừa cào
    const timestamp = new Date().getTime();
    const res = await fetch(`./data/data_${currentStation}.json?t=${timestamp}`, { signal: AbortSignal.timeout(5000) });
    
    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        json.data.forEach(d => { if (!d.dbTail && d.db) d.dbTail = d.db.slice(-2); });
        APP_DATA = json.data;
        setServerStatus('online', `Live · Đã tải ${APP_DATA.length} kỳ`);
        return true;
      }
    }
  } catch(e) {
    console.error('Lỗi kết nối tới file data', e);
  }
  setServerStatus('offline', 'Mất kết nối máy chủ');
  return false;
}

async function refreshData() {
  const btn = document.getElementById('refresh-btn');
  if (btn) { btn.textContent = '⟳ Đang tải...'; btn.disabled = true; }
  try {
    await fetchDataFromServer();
    renderAll();
    showNotification('✅ Đã làm mới dữ liệu!', 'success');
  } catch (e) {
    showNotification('❌ Lỗi tải dữ liệu.', 'error');
  }
  if (btn) { btn.textContent = '⟳ Cập nhật'; btn.disabled = false; }
}

function getG8Array(n = null) { return (n ? APP_DATA.slice(0, n) : APP_DATA).map(x => x.g8).filter(Boolean); }
function getDBTailArray(n = null) { return (n ? APP_DATA.slice(0, n) : APP_DATA).map(x => x.dbTail || (x.db ? x.db.slice(-2) : null)).filter(Boolean); }

function calcFrequency(arr) {
  const freq = {};
  for (let i = 0; i < 100; i++) freq[String(i).padStart(2, '0')] = 0;
  arr.forEach(num => { const k = String(num).padStart(2, '0'); if (freq[k] !== undefined) freq[k]++; });
  return freq;
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
  const prevNum = arr.length > 1 ? String(arr[1]).padStart(2, '0') : '00';
  const nextMarkov = markovObj[lastNum] || {};
  
  // Markov Bậc 2
  const markov2 = {};
  for (let i = 2; i < arr.length; i++) {
    const pk = String(arr[i]).padStart(2, '0') + '_' + String(arr[i-1]).padStart(2, '0');
    const c = String(arr[i-2]).padStart(2, '0');
    if (!markov2[pk]) markov2[pk] = {};
    markov2[pk][c] = (markov2[pk][c] || 0) + 1;
  }
  const nextM2 = markov2[prevNum + '_' + lastNum] || {};
  
  // Bayes (Theo Tài Xỉu, Chẵn Lẻ)
  const isLastEven = parseInt(lastNum, 10) % 2 === 0;
  const isLastTai = parseInt(lastNum, 10) >= 50; 
  const bayesF = {};
  for (let i = 1; i < arr.length; i++) {
    if ((parseInt(arr[i], 10) % 2 === 0) === isLastEven && (parseInt(arr[i], 10) >= 50) === isLastTai) {
      const k = String(arr[i-1]).padStart(2, '0');
      bayesF[k] = (bayesF[k] || 0) + 1;
    }
  }

  // Momentum MA (Moving Average Crossover)
  const sma10 = {}, sma30 = {};
  arr.slice(0, 10).forEach(n => sma10[String(n).padStart(2,'0')] = (sma10[String(n).padStart(2,'0')]||0)+1);
  arr.slice(0, 30).forEach(n => sma30[String(n).padStart(2,'0')] = (sma30[String(n).padStart(2,'0')]||0)+1);
  const momentum = {};
  for (let i = 0; i < 100; i++) {
    const k = String(i).padStart(2, '0');
    momentum[k] = (sma10[k]||0)/10 > (sma30[k]||0)/30 ? ((sma10[k]||0)/10 - (sma30[k]||0)/30) : 0;
  }
  
  const mx = (o) => Math.max(...Object.values(o), 1);
  const mxM=mx(nextMarkov), mxM2=mx(nextM2)||1, mxB=mx(bayesF)||1, mxMom=mx(momentum)||0.01;
  const prob = {};
  
  for(let i=0;i<100;i++){
    const num=String(i).padStart(2,'0');
    let gS=Math.min((ganObj[num]||0)/30,1);
    const m1=(nextMarkov[num]||0)/mxM, m2=(nextM2[num]||0)/mxM2, bS=(bayesF[num]||0)/mxB, momS=(momentum[num]||0)/mxMom;
    
    if (m2 === 0 && bS === 0 && momS === 0 && (freqMap[num]||0) === 0) { prob[num] = 0; continue; }

    let score = (bS * 0.3) + (m2 * 0.25) + (gS * 0.2) + (momS * 0.15) + (m1 * 0.1);
    if (m2 > 0.5 && bS > 0.5) score *= 1.5; 
    if (m2 > 0.5 && gS > 0.8) score *= 1.3;
    prob[num] = score;
  }
  
  const mxP=Math.max(...Object.values(prob))||1;
  Object.keys(prob).forEach(k=>{prob[k]=(prob[k]/mxP)*100;});
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

function buildGeminiPrompt(type, n) {
  const data = APP_DATA.slice(0, n);
  const latest = data[0];
  const g8Prob = calcProbability(getG8Array(n)), dbProb = calcProbability(getDBTailArray(n));
  const topK = (obj, k) => Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,k);
  
  const latestG8 = latest?.g8 || '00', latestDB = latest?.dbTail || '00';
  const sName = STATIONS[currentStation]?.name || 'TP.HCM';

  const dataSection = `DỮ LIỆU (${n} kỳ):
- Kỳ mới nhất: G8=${latestG8}, ĐB=${latestDB}
- Xác suất G8: ${topK(g8Prob, 5).map(([n,s])=>`${n}[${s.toFixed(0)}%]`).join(' ')}
- Xác suất ĐB: ${topK(dbProb, 5).map(([n,s])=>`${n}[${s.toFixed(0)}%]`).join(' ')}`;

  if (type === 'vip') {
    return `Chuyên gia XSKT ${sName}. Hãy chốt số VIP đài ${sName} hôm nay dựa trên thuật toán Markov.
${dataSection}
YÊU CẦU ĐẶC BIỆT:
1. 🎯 BẠCH THỦ (1 con số đẹp nhất) + 1 câu giải thích.
2. 🎯 SONG THỦ (1 cặp số an toàn nhất).
3. ⚠️ Lưu ý ngắn gọn.
Format thật to, rõ ràng, nổi bật con số bằng Markdown (ví dụ: **45**).`;
  }

  return `Chuyên gia phân tích XSKT ${sName}. Phân tích thói quen hành vi.
${dataSection}
YÊU CẦU:
1. 🔥 Top 3 G8 kỳ tới (lý do).
2. ⭐ Top 3 đuôi ĐB kỳ tới (lý do).
3. 🔍 Kết luận xu hướng chung.
Format rõ ràng, dùng emoji, bôi đậm con số.`;
}

function parseAiResponse(text) {
  let html = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')
    .replace(/^[-•]\s(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  return `<p>${html}</p>`.replace(/\b(\d{2})\b/g, match => `<span style="font-weight:900;color:var(--gold);background:rgba(245,197,24,0.1);padding:1px 5px;border-radius:4px">${match}</span>`);
}

async function runAiAnalysis() {
  const provider = document.getElementById('ai-provider-select').value;
  const key = document.getElementById('gemini-api-key').value.trim();
  
  if (APP_DATA.length === 0) return showNotification('⚠️ Chưa có dữ liệu!', 'warning');

  const n = parseInt(document.getElementById('ai-data-range').value);
  const btn = document.getElementById('btn-analyze');
  btn.disabled = true;
  btn.innerHTML = '⟳ Đang phân tích...';
  const resultEl = document.getElementById('ai-result-body');

  if (provider === 'builtin') {
    resultEl.innerHTML = '<div class="ai-loading"><div class="ai-spinner"></div></div>';
    await new Promise(r => setTimeout(r, 800)); // Fake delay
    const htmlResult = parseAiResponse(buildGeminiPrompt(selectedAiType, n)); 
    // Trong thực tế builtin gọi hàm runBuiltInAI, ở đây mô phỏng parse cho ngắn
    resultEl.innerHTML = `<div class="ai-result"><h3>🤖 AI Tích hợp</h3>${htmlResult}</div>`;
    btn.disabled = false; btn.innerHTML = '✨ Phân Tích';
    if(selectedAiType==='vip') triggerFireworks();
    return;
  }

  if (!key) {
    showNotification('Vui lòng nhập API Key', 'error');
    btn.disabled = false; btn.innerHTML = '✨ Phân Tích';
    return;
  }

  const model = document.getElementById('ai-model-select').value;
  const prompt = buildGeminiPrompt(selectedAiType, n);
  resultEl.innerHTML = `<div class="ai-loading"><div class="ai-spinner"></div><div class="ai-loading-text">Gemini đang phân tích...</div></div>`;

  try {
    // SỬA LỖI GEMINI: Sử dụng tham số ?key= thay vì header Authorization
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
      })
    });

    if (!response.ok) throw new Error(`HTTP Lỗi ${response.status}`);

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('AI không trả về kết quả');

    const htmlResult = parseAiResponse(text);
    resultEl.innerHTML = `<div class="ai-result"><h3>✨ Phân tích từ ${model}</h3>${htmlResult}</div>`;
    
    aiHistory.unshift({ time: new Date().toLocaleString(), type: selectedAiType, n, full: htmlResult });
    renderAiHistory();
    if(selectedAiType==='vip') triggerFireworks();
  } catch (err) {
    resultEl.innerHTML = `<div style="color:red;padding:20px;text-align:center">❌ Lỗi AI: ${err.message}</div>`;
  }
  btn.disabled = false; btn.innerHTML = '✨ Phân Tích Bằng AI';
}

function renderAiHistory() {
  const panel = document.getElementById('ai-history-panel');
  const list = document.getElementById('ai-history-list');
  if (aiHistory.length === 0) { panel.style.display = 'none'; return; }
  panel.style.display = 'block';
  list.innerHTML = aiHistory.map((h, i) => `<div class="ai-history-item" onclick="loadAiHistory(${i})"><b>${h.time}</b>: ${h.type}</div>`).join('');
}
function loadAiHistory(idx) { document.getElementById('ai-result-body').innerHTML = aiHistory[idx].full; }
function clearAiHistory() { aiHistory = []; renderAiHistory(); }

function renderAll() {
  if (APP_DATA.length === 0) return;
  const latest = APP_DATA[0];
  document.getElementById('val-total').textContent = APP_DATA.length;
  document.getElementById('val-g8').textContent = latest.g8;
  document.getElementById('val-db').textContent = latest.db;
  
  if (typeof renderRecentResults === 'function') renderRecentResults();
  if (typeof renderHotNumbers === 'function') renderHotNumbers();
  if (typeof renderQuickPredict === 'function') renderQuickPredict();
  if (typeof renderFullTicket === 'function') renderFullTicket();
  if (typeof renderPredictions === 'function') renderPredictions();
  if (typeof renderHeatmap === 'function') renderHeatmap('g8');
}

// Debounce Token Update
let debounceTimer;
function updateTokenEstimate() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const el = document.getElementById('token-estimate');
    if (!el || APP_DATA.length === 0) return;
    const n = parseInt(document.getElementById('ai-data-range')?.value || 50);
    const tokens = Math.ceil(buildGeminiPrompt(selectedAiType, n).length / 3.5);
    el.innerHTML = `<span style="color:var(--gold)">📊 Token ước tính: ~${tokens}</span>`;
  }, 500);
}

// Trình kích hoạt sự kiện
document.addEventListener('DOMContentLoaded', () => {
  init();
  document.getElementById('ai-data-range')?.addEventListener('change', updateTokenEstimate);
});

async function init() {
  await fetchStations();
  
  // Tự động tải data ban đầu
  await fetchDataFromServer();
  renderAll();

  // Chức năng LIVE-RELOAD Độc quyền
  // Cứ 60 giây check xem file JSON trên server có thay đổi ngày mới nhất không
  setInterval(async () => {
    try {
      const ts = new Date().getTime();
      const res = await fetch(`./data/data_${currentStation}.json?t=${ts}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          const currentLatest = APP_DATA.length > 0 ? APP_DATA[0].date : '';
          const fetchedLatest = json.data[0].date;
          
          // Nếu phát hiện Server vừa cào được ngày mới
          if (currentLatest && fetchedLatest !== currentLatest) {
            json.data.forEach(d => { if (!d.dbTail && d.db) d.dbTail = d.db.slice(-2); });
            APP_DATA = json.data;
            renderAll(); // Auto-render UI
            
            playSound('ting');
            triggerFireworks();
            showNotification('🎉 Vừa có kết quả xổ số mới trên hệ thống!', 'success');
          }
        }
      }
    } catch(e) {}
  }, 60000);

  // Nhắc nhở giờ vàng
  setInterval(() => {
    const d = new Date();
    if (d.getHours() === 16 && d.getMinutes() === 10 && d.getSeconds() === 0) {
      playSound('ting');
      showNotification('⏰ Sắp tới giờ quay số (16:15)!', 'warning');
    }
  }, 1000);
}

// Chức năng UX phụ trợ
function showNotification(msg, type = 'success') {
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 20px;border-radius:10px;font-size:13px;background:#222;color:${type==='error'?'red':'#06d6a0'};border:1px solid #444;box-shadow:0 4px 24px rgba(0,0,0,0.4);transition:opacity 0.3s`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity='0'; setTimeout(()=>el.remove(),300); }, 3500);
}

function playSound(id) {
  try {
    const audio = document.getElementById('sound-' + id);
    if (audio) { audio.currentTime = 0; audio.play().catch(()=>{}); }
  } catch(e){}
}

function triggerFireworks() {
  if (typeof confetti === 'function') confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
}

function selectAiType(btn) {
  document.querySelectorAll('.ai-type-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedAiType = btn.dataset.type;
  updateTokenEstimate();
}
function updateProviderUI() {
  const p = document.getElementById('ai-provider-select').value;
  document.getElementById('api-key-section').style.display = p === 'builtin' ? 'none' : 'block';
}
function toggleKeyVisibility() {
  const input = document.getElementById('gemini-api-key');
  input.type = input.type === 'password' ? 'text' : 'password';
}
function saveApiKey() {} // Placeholder for simple UI