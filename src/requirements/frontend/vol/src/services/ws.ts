// socket io

import { io, Socket } from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL, {
  autoConnect: true,
  reconnection: false,
  auth: {
    token: document.cookie
  }
});

socket.on('error', (data) => {
  console.log(`socket error: ${data}`);
  socket.io.opts.reconnection = false;
  socket.disconnect();
})

export default socket;

