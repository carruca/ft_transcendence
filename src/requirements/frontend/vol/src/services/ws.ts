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

/*
const pendingMessages = [];

// Middleware que se ejecuta antes de cada emisión de evento
socket.use((packet, next) => {
  const [eventName, data] = packet;

  if (socket.connected) {
    // Si el socket está conectado, permite que la emisión continúe
    next();
  } else {
    // Si el socket no está conectado, almacena el evento y los datos
    pendingMessages.push({ eventName, data });
    console.log('Socket no está conectado. Mensaje almacenado:', { eventName, data });
    // Puedes almacenar el mensaje o realizar otras acciones aquí
  }
});

// Manejar el evento de conexión
socket.on('connect', () => {
  console.log('Socket conectado. Enviando mensajes pendientes...');

  // Enviar mensajes pendientes
  while (pendingMessages.length > 0) {
    const { eventName, data } = pendingMessages.shift();
    socket.emit(eventName, data);
    console.log('Mensaje enviado:', { eventName, data });
  }
});
*/
export default socket;

