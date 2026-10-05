import { io } from "socket.io-client";
import { backend_url } from "./backend.api.js";

export const socket = io(backend_url);