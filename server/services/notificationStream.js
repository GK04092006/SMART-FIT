const clientsByUser = new Map();

const addNotificationClient = (userId, response) => {
  const key = String(userId);
  const clients = clientsByUser.get(key) || new Set();
  clients.add(response);
  clientsByUser.set(key, clients);

  return () => {
    clients.delete(response);
    if (clients.size === 0) clientsByUser.delete(key);
  };
};

const publishNotification = (userId, notification) => {
  const clients = clientsByUser.get(String(userId));
  if (!clients?.size) return;

  const payload = `event: notification\ndata: ${JSON.stringify(notification)}\n\n`;
  for (const response of clients) {
    if (response.writableEnded || response.destroyed) {
      clients.delete(response);
      continue;
    }

    try {
      response.write(payload);
    } catch (error) {
      console.error('[Notification Stream Error]', error.message);
      clients.delete(response);
    }
  }

  if (clients.size === 0) clientsByUser.delete(String(userId));
};

module.exports = { addNotificationClient, publishNotification };
