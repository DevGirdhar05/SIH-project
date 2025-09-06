interface OfflineIssue {
  id: string;
  data: any;
  token: string;
  timestamp: number;
}

class OfflineService {
  private dbName = 'CivicConnectDB';
  private dbVersion = 1;
  private storeName = 'offlineIssues';

  async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async saveOfflineIssue(issueData: any): Promise<string> {
    const db = await this.initDB();
    const token = localStorage.getItem('token') || '';
    
    const offlineIssue: OfflineIssue = {
      id: Date.now().toString(),
      data: issueData,
      token,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(offlineIssue);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(offlineIssue.id);
    });
  }

  async getOfflineIssues(): Promise<OfflineIssue[]> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async removeOfflineIssue(id: string): Promise<void> {
    const db = await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async syncOfflineIssues(): Promise<void> {
    if (!navigator.onLine) {
      console.log('Still offline, cannot sync');
      return;
    }

    const offlineIssues = await this.getOfflineIssues();
    
    for (const issue of offlineIssues) {
      try {
        const response = await fetch('/api/issues', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${issue.token}`
          },
          body: JSON.stringify(issue.data)
        });

        if (response.ok) {
          await this.removeOfflineIssue(issue.id);
          console.log('Offline issue synced successfully');
          
          // Dispatch custom event to notify UI
          window.dispatchEvent(new CustomEvent('offline-issue-synced', {
            detail: { issueId: issue.id }
          }));
        }
      } catch (error) {
        console.error('Failed to sync offline issue:', error);
      }
    }
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  // Register service worker for background sync
  async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', registration);
        
        // Request background sync permission
        try {
          if ('sync' in window.ServiceWorkerRegistration.prototype) {
            const swRegistration = registration as any;
            if (swRegistration.sync) {
              await swRegistration.sync.register('background-sync-issues');
            }
          }
        } catch (error) {
          console.log('Background sync not supported');
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }
}

export const offlineService = new OfflineService();