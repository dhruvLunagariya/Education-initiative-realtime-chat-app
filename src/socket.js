import { io } from 'socket.io-client';

export const initSocket = async () => {
    const options = {
        'force new connection': true, // connection start 
        reconnectionAttempt: 'Infinity',
        timeout: 10000,
        transports: ['websocket'],
    };
    return io(process.env.REACT_APP_BACKEND_URL, options); //in .env file there is link of localhost 
    //this function return instance of client
};
