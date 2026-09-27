import { io } from "socket.io-client";

export const socket = io(backend_url);