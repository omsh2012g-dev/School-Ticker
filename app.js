// إدارة التنقل بين الأقسام
class NavigationManager {
    constructor() {
        this.sections = document.querySelectorAll('.section');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.setupEventListeners();
        this.showSection('dashboard');
    }

    setupEventListeners() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href').substring(1);
                this.showSection(target);
                this.updateActiveNav(link);
            });
        });
    }

    showSection(sectionId) {
        this.sections.forEach(section => {
            section.classList.remove('active');
            section.setAttribute('hidden', 'true');
        });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.removeAttribute('hidden');
        }
    }

    updateActiveNav(activeLink) {
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        });
        activeLink.classList.add('active');
        activeLink.setAttribute('aria-current', 'page');
    }
}

// إدارة المعلمين
class TeachersManager {
    constructor() {
        this.teachers = window.storageManager.load('teachers') || [];
        this.teacherForm = document.getElementById('teacher-form');
        this.teachersList = document.getElementById('teachers-list');
        this.setupEventListeners();
        this.renderTeachers();
    }

    setupEventListeners() {
        this.teacherForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTeacher();
        });
    }

    addTeacher() {
        const nameInput = document.getElementById('teacher-name');
        const subjectInput = document.getElementById('teacher-subject');
        const phoneInput = document.getElementById('teacher-phone');

        const name = nameInput.value.trim();
        const subject = subjectInput.value.trim();
        const phone = phoneInput.value.trim();

        if (!name || !subject) {
            window.dailyManager.showNotification('يرجى ملء حقلي الاسم والمادة', 'error');
            return;
        }

        const teacher = {
            id: Date.now(),
            name,
            subject,
            phone,
            createdAt: new Date().toLocaleDateString('ar-SA')
        };

        this.teachers.push(teacher);
        this.saveTeachers();
        this.renderTeachers();
        this.teacherForm.reset();
        window.dailyManager.showNotification('تم إضافة المعلم بنجاح', 'success');
        window.settingsManager.updateStats();
    }

    saveTeachers() {
        window.storageManager.save('teachers', this.teachers);
    }

    renderTeachers() {
        if (!this.teachersList) return;

        if (this.teachers.length === 0) {
            this.teachersList.innerHTML = `<div class="empty-state"><p>لا يوجد معلمين حالياً</p></div>`;
            return;
        }

        this.teachersList.innerHTML = this.teachers.map(teacher => `
            <div class="teacher-card" data-id="${teacher.id}">
                <div class="teacher-info">
                    <h4>${teacher.name}</h4>
                    <p>المادة: ${teacher.subject}</p>
                    ${teacher.phone ? `<p>الهاتف: ${teacher.phone}</p>` : ''}
                    <small>تم الإضافة: ${teacher.createdAt}</small>
                </div>
                <button class="btn btn-danger btn-sm" onclick="window.teachersManager.removeTeacher(${teacher.id})">🗑️ حذف</button>
            </div>
        `).join('');
    }

    removeTeacher(id) {
        if (confirm('هل أنت متأكد من حذف هذا المعلم؟')) {
            this.teachers = this.teachers.filter(teacher => teacher.id !== id);
            this.saveTeachers();
            this.renderTeachers();
            window.dailyManager.showNotification('تم حذف المعلم بنجاح', 'success');
            window.settingsManager.updateStats();
        }
    }
}

// إدارة الإعدادات
class SettingsManager {
    constructor() {
        this.settings = window.storageManager.load('appSettings') || this.getDefaultSettings();
        // --- ✨ (إضافة) تحديد مدخل الشعار ---
        this.logoInput = document.getElementById('school-logo');
        this.init();
    }

    getDefaultSettings() {
        return {
            schoolName: 'الجداول الدراسية اليومية', // اسم افتراضي
            schoolLogo: null, // شعار افتراضي
            language: 'ar'
        };
    }

    init() {
        this.loadSettingsToUI();
        this.setupEventListeners();
        this.updateStats();
        // (تم نقل applyTickerInfo إلى نهاية ملف app.js لضمان تحميل tickerManager أولاً)
    }

    loadSettingsToUI() {
        document.getElementById('school-name').value = this.settings.schoolName;
        document.getElementById('language').value = this.settings.language;
        // لا نحتاج لتحميل الشعار مرة أخرى في حقل الإدخال
    }

    setupEventListeners() {
        document.getElementById('school-name')?.addEventListener('change', () => this.saveSettings());
        document.getElementById('language')?.addEventListener('change', () => this.saveSettings());
        
        // --- ✨ (إضافة) ربط حدث تغيير الشعار ---
        this.logoInput?.addEventListener('change', (e) => this.handleLogoUpload(e));
        
        document.getElementById('export-data')?.addEventListener('click', () => this.exportData());
        document.getElementById('import-data')?.addEventListener('click', () => this.importData());
        document.getElementById('reset-all')?.addEventListener('click', () => this.resetAll());
    }

    // --- ✨ (إضافة) دالة جديدة لمعالجة الشعار ---
    handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // التحقق من حجم الملف (مثال: 2 ميجا)
        if (file.size > 2 * 1024 * 1024) {
            window.dailyManager.showNotification('حجم الشعار كبير جداً (الأقصى 2 ميجا)', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const logoData = event.target.result; // هذا هو نص Base64
            this.settings.schoolLogo = logoData;
            window.storageManager.save('appSettings', this.settings);
            window.dailyManager.showNotification('تم حفظ الشعار بنجاح', 'success');
            
            // إبلاغ الشريط الإخباري بالتحديث
            if (window.tickerManager) {
                window.tickerManager.updateSchoolLogo(logoData);
            }
        };
        reader.readAsDataURL(file); // تحويل الصورة إلى Base64
    }

    // --- ✨ (تعديل) تعديل دالة حفظ الإعدادات ---
    saveSettings() {
        this.settings = {
            schoolName: document.getElementById('school-name').value,
            language: document.getElementById('language').value,
            schoolLogo: this.settings.schoolLogo // الحفاظ على الشعار المحفوظ مسبقاً
        };
        window.storageManager.save('appSettings', this.settings);
        window.dailyManager.showNotification('تم حفظ الإعدادات', 'success');
        
        // إبلاغ الشريط الإخباري باسم المدرسة الجديد
        if (window.tickerManager) {
            window.tickerManager.updateSchoolName(this.settings.schoolName);
        }
    }
    
    // --- ✨ (إضافة) دالة لتطبيق البيانات على الشريط عند بدء التشغيل ---
    applyTickerInfo() {
        // هذه الدالة تعمل عند بدء تشغيل الصفحة
        if (window.tickerManager) {
            window.tickerManager.updateSchoolName(this.settings.schoolName);
            if (this.settings.schoolLogo) {
                window.tickerManager.updateSchoolLogo(this.settings.schoolLogo);
            }
        }
    }

    updateStats() {
        const teachers = window.storageManager.load('teachers') || [];
        const schedule = window.storageManager.load('weeklySchedule') || {};
        
        let totalClasses = 0;
        Object.values(schedule).forEach(day => 
            Object.values(day).forEach(period => 
                Object.values(period).forEach(classData => {
                    if (classData.المادة && classData.المعلم) totalClasses++;
                })
            )
        );
        
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length * 2;
            }
        }
        
        document.getElementById('total-teachers-count').textContent = teachers.length;
        document.getElementById('total-classes-count').textContent = totalClasses;
        document.getElementById('storage-usage').textContent = `${Math.round(totalSize / 1024)} KB`;
        document.getElementById('last-update').textContent = new Date().toLocaleDateString('ar-SA');
    }

    exportData() {
        const data = window.storageManager.backupData();
        data.exportDate = new Date().toISOString();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `school-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        window.dailyManager.showNotification('تم تصدير البيانات بنجاح', 'success');
    }

    importData() {
        const fileInput = document.getElementById('import-file');
        const file = fileInput.files[0];
        if (!file) {
            window.dailyManager.showNotification('يرجى اختيار ملف للاستيراد', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                window.storageManager.restoreData(data);
                window.dailyManager.showNotification('تم استيراد البيانات بنجاح، سيتم تحديث الصفحة', 'success');
                setTimeout(() => location.reload(), 1500);
            } catch (error) {
                window.dailyManager.showNotification('خطأ في قراءة الملف، تأكد أنه ملف JSON صالح', 'error');
            }
        };
        reader.readAsText(file);
    }

    resetAll() {
        if (confirm('⚠️ تحذير: هذا الإجراء سيحذف جميع البيانات ولا يمكن التراجع عنه. هل أنت متأكد؟')) {
            window.storageManager.clear();
            window.dailyManager.showNotification('تم مسح جميع البيانات، سيتم تحديث الصفحة', 'success');
            setTimeout(() => location.reload(), 1500);
        }
    }
}

// --- ✨ بداية: مدير الغياب وحصص الانتظار ---
class AbsenceManager {
    constructor() {
        this.teachersListContainer = document.getElementById('absence-teachers-list');
        this.scheduleListContainer = document.getElementById('absence-schedule-list');
        
        this.todayString = this.getTodayString(); // '2025-11-07'
        
        // --- ✨ (بداية الإصلاح) ---
        // (تم حذف السطر القديم الذي يستدعي dailyManager.getCurrentDayName())
        // نعتمد على رقم اليوم بدلاً من اسمه
        const todayIndex = new Date().getDay(); // 0=Sun, 1=Mon...
        
        // جلب قائمة الأيام الموثوقة من مدير الجدول
        // (هذا آمن لأن scheduleManager يتم إنشاؤه *قبل* absenceManager)
        if (window.scheduleManager && window.scheduleManager.days[todayIndex]) {
            this.todayDayName = window.scheduleManager.days[todayIndex]; // ex: "الإثنين"
        } else {
            this.todayDayName = null; // اليوم عطلة (جمعة أو سبت)
        }
        // --- (نهاية الإصلاح) ---

        this.loadData();
    }

    // تهيئة (يتم استدعاؤها بعد إنشاء كل المدراء)
    init() {
        this.renderTeacherList();
        this.checkAbsencesOnLoad();
    }

    // دالة مساعدة للحصول على تاريخ اليوم
    getTodayString() {
        const today = new Date();
        const y = today.getFullYear();
        const m = (today.getMonth() + 1).toString().padStart(2, '0');
        const d = today.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // تحميل البيانات المحفوظة لليوم
    loadData() {
        const allAbsences = window.storageManager.load('dailyAbsences') || {};
        const allSubstitutes = window.storageManager.load('substituteSchedule') || {};

        // جلب بيانات اليوم فقط
        this.dailyAbsences = allAbsences[this.todayString] || [];
        this.substituteSchedule = allSubstitutes[this.todayString] || {};
    }

    // حفظ البيانات لليوم
    saveData() {
        const allAbsences = window.storageManager.load('dailyAbsences') || {};
        const allSubstitutes = window.storageManager.load('substituteSchedule') || {};

        allAbsences[this.todayString] = this.dailyAbsences;
        allSubstitutes[this.todayString] = this.substituteSchedule;

        window.storageManager.save('dailyAbsences', allAbsences);
        window.storageManager.save('substituteSchedule', allSubstitutes);
    }

    // 1. عرض قائمة المعلمين في العمود الأيمن
    renderTeacherList() {
        const allTeachers = window.teachersManager.teachers || [];
        
        if (allTeachers.length === 0) {
            this.teachersListContainer.innerHTML = `<div class="empty-state"><p>يرجى إضافة معلمين أولاً من "لوحة التحكم".</p></div>`;
            return;
        }

        this.teachersListContainer.innerHTML = allTeachers.map(teacher => {
            const isAbsent = this.dailyAbsences.includes(teacher.name);
            return `
                <div class="teacher-card ${isAbsent ? 'absent' : ''}" 
                     data-id="${teacher.id}" 
                     onclick="window.absenceManager.toggleAbsence('${teacher.name}')">
                    
                    <div class="teacher-info">
                        <h4>${teacher.name}</h4>
                        <p>المادة: ${teacher.subject}</p>
                    </div>
                    <button class="btn ${isAbsent ? 'btn-warning' : 'btn-danger'} btn-sm">
                        ${isAbsent ? '🔄 إلغاء الغياب' : '❌ تسجيل غياب'}
                    </button>
                </div>
            `;
        }).join('');
    }

    // 2. عند الضغط على زر "تسجيل غياب"
    toggleAbsence(teacherName) {
        if (!this.todayDayName) {
            window.dailyManager.showNotification('لا يمكن تسجيل غياب في يوم عطلة', 'warning');
            return;
        }
        
        const index = this.dailyAbsences.indexOf(teacherName);
        
        if (index > -1) {
            // المعلم موجود (إلغاء الغياب)
            this.dailyAbsences.splice(index, 1);
            this.scheduleListContainer.innerHTML = `<div class="empty-state"><p>تم إلغاء غياب ${teacherName}.</p></div>`;
        } else {
            // المعلم غير موجود (تسجيل غياب)
            // (للسماح بغياب معلم واحد فقط في كل مرة، يمكن إلغاء التعليق عن السطر التالي)
            // this.dailyAbsences = [teacherName]; 
            
            // (للسماح بغياب عدة معلمين)
             this.dailyAbsences.push(teacherName);
            
            this.renderAbsentTeacherSchedule(teacherName);
        }
        
        this.saveData();
        this.renderTeacherList(); // إعادة التلوين
    }

    // 3. عرض حصص المعلم الغائب في العمود الأيسر
    renderAbsentTeacherSchedule(teacherName) {
        if (!this.todayDayName) {
             this.scheduleListContainer.innerHTML = `<div class="empty-state"><p>اليوم عطلة رسمية.</p></div>`;
             return;
        }
        
        const scheduleData = window.scheduleManager.getScheduleData();
        const todaySchedule = scheduleData.schedule[this.todayDayName];

        if (!todaySchedule) {
            this.scheduleListContainer.innerHTML = `<div class="empty-state"><p>لا يوجد جدول ليوم ${this.todayDayName}.</p></div>`;
            return;
        }
        
        const teacherClasses = []; // [ {period, class, subject} ]
        
        // البحث عن حصص المعلم الغائب
        scheduleData.periods.forEach(period => {
            if (period === 'الفسحة') return;
            
            scheduleData.classes.forEach(className => {
                const classData = todaySchedule[period]?.[className];
                if (classData && classData.المعلم === teacherName) {
                    teacherClasses.push({
                        period: period,
                        className: className,
                        subject: classData.المادة
                    });
                }
            });
        });

        if (teacherClasses.length === 0) {
            this.scheduleListContainer.innerHTML = `<div class="empty-state"><p>المعلم ${teacherName} ليس لديه حصص اليوم.</p></div>`;
            return;
        }

        // عرض بطاقات الحصص لإسنادها
        this.scheduleListContainer.innerHTML = teacherClasses.map(session => {
            const uniqueId = `${session.period}-${session.className}`;
            const selectedSubstitute = this.substituteSchedule[uniqueId] || "";
            
            return `
                <div class="substitute-card" data-id="${uniqueId}">
                    <div class="class-info">
                        <strong>${session.period} - ( ${session.className} )</strong>
                        <br>
                        <span>${session.subject}</span>
                        <br>
                        <span class="original-teacher">المعلم الأساسي: ${teacherName}</span>
                    </div>
                    <div class="substitute-select-wrapper">
                        <label for="select-${uniqueId}">إسناد إلى:</label>
                        <select id="select-${uniqueId}" 
                                class="substitute-select"
                                onchange="window.absenceManager.assignSubstitute('${uniqueId}', this.value)">
                            <option value="">-- اختر معلم بديل --</option>
                            ${this.getAvailableTeachersOptions(session.period, teacherName, selectedSubstitute)}
                        </select>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 4. (مهم) جلب قائمة المعلمين المتاحين لهذه الحصة
    getAvailableTeachersOptions(period, absentTeacherName, selectedSubstitute) {
        const scheduleData = window.scheduleManager.getScheduleData();
        const allTeachers = window.teachersManager.teachers;
        const todaySchedule = scheduleData.schedule[this.todayDayName];
        
        // 1. العثور على كل المعلمين المشغولين في هذه الحصة
        const busyTeachers = new Set();
        if (todaySchedule && todaySchedule[period]) {
            scheduleData.classes.forEach(className => {
                const teacher = todaySchedule[period][className]?.المعلم;
                if (teacher) {
                    busyTeachers.add(teacher);
                }
            });
        }
        
        // 2. إتاحة المعلمين غير المشغولين
        return allTeachers
            .filter(teacher => 
                teacher.name !== absentTeacherName && // استبعاد المعلم الغائب
                !busyTeachers.has(teacher.name)       // استبعاد المشغولين
            )
            .map(teacher => 
                `<option value="${teacher.name}" ${teacher.name === selectedSubstitute ? 'selected' : ''}>
                    ${teacher.name} (${teacher.subject})
                </option>`
            )
            .join('');
    }

    // 5. عند اختيار معلم بديل من القائمة
    assignSubstitute(sessionId, substituteTeacherName) {
        if (!substituteTeacherName) {
            delete this.substituteSchedule[sessionId];
        } else {
            this.substituteSchedule[sessionId] = substituteTeacherName;
        }
        
        this.saveData();
        window.dailyManager.showNotification('تم إسناد الحصة بنجاح', 'success');
    }

    // دالة للتحقق من الغيابات عند تحميل الصفحة
    checkAbsencesOnLoad() {
        if (this.dailyAbsences.length > 0) {
            // إذا كان هناك معلم واحد فقط مسجل كغائب، اعرض جدوله
            if (this.dailyAbsences.length === 1) {
                this.renderAbsentTeacherSchedule(this.dailyAbsences[0]);
            } else {
                // إذا كان هناك عدة غائبين، اطلب من المستخدم الاختيار
                this.scheduleListContainer.innerHTML = `<div class="empty-state"><p>يوجد ${this.dailyAbsences.length} معلمين غائبين. الرجاء الضغط على أحدهم (باللون الأحمر) لعرض جدوله.</p></div>`;
            }
        } else {
             this.scheduleListContainer.innerHTML = `<div class="empty-state"><p>الرجاء اختيار "تسجيل غياب" لأحد المعلمين من القائمة اليمنى أولاً.</p></div>`;
        }
    }
}
// --- نهاية: مدير الغياب وحصص الانتظار ---


// --- ✨ (تعديل) كود بدء التشغيل الرئيسي ---

document.addEventListener('DOMContentLoaded', function() {
    try {
        // 1. إنشاء الأدوات الأساسية (لا تعتمد على شيء)
        window.storageManager = new StorageManager();
        window.dailyManager = new DailyManager();

        // 2. إنشاء مدير الإعدادات (يعتمد على storage و dailyManager)
        window.settingsManager = new SettingsManager();

        // 3. إنشاء مدير الجدول (يعتمد على storage و settingsManager)
        window.scheduleManager = new WeeklyScheduleManager();

        // 4. إنشاء مدير الشريط الإخباري (يعتمد على scheduleManager)
        window.tickerManager = new DailyTickerManager();

        // 5. إنشاء مديري لوحة التحكم (يعتمدون على ما سبق)
        window.navigationManager = new NavigationManager();
        window.teachersManager = new TeachersManager();

        // --- ✨ (إضافة) 6. إنشاء مدير الغياب (يعتمد على teachers و schedule) ---
        window.absenceManager = new AbsenceManager();
        window.absenceManager.init(); // تفعيل مدير الغياب

        // --- ✨ (تعديل) 7. تطبيق الإعدادات (الاسم والشعار) على الشريط ---
        window.settingsManager.applyTickerInfo(); 

        // 8. تحديث أولي للنظام
        console.log('✅ تم تشغيل جميع وحدات النظام بنجاح!');
        window.settingsManager.updateStats(); // تحديث الإحصائيات
        window.dailyManager.showNotification('تم تحميل النظام بنجاح', 'success');

    } catch (error) {
        console.error('❌ خطأ فادح عند تشغيل النظام:', error);
        window.dailyManager?.showNotification('حدث خطأ فادح، يرجى مراجعة الكونسول', 'error');
    }
});