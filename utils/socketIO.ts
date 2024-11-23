import {createContext} from 'react';
import SocketIO from 'socket.io-client';

const development = 'http://10.0.2.2:8000';
const device_development = 'http://192.168.2.77:8000';
const production = 'https://callflow-server.onrender.com';

export const callerId = Math.floor(100000 + Math.random() * 900000).toString();

export const socket = SocketIO(development, {
  transports: ['websocket'],
  query: {
    callerId,
  },
});

export const SocketContext = createContext({});
