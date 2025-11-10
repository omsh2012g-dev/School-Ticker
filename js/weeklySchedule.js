// إدارة الجدول الأسبوعي والمشرفين والمناوبين
class WeeklyScheduleManager {
    constructor() {
        this.currentDayIndex = 0; // الأحد
        this.days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
        this.periods = ['الأولى', 'الثانية', 'الثالثة', 'الفسحة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة'];
        this.classes = JSON.parse(localStorage.getItem('classNames')) || this.getDefaultClasses();
        this.periodTimes = JSON.parse(localStorage.getItem('periodTimes')) || this.getDefaultPeriodTimes();
        
        this.schedule = JSON.parse(localStorage.getItem('weeklySchedule')) || this.initializeEmptySchedule();
        this.supervisors = JSON.parse(localStorage.getItem('supervisors')) || this.initializeEmptySupervisors();
        this.dutyStaff = JSON.parse(localStorage.getItem('dutyStaff')) || this.initializeEmptyDutyStaff();
        this.teacherConflicts = {}; // تتبع تعارضات المعلمين
        
        this.init();
    }

    getDefaultClasses() {
        return ['1/1', '1/2', '1/3', '2/1', '2/2', '3/1', '3/2', '4/1', '4/2', '5/1', '5/2', '6/1'];
    }

    getDefaultPeriodTimes() {
        return {
            'الأولى': { start: '07:30', end: '08:10' },
            'الثانية': { start: '08:15', end: '08:55' },
            'الثالثة': { start: '09:00', end: '09:40' },
            'الفسحة': { start: '09:40', end: '10:10' },
            'الرابعة': { start: '10:10', end: '10:50' },
            'الخامسة': { start: '10:55', end: '11:35' },
            'السادسة': { start: '11:40', end: '12:20' },
            'السابعة': { start: '12:25', end: '13:05' }
        };
    }

    init() {
        this.setupEventListeners();
        this.renderCurrentDay();
        this.updateNavigation();
        this.updatePreview();
        this.renderClassNamesEditor();
        this.renderPeriodTimesEditor();
    }

    initializeEmptySchedule() {
        const schedule = {};
        this.days.forEach(day => {
            schedule[day] = {};
            this.periods.forEach(period => {
                schedule[day][period] = {};
                this.classes.forEach(className => {
                    schedule[day][period][className] = {
                        المادة: '',
                        المعلم: ''
                    };
                });
            });
        });
        return schedule;
    }

    initializeEmptySupervisors() {
        const supervisors = {};
        this.days.forEach(day => {
            supervisors[day] = Array(5).fill(''); // 5 مشرفين لكل يوم
        });
        return supervisors;
    }

    initializeEmptyDutyStaff() {
        const dutyStaff = {};
        this.days.forEach(day => {
            dutyStaff[day] = Array(2).fill(''); // 2 مناوبين لكل يوم
        });
        return dutyStaff;
    }

    setupEventListeners() {
        // تنقل الأيام
        document.getElementById('prev-day')?.addEventListener('click', () => this.previousDay());
        document.getElementById('next-day')?.addEventListener('click', () => this.nextDay());

        // حفظ البيانات
        document.getElementById('save-daily-data')?.addEventListener('click', () => this.saveDailyData());
        document.getElementById('save-all-week')?.addEventListener('click', () => this.saveAllWeek());
        document.getElementById('clear-all')?.addEventListener('click', () => this.clearAllData());
    }

    renderClassNamesEditor() {
        const editorContainer = document.getElementById('class-names-editor');
        if (!editorContainer) return;

        editorContainer.innerHTML = `
            <div class="class-names-editor">
                <h4>📝 تحرير أسماء الصفوف</h4>
                <div class="classes-editor-grid">
                    ${this.classes.map((className, index) => `
                        <div class="class-editor-card">
                            <label>الصف ${index + 1}:</label>
                            <input type="text" 
                                   value="${className}" 
                                   placeholder="مثال: 1/1"
                                   data-index="${index}"
                                   class="class-name-input">
                        </div>
                    `).join('')}
                </div>
                <button type="button" id="save-class-names-btn" class="btn btn-primary">
                    💾 حفظ أسماء الصفوف
                </button>
            </div>
        `;

        // إضافة event listener جديد بعد التصيير
        document.getElementById('save-class-names-btn')?.addEventListener('click', () => this.saveClassNames());
    }

    renderPeriodTimesEditor() {
        const editorContainer = document.getElementById('period-times-editor');
        if (!editorContainer) return;

        const periodIcons = {
            'الأولى': '1️⃣',
            'الثانية': '2️⃣',
            'الثالثة': '3️⃣',
            'الفسحة': '☕',
            'الرابعة': '4️⃣',
            'الخامسة': '5️⃣',
            'السادسة': '6️⃣',
            'السابعة': '7️⃣'
        };

        editorContainer.innerHTML = `
            <div class="period-times-editor">
                <h4>⏰ تحرير أوقات الحصص</h4>
                <div class="period-cards-grid">
                    ${this.periods.map(period => {
                        const time = this.periodTimes[period] || { start: '', end: '' };
                        return `
                            <div class="period-card" data-period="${period}">
                                <div class="period-card-header">
                                    <span class="period-icon">${periodIcons[period] || '⏰'}</span>
                                    <span class="period-name">الحصة ${period}</span>
                                </div>
                                <div class="period-time-inputs">
                                    <div class="time-input-group">
                                        <label>بداية:</label>
                                        <input type="time" 
                                               value="${time.start}" 
                                               data-period="${period}" 
                                               data-type="start"
                                               class="time-input">
                                    </div>
                                    <div class="time-input-group">
                                        <label>نهاية:</label>
                                        <input type="time" 
                                               value="${time.end}" 
                                               data-period="${period}" 
                                               data-type="end"
                                               class="time-input">
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <button type="button" id="save-period-times-btn" class="btn btn-primary">
                    💾 حفظ جميع الأوقات
                </button>
            </div>
        `;

        // إضافة event listener جديد بعد التصيير
        document.getElementById('save-period-times-btn')?.addEventListener('click', () => this.savePeriodTimes());
    }

    saveClassNames() {
        const inputs = document.querySelectorAll('.class-name-input');
        const newClasses = Array.from(inputs).map(input => input.value.trim()).filter(name => name !== '');
        
        if (newClasses.length === 0) {
            this.showMessage('يرجى إدخال أسماء للصفوف', 'error');
            return;
        }

        this.classes = newClasses;
        localStorage.setItem('classNames', JSON.stringify(this.classes));
        
        // إعادة تهيئة الجدول مع الصفوف الجديدة
        const oldSchedule = { ...this.schedule };
        this.schedule = this.initializeEmptySchedule();
        
        // نقل البيانات القديمة للصفوف المتطابقة
        this.days.forEach(day => {
            this.periods.forEach(period => {
                this.classes.forEach(className => {
                    if (oldSchedule[day]?.[period]?.[className]) {
                        this.schedule[day][period][className] = oldSchedule[day][period][className];
                    }
                });
            });
        });
        
        this.saveToLocalStorage();
        this.renderCurrentDay();
        this.showMessage('تم حفظ أسماء الصفوف بنجاح', 'success');
    }

    savePeriodTimes() {
        const inputs = document.querySelectorAll('.time-input');
        const newPeriodTimes = { ...this.periodTimes };

        let hasEmptyFields = false;
        inputs.forEach(input => {
            const period = input.getAttribute('data-period');
            const type = input.getAttribute('data-type');
            const value = input.value;

            if (!value) {
                hasEmptyFields = true;
            }

            if (!newPeriodTimes[period]) {
                newPeriodTimes[period] = {};
            }
            newPeriodTimes[period][type] = value;
        });

        if (hasEmptyFields) {
            this.showMessage('يرجى ملء جميع أوقات الحصص', 'error');
            return;
        }

        this.periodTimes = newPeriodTimes;
        localStorage.setItem('periodTimes', JSON.stringify(this.periodTimes));
        this.showMessage('تم حفظ أوقات الحصص بنجاح', 'success');

        // تحديث الشريط الإخباري إذا كان يعمل
        if (window.tickerManager) {
            window.tickerManager.updatePeriodTimes(this.periodTimes);
        }

        // إعادة تصيير الجدول لعرض الأوقات الجديدة
        this.renderCurrentDay();
    }

    previousDay() {
        if (this.currentDayIndex > 0) {
            this.currentDayIndex--;
            this.renderCurrentDay();
            this.updateNavigation();
        }
    }

    nextDay() {
        if (this.currentDayIndex < this.days.length - 1) {
            this.currentDayIndex++;
            this.renderCurrentDay();
            this.updateNavigation();
        }
    }

    updateNavigation() {
        const currentDayElement = document.getElementById('current-day');
        if (currentDayElement) {
            currentDayElement.textContent = this.days[this.currentDayIndex];
        }
    }

    renderCurrentDay() {
        const currentDay = this.days[this.currentDayIndex];
        this.renderSchedule(currentDay);
        this.renderSupervisors(currentDay);
        this.renderDutyStaff(currentDay);
    }

    renderSchedule(day) {
        const scheduleContainer = document.getElementById('daily-schedule');
        if (!scheduleContainer) return;

        const daySchedule = this.schedule[day] || {};

        scheduleContainer.innerHTML = `
            <div class="class-schedule-table">
                <table>
                    <thead>
                        <tr>
                            <th rowspan="2" class="period-header">الحصة</th>
                            ${this.classes.map(className => `
                                <th colspan="2" class="class-header">${className}</th>
                            `).join('')}
                        </tr>
                        <tr>
                            ${this.classes.map(() => `
                                <th class="type-header">المادة</th>
                                <th class="type-header">المعلم</th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${this.periods.map(period => {
                            const periodData = daySchedule[period] || {};
                            const isBreak = period === 'الفسحة';
                            const periodTime = this.periodTimes[period] || { start: '', end: '' };
                            
                            if (isBreak) {
                                return `
                                    <tr class="break-period">
                                        <td class="period-name break">
                                            ${period}
                                            ${periodTime.start ? `<br><small>${periodTime.start} - ${periodTime.end}</small>` : ''}
                                        </td>
                                        ${this.classes.map(() => `
                                            <td colspan="2" class="break-cell">فسحة</td>
                                        `).join('')}
                                    </tr>
                                `;
                            }
                            
                            return `
                                <tr>
                                    <td class="period-name">
                                        ${period}
                                        ${periodTime.start ? `<br><small>${periodTime.start} - ${periodTime.end}</small>` : ''}
                                    </td>
                                    ${this.classes.map(className => {
                                        const classData = periodData[className] || { المادة: '', المعلم: '' };
                                        return `
                                            <td class="subject-cell">
                                                <input type="text" 
                                                       value="${classData.المادة}" 
                                                       placeholder="المادة"
                                                       data-field="المادة"
                                                       data-day="${day}"
                                                       data-period="${period}"
                                                       data-class="${className}">
                                            </td>
                                            <td class="teacher-cell">
                                                <input type="text" 
                                                       value="${classData.المعلم}" 
                                                       placeholder="المعلم"
                                                       data-field="المعلم"
                                                       data-day="${day}"
                                                       data-period="${period}"
                                                       data-class="${className}">
                                            </td>
                                        `;
                                    }).join('')}
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // إضافة event listeners لحقول الإدخال
        this.attachScheduleInputListeners();
    }

    attachScheduleInputListeners() {
        const inputs = document.querySelectorAll('#daily-schedule input');
        inputs.forEach(input => {
            // إزالة أي event listeners سابقة
            input.replaceWith(input.cloneNode(true));
        });

        // إضافة event listeners جديدة
        const newInputs = document.querySelectorAll('#daily-schedule input');
        newInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const field = e.target.getAttribute('data-field');
                const day = e.target.getAttribute('data-day');
                const period = e.target.getAttribute('data-period');
                const className = e.target.getAttribute('data-class');
                const value = e.target.value.trim();

                // التحقق من التعارضات للمعلمين فقط
                if (field === 'المعلم' && value) {
                    const conflict = this.checkTeacherConflict(day, period, className, value);
                    if (conflict) {
                        this.showMessage(`تعارض: المعلم ${value} موجود بالفعل في ${conflict}`, 'error');
                        e.target.value = ''; // مسح القيمة
                        return;
                    }
                }

                this.updateSchedule(day, period, className, field, value);
            });
            
            input.addEventListener('blur', (e) => {
                this.updatePreview();
            });
        });
    }

    // دالة للتحقق من تعارضات المعلمين
    checkTeacherConflict(day, period, currentClass, teacherName) {
        const daySchedule = this.schedule[day] || {};
        const currentPeriodData = daySchedule[period] || {};
        
        // التحقق من جميع الصفوف في نفس الحصة
        for (const className in currentPeriodData) {
            if (className !== currentClass) { // تخطي الصف الحالي
                const classData = currentPeriodData[className];
                if (classData.المعلم === teacherName) {
                    return `الصف ${className}`;
                }
            }
        }
        
        return null; // لا يوجد تعارض
    }

    updateSchedule(day, period, className, field, value) {
        if (!this.schedule[day]) {
            this.schedule[day] = {};
        }
        if (!this.schedule[day][period]) {
            this.schedule[day][period] = {};
        }
        if (!this.schedule[day][period][className]) {
            this.schedule[day][period][className] = { المادة: '', المعلم: '' };
        }

        this.schedule[day][period][className][field] = value;
        this.saveToLocalStorage(); // حفظ فوري عند التغيير
    }

    renderSupervisors(day) {
        const supervisorsContainer = document.getElementById('daily-supervisors');
        if (!supervisorsContainer) return;

        const daySupervisors = this.supervisors[day] || Array(5).fill('');

        supervisorsContainer.innerHTML = `
            <div class="supervisors-inputs">
                ${daySupervisors.map((supervisor, index) => `
                    <div class="supervisor-input-group">
                        <label>المشرف ${index + 1}:</label>
                        <input type="text" 
                               value="${supervisor}" 
                               placeholder="اسم المشرف"
                               data-day="${day}"
                               data-index="${index}">
                    </div>
                `).join('')}
            </div>
        `;

        this.attachSupervisorsInputListeners();
    }

    attachSupervisorsInputListeners() {
        const inputs = document.querySelectorAll('#daily-supervisors input');
        inputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const day = e.target.getAttribute('data-day');
                const index = parseInt(e.target.getAttribute('data-index'));
                const value = e.target.value.trim();

                this.updateSupervisor(day, index, value);
            });
        });
    }

    updateSupervisor(day, index, value) {
        if (!this.supervisors[day]) {
            this.supervisors[day] = Array(5).fill('');
        }
        this.supervisors[day][index] = value;
        this.saveToLocalStorage(); // حفظ فوري عند التغيير
    }

    renderDutyStaff(day) {
        const dutyContainer = document.getElementById('daily-duty');
        if (!dutyContainer) return;

        const dayDuty = this.dutyStaff[day] || Array(2).fill('');

        dutyContainer.innerHTML = `
            <div class="duty-inputs">
                ${dayDuty.map((staff, index) => `
                    <div class="duty-input-group">
                        <label>المناوب ${index + 1}:</label>
                        <input type="text" 
                               value="${staff}" 
                               placeholder="اسم المناوب"
                               data-day="${day}"
                               data-index="${index}">
                    </div>
                `).join('')}
            </div>
        `;

        this.attachDutyInputListeners();
    }

    attachDutyInputListeners() {
        const inputs = document.querySelectorAll('#daily-duty input');
        inputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const day = e.target.getAttribute('data-day');
                const index = parseInt(e.target.getAttribute('data-index'));
                const value = e.target.value.trim();

                this.updateDutyStaff(day, index, value);
            });
        });
    }

    updateDutyStaff(day, index, value) {
        if (!this.dutyStaff[day]) {
            this.dutyStaff[day] = Array(2).fill('');
        }
        this.dutyStaff[day][index] = value;
        this.saveToLocalStorage(); // حفظ فوري عند التغيير
    }

    saveDailyData() {
        this.saveToLocalStorage();
        this.showMessage('تم حفظ بيانات اليوم بنجاح', 'success');
        this.updatePreview();
        
        if (window.settingsManager) {
            window.settingsManager.updateStats();
        }
    }

    saveAllWeek() {
        this.saveToLocalStorage();
        this.showMessage('تم حفظ الجدول الأسبوعي كاملاً بنجاح', 'success');
        this.updatePreview();
        
        if (window.settingsManager) {
            window.settingsManager.updateStats();
        }
    }

    saveToLocalStorage() {
        localStorage.setItem('weeklySchedule', JSON.stringify(this.schedule));
        localStorage.setItem('supervisors', JSON.stringify(this.supervisors));
        localStorage.setItem('dutyStaff', JSON.stringify(this.dutyStaff));
        console.log('✅ تم حفظ البيانات في localStorage');
    }

    clearAllData() {
        if (confirm('⚠️ هل أنت متأكد من مسح جميع بيانات الجدول الأسبوعي؟ هذا الإجراء لا يمكن التراجع عنه.')) {
            this.schedule = this.initializeEmptySchedule();
            this.supervisors = this.initializeEmptySupervisors();
            this.dutyStaff = this.initializeEmptyDutyStaff();
            
            this.saveToLocalStorage();
            this.renderCurrentDay();
            this.showMessage('تم مسح جميع البيانات بنجاح', 'success');
            this.updatePreview();
            
            if (window.settingsManager) {
                window.settingsManager.updateStats();
            }
        }
    }

    updatePreview() {
        const previewContainer = document.getElementById('preview-cards');
        if (!previewContainer) return;

        let totalClasses = 0;
        let totalSupervisors = 0;
        let totalDutyStaff = 0;

        // حساب الإحصائيات
        this.days.forEach(day => {
            const daySchedule = this.schedule[day];
            if (daySchedule) {
                Object.values(daySchedule).forEach(periodData => {
                    Object.values(periodData).forEach(classData => {
                        if (classData.المادة && classData.المعلم) {
                            totalClasses++;
                        }
                    });
                });
            }

            const daySupervisors = this.supervisors[day] || [];
            totalSupervisors += daySupervisors.filter(s => s.trim() !== '').length;

            const dayDuty = this.dutyStaff[day] || [];
            totalDutyStaff += dayDuty.filter(d => d.trim() !== '').length;
        });

        previewContainer.innerHTML = `
            <div class="preview-card">
                <h4>📊 ملخص الجدول الأسبوعي</h4>
                <div class="preview-stats">
                    <div class="preview-stat">
                        <span class="stat-number">${totalClasses}</span>
                        <span class="stat-label">حصة مدرسية</span>
                    </div>
                    <div class="preview-stat">
                        <span class="stat-number">${totalSupervisors}</span>
                        <span class="stat-label">مشرف</span>
                    </div>
                    <div class="preview-stat">
                        <span class="stat-number">${totalDutyStaff}</span>
                        <span class="stat-label">مناوب</span>
                    </div>
                </div>
            </div>
            <div class="preview-card">
                <h4>📅 جدول اليوم (${this.days[this.currentDayIndex]})</h4>
                <div class="today-preview">
                    ${this.getTodayPreview()}
                </div>
            </div>
        `;
    }

    getTodayPreview() {
        const today = this.days[this.currentDayIndex];
        const todaySchedule = this.schedule[today] || {};
        const hasData = Object.values(todaySchedule).some(periodData => 
            Object.values(periodData).some(classData => 
                classData.المادة || classData.المعلم
            )
        );

        if (!hasData) {
            return '<p class="no-data">لا توجد بيانات لهذا اليوم</p>';
        }

        let previewHTML = '';
        this.periods.forEach(period => {
            const periodData = todaySchedule[period] || {};
            const periodClasses = Object.entries(periodData)
                .filter(([className, data]) => data.المادة && data.المعلم)
                .map(([className, data]) => `${className}: ${data.المادة} - ${data.المعلم}`)
                .join('، ');

            if (periodClasses) {
                previewHTML += `
                    <div class="period-preview">
                        <strong>${period}:</strong>
                        ${periodClasses}
                    </div>
                `;
            }
        });

        return previewHTML || '<p class="no-data">لا توجد بيانات لهذا اليوم</p>';
    }

    // --- ✨ (إضافة) دالة مساعدة لجلب تاريخ اليوم بصيغة YYYY-MM-DD ---
    getTodayStringForSub() {
        const today = new Date();
        const y = today.getFullYear();
        const m = (today.getMonth() + 1).toString().padStart(2, '0');
        const d = today.getDate().toString().padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // دالة للحصول على بيانات الحصة الحالية للشريط الإخباري - معدلة
    getCurrentPeriodData(currentPeriod) {
        // --- ✨ (بداية الإصلاح) ---
        const dayIndex = new Date().getDay(); // 0=الأحد, 1=الإثنين...
        
        // التحقق إذا كان يوم عطلة (الجمعة 5 أو السبت 6)
        if (dayIndex < 0 || dayIndex > 4) return null; 
        
        const currentDay = this.days[dayIndex]; // ex: this.days[1] = "الإثنين"
        // --- (نهاية الإصلاح) ---
        
        const periodData = this.schedule[currentDay]?.[currentPeriod];
        
        if (!periodData) return null;

        // --- (جلب بيانات الغياب لليوم) ---
        const allSubstitutes = JSON.parse(localStorage.getItem('substituteSchedule')) || {};
        const todayString = this.getTodayStringForSub(); // '2025-11-07'
        const todaySubstitutes = allSubstitutes[todayString] || {};
        // --- (نهاية جلب البيانات) ---

        const classesData = [];
        
        this.classes.forEach(className => {
            const classData = periodData[className];
            if (classData && classData.المادة && classData.المعلم) {
                
                const originalTeacher = classData.المعلم;
                let finalTeacher = originalTeacher;
                let isSubstitute = false;

                // التحقق من وجود بديل
                const uniqueId = `${currentPeriod}-${className}`; // مثال: "الأولى-1/1"
                const substituteTeacher = todaySubstitutes[uniqueId];

                if (substituteTeacher) {
                    finalTeacher = substituteTeacher; // استبدال المعلم
                    isSubstitute = true;
                }

                classesData.push({
                    الصف: className,
                    المادة: classData.المادة,
                    المعلم: finalTeacher, // إرسال المعلم النهائي
                    isSubstitute: isSubstitute // إرسال علامة "انتظار"
                });
            }
        });

        return {
            الحصة: currentPeriod,
            اليوم: currentDay,
            الصفوف: classesData
        };
    }

    // دالة للحصول على بيانات المشرفين والمناوبين لليوم الحالي
    getTodayStaffData() {
        // --- ✨ (بداية الإصلاح) ---
        const dayIndex = new Date().getDay(); // 0=الأحد, 1=الإثنين...
        
        // التحقق إذا كان يوم عطلة (الجمعة 5 أو السبت 6)
        if (dayIndex < 0 || dayIndex > 4) return null; 
        
        const currentDay = this.days[dayIndex]; // ex: this.days[1] = "الإثنين"
        // --- (نهاية الإصلاح) ---
        
        const supervisors = this.supervisors[currentDay] || [];
        const dutyStaff = this.dutyStaff[currentDay] || [];
        
        const activeSupervisors = supervisors.filter(s => s.trim() !== '');
        const activeDutyStaff = dutyStaff.filter(d => d.trim() !== '');
        
        return {
            اليوم: currentDay,
            المشرفون: activeSupervisors,
            المناوبون: activeDutyStaff
        };
    }

    getDayIndex(dayName) {
        // (هذه الدالة لم نعد نستخدمها لجلب اليوم الحالي، ولكنها قد تستخدم لاحقاً)
        const dayMap = {
            'الأحد': 0,
            'الإثنين': 1,
            'الثلاثاء': 2,
            'الأربعاء': 3,
            'الخميس': 4
        };
        return dayMap[dayName] !== undefined ? dayMap[dayName] : -1;
    }

    // دالة للحصول على أوقات الحصص
    getPeriodTimes() {
        return this.periodTimes;
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            padding: 12px 20px;
            border-radius: 5px;
            color: white;
            z-index: 1000;
            ${type === 'success' ? 'background: #38a169;' : 'background: #e53e3e;'}
        `;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // دالة للحصول على بيانات الجدول (للاستخدام في الشريط الإخباري)
    getScheduleData() {
        return {
            schedule: this.schedule,
            supervisors: this.supervisors,
            dutyStaff: this.dutyStaff,
            days: this.days,
            periods: this.periods,
            classes: this.classes,
            periodTimes: this.periodTimes
        };
    }
}