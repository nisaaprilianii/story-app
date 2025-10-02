import { convertBase64ToUint8Array } from './index';
import { VAPID_PUBLIC_KEY } from '../config';
import { subscribePushNotification, unsubscribePushNotification } from '../data/api';

// cek Notification API
export function isNotificationAvailable() {
  return 'Notification' in window;
}

// cek izin notifikasi
export function isNotificationGranted() {
  return Notification.permission === 'granted';
}

// minta izin notifikasi
export async function requestNotificationPermission() {
  if (!isNotificationAvailable()) {
    console.error('Notification API unsupported.');
    return false;
  }
  if (isNotificationGranted()) return true;

  const status = await Notification.requestPermission();
  if (status !== 'granted') {
    alert('Izin notifikasi tidak diberikan.');
    return false;
  }
  return true;
}

// ambil subscription saat ini
export async function getPushSubscription() {
  const registration = await navigator.serviceWorker.getRegistration();
  return registration ? await registration.pushManager.getSubscription() : null;
}

export async function isCurrentPushSubscriptionAvailable() {
  return !!(await getPushSubscription());
}

// opsi subscribe
export function generateSubscribeOptions() {
  return {
    userVisibleOnly: true,
    applicationServerKey: convertBase64ToUint8Array(VAPID_PUBLIC_KEY),
  };
}

// subscribe push notification
export async function subscribe() {
  if (!(await requestNotificationPermission())) return;

  if (await isCurrentPushSubscriptionAvailable()) {
    alert('Sudah berlangganan push notification.');
    return;
  }

  const failureMsg = 'Langganan push notification gagal.';
  const successMsg = 'Langganan push notification berhasil!';
  let pushSubscription;
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    pushSubscription = await registration.pushManager.subscribe(generateSubscribeOptions());
    const { endpoint, keys } = pushSubscription.toJSON();
    const response = await subscribePushNotification({ endpoint, keys });
    if (!response.ok) {
      await pushSubscription.unsubscribe();
      alert(failureMsg);
      return;
    }
    alert(successMsg);
  } catch (error) {
    console.error('subscribe error:', error);
    if (pushSubscription) await pushSubscription.unsubscribe();
    alert(failureMsg);
  }
}

// unsubscribe push notification
export async function unsubscribe() {
  const failureMsg = 'Gagal memutus langganan push notification.';
  const successMsg = 'Langganan push notification berhasil dihentikan!';
  try {
    const pushSubscription = await getPushSubscription();
    if (!pushSubscription) {
      alert('Belum berlangganan push notification.');
      return;
    }
    const { endpoint, keys } = pushSubscription.toJSON();
    const response = await unsubscribePushNotification({ endpoint });
    if (!response.ok) {
      alert(failureMsg);
      return;
    }
    const unsubscribed = await pushSubscription.unsubscribe();
    if (!unsubscribed) {
      alert(failureMsg);
      return;
    }
    alert(successMsg);
  } catch (error) {
    console.error('unsubscribe error:', error);
    alert(failureMsg);
  }
}
