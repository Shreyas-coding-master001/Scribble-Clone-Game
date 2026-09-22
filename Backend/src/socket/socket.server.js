import { Server } from "socket.io";
import config from "../config/config.js";

let io;

const rooms = [],
words = [
  "apple", "banana", "guitar", "elephant", "mountain",
  "rainbow", "bicycle", "castle", "dragon", "umbrella",
  "volcano", "penguin", "rocket", "sandwich", "tiger",
  "waterfall", "butterfly", "telescope", "pyramid", "octopus",
  "snowman", "lighthouse", "cactus", "dolphin", "kangaroo",
  "helicopter", "campfire", "spider", "windmill", "jellyfish",
  "skateboard", "volcano2", "trumpet", "pineapple", "scarecrow",
  "compass", "hedgehog", "parachute", "flamingo", "chandelier",
  "submarine", "cupcake", "cheetah", "hammer", "igloo",
  "jacket", "kite", "lantern", "mushroom", "necklace"
],
set = new Set();

function startTurnTImer(roomID) {
    const room = rooms[roomID];

    
    if(!room) return;
    
    if(room.intervalID) clearInterval(room.intervalID);

    if (!room || room.players.length < 1) {
        clearInterval(room?.intervalId);
        return;
    }

    const randomIndex = Math.floor(Math.random() * room.players.length);
    room.currentDrawer = room.players[randomIndex];

    io.to(roomID).emit("room-update", room);

    room.intervalID = setInterval(() => {
        
        console.log("In Loop");
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

        socket.on("create-room", () => {
            while(true) {
                const roomID = Math.floor(Math.random() * 999999);
                
                if(!rooms[roomID]) {
                    rooms[roomID] = { players : [], currentDrawer : null, intervalId : null };

                    rooms[roomID].players.push({id: socket.id, name : name});
                }

            }
        });

        socket.on("join-room", ({ roomID, name }) => {
            socket.join(roomID)

            rooms[roomID] ??= { players : [], currentDrawer : null, intervalId : null };     //Simply rooms[roomID] = rooms[roomID] ?? { players : [], currentDrawerId : null }
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
            
            
            console.log("In Chat-messages");
            const player = rooms[roomId].players.find(p => p.id === socket.id);
            if (!player) {
                // Optional: Handle the case where the player or room wasn't found
                console.log(`Room or player not found for ID: ${roomId}`);
                return; 
            }

            const message = { username: player?.name || "Unknown", text: text };

            console.log(message);
            

            io.to(roomId).emit("chat-message", message);
        });

        socket.on("disconnect", () => {
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