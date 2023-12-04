// socket io
import { io, Socket } from 'socket.io-client';

export const socket = io(import.meta.env.VITE_BACKEND_URL, {
  autoConnect: false,
  auth: {
    token: document.cookie
  }
});

socket.on('error', (data) => {
})

const pendingMessages = [];

export function socketSend(event: string, value: any) {
  if (socket.connected) {
    socket.emit(event, value);
  } else {
    pendingMessages.push({ event, value });
  }
}

socket.on('connect', () => {
  while (pendingMessages.length > 0) {
    const { eventName, data } = pendingMessages.shift();
    socket.emit(eventName, data);
  }
});
