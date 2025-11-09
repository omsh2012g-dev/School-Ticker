// دالات مساعدة لإدارة التخزين المحلي (LocalStorage)
class StorageManager {
    constructor() {
        if (!this.isLocalStorageSupported()) {
            console.error("LocalStorage is not supported in this browser.");
            alert("المتصفح لا يدعم التخزين المحلي، قد لا يعمل التطبيق بشكل صحيح.");
        }
    }

    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Error saving to localStorage with key "${key}":`, error);
            return false;
        }
    }

    load(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error loading from localStorage with key "${key}":`, error);
            return null;
        }
    }

    clear(key = null) {
        try {
            if (key) {
                localStorage.removeItem(key);
            } else {
                localStorage.clear();
            }
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
    
    isLocalStorageSupported() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    backupData() {
        const backup = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            backup[key] = this.load(key);
        }
        return backup;
    }

    restoreData(backup) {
        try {
            this.clear();
            Object.keys(backup).forEach(key => {
                this.save(key, backup[key]);
            });
            return true;
        } catch (error) {
            console.error('Error restoring data:', error);
            return false;
        }
    }
}
// -- تم حذف سطر الإنشاء الذي كان هنا --