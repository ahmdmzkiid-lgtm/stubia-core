import webpush from 'web-push';
import fs from 'fs';
import path from 'path';

const KEYS_PATH = path.join(__dirname, '../../data/vapid-keys.json');
const SUBS_PATH = path.join(__dirname, '../../data/push-subscriptions.json');

// Ensure directories exist
if (!fs.existsSync(path.dirname(KEYS_PATH))) {
  fs.mkdirSync(path.dirname(KEYS_PATH), { recursive: true });
}

let vapidKeys: { publicKey: string; privateKey: string };

if (fs.existsSync(KEYS_PATH)) {
  vapidKeys = JSON.parse(fs.readFileSync(KEYS_PATH, 'utf8'));
} else {
  vapidKeys = webpush.generateVAPIDKeys();
  fs.writeFileSync(KEYS_PATH, JSON.stringify(vapidKeys), 'utf8');
}

// Configure web-push with vapid keys
webpush.setVapidDetails(
  'mailto:admin@stubia.id',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export const getVapidPublicKey = () => vapidKeys.publicKey;

export interface PushSubscription {
  userId: string;
  subscription: any;
}

const getSubscriptions = (): PushSubscription[] => {
  if (fs.existsSync(SUBS_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(SUBS_PATH, 'utf8'));
    } catch {
      return [];
    }
  }
  return [];
};

const saveSubscriptions = (subs: PushSubscription[]) => {
  fs.writeFileSync(SUBS_PATH, JSON.stringify(subs, null, 2), 'utf8');
};

export const subscribeUser = (userId: string, subscription: any) => {
  const subs = getSubscriptions();
  // Filter out existing user subscriptions to keep it clean (1 active device subscription)
  const filtered = subs.filter((s) => s.userId !== userId);
  filtered.push({ userId, subscription });
  saveSubscriptions(filtered);
};

export const unsubscribeUser = (userId: string) => {
  const subs = getSubscriptions();
  const filtered = subs.filter((s) => s.userId !== userId);
  saveSubscriptions(filtered);
};

export const sendPushNotification = async (
  userId: string,
  title: string,
  body: string,
  url: string = '/',
  options?: {
    urgency?: 'very-low' | 'low' | 'normal' | 'high';
    TTL?: number;
    tag?: string;
    vibrate?: number[];
    renotify?: boolean;
    requireInteraction?: boolean;
  }
) => {
  const subs = getSubscriptions();
  const userSub = subs.find((s) => s.userId === userId);
  if (!userSub) return;

  const urgency = options?.urgency || 'high';
  const TTL = options?.TTL !== undefined ? options.TTL : 86400; // default 1 day TTL
  const tag = options?.tag || 'chat-message';
  const vibrate = options?.vibrate || [200, 100, 200];
  const renotify = options?.renotify !== undefined ? options.renotify : true;
  const requireInteraction = options?.requireInteraction !== undefined ? options.requireInteraction : false;

  const payload = JSON.stringify({
    title,
    body,
    icon: '/icons/192.webp',
    url,
    tag,
    vibrate,
    renotify,
    requireInteraction,
  });

  const sendOptions = {
    TTL,
    urgency,
  };

  try {
    await webpush.sendNotification(userSub.subscription, payload, sendOptions);
    console.log(`[WebPush] Sent notification to user ${userId} with urgency ${urgency}`);
  } catch (error: any) {
    console.error(`[WebPush] Failed to send notification to user ${userId}:`, error);
    // Auto-clean expired/uninstalled subscriptions
    if (error.statusCode === 410 || error.statusCode === 404) {
      unsubscribeUser(userId);
    }
  }
};
