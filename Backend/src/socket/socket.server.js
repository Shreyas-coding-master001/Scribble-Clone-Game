import { Server } from "socket.io";
import config from "../config/config.js";

let io;

const CHAT_MUTE_MS = 10_000;
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
],
set = new Set();

function startTurnTImer(roomID) {
    const room = rooms[roomID];
    let randomWord = getRandomWord();

    if(!room) return;
    
    if(room.intervalID) clearInterval(room.intervalID);

    if (!room || room.players.length < 1) {
        clearInterval(room?.intervalId);
        return;
    }

    const randomIndex = Math.floor(Math.random() * room.players.length);
    room.currentDrawer = room.players[randomIndex];
    room.currentWord = randomWord;
    room.correctGuessers = [];


    io.to(roomID).emit("room-update", room);

    room.intervalID = setInterval(() => {
        
        console.log("In Loop");
        randomWord = getRandomWord();
        room.currentWord = randomWord;
        room.correctGuessers = [];
        if (!room || room.players.length < 1) {
            clearInterval(room?.intervalId);
            return;
        }

        const randomIndex = Math.floor(Math.random() * room.players.length);
        room.currentDrawer = room.players[randomIndex];

        console.log(room);
        

        io.to(roomID).emit("room-update", room);

    },  3 * 60* 1000);
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
            // while(true) {
                let roomID = Math.floor(Math.random() * 999999);
                const room = rooms.find(room => room?.players.length < 7);

                if (room) {
                    room.players.push({id: socket.id, name : username});
                    roomID = rooms.indexOf(room);
                }
                else if(!rooms[roomID]) {
                    rooms[roomID] = { players : [], currentDrawer : null, currentWord: null, correctGuessers: [], intervalId : null };
                    rooms[roomID].players.push({id: socket.id, name : username});
                }

                socket.emit("room-created", { roomID, name : username });

            // }
        });

        socket.on("join-room", ({ roomID, name }) => {
            socket.join(roomID)

            rooms[roomID] ??= { players : [], currentDrawer : null, correctGuessers: [], intervalId : null };     //Simply rooms[roomID] = rooms[roomID] ?? { players : [], currentDrawerId : null }
            //room[roomID] = rooms[ID] if some value OR this { players : [], currentDrawerId : null };  


            if(!set.has(socket.id)) 
            rooms[roomID].players.push({id: socket.id, name : name});
            
            set.add(socket.id);
        
            startTurnTImer(roomID);
        });

        socket.on("draw", ({ roomId, x, y, color, size }) => {
            // if(!rooms[roomId] ) return;
            if(!rooms[roomId] || rooms[roomId]?.currentDrawer.id !== socket.id) return;
        
            socket.to(roomId).emit("draw", {x, y, color, size});
        });

        socket.on("chat-message", ({roomId, text}) => {
            if(!rooms[roomId]) return;

            let mutedUntil;

            const player = rooms[roomId].players.find(p => p.id === socket.id);
            
            if (!player) {
                console.log(`Room or player not found for ID: ${roomId}`);
                return; 
            }else if(player.id == rooms[roomId].currentDrawer.id) {
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
                io.to(roomId).emit("correct-guess", {
                    username: player.name,
                    playerId: player.id,
                    word: room.currentWord
                });
                socket.emit("chat-muted", { durationMs: CHAT_MUTE_MS });
                return;
            }

            io.to(roomId).emit("chat-message", message);
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

                if (room.currentDrawerId === socket.id) {
                    room.currentDrawerId = room.players[0].id;
                }

                io.to(roomId).emit("room-update", room);

                console.log(`User Disconnected ${socket.id}`);
            }
        });
    });
}

export default initServer;