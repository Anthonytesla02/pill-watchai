// Drug Expiry Tracker - Content Script
// Monitors input fields and shows alerts for matching drugs

(function() {
  'use strict';

  // Debounce function to limit API calls
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Track shown notifications to avoid duplicates
  const shownNotifications = new Set();
  let notificationContainer = null;

  // Create notification container
  function createNotificationContainer() {
    if (notificationContainer) return notificationContainer;

    notificationContainer = document.createElement('div');
    notificationContainer.id = 'drug-expiry-tracker-notifications';
    notificationContainer.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    `;
    document.body.appendChild(notificationContainer);
    return notificationContainer;
  }

  // Create a notification toast
  function createNotification(drug) {
    const notificationId = `${drug.id}-${drug.status}`;
    if (shownNotifications.has(notificationId)) return;
    shownNotifications.add(notificationId);

    const container = createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = 'drug-expiry-notification';
    
    const isExpired = drug.status === 'expired';
    const isExpiring = drug.status === 'expiring';
    
    const bgColor = isExpired ? '#FEE2E2' : isExpiring ? '#FEF3C7' : '#D1FAE5';
    const borderColor = isExpired ? '#EF4444' : isExpiring ? '#F59E0B' : '#10B981';
    const textColor = isExpired ? '#991B1B' : isExpiring ? '#92400E' : '#065F46';
    const iconColor = isExpired ? '#DC2626' : isExpiring ? '#D97706' : '#059669';
    
    const icon = isExpired 
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
      : isExpiring 
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;

    notification.style.cssText = `
      background: ${bgColor};
      border: 1px solid ${borderColor};
      border-left: 4px solid ${borderColor};
      border-radius: 8px;
      padding: 12px 16px;
      min-width: 300px;
      max-width: 400px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      animation: slideIn 0.3s ease-out;
      pointer-events: auto;
      cursor: pointer;
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="flex-shrink: 0; margin-top: 2px;">
          ${icon}
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
            <div>
              <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: ${textColor};">
                ${isExpired ? '⚠️ Drug Expired' : isExpiring ? '⏰ Drug Expiring Soon' : '✓ Drug Safe'}
              </h4>
              <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 500; color: ${textColor};">
                ${drug.name}
              </p>
              <p style="margin: 0; font-size: 12px; color: ${textColor}; opacity: 0.8;">
                ${drug.statusText} • Batch: ${drug.batchNumber}
              </p>
            </div>
            <button style="
              background: transparent;
              border: none;
              cursor: pointer;
              padding: 4px;
              color: ${textColor};
              opacity: 0.5;
              font-size: 18px;
              line-height: 1;
            " onclick="this.closest('.drug-expiry-notification').remove()">×</button>
          </div>
        </div>
      </div>
    `;

    container.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
          notification.remove();
          shownNotifications.delete(notificationId);
        }, 300);
      }
    }, 5000);

    // Click to dismiss
    notification.addEventListener('click', () => {
      notification.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => {
        notification.remove();
        shownNotifications.delete(notificationId);
      }, 300);
    });
  }

  // Add CSS animations
  function addStyles() {
    if (document.getElementById('drug-expiry-tracker-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'drug-expiry-tracker-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Check input value for drug matches
  const checkForDrugs = debounce(async (value) => {
    if (!value || value.length < 3) return;

    try {
      const matches = await chrome.runtime.sendMessage({
        type: 'CHECK_DRUG',
        text: value
      });

      if (matches && matches.length > 0) {
        // Only show notifications for expired or expiring drugs
        const alertDrugs = matches.filter(d => d.status === 'expired' || d.status === 'expiring');
        alertDrugs.forEach(drug => createNotification(drug));
      }
    } catch (error) {
      console.error('Drug Expiry Tracker: Error checking drugs', error);
    }
  }, 300);

  // Handle input events
  function handleInput(event) {
    const target = event.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      const value = target.value || target.textContent || '';
      checkForDrugs(value);
    }
  }

  // Initialize
  function init() {
    addStyles();
    
    // Listen for input events on all input fields
    document.addEventListener('input', handleInput, true);
    document.addEventListener('keyup', handleInput, true);

    // Also observe for dynamically added inputs
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const inputs = node.querySelectorAll ? 
              node.querySelectorAll('input, textarea, [contenteditable="true"]') : [];
            inputs.forEach(input => {
              input.addEventListener('input', handleInput);
              input.addEventListener('keyup', handleInput);
            });
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    console.log('Drug Expiry Tracker: Content script initialized');
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
