// إدارة الشريط الإخباري الذكي
class DailyTickerManager {
    constructor() {
        this.isRunning = false;
        this.currentPeriodIndex = 0;
        this.tickerInterval = null;
        this.displayInterval = null;
        this.periodTimes = this.loadPeriodTimes();
        this.currentDisplayIndex = 0;
        this.displayTypes = ['period', 'supervisors', 'duty']; // 3 أنواع من العروض
        
        this.init();
    }

    // --- ✨ (إضافة) دالة جديدة لتحديث اسم المدرسة ---
    updateSchoolName(name) {
        const nameElement = document.getElementById('ticker-school-name');
        if (nameElement) {
            if (name && name.trim() !== '') {
                nameElement.textContent = name;
            } else {
                nameElement.textContent = 'الجداول الدراسية اليومية'; // الاسم الافتراضي
            }
        }
    }

    // --- ✨ (إضافة) دالة جديدة لتحديث شعار المدرسة ---
    updateSchoolLogo(logoData) {
        const logoElement = document.getElementById('ticker-school-logo');
        if (logoElement) {
            if (logoData) {
                logoElement.src = logoData; // logoData هو نص Base64
                logoElement.style.display = 'block'; // إظهار الصورة
            } else {
                logoElement.src = '';
                logoElement.style.display = 'none'; // إخفاء الصورة
            }
        }
    }

    loadPeriodTimes() {
        const savedTimes = JSON.parse(localStorage.getItem('periodTimes'));
        if (savedTimes) {
            return savedTimes;
        }
        
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

    updatePeriodTimes(newTimes) {
        this.periodTimes = newTimes;
        if (this.isRunning) {
            this.updateTickerDisplay();
        }
    }

    init() {
        this.setupEventListeners();
        this.updateDateTime();
        this.loadTickerData();
    }

    setupEventListeners() {
        document.getElementById('start-ticker')?.addEventListener('click', () => this.startTicker());
        document.getElementById('pause-ticker')?.addEventListener('click', () => this.pauseTicker());
        document.getElementById('stop-ticker')?.addEventListener('click', () => this.stopTicker());
    }

    startTicker() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.currentDisplayIndex = 0;
        
        // تحديث البيانات الأساسية كل 30 ثانية
        this.tickerInterval = setInterval(() => {
            this.updateDateTime();
            this.updateTickerDisplay();
        }, 30000);
        
        // تبديل العروض كل 15 ثواني (تم التعديل بواسطة المستخدم)
        this.displayInterval = setInterval(() => {
            this.rotateDisplay();
        }, 15000);
        
        this.updateTickerDisplay();
        this.showMessage('تم تشغيل الشريط الإخباري', 'success');
    }

    rotateDisplay() {
        this.currentDisplayIndex = (this.currentDisplayIndex + 1) % this.displayTypes.length;
        this.updateTickerDisplay();
    }

    pauseTicker() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.clearIntervals();
        this.showMessage('تم إيقاف الشريط الإخباري مؤقتاً', 'warning');
    }

    stopTicker() {
        this.isRunning = false;
        this.clearIntervals();
        this.resetTickerDisplay();
        this.showMessage('تم إيقاف الشريط الإخباري', 'error');
    }

    clearIntervals() {
        if (this.tickerInterval) {
            clearInterval(this.tickerInterval);
            this.tickerInterval = null;
        }
        if (this.displayInterval) {
            clearInterval(this.displayInterval);
            this.displayInterval = null;
        }
    }

    updateDateTime() {
        const now = new Date();
        const dateElement = document.getElementById('current-date');
        const periodElement = document.getElementById('current-period');
        
        if (dateElement) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateElement.textContent = now.toLocaleDateString('ar-SA', options);
        }
        
        if (periodElement) {
            const currentPeriod = this.getCurrentPeriod();
            if (currentPeriod) {
                const periodTime = this.periodTimes[currentPeriod.period];
                periodElement.innerHTML = `
                    <div class="period-badge">
                        <span class="period-icon">⏰</span>
                        <span class="period-text">${currentPeriod.period}</span>
                        <span class="period-time">${periodTime.start} - ${periodTime.end}</span>
                    </div>
                `;
            } else {
                periodElement.innerHTML = `
                    <div class="period-badge no-period">
                        <span class="period-icon">📚</span>
                        <span class="period-text">لا توجد حصة حالياً</span>
                    </div>
                `;
            }
        }
    }

    getCurrentPeriod() {
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                           now.getMinutes().toString().padStart(2, '0');
        
        for (const [period, times] of Object.entries(this.periodTimes)) {
            if (currentTime >= times.start && currentTime <= times.end) {
                return { period, start: times.start, end: times.end };
            }
        }
        
        return null;
    }

    updateTickerDisplay() {
        const tickerDisplay = document.getElementById('ticker-display');
        if (!tickerDisplay) return;

        const displayType = this.displayTypes[this.currentDisplayIndex];
        
        switch(displayType) {
            case 'period':
                this.showPeriodDisplay();
                break;
            case 'supervisors':
                this.showSupervisorsDisplay();
                break;
            case 'duty':
                this.showDutyDisplay();
                break;
        }
    }

    showPeriodDisplay() {
        const tickerDisplay = document.getElementById('ticker-display');
        const currentPeriod = this.getCurrentPeriod();
        
        if (!currentPeriod) {
            this.showNoClassMessage();
            return;
        }

        const periodData = window.scheduleManager?.getCurrentPeriodData(currentPeriod.period);
        
        if (!periodData || periodData.الصفوف.length === 0) {
            this.showNoScheduleMessage(currentPeriod);
            return;
        }

        this.showPeriodOverview(periodData, currentPeriod);
    }

    showSupervisorsDisplay() {
        const tickerDisplay = document.getElementById('ticker-display');
        const staffData = window.scheduleManager?.getTodayStaffData();
        
        if (!staffData || staffData.المشرفون.length === 0) {
            this.showNoSupervisorsMessage();
            return;
        }

        this.showSupervisorsView(staffData);
    }

    showDutyDisplay() {
        const tickerDisplay = document.getElementById('ticker-display');
        const staffData = window.scheduleManager?.getTodayStaffData();
        
        if (!staffData || staffData.المناوبون.length === 0) {
            this.showNoDutyMessage();
            return;
        }

        this.showDutyView(staffData);
    }

    showPeriodOverview(periodData, currentPeriod) {
        const tickerDisplay = document.getElementById('ticker-display');
        const periodTime = this.periodTimes[currentPeriod.period];
        
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

        const classCards = periodData.الصفوف.map(classData => {
            const teacherName = classData.isSubstitute 
                ? `🔄 ${classData.المعلم} (انتظار)` 
                : classData.المعلم;
            
            const cardClass = classData.isSubstitute 
                ? 'class-card-grid substitute' 
                : 'class-card-grid';

            return `
                <div class="${cardClass}">
                    <span class="class-grid-name">${classData.الصف}</span>
                    <span class="class-grid-subject">${classData.المادة}</span>
                    <span class="class-grid-teacher">${teacherName}</span>
                </div>
            `;
        }).join('');


        tickerDisplay.innerHTML = `
            <div class="ticker-layout period-layout horizontal-layout">
                <div class="header-section">
                    <div class="day-badge">
                        <span class="day-icon">📅</span>
                        <span class="day-text">${periodData.اليوم}</span>
                    </div>
                    <div class="period-badge-large">
                        <span class="period-icon">${periodIcons[currentPeriod.period] || '⏰'}</span>
                        <span class="period-text">الحصة ${periodData.الحصة}</span>
                        <span class="period-time">${periodTime.start} - ${periodTime.end}</span>
                    </div>
                </div>
                
                <div class="content-section">
                    
                    ${classCards ? `
                    <div class="horizontal-subjects-container">
                        <div class="class-grid-3x3">
                            ${classCards}
                        </div>
                    </div>
                    ` : ''}
                    </div>
            </div>
        `;
    }

    showSupervisorsView(staffData) {
        const tickerDisplay = document.getElementById('ticker-display');
        
        const supervisorsList = staffData.المشرفون.map((supervisor, index) => `
            <div class="horizontal-staff-item">
                <span class="staff-icon">👥</span>
                <div class="staff-content">
                    <span class="staff-name">${supervisor}</span>
                    <span class="staff-role">مشرف ${index + 1}</span>
                </div>
            </div>
        `).join('');

        tickerDisplay.innerHTML = `
            <div class="ticker-layout supervisors-layout horizontal-layout">
                <div class="header-section">
                    <div class="day-badge">
                        <span class="day-icon">📅</span>
                        <span class="day-text">${staffData.اليوم}</span>
                    </div>
                    <div class="staff-badge-large">
                        <span class="staff-icon">👥</span>
                        <span class="staff-text">فريق الإشراف</span>
                    </div>
                </div>
                
                <div class="content-section">
                    <div class="horizontal-staff-container">
                        <h4 class="section-title">👥 المشرفون اليوم</h4>
                        <div class="horizontal-staff-grid">
                            ${supervisorsList}
                        </div>
                        <div class="staff-summary">
                            <div class="summary-badge">
                                <span class="summary-number">${staffData.المشرفون.length}</span>
                                <span class="summary-label">مشرف</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showDutyView(staffData) {
        const tickerDisplay = document.getElementById('ticker-display');
        
        const dutyList = staffData.المناوبون.map((duty, index) => `
            <div class="horizontal-staff-item">
                <span class="staff-icon">🔄</span>
                <div class="staff-content">
                    <span class="staff-name">${duty}</span>
                    <span class="staff-role">مناوب ${index + 1}</span>
                </div>
            </div>
        `).join('');

        tickerDisplay.innerHTML = `
            <div class="ticker-layout duty-layout horizontal-layout">
                <div class="header-section">
                    <div class="day-badge">
                        <span class="day-icon">📅</span>
                        <span class="day-text">${staffData.اليوم}</span>
                    </div>
                    <div class="staff-badge-large">
                        <span class="staff-icon">🔄</span>
                        <span class="staff-text">فريق المناوبة</span>
                    </div>
                </div>
                
                <div class="content-section">
                    <div class="horizontal-staff-container">
                        <h4 class="section-title">🔄 المناوبون اليوم</h4>
                        <div class="horizontal-staff-grid">
                            ${dutyList}
                        </div>
                        <div class="staff-summary">
                            <div class="summary-badge">
                                <span class="summary-number">${staffData.المناوبون.length}</span>
                                <span class="summary-label">مناوب</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    showNoSupervisorsMessage() {
        const tickerDisplay = document.getElementById('ticker-display');
        const today = new Date().toLocaleDateString('ar-SA', { weekday: 'long' });
        
        tickerDisplay.innerHTML = `
            <div class="ticker-layout no-staff-layout">
                <div class="header-section">
                    <div class="day-badge">
                        <span class="day-icon">📅</span>
                        <span class="day-text">${today}</span>
                    </div>
                    <div class="staff-badge-large">
                        <span class="staff-icon">👥</span>
                        <span class="staff-text">المشرفون</span>
                    </div>
                </div>
                
                <div class="content-section">
                    <div class="no-staff-message">
                        <div class="message-icon">👥</div>
                        <h3>لا يوجد مشرفين لهذا اليوم</h3>
                        <p class="hint">يرجى تعيين المشرفين من لوحة التحكم</p>
                    </div>
                </div>
            </div>
        `;
    }

    showNoDutyMessage() {
        const tickerDisplay = document.getElementById('ticker-display');
        const today = new Date().toLocaleDateString('ar-SA', { weekday: 'long' });
        
        tickerDisplay.innerHTML = `
            <div class="ticker-layout no-staff-layout">
                <div class="header-section">
                    <div class="day-badge">
                        <span class="day-icon">📅</span>
                        <span class="day-text">${today}</span>
                    </div>
                    <div class="staff-badge-large">
                        <span class="staff-icon">🔄</span>
                        <span class="staff-text">المناوبون</span>
                    </div>
                </div>
                
                <div class="content-section">
                    <div class="no-staff-message">
                        <div class="message-icon">🔄</div>
                        <h3>لا توجد مناوبين لهذا اليوم</h3>
                        <p class="hint">يرجى تعيين المناوبين من لوحة التحكم</p>
                    </div>
                </div>
            </div>
        `;
    }

    showNoScheduleMessage(currentPeriod) {
        const tickerDisplay = document.getElementById('ticker-display');
        const periodTime = this.periodTimes[currentPeriod.period];
        
        tickerDisplay.innerHTML = `
            <div class="ticker-layout no-schedule-layout">
                <div class="header-section">
                    <div class="day-badge">
                        <span class="day-icon">📅</span>
                        <span class="day-text">${new Date().toLocaleDateString('ar-SA', { weekday: 'long' })}</span>
                    </div>
                    <div class="period-badge-large">
                        <span class="period-icon">⏰</span>
                        <span class="period-text">الحصة ${currentPeriod.period}</span>
                    </div>
                </div>
                
                <div class="content-section">
                    <div class="no-schedule-message">
                        <div class="message-icon">📋</div>
                        <h3>لا توجد جداول مبرمجة</h3>
                        <p>الحصة ${currentPeriod.period} - ${periodTime.start} - ${periodTime.end}</p>
                        <p class="hint">يرجى مراجعة إدارة المدرسة</p>
                    </div>
                </div>
            </div>
        `;
    }

    showNoClassMessage() {
        const tickerDisplay = document.getElementById('ticker-display');
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                           now.getMinutes().toString().padStart(2, '0');
        
        const nextPeriod = this.getNextPeriod();
        
        let nextPeriodInfo = '';
        if (nextPeriod) {
            nextPeriodInfo = `
                <div class="next-period">
                    <span class="next-icon">⏭️</span>
                    <span class="next-text">الحصة التالية: ${nextPeriod.period} الساعة ${nextPeriod.start}</span>
                </div>
            `;
        }
        
        tickerDisplay.innerHTML = `
            <div class="ticker-layout no-class-layout">
                <div class="header-section">
                    <div class="day-badge">
                        <span class="day-icon">📅</span>
                        <span class="day-text">${new Date().toLocaleDateString('ar-SA', { weekday: 'long' })}</span>
                    </div>
                    <div class="time-badge">
                        <span class="time-icon">🕒</span>
                        <span class="time-text">${currentTime}</span>
                    </div>
                </div>
                
                <div class="content-section">
                    <div class="no-class-message">
                        <div class="message-icon">⏰</div>
                        <h3>وقت خارج الدوام الدراسي</h3>
                        <p>لا توجد حصة دراسية حالياً</p>
                        ${nextPeriodInfo}
                    </div>
                </div>
            </div>
        `;
    }

    getNextPeriod() {
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                           now.getMinutes().toString().padStart(2, '0');
        
        for (const [period, times] of Object.entries(this.periodTimes)) {
            if (currentTime < times.start) {
                return { period, start: times.start, end: times.end };
            }
        }
        
        return null;
    }

    resetTickerDisplay() {
        const tickerDisplay = document.getElementById('ticker-display');
        // --- ✨ (تعديل) عند الإيقاف، لا يزال يعرض الاسم والشعار ---
        const schoolName = window.settingsManager?.settings.schoolName || 'مرحباً بكم في نظام إدارة المدرسة';
        
        tickerDisplay.innerHTML = `
            <div class="ticker-layout welcome-layout">
                <div class="welcome-message">
                    <div class="welcome-icon">🏫</div>
                    <h3>${schoolName}</h3>
                    <p>الشريط الإخباري متوقف</p>
                </div>
            </div>
        `;
    }

    loadTickerData() {
        this.updateDateTime();
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
            ${type === 'success' ? 'background: #38a169;' : 
              type === 'warning' ? 'background: #dd6b20;' : 'background: #e53e3e;'}
        `;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}