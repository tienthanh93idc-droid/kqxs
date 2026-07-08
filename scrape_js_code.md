``javascript
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const STATIONS = {
  'xshcm': { name: 'TP. HCM', days: [2, 7], code: 'xshcm-xstp' },
  'xsdt':  { name: 'Äá»“ng ThÃ¡p', days: [2], code: 'xsdt' },
  'xscm':  { name: 'CÃ  Mau', days: [2], code: 'xscm' },
  'xsbt':  { name: 'Báº¿n Tre', days: [3], code: 'xsbt' },
  'xsvt':  { name: 'VÅ©ng TÃ u', days: [3], code: 'xsvt' },
  'xsbl':  { name: 'Báº¡c LiÃªu', days: [3], code: 'xsbl' },
  'xsdn':  { name: 'Äá»“ng Nai', days: [4], code: 'xsdn' },
  'xsct':  { name: 'Cáº§n ThÆ¡', days: [4], code: 'xsct' },
  'xsst':  { name: 'SÃ³c TrÄƒng', days: [4], code: 'xsst' },
  'xstn':  { name: 'TÃ¢y Ninh', days: [5], code: 'xstn' },
  'xsag':  { name: 'An Giang', days: [5], code: 'xsag' },
  'xsbth': { name: 'BÃ¬nh Thuáº­n', days: [5], code: 'xsbth' },
  'xsvl':  { name: 'VÄ©nh Long', days: [6], code: 'xsvl' },
  'xsbd':  { name: 'BÃ¬nh DÆ°Æ¡ng', days: [6], code: 'xsbd' },
  'xstv':  { name: 'TrÃ  Vinh', days: [6], code: 'xstv' },
  'xsla':  { name: 'Long An', days: [7], code: 'xsla' },
  'xsbp':  { name: 'BÃ¬nh PhÆ°á»›c', days: [7], code: 'xsbp' },
  'xshg':  { name: 'Háº­u Giang', days: [7], code: 'xshg' },
  'xstg':  { name: 'Tiá»n Giang', days: [0], code: 'xstg' },
  'xskg':  { name: 'KiÃªn Giang', days: [0], code: 'xskg' },
  'xsdl':  { name: 'ÄÃ  Láº¡t', days: [0], code: 'xsld-xsdl' }
};

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

function loadData(stationId) {
  const filePath = path.join(DATA_DIR, `data_${stationId}.json`);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.error(`Lá»—i Ä‘á»c JSON cho Ä‘Ã i ${stationId}`, e);
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
  if (text.includes('chá»§ nháº­t')) return 0;
  if (text.includes('thá»©')) {
    const num = parseInt(text.replace('thá»©', '').trim());
    if (!isNaN(num) && num >= 2 && num <= 7) return num;
  }
  return -1;
}

async function scrapeStation(stationId, stationInfo) {
  console.log(`\nðŸ”„ Scrape [${stationInfo.name}]...`);
  
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
          const dateMatch = h2Text.match(/ngÃ y\s+(\d{1,2}\/\d{1,2})/i);
          const dayMatch = h2Text.match(/(Thá»©\s+\w+|Chá»§\s+Nháº­t)/i);

          if (!dateMatch) return;
          let rawDate = dateMatch[1];
          if (!rawDate) return;

          const dataUrl = box.find('i[data-url]').attr('data-url') || '';
          const yearMatch = dataUrl.match(/(\d{4})/);
          const year = yearMatch ? yearMatch[1] : new Date().getFullYear();

          const parts = rawDate.split('/');
          const dateStr = `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${year}`;
          const dayNum = new Date(year, parts[1]-1, parts[0]).getDay();
          
          if (existingDates.has(dateStr)) return; // Skip if exists

          const prizes = {};
          box.find('table.result tbody tr').each((j, tr) => {
            const row = $(tr);
            const title = row.find('td[title]').attr('title') || '';
            const nextTd = row.find('td').eq(1);
            if (title && nextTd.length > 0) {
              // Sá»¬A Lá»–I á»ž ÄÃ‚Y: ThÃªm khoáº£ng tráº¯ng vÃ o giá»¯a cÃ¡c tháº» p/span Ä‘á»ƒ sá»‘ khÃ´ng bá»‹ dÃ­nh liá»n
              let html = nextTd.html() || '';
              html = html.replace(/<\/(p|span|em|div|b|i)>/ig, ' </$1>');
              const text = cheerio.load(html).text().replace(/\s+/g, ' ').trim();
              
              if (title.includes('Giáº£i ÄB')) prizes.db = text;
              else if (title.includes('Giáº£i nháº¥t')) prizes.g1 = text;
              else if (title.includes('Giáº£i nhÃ¬')) prizes.g2 = text;
              else if (title.includes('Giáº£i ba')) prizes.g3 = text;
              else if (title.includes('Giáº£i tÆ°')) prizes.g4 = text;
              else if (title.includes('Giáº£i nÄƒm')) prizes.g5 = text;
              else if (title.includes('Giáº£i sÃ¡u')) prizes.g6 = text;
              else if (title.includes('Giáº£i báº£y')) prizes.g7 = text;
              else if (title.includes('Giáº£i tÃ¡m')) prizes.g8 = text;
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
      console.error(`  âŒ Lá»—i fetch ${url}:`, e.message);
    }
  }

  if (results.length > 0) {
    const parseDate = (dStr) => {
      const [dd, mm, yyyy] = dStr.split('/');
      return new Date(yyyy, mm - 1, dd).getTime();
    };
    const combined = [...cacheObj.data, ...results];
    combined.sort((a, b) => parseDate(b.date) - parseDate(a.date));
    
    // Giá»›i háº¡n 300 ká»³
    if (combined.length > 300) combined.length = 300;
    
    cacheObj.data = combined;
    cacheObj.lastUpdated = new Date().toISOString();
    saveData(stationId, cacheObj);
    console.log(`âœ… ÄÃ£ cáº­p nháº­t ${stationInfo.name}! Má»›i: +${results.length}. Tá»•ng: ${combined.length} ká»³.`);
  } else {
    console.log(`âš ï¸ KhÃ´ng cÃ³ dá»¯ liá»‡u má»›i cho ${stationInfo.name}. Tá»•ng: ${cacheObj.data.length} ká»³.`);
  }
}

async function scrapeAll() {
  console.log("==================================================");
  console.log("ðŸŽ° XSKT MIá»€N NAM - Báº®T Äáº¦U CÃ€O Dá»® LIá»†U Tá»° Äá»˜NG");
  console.log("==================================================");
  
  for (const [id, info] of Object.entries(STATIONS)) {
    await scrapeStation(id, info);
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log("\nâœ… ÄÃ£ quÃ©t xong toÃ n bá»™ Ä‘Ã i miá»n Nam!");
}

scrapeAll();

``
