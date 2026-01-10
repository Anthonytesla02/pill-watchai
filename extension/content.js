// Drug Expiry Tracker - Content Script
// Monitors input fields and shows alerts for matching drugs (including aliases and brand names)

(function() {
  'use strict';

  // Check if already initialized to prevent duplicate execution
  if (window.__drugExpiryTrackerInitialized) return;
  window.__drugExpiryTrackerInitialized = true;

  console.log('Drug Expiry Tracker: Starting initialization...');

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
  const processedInputs = new WeakSet();

  // Create notification container
  function createNotificationContainer() {
    if (notificationContainer && document.body.contains(notificationContainer)) {
      return notificationContainer;
    }

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

  // Format aliases and brand names for display
  function formatAlternativeNames(drug) {
    const parts = [];
    
    if (drug.aliases && drug.aliases.length > 0) {
      parts.push(`Also known as: ${drug.aliases.slice(0, 2).join(', ')}${drug.aliases.length > 2 ? '...' : ''}`);
    }
    
    if (drug.brandNames && drug.brandNames.length > 0) {
      const brandDisplay = drug.brandNames.slice(0, 2).map(b => b.name).join(', ');
      parts.push(`Brands: ${brandDisplay}${drug.brandNames.length > 2 ? '...' : ''}`);
    }
    
    return parts.join(' • ');
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

    const alternativeNames = formatAlternativeNames(drug);

    notification.style.cssText = `
      background: ${bgColor};
      border: 1px solid ${borderColor};
      border-left: 4px solid ${borderColor};
      border-radius: 8px;
      padding: 12px 16px;
      min-width: 300px;
      max-width: 400px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      animation: drugExpirySlideIn 0.3s ease-out;
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
                ${drug.name}${drug.genericName ? ` (${drug.genericName})` : ''}
              </p>
              <p style="margin: 0; font-size: 12px; color: ${textColor}; opacity: 0.8;">
                ${drug.statusText} • Batch: ${drug.batchNumber}
              </p>
              ${alternativeNames ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: ${textColor}; opacity: 0.7;">${alternativeNames}</p>` : ''}
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

    // Auto-remove after 6 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'drugExpirySlideOut 0.3s ease-in forwards';
        setTimeout(() => {
          notification.remove();
          shownNotifications.delete(notificationId);
        }, 300);
      }
    }, 6000);

    // Click to dismiss
    notification.addEventListener('click', () => {
      notification.style.animation = 'drugExpirySlideOut 0.3s ease-in forwards';
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
      @keyframes drugExpirySlideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes drugExpirySlideOut {
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

  // Extract words from text to check individually
  function extractWords(text) {
    return text.toLowerCase().split(/\s+/).filter(word => word.length >= 3);
  }

  // Check if extension context is still valid
  function isExtensionContextValid() {
    try {
      return chrome.runtime && chrome.runtime.id;
    } catch (e) {
      return false;
    }
  }

  // Check input value for drug matches
  async function checkDrugsForText(value) {
    if (!value || value.length < 3) return;
    if (!isExtensionContextValid()) {
      console.log('Drug Expiry Tracker: Extension context invalidated');
      return;
    }

    // Check both the full text and individual words
    const wordsToCheck = new Set([value.toLowerCase(), ...extractWords(value)]);
    
    for (const word of wordsToCheck) {
      if (word.length < 3) continue;
      
      try {
        const matches = await chrome.runtime.sendMessage({
          type: 'CHECK_DRUG',
          text: word
        });

        if (matches && matches.length > 0) {
          // Show notifications for expired or expiring drugs
          const alertDrugs = matches.filter(d => d.status === 'expired' || d.status === 'expiring');
          alertDrugs.forEach(drug => createNotification(drug));
        }
      } catch (error) {
        // Extension context might be invalidated, log but don't spam
        if (error.message && error.message.includes('Extension context invalidated')) {
          console.log('Drug Expiry Tracker: Extension was reloaded, please refresh the page');
          return;
        }
        console.error('Drug Expiry Tracker: Error checking drugs', error);
      }
    }
  }

  const debouncedCheck = debounce(checkDrugsForText, 300);

  // Get the value from an input element
  function getInputValue(element) {
    if (!element) return '';
    
    // Standard input/textarea
    if (element.value !== undefined) {
      return element.value;
    }
    
    // ContentEditable
    if (element.isContentEditable) {
      return element.textContent || element.innerText || '';
    }
    
    return '';
  }

  // Handle input events
  function handleInputEvent(event) {
    const target = event.target;
    if (!target) return;
    
    const value = getInputValue(target);
    if (value) {
      debouncedCheck(value);
    }
  }

  // Attach listeners to a single input element
  function attachListenersToInput(input) {
    if (!input || processedInputs.has(input)) return;
    processedInputs.add(input);
    
    input.addEventListener('input', handleInputEvent, { passive: true });
    input.addEventListener('keyup', handleInputEvent, { passive: true });
    input.addEventListener('paste', (e) => {
      setTimeout(() => handleInputEvent(e), 0);
    }, { passive: true });
  }

  // Find and attach listeners to all inputs on the page
  function attachListenersToAllInputs() {
    const inputs = document.querySelectorAll('input, textarea, [contenteditable="true"]');
    inputs.forEach(attachListenersToInput);
  }

  // Handle document-level events for dynamically created inputs
  function setupGlobalListeners() {
    // Capture phase to catch events before they're stopped
    document.addEventListener('input', handleInputEvent, { capture: true, passive: true });
    document.addEventListener('keyup', handleInputEvent, { capture: true, passive: true });
    
    // Focus event to catch newly focused inputs
    document.addEventListener('focus', (event) => {
      const target = event.target;
      if (target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      )) {
        attachListenersToInput(target);
      }
    }, { capture: true, passive: true });
  }

  // Setup MutationObserver for dynamically added elements
  function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          
          // Check if the node itself is an input
          if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || node.isContentEditable) {
            attachListenersToInput(node);
          }
          
          // Check for inputs within the node
          if (node.querySelectorAll) {
            const inputs = node.querySelectorAll('input, textarea, [contenteditable="true"]');
            inputs.forEach(attachListenersToInput);
          }
        }
      }
    });

    observer.observe(document.documentElement, { 
      childList: true, 
      subtree: true 
    });
  }

  // Initialize
  function init() {
    try {
      addStyles();
      setupGlobalListeners();
      attachListenersToAllInputs();
      setupMutationObserver();
      console.log('Drug Expiry Tracker: Content script initialized successfully (with aliases and brand names support)');
    } catch (error) {
      console.error('Drug Expiry Tracker: Failed to initialize', error);
    }
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Small delay to ensure body exists
    setTimeout(init, 0);
  }
})();