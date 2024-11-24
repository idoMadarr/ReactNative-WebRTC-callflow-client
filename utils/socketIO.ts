import {createContext} from 'react';
import SocketIO from 'socket.io-client';
import connection from './connection';

export const callerId = Math.floor(100000 + Math.random() * 900000).toString();

export const socket = SocketIO(connection, {
  transports: ['websocket'],
  query: {
    callerId,
  },
});

export const SocketContext = createContext({});
