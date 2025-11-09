// إدارة العمليات اليومية العامة مثل الوقت والإشعارات
class DailyManager {
    constructor() {
        // سيتم استدعاؤه مرة واحدة عند الإنشاء
    }

    updateDateTime() {
        const today = new Date().toLocaleDateString('ar-SA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const dateElements = document.querySelectorAll('#current-date');
        dateElements.forEach(element => {
            element.textContent = today;
        });
    }

    getCurrentDayName() {
        return new Date().toLocaleDateString('ar-SA', { weekday: 'long' });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    getNotificationIcon(type) {
        const icons = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };
        return icons[type] || 'ℹ️';
    }
}
// -- تم حذف جزء الإنشاء الذي كان هنا --