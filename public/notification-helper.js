// Push notification helper for PodcastHub PWA

// Check if push notifications are supported
function arePushNotificationsSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Convert URL safe base64 to Uint8Array
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Replace with your VAPID public key when you have one
// For production use, generate your own keys: https://web-push-codelab.glitch.me/
const applicationServerPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

// Request permission and subscribe to push notifications
async function subscribeToPushNotifications() {
  if (!arePushNotificationsSupported()) {
    console.warn('Push notifications are not supported in this browser');
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }
    
    const registration = await navigator.serviceWorker.ready;
    
    // Get subscription if it exists, otherwise create a new one
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
      
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
    }
    
    // Send the subscription to your server
    await sendSubscriptionToServer(subscription);
    
    return true;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return false;
  }
}

// Send push subscription to server
async function sendSubscriptionToServer(subscription) {
  const response = await fetch('/api/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subscription: subscription
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to store subscription on server');
  }
  
  return response.json();
}

// Unsubscribe from push notifications
async function unsubscribeFromPushNotifications() {
  if (!arePushNotificationsSupported()) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      return true;
    }
    
    // Send unsubscribe request to server
    await fetch('/api/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription
      }),
    });
    
    // Unsubscribe locally
    await subscription.unsubscribe();
    return true;
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return false;
  }
}

// Function to check subscription status
async function checkNotificationSubscription() {
  if (!arePushNotificationsSupported()) {
    return {
      supported: false,
      subscribed: false
    };
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    return {
      supported: true,
      subscribed: !!subscription,
      subscription: subscription
    };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return {
      supported: true,
      subscribed: false,
      error: error.message
    };
  }
}

// Add a notification toggle to the UI
function addNotificationToggleToUI() {
  // Create notification settings button
  const notificationButton = document.createElement('button');
  notificationButton.classList.add('notification-toggle');
  notificationButton.innerHTML = '🔔';
  notificationButton.title = 'Notification Settings';
  
  // Style the button
  Object.assign(notificationButton.style, {
    background: 'transparent',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.5rem',
    marginLeft: '0.5rem'
  });
  
  // Find header-right element to append the button to
  const targetContainer = document.querySelector('.header-right');
  if (targetContainer) {
    targetContainer.prepend(notificationButton);
  }
  
  // Update button state based on subscription status
  updateNotificationButtonState(notificationButton);
  
  // Add click handler
  notificationButton.addEventListener('click', async () => {
    const status = await checkNotificationSubscription();
    
    if (!status.supported) {
      alert('Push notifications are not supported in your browser.');
      return;
    }
    
    if (status.subscribed) {
      if (confirm('You are currently subscribed to notifications. Would you like to unsubscribe?')) {
        await unsubscribeFromPushNotifications();
      }
    } else {
      await subscribeToPushNotifications();
    }
    
    updateNotificationButtonState(notificationButton);
  });
}

// Update notification button state
async function updateNotificationButtonState(button) {
  const status = await checkNotificationSubscription();
  
  if (!status.supported) {
    button.style.opacity = '0.5';
    button.title = 'Notifications not supported';
    return;
  }
  
  if (status.subscribed) {
    button.innerHTML = '🔔';
    button.title = 'Notifications enabled - click to disable';
    button.classList.add('notifications-active');
  } else {
    button.innerHTML = '🔕';
    button.title = 'Notifications disabled - click to enable';
    button.classList.remove('notifications-active');
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (arePushNotificationsSupported()) {
    addNotificationToggleToUI();
  }
});

// Export functions
window.PodcastNotifications = {
  subscribe: subscribeToPushNotifications,
  unsubscribe: unsubscribeFromPushNotifications,
  checkStatus: checkNotificationSubscription
};
