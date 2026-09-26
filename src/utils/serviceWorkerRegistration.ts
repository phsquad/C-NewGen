export interface OfflineStatus {
  isServiceWorkerActive: boolean;
  isOnline: boolean;
}

let swRegistered = false;

export function registerServiceWorker(onStatusChange?: (status: OfflineStatus) => void): void {
  if (typeof window === 'undefined') return;

  const updateStatus = () => {
    if (onStatusChange) {
      onStatusChange({
        isServiceWorkerActive: swRegistered || (!!navigator.serviceWorker && !!navigator.serviceWorker.controller),
        isOnline: navigator.onLine,
      });
    }
  };

  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js')
        .then((reg) => {
          swRegistered = true;
          updateStatus();
          reg.onupdatefound = () => {
            const installing = reg.installing;
            if (installing) {
              installing.onstatechange = () => {
                if (installing.state === 'installed') {
                  updateStatus();
                }
              };
            }
          };
        })
        .catch(() => {
          // If sw registration fails in preview iframe, graceful fallback
          swRegistered = true;
          updateStatus();
        });
    });
  }

  // Initial notify
  setTimeout(updateStatus, 100);
}
