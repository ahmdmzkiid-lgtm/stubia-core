/// <reference types="vite/client" />
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
    // Connect directly to the backend URL in production to bypass Vercel's WebSocket limitations.
    // Falls back to the relative path in development to use Vite's dev server proxy.
    const backendUrl = import.meta.env.VITE_API_URL || '';
    const socketUrl = `${backendUrl.replace(/\/$/, '')}/chat`;

    socket = io(socketUrl, {
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
