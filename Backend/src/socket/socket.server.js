import { Server } from "socket.io";
import config from "../config/config.js";

let io;

const CHAT_MUTE_MS = 10_000;
const TURN_DURATION_MS = 3 * 60 * 1000;
const chatMutedUntil = new Map();

const rooms = [],
words = [
  "apple", "banana", "guitar", "elephant", "mountain",
  "rainbow", "bicycle", "castle", "dragon", "umbrella",
  "volcano", "penguin", "rocket", "sandwich", "tiger",
  "waterfall", "butterfly", "telescope", "pyramid", "octopus",
  "snowman", "lighthouse", "cactus", "dolphin", "kangaroo",
  "helicopter", "campfire", "spider", "windmill", "jellyfish",
  "skateboard", "volcano", "trumpet", "pineapple", "scarecrow",
  "compass", "hedgehog", "parachute", "flamingo", "chandelier",
  "submarine", "cupcake", "cheetah", "hammer", "igloo",
  "jacket", "kite", "lantern", "mushroom", "necklace"
];

function createRoom(isPrivate = false) {
    return {
        players: [],
        currentDrawer: null,
        currentWord: null,
        correctGuessers: [],
        intervalId: null,
        roundEndsAt: null,
        isPrivate
    };
}

function emitRoomUpdate(roomID, room) {
    io.to(String(roomID)).emit("room-update", {
        players: room.players,
        currentDrawer: room.currentDrawer,
        currentWord: room.currentWord,
        correctGuessers: room.correctGuessers,
        roundEndsAt: room.roundEndsAt,
        roundDurationMs: TURN_DURATION_MS
    });
}

function startTurnTimer(roomID) {
    const room = rooms[roomID];
    if (!room) return;

    if (room.intervalId) clearInterval(room.intervalId);

    const startNextTurn = () => {
        if (room.players.length < 1) {
            clearInterval(room.intervalId);
            room.intervalId = null;
            room.roundEndsAt = null;
            return;
        }

        const randomIndex = Math.floor(Math.random() * room.players.length);
        room.currentDrawer = room.players[randomIndex];
        room.currentWord = getRandomWord();
        room.correctGuessers = [];
        room.roundEndsAt = Date.now() + TURN_DURATION_MS;
        emitRoomUpdate(roomID, room);
    };

    startNextTurn();
    room.intervalId = setInterval(startNextTurn, TURN_DURATION_MS);
}

function getRandomWord() {
  const index = Math.floor(Math.random() * words.length);
  return words[index];
}

// // Usage when starting a round
// const wordForRound = getRandomWord();
// io.emit("wordHint", wordForRound.replace(/[a-z]/gi, "_ "));
// socket.to(currentDrawerSocketId).emit("wordToGuess", wordForRound);

function initServer(httpServer) {

    io = new Server(httpServer, {
        cors : {
            origin: ["http://localhost:5173", config.frontend_url],
            credentials: true
        }
    });

    console.log("Socket Server is Running");

    io.on("connection", (socket) => {
        console.log("A new User Connected to Socket : ", socket.id);

        socket.on("create-room", ({ username }) => {
            const room = rooms.find((candidate) =>
                candidate && !candidate.isPrivate && candidate.players.length < 7
            );
            let roomID;

            if (room) {
                roomID = rooms.indexOf(room);
            } else {
                do {
                    roomID = Math.floor(Math.random() * 999999);
                } while (rooms[roomID]);
                rooms[roomID] = createRoom();
            }

            rooms[roomID].players.push({ id: socket.id, name: username });
            // socket.join(String(roomID));
            socket.emit("room-created", { roomID, name: username });
        });

        socket.on("join-private-room", ({ roomID, username }) => {
            const roomKey = String(roomID ?? "").trim();
            const room = rooms[roomKey];

            if (!room?.isPrivate) {
                socket.emit("private-room-error", { message: "That private room does not exist." });
                return;
            }
            if (room.players.length >= 7) {
                socket.emit("private-room-error", { message: "That room is full." });
                return;
            }

            socket.emit("private-room-joined", { roomID: roomKey, username });
        });

        socket.on("join-room", ({ roomID, name }) => {
            const roomKey = String(roomID ?? "").trim();
            const room = rooms[roomKey];

            if (!room) {
                socket.emit("room-join-error", { message: "That room is no longer available." });
                return;
            }

            const existingPlayer = room.players.find((player) => player.id === socket.id);
            if (!existingPlayer && room.players.length >= 7) {
                socket.emit("room-join-error", { message: "That room is full." });
                return;
            }

            socket.join(roomKey);
            console.log(`Socket ${socket.id} joined room ${roomKey}`);
            if (!existingPlayer) room.players.push({ id: socket.id, name });
            if (!room.intervalId) startTurnTimer(roomKey);
        });

        socket.on("draw", ({ roomId, x, y, color, size, isEraser }) => {
            if (!rooms[roomId] || rooms[roomId]?.currentDrawer?.id !== socket.id) return;

            socket.to(String(roomId)).emit("draw", { x, y, color, size, isEraser });
        });

        socket.on("chat-message", ({roomId, text}) => {
            if(!rooms[roomId]) return;

            let mutedUntil;

            const player = rooms[roomId].players.find(p => p.id === socket.id);

            if (!player) {
                console.log(`Room or player not found for ID: ${roomId}`);
                return; 
            } else if (player.id === rooms[roomId].currentDrawer?.id) {
                mutedUntil = chatMutedUntil.get(socket.id) || 0;
                
                socket.emit("chat-muted", { remainingMs: mutedUntil - Date.now() });
                return;
            }

            
            
            if (typeof text !== "string" || !text.trim()) return;
            
            

            mutedUntil = chatMutedUntil.get(socket.id) || 0;
            if (mutedUntil > Date.now()) {
                socket.emit("chat-muted", { remainingMs: mutedUntil - Date.now() });
                return;
            }

            const room = rooms[roomId];
            const message = { username: player.name, text: text.trim() };

            if (message.text.toLowerCase() === room.currentWord?.toLowerCase()) {
                chatMutedUntil.set(socket.id, Date.now() + CHAT_MUTE_MS);
                room.correctGuessers ??= [];
                room.correctGuessers.push(player.id);
                io.to(String(roomId)).emit("correct-guess", {
                    username: player.name,
                    playerId: player.id,
                    word: room.currentWord
                });
                socket.emit("chat-muted", { durationMs: CHAT_MUTE_MS });
                return;
            }

            
            io.to(String(roomId)).emit("chat-messages", message);
        });

        socket.on("create-private-room", ({ username }) => {
            let roomID;
            do {
                roomID = Math.floor(Math.random() * 999999);
            } while (rooms[roomID]);
            rooms[roomID] = createRoom(true);

            socket.emit("private-room-created", { roomID, username });
        });

        socket.on("disconnect", () => {
            chatMutedUntil.delete(socket.id);
            for (const roomId in rooms) {
                const room = rooms[roomId];
                room.players = room.players.filter(p => p.id !== socket.id);

                if (room.players.length < 1) {
                    clearInterval(room.intervalId);
                    delete rooms[roomId]; // clean up memory too
                    continue;
                }

                if (room.currentDrawer?.id === socket.id) {
                    startTurnTimer(roomId);
                } else {
                    emitRoomUpdate(roomId, room);
                }

                console.log(`User Disconnected ${socket.id}`);
            }
        });
    });
}

export default initServer;