import { io } from 'socket.io-client';

// In development, connect to the backend server (typically localhost:3001)
// In production, use undefined so socket.io-client defaults to connecting to the same origin serving the app
const SOCKET_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001')
  : undefined;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000
});
