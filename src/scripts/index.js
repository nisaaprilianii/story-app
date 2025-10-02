import '../styles/styles.css';
import App from './pages/app';
import CONFIG from './config';

// Helper: konversi VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  return Uint8Array.from([...window.atob(base64)].map(c => c.charCodeAt(0)));
}

// Register service worker
async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
      console.log('Service worker terdaftar.');
    } catch (err) {
      console.error('Gagal mendaftar service worker:', err);
    }
  }
}

// Toggle push notification global
window.togglePushNotification = async function () {
  const toggleButton = document.getElementById('toggle-push');
  if (!toggleButton) return;

  if (localStorage.getItem('push_enabled') === 'true') {
    localStorage.setItem('push_enabled', 'false');
    console.log('Push notification dinonaktifkan');
  } else {
    if (!('Notification' in window)) return alert('Browser tidak mendukung notifikasi.');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY),
      });
      console.log('Push subscription berhasil.');
    }

    localStorage.setItem('push_enabled', 'true');

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'PUSH_TEST',
        data: {
          title: 'Cerita Baru!',
          body: 'Ada cerita baru yang bisa kamu baca di aplikasi Berbagi Cerita.',
          icon: '/images/logo.png',
          url: '/'
        }
      });
    }
  }
};

// Render halaman
const app = new App({
  content: document.querySelector('#main-content'),
  drawerButton: document.querySelector('#drawer-button'),
  navigationDrawer: document.querySelector('#navigation-drawer'),
});

async function renderApp() {
  if (document.startViewTransition) {
    await document.startViewTransition(async () => app.renderPage());
  } else {
    await app.renderPage();
  }
}

// Event DOMContentLoaded
window.addEventListener('DOMContentLoaded', async () => {
  await registerServiceWorker();
  renderApp();
});

window.addEventListener('hashchange', renderApp);

// Skip link
document.body.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;

  if (link.classList.contains('skip-link')) {
    event.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.setAttribute('tabindex', '-1');
      mainContent.focus();
    }
    return;
  }

  event.preventDefault();
  const hash = link.getAttribute('href');
  if (location.hash !== hash) location.hash = hash;
});
