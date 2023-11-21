// socket io
import { io, Socket } from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL, {
  autoConnect: false,
// reconnection: true,
//  reconnectionDelay: 1000,
  auth: {
    token: document.cookie
  }
});

socket.on('error', (data) => {
  console.log(`socket error: ${data}`);
  //socket.io.opts.reconnection = false;
  //socket.io.opts.reconnection = true;
  //socket.io.opts.reconnectionDelay = 1000;
})

export default socket;

