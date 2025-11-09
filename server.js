// 1. استيراد المكتبات
require('dotenv').config(); // لتحميل رابط قاعدة البيانات السري
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// 2. إعدادات الخادم
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors()); // للسماح بالاتصالات
app.use(express.json()); // لقراءة بيانات JSON القادمة

// 3. الاتصال بقاعدة البيانات (MongoDB Atlas)
//    (يجب أن يكون الرابط في ملف .env)
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ تم الاتصال بقاعدة بيانات MongoDB بنجاح!');
  })
  .catch((err) => {
    console.error('❌ فشل الاتصال بقاعدة البيانات:', err.message);
  });

// 4. (قريباً) سنضيف الـ API Schema هنا...
// 5. (قريباً) سنضيف الـ API Endpoints هنا...


// 6. تقديم ملفات الواجهة الأمامية (index.html وكل شيء في مجلد public)
app.use(express.static(path.join(__dirname, 'public')));

// 7. تشغيل الخادم
app.listen(PORT, () => {
  console.log(`🚀 الخادم يعمل على http://localhost:${PORT}`);
});