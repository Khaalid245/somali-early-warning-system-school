// Offline support and data synchronization
export class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.pendingOperations = JSON.parse(localStorage.getItem('pending_operations') || '[]');
    this.isSyncing = false;
    this.setupEventListeners();
    
    // Auto-sync on startup if online
    if (this.isOnline && this.pendingOperations.length > 0) {
      setTimeout(() => this.syncPendingOperations(), 2000);
    }
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('✅ Connection restored. Syncing pending operations...');
      this.syncPendingOperations();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('⚠️ Connection lost. Operating in offline mode.');
    });
  }

  async saveAttendanceOffline(attendanceData) {
    const operation = {
      id: Date.now() + Math.random(),
      type: 'attendance_create',
      data: attendanceData,
      timestamp: new Date().toISOString(),
      retries: 0,
      status: 'pending'
    };
    
    this.pendingOperations.push(operation);
    this.savePendingOperations();
    
    console.log(`💾 Saved offline: ${operation.id}`);
    
    // Try to sync immediately if online
    if (this.isOnline) {
      setTimeout(() => this.syncPendingOperations(), 1000);
    }
    
    return operation.id;
  }

  async syncPendingOperations() {
    if (this.isSyncing || !this.isOnline || this.pendingOperations.length === 0) {
      return;
    }

    this.isSyncing = true;
    const operations = [...this.pendingOperations];
    let syncedCount = 0;
    
    console.log(`🔄 Syncing ${operations.length} pending operations...`);

    for (const operation of operations) {
      if (operation.status === 'synced') continue;
      
      try {
        await this.executeOperation(operation);
        operation.status = 'synced';
        this.removePendingOperation(operation.id);
        syncedCount++;
        console.log(`✅ Synced: ${operation.id}`);
      } catch (error) {
        operation.retries++;
        console.error(`❌ Sync failed (attempt ${operation.retries}):`, error.message);
        
        if (operation.retries >= 5) {
          operation.status = 'failed';
          console.error(`🚫 Operation failed permanently: ${operation.id}`);
        }
      }
    }
    
    this.savePendingOperations();
    this.isSyncing = false;
    
    if (syncedCount > 0) {
      console.log(`✅ Successfully synced ${syncedCount} operations`);
      // Trigger custom event for UI update
      window.dispatchEvent(new CustomEvent('offlineSyncComplete', { detail: { count: syncedCount } }));
    }
  }

  async executeOperation(operation) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/attendance/sessions/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('access')}`
        },
        body: JSON.stringify(operation.data),
        credentials: 'include',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - network too slow');
      }
      throw error;
    }
  }

  removePendingOperation(id) {
    this.pendingOperations = this.pendingOperations.filter(op => op.id !== id);
  }

  savePendingOperations() {
    localStorage.setItem('pending_operations', JSON.stringify(this.pendingOperations));
  }

  getPendingCount() {
    return this.pendingOperations.filter(op => op.status !== 'synced').length;
  }
  
  getFailedCount() {
    return this.pendingOperations.filter(op => op.status === 'failed').length;
  }
  
  clearSyncedOperations() {
    this.pendingOperations = this.pendingOperations.filter(op => op.status !== 'synced');
    this.savePendingOperations();
  }
  
  // Manual retry for failed operations
  async retryFailed() {
    this.pendingOperations.forEach(op => {
      if (op.status === 'failed') {
        op.status = 'pending';
        op.retries = 0;
      }
    });
    this.savePendingOperations();
    await this.syncPendingOperations();
  }
}

export const offlineManager = new OfflineManager();