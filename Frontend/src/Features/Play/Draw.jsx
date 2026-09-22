import React, { useEffect, useRef } from 'react';
import { io } from "socket.io-client";
import './Draw.scss';
import { backend_url } from '../../API/backend.api';
import { useState } from 'react';

const socket = io(backend_url);

const Draw = ({roomId="1233456", username="Unknown"}) => {

    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const isDrawing = useRef(false);
    const paintSize = useRef(10);
    const paintColor = useRef("white");
    const chatMessagesRef = useRef(null);
    
    const [players, setPlayers] = useState([]);
    const [currentDrawer, setCurrentDrawer] = useState({});
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [currentWord, setCurrentWord] = useState("");
    const [maskedWord, setMaskedWord] = useState("");

    const isMyTurn = currentDrawer?.id === socket.id;

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;

        if (!canvas || !container) return;

        const resizeCanvas = () => {
            const rect = container.getBoundingClientRect();
            const ratio = window.devicePixelRatio || 1;
            const width = Math.max(1, Math.floor(rect.width));
            const height = Math.max(1, Math.floor(rect.height));

            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            canvas.width = width * ratio;
            canvas.height = height * ratio;

            const ctx = canvas.getContext('2d');
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        };

        resizeCanvas();
        const observer = new ResizeObserver(resizeCanvas);
        observer.observe(container);

        window.addEventListener('resize', resizeCanvas);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', resizeCanvas);
        };

    }, []);

    //Socket.io ID
    useEffect(() => {
        socket.on("connect", () => {
          console.log(`User Connected to Socket`);
        });

        socket.emit("join-room", { roomID: roomId, name: username });

        socket.on("chat-message", (message) =>  {
          setMessages((prev) => [...prev, message]);
        });

        socket.on('room-update', (room) => {
            setPlayers(room.players);
            setCurrentDrawer(room.currentDrawer);

            console.log(room);
        });

        socket.on('draw', ({ x, y, color, size }) => {
            drawDot(x, y, color, size);
        });

        socket.on("drawerChanged", (drawer) => setCurrentDrawer(drawer));
        socket.on("wordToGuess", (word) => setCurrentWord(word));
        socket.on("wordHint", (hint) => setMaskedWord(hint));

        return () => {
          socket.off('connect');
          socket.off('room-update');
          socket.off('draw');
          socket.off('chat-message');
          socket.off("drawerChanged");
          socket.off("wordToGuess");
          socket.off("wordHint");
          socket.off('clear');

          // socket.disconnect();
        };
    }, [roomId, username]);

    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }

        console.log(messages);
        
    }, [messages]);

    // shared drawing logic used for both local + remote strokes
    function drawDot(xRatio, yRatio, color, size) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = xRatio * rect.width;
        const y = yRatio * rect.height;

        ctx.beginPath();
        ctx.fillStyle =  color ?? paintColor.current;
        ctx.arc(x, y, paintSize.current, 0, Math.PI * 2, true);
        ctx.fill();
    }
    
    function DrawOnPixel(event) {
        if (!isDrawing.current) return;
        if (!isMyTurn) return;
       
        const canvas = canvasRef.current;
        if (!canvas) return;

        const board = canvas.getBoundingClientRect();
        const x = event.clientX - board.left;
        const y = event.clientY - board.top;
        const xRatio = x / board.width;
        const yRatio = y / board.height;

        drawDot(xRatio, yRatio, paintColor.current, Math.PI * 2);
        
        console.log("Above Draw");
        
        socket.emit("draw", {
          roomId, 
          x: xRatio, 
          y: yRatio, 
          color: paintColor.current, 
          size: Math.PI * 2 
        });
    }

    function StartDrawing(event) {
        if (!isMyTurn) return;
        isDrawing.current = true;
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.setPointerCapture(event.pointerId);
        }

    }

    function StopDrawing(event) {
        isDrawing.current = false;
        const canvas = canvasRef.current;
        if (canvas) {
            try {
                canvas.releasePointerCapture(event.pointerId);
            } catch (error) {
                // ignore if pointer capture is not active
            }
        }
    }

    function ColorSelection(e){
      if (!isMyTurn) return;
      const classNames = e.target.className.split(" ");
      if(classNames[1] === "green"){
        paintColor.current = "rgb(0, 183, 0)";
      }else if(classNames[1] === "light-blue"){
        paintColor.current = "rgb(0, 128, 255)";
      } else{
        paintColor.current = classNames[1];  
      }
    }

    function handleSendMessage(e) {
        e.preventDefault();
        if (!chatInput.trim()) return;

        console.log("Message send to Backend");
        
        socket.emit("chat-message", { roomId, text: chatInput.trim() });
        setChatInput("");
    }

    return (
        <div id="Drawing-area" 
        // width="100vw"
        // height="100vh"
        >
          <div id="Leader-board">
            <h2>Leader Board</h2>
            <br />
            <div className="Players-names">
                {players.map((player, idx) => {
                  return(
                    <div className="player" key={idx}>
                      <div className="left">
                        <div className="profile-photo">
                          <img src="https://ik.imagekit.io/t7oiyoofv/images.jpg?updatedAt=1773596800932" alt="Default image" />
                        </div>
                      </div>
                      <div className="right">      
                        <h3>{player.name}</h3>
                        <h4>Points : 00</h4>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
          
          <div className="board-container"
          ref={containerRef}
          >
            <div id="word-guess">
              {currentDrawer?.id === socket.id ? (
                  <div className="drawer-status you-drawing">
                    You are the Current Drawing Person
                  </div>
                ) : (
                  <div className="drawer-status someone-drawing">
                    <strong>{currentDrawer?.name || "Someone"}</strong> is drawing
                  </div>
                )}

                {currentDrawer?.id === socket.id ? (
                  <div className="word-reveal">
                    Your word: <strong>{currentWord}</strong>
                  </div>
                ) : (
                  <div className="word-hint">
                    Word: <strong>{maskedWord}</strong>
                  </div>
                )}
            </div>
            <canvas
                ref={canvasRef}
                id="board"
                style={{ 
                  pointerEvents: isMyTurn ? 'auto' : 'none',
                  cursor: isMyTurn ? 'crosshair' : 'not-allowed'
                }}
                onPointerDown={StartDrawing}
                onPointerUp={StopDrawing}
                onPointerMove={DrawOnPixel}
                onPointerLeave={StopDrawing}
                onPointerCancel={StopDrawing}
            >
                <h5>
                    <strong>
                        Hello, your browser does not support the HTML5 canvas tag.
                    </strong>{' '}
                    Change to another browser please
                </h5>
            </canvas>
            <div id="paints" style={{ opacity: isMyTurn ? 1 : 0.4, pointerEvents: isMyTurn ? 'auto' : 'none' }}>
              <div className="paint white" onClick={ColorSelection}></div>
              <div className="paint red" onClick={ColorSelection}></div>
              <div className="paint crimson" onClick={ColorSelection} ></div>
              <div className="paint orange" onClick={ColorSelection} ></div>
              <div className="paint yellow" onClick={ColorSelection} ></div>
              <div className="paint green" onClick={ColorSelection} ></div>
              <div className="paint light-blue" onClick={ColorSelection} ></div>
              <div className="paint blue" onClick={ColorSelection} ></div>
              <div className="paint purple" onClick={ColorSelection} ></div>
              <div className="paint gray" onClick={ColorSelection} ></div>
              <div className="paint black" onClick={ColorSelection} ></div>
            </div>
          </div>

          <div className="chat-section">
            <div className="chat-header">
              <h3>Chat</h3>
            </div>

            <div className="chat-messages" ref={chatMessagesRef}>
              {messages.map((msg, index) => (
                <div className="chat-message" key={index}>
                  <span className="chat-username">{msg.username}:</span>
                  <span className="chat-text">{msg.text}</span>
                </div>
              ))}
            </div>

            <form className="chat-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="Type a guess or message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit">Send</button>
            </form>
          </div>
        </div>
    );
};

export default Draw;

// import React, { useEffect, useRef, useState } from 'react';
// import { io } from 'socket.io-client';
// import './Draw.scss';

// const socket = io('http://localhost:3000'); // move to env var in real app

// const Draw = ({ roomId = "123456", userName="Yash" }) => {
//     const canvasRef = useRef(null);
//     const containerRef = useRef(null);
//     const isDrawing = useRef(false);
//     const paintSize = useRef(5);
//     const paintColor = useRef("white");

//     const [players, setPlayers] = useState([]);
//     const [currentDrawerId, setCurrentDrawerId] = useState(null);
//     const myId = useRef(null);

//     const isMyTurn = myId.current && myId.current === currentDrawerId;

//     useEffect(() => {
//         socket.on('connect', () => {
//             myId.current = socket.id;
//             socket.emit('join-room', { roomId, name: userName });
//         });

//         socket.on('room-update', (room) => {
//             setPlayers(room.players);
//             setCurrentDrawerId(room.currentDrawerId);
//         });

//         socket.on('draw', ({ x, y, color, size }) => {
//             drawDot(x, y, color, size);
//         });

//         socket.on('clear', () => {
//             const canvas = canvasRef.current;
//             const ctx = canvas.getContext('2d');
//             ctx.clearRect(0, 0, canvas.width, canvas.height);
//         });

//         return () => {
//             socket.off('connect');
//             socket.off('room-update');
//             socket.off('draw');
//             socket.off('clear');
//         };
//     }, [roomId, userName]);

//     // shared drawing logic used for both local + remote strokes
//     function drawDot(xRatio, yRatio, color, size) {
//         const canvas = canvasRef.current;
//         if (!canvas) return;
//         const ctx = canvas.getContext('2d');
//         const rect = canvas.getBoundingClientRect();
//         const x = xRatio * rect.width;
//         const y = yRatio * rect.height;

//         ctx.beginPath();
//         ctx.fillStyle = color;
//         ctx.arc(x, y, size, 0, Math.PI * 2, true);
//         ctx.fill();
//     }

//     function DrawOnPixel(event) {
//         if (!isDrawing.current || !isMyTurn) return; // gate on turn

//         const canvas = canvasRef.current;
//         const board = canvas.getBoundingClientRect();
//         const x = event.clientX - board.left;
//         const y = event.clientY - board.top;
//         const xRatio = x / board.width;
//         const yRatio = y / board.height;

//         drawDot(xRatio, yRatio, paintColor.current, paintSize.current);

//         socket.emit('draw', {
//             roomId,
//             x: xRatio,
//             y: yRatio,
//             color: paintColor.current,
//             size: paintSize.current,
//         });
//     }

//     function StartDrawing(event) {
//         if (!isMyTurn) return; // block non-drawers from starting a stroke
//         isDrawing.current = true;
//         canvasRef.current?.setPointerCapture(event.pointerId);
//     }

//     function StopDrawing(event) {
//         isDrawing.current = false;
//         try { canvasRef.current?.releasePointerCapture(event.pointerId); } catch {}
//     }

//     // ...rest of your resize/color logic stays the same

//     return (
//         <div id="Drawing-area">
//             {!isMyTurn && (
//                 <div className="spectator-banner">
//                     {players.find(p => p.id === currentDrawerId)?.name || "Someone"} is drawing…
//                 </div>
//             )}
//             <div
//                 className="board-container"
//                 ref={containerRef}
//                 style={{ pointerEvents: isMyTurn ? 'auto' : 'none' }} // extra UX safeguard
//             >
//                 <canvas
//                     ref={canvasRef}
//                     id="board"
//                     onPointerDown={StartDrawing}
//                     onPointerUp={StopDrawing}
//                     onPointerMove={DrawOnPixel}
//                     onPointerLeave={StopDrawing}
//                     onPointerCancel={StopDrawing}
//                 />
//                 {/* paints div etc, maybe also hidden/disabled when !isMyTurn */}
//             </div>
//         </div>
//     );
// };

// export default Draw;