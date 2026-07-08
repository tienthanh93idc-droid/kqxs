const express = require('express');
const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Bật CORS và phục vụ các file tĩnh (HTML, CSS, JS, thư mục data)
app.use(cors());
app.use(express.static(__dirname));

// Cú pháp cron: Phút Giờ Ngày Tháng Ngày_trong_tuần (Giờ VN)
// "40 16 * * *" = Chạy mỗi ngày vào đúng 16:40 (16h40 chiều)
cron.schedule('40 16 * * *', () => {
    console.log(`\n[${new Date().toLocaleString('vi-VN')}] ⏰ Đã đến giờ! Bắt đầu tự động lấy kết quả XSKT...`);
    
    // Gọi ngầm file scrape.js để cào số mới
    exec('node scrape.js', (error, stdout, stderr) => {
        if (error) {
            console.error(`[CRON ERROR] Lỗi khi cào dữ liệu: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`[CRON CẢNH BÁO]: ${stderr}`);
        }
        console.log(`[CRON KẾT QUẢ]:\n${stdout}`);
        console.log(`[${new Date().toLocaleString('vi-VN')}] ✅ Tiến trình tự động cập nhật hoàn tất!`);
    });
}, {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh" 
});

app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🚀 MÁY CHỦ XSKT AI ĐANG CHẠY TẠI http://localhost:${PORT}`);
    console.log(`⏰ AUTO-UPDATE ĐÃ BẬT: Tự động cập nhật số mới mỗi ngày lúc 16:40`);
    console.log(`=================================================`);
});