const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const STATIONS = {
  'xshcm': { name: 'TP. HCM', code: 'xshcm-xstp' },
  'xsdt':  { name: 'Đồng Tháp', code: 'xsdt' },
  'xscm':  { name: 'Cà Mau', code: 'xscm' },
  'xsbt':  { name: 'Bến Tre', code: 'xsbt' },
  'xsvt':  { name: 'Vũng Tàu', code: 'xsvt' },
  'xsbl':  { name: 'Bạc Liêu', code: 'xsbl' },
  'xsdn':  { name: 'Đồng Nai', code: 'xsdn' },
  'xsct':  { name: 'Cần Thơ', code: 'xsct' },
  'xsst':  { name: 'Sóc Trăng', code: 'xsst' },
  'xstn':  { name: 'Tây Ninh', code: 'xstn' },
  'xsag':  { name: 'An Giang', code: 'xsag' },
  'xsbth': { name: 'Bình Thuận', code: 'xsbth' },
  'xsvl':  { name: 'Vĩnh Long', code: 'xsvl' },
  'xsbd':  { name: 'Bình Dương', code: 'xsbd' },
  'xstv':  { name: 'Trà Vinh', code: 'xstv' },
  'xsla':  { name: 'Long An', code: 'xsla' },
  'xsbp':  { name: 'Bình Phước', code: 'xsbp' },
  'xshg':  { name: 'Hậu Giang', code: 'xshg' },
  'xstg':  { name: 'Tiền Giang', code: 'xstg' },
  'xskg':  { name: 'Kiên Giang', code: 'xskg' },
  'xsdl':  { name: 'Đà Lạt', code: 'xsld-xsdl' }
};

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

function loadData(stationId) {
  const filePath = path.join(DATA_DIR, `data_${stationId}.json`);
  if (fs.existsSync(filePath)) {
    try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch (e) {}
  }
  return { data: [], lastUpdated: null };
}

function saveData(stationId, dataObj) {
  const filePath = path.join(DATA_DIR, `data_${stationId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(dataObj, null, 2), 'utf8');
}

async function scrapeStation(stationId, stationInfo) {
  console.log(`🔄 Đang cào đài [${stationInfo.name}]...`);
  const cacheObj = loadData(stationId);
  const existingDates = new Set(cacheObj.data.map(d => d.date));
  const results = [];
  
  // Quét trang chủ và trang 30 ngày để cập nhật
  const urls = [`https://xskt.com.vn/${stationInfo.code}`, `https://xskt.com.vn/${stationInfo.code}/30-ngay`];

  for (const url of urls) {
    try {
      const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
      const $ = cheerio.load(response.data);
      
      $('.box-ketqua').each((i, el) => {
        try {
          const box = $(el);
          const h2Text = box.find('h2').text();
          const dateMatch = h2Text.match(/ngày\s+(\d{1,2}\/\d{1,2})/i);
          if (!dateMatch) return;
          
          let rawDate = dateMatch[1];
          const dataUrl = box.find('i[data-url]').attr('data-url') || '';
          const yearMatch = dataUrl.match(/(\d{4})/);
          const year = yearMatch ? yearMatch[1] : new Date().getFullYear();

          const parts = rawDate.split('/');
          const dateStr = `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${year}`;

          // Bỏ qua nếu ngày này đã có trong file json
          if (existingDates.has(dateStr)) return;

          const prizes = {};
          box.find('table.result tbody tr').each((j, tr) => {
            const row = $(tr);
            const title = row.find('td[title]').attr('title') || '';
            const nextTd = row.find('td').eq(1);
            if (title && nextTd.length > 0) {
              let text = nextTd.text().replace(/\s+/g, ' ').trim();
              if (title.includes('Giải ĐB')) prizes.db = text;
              else if (title.includes('Giải nhất')) prizes.g1 = text;
              else if (title.includes('Giải nhì')) prizes.g2 = text;
              else if (title.includes('Giải ba')) prizes.g3 = text;
              else if (title.includes('Giải tư')) prizes.g4 = text;
              else if (title.includes('Giải năm')) prizes.g5 = text;
              else if (title.includes('Giải sáu')) prizes.g6 = text;
              else if (title.includes('Giải bảy')) prizes.g7 = text;
              else if (title.includes('Giải tám')) prizes.g8 = text;
            }
          });

          if (prizes.g8 && prizes.db) {
            existingDates.add(dateStr);
            results.push({
              date: dateStr, day: new Date(year, parts[1]-1, parts[0]).getDay(),
              g8: prizes.g8, db: prizes.db, dbTail: prizes.db.slice(-2), prizes: prizes
            });
          }
        } catch(e){}
      });
      await new Promise(r => setTimeout(r, 500)); 
    } catch (e) {
      console.error(`  ❌ Lỗi fetch:`, e.message);
    }
  }

  // Gộp dữ liệu mới vào dữ liệu cũ
  if (results.length > 0) {
    const parseDate = (dStr) => { const [dd, mm, yyyy] = dStr.split('/'); return new Date(yyyy, mm - 1, dd).getTime(); };
    const combined = [...cacheObj.data, ...results];
    combined.sort((a, b) => parseDate(b.date) - parseDate(a.date));
    
    if (combined.length > 300) combined.length = 300; // Giới hạn lưu 300 kỳ
    
    cacheObj.data = combined;
    cacheObj.lastUpdated = new Date().toISOString();
    saveData(stationId, cacheObj);
    console.log(`✅ Cập nhật thành công ${stationInfo.name} (+${results.length} kỳ mới)`);
  }
}

async function scrapeAll() {
  for (const [id, info] of Object.entries(STATIONS)) {
    await scrapeStation(id, info);
  }
  console.log("🎉 Hoàn tất cào dữ liệu toàn bộ các đài!");
}

scrapeAll();