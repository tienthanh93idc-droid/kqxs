const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

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

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

function loadData(stationId) {
  const filePath = path.join(DATA_DIR, `data_${stationId}.json`);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.error(`Lỗi đọc JSON cho đài ${stationId}`, e);
    }
  }
  return { data: [], lastUpdated: null };
}

function saveData(stationId, dataObj) {
  const filePath = path.join(DATA_DIR, `data_${stationId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(dataObj, null, 2), 'utf8');
}

function parseDayOfWeek(text) {
  text = text.toLowerCase().trim();
  if (text.includes('chủ nhật')) return 0;
  if (text.includes('thứ')) {
    const num = parseInt(text.replace('thứ', '').trim());
    if (!isNaN(num) && num >= 2 && num <= 7) return num;
  }
  return -1;
}

async function scrapeStation(stationId, stationInfo) {
  console.log(`\n🔄 Scrape [${stationInfo.name}]...`);
  
  const cacheObj = loadData(stationId);
  const existingDates = new Set(cacheObj.data.map(d => d.date));
  const results = [];
  
  const urls = [
    `https://xskt.com.vn/${stationInfo.code}`,
    `https://xskt.com.vn/${stationInfo.code}/30-ngay`,
    `https://xskt.com.vn/${stationInfo.code}/100-ngay`,
    `https://xskt.com.vn/${stationInfo.code}/200-ngay`
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html'
  };

  for (const url of urls) {
    try {
      console.log(`  Fetching ${url}...`);
      const response = await axios.get(url, { headers, timeout: 15000 });
      const $ = cheerio.load(response.data);
      const boxes = $('.box-ketqua');
      
      if (boxes.length === 0) continue;
      
      boxes.each((i, el) => {
        try {
          const box = $(el);
          const h2Text = box.find('h2').text();
          const dateMatch = h2Text.match(/ngày\s+(\d{1,2}\/\d{1,2})/i);
          const dayMatch = h2Text.match(/(Thứ\s+\w+|Chủ\s+Nhật)/i);

          if (!dateMatch) return;
          let rawDate = dateMatch[1];
          if (!rawDate) return;
          const dayText = dayMatch ? dayMatch[1] : '';
          const dayNum = parseDayOfWeek(dayText);

          const dataUrl = box.find('i[data-url]').attr('data-url') || '';
          const yearMatch = dataUrl.match(/(\d{4})/);
          const year = yearMatch ? yearMatch[1] : new Date().getFullYear();

          const parts = rawDate.split('/');
          const dateStr = `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${year}`;

          if (existingDates.has(dateStr)) return; // Skip if exists

          const prizes = {};
          box.find('table.result tbody tr').each((j, tr) => {
            const row = $(tr);
            const title = row.find('td[title]').attr('title') || '';
            const nextTd = row.find('td').eq(1);
            if (title && nextTd.length > 0) {
              let html = nextTd.html() || '';
              html = html.replace(/<\/(p|span|em|div|b|i)>/ig, ' </$1>');
              const text = cheerio.load(html).text().replace(/\s+/g, ' ').trim();
              
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
              date: dateStr,
              day: dayNum,
              g8: prizes.g8,
              db: prizes.db,
              dbTail: prizes.db.slice(-2),
              prizes: prizes
            });
          }
        } catch(e){}
      });

      await new Promise(r => setTimeout(r, 800)); // Delay between requests
    } catch (e) {
      console.error(`  ❌ Lỗi fetch ${url}:`, e.message);
    }
  }

  if (results.length > 0) {
    const parseDate = (dStr) => {
      const [dd, mm, yyyy] = dStr.split('/');
      return new Date(yyyy, mm - 1, dd).getTime();
    };
    const combined = [...cacheObj.data, ...results];
    combined.sort((a, b) => parseDate(b.date) - parseDate(a.date));
    
    // Giới hạn 300 kỳ
    if (combined.length > 300) combined.length = 300;
    
    cacheObj.data = combined;
    cacheObj.lastUpdated = new Date().toISOString();
    saveData(stationId, cacheObj);
    console.log(`✅ Đã cập nhật ${stationInfo.name}! Mới: +${results.length}. Tổng: ${combined.length} kỳ.`);
  } else {
    console.log(`⚠️ Không có dữ liệu mới cho ${stationInfo.name}. Tổng: ${cacheObj.data.length} kỳ.`);
  }
}

async function scrapeAll() {
  console.log("==================================================");
  console.log("🎰 XSKT MIỀN NAM - BẮT ĐẦU CÀO DỮ LIỆU TỰ ĐỘNG");
  console.log("==================================================");
  
  for (const [id, info] of Object.entries(STATIONS)) {
    await scrapeStation(id, info);
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log("\n✅ Đã quét xong toàn bộ đài miền Nam!");
}

scrapeAll();
