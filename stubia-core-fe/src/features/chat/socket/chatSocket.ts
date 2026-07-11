/**
 * chatSocket.ts — Singleton Socket.io manager for the /chat namespace.
 *
 * Using a singleton so the connection persists across page navigation,
 * and we get real-time events even when not on the /chat page.
 */
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getChatSocket = (): Socket => {
  if (!socket || !socket.connected) {
    socket = io('/chat', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
};

export const disconnectChatSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
