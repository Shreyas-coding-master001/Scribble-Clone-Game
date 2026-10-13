import React, { useEffect, useRef } from 'react';
import './Draw.scss';
import {socket} from "../../API/socket.io.js";
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import useContext from "../../hooks/useContext.js";

const Draw = ({roomId="1233456"}) => {
    const {username} = useContext();
    const location = useLocation();
    const activeRoomId = location.state?.roomID ?? roomId;

    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const isDrawing = useRef(false);
    const paintSize = useRef(10);
    const paintColor = useRef("white");
    const isEraser = useRef(false);
    const chatMessagesRef = useRef(null);
    const chatMuteTimeoutRef = useRef(null);
    
    const [players, setPlayers] = useState([]);
    const [correctGuessers, setCorrectGuessers] = useState(new Set());
    const [currentDrawer, setCurrentDrawer] = useState({});
    const [messages, setMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [chatMuted, setChatMuted] = useState(false);
    const [currentWord, setCurrentWord] = useState("");
    const [maskedWord, setMaskedWord] = useState("");
    const [roundEndsAt, setRoundEndsAt] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [joinError, setJoinError] = useState("");

    const isMyTurn = currentDrawer?.id === socket.id;

    const handleNewMessage = (message) =>  {
      setMessages((prev) => [...prev, message]);      
    }

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
        const handleRoomJoinError = ({ message }) => setJoinError(message);

        socket.on("connect", () => {
          console.log(`User Connected to Socket`);
        });

        socket.on("chat-messages", handleNewMessage);

        socket.on("correct-guess", ({ playerId }) => {
            setCorrectGuessers((prev) => new Set(prev).add(playerId));
        });

        socket.on("chat-muted", ({ durationMs, remainingMs }) => {
            window.clearTimeout(chatMuteTimeoutRef.current);
            setChatMuted(true);
            chatMuteTimeoutRef.current = window.setTimeout(
                () => setChatMuted(false),
                remainingMs ?? durationMs
            );
        });

        socket.on('room-update', (room) => {
            setPlayers(room.players);
            setCorrectGuessers(new Set(room.correctGuessers || []));
            setCurrentDrawer(room.currentDrawer);
            setMaskedWord(room.currentWord ? room.currentWord.replace(/./g, '_') : "");
            setCurrentWord(room.currentWord || "");
            setRoundEndsAt(room.roundEndsAt || null);
        });

        socket.on('draw', ({ x, y, color, size, isEraser: remoteIsEraser }) => {
            drawDot(x, y, color, size, remoteIsEraser);
        });
        socket.on("room-join-error", handleRoomJoinError);

        socket.on("drawerChanged", (drawer) => setCurrentDrawer(drawer));
        socket.on("wordToGuess", (word) => setCurrentWord(word));
        socket.on("wordHint", (hint) => setMaskedWord(hint));

        socket.emit("join-room", { roomID: activeRoomId, name: username });

        return () => {
          socket.off('connect');
          socket.off('room-update');
          socket.off('draw');
          socket.off('chat-message');
          socket.off('correct-guess');
          socket.off('chat-muted');
          socket.off("drawerChanged");
          socket.off("wordToGuess");
          socket.off("wordHint");
          socket.off("room-join-error", handleRoomJoinError);
          socket.off('clear');
          window.clearTimeout(chatMuteTimeoutRef.current);

          // socket.disconnect();
        };
    }, [activeRoomId, username]);

    useEffect(() => {
        if (!roundEndsAt) {
            setTimeLeft(0);
            return;
        }

        const updateTimeLeft = () => {
            setTimeLeft(Math.max(0, Math.ceil((roundEndsAt - Date.now()) / 1000)));
        };
        updateTimeLeft();
        const timer = window.setInterval(updateTimeLeft, 1000);
        return () => window.clearInterval(timer);
    }, [roundEndsAt]);

    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }

        console.log(messages);
        
    }, [messages]);

    // shared drawing logic used for both local + remote strokes
    function drawDot(xRatio, yRatio, color, size, erase = false) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = xRatio * rect.width;
        const y = yRatio * rect.height;

        ctx.beginPath();
        ctx.globalCompositeOperation = erase ? 'destination-out' : 'source-over';
        ctx.fillStyle = color ?? paintColor.current;
        ctx.arc(x, y, size ?? paintSize.current, 0, Math.PI * 2, true);
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

        drawDot(xRatio, yRatio, paintColor.current, paintSize.current, isEraser.current);
        
        socket.emit("draw", {
          roomId: activeRoomId,
          x: xRatio, 
          y: yRatio, 
          color: paintColor.current, 
          size: paintSize.current,
          isEraser: isEraser.current
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
      isEraser.current = false;
      if(classNames[1] === "green"){
        paintColor.current = "rgb(0, 183, 0)";
      }else if(classNames[1] === "light-blue"){
        paintColor.current = "rgb(0, 128, 255)";
      } else{
        paintColor.current = classNames[1];  
      }
    }

    function SelectEraser() {
      if (!isMyTurn) return;
      isEraser.current = true;
    }

    const formattedTime = `${Math.floor(timeLeft / 60)
      .toString()
      .padStart(2, "0")}:${(timeLeft % 60).toString().padStart(2, "0")}`;

    function handleSendMessage(e) {
        e.preventDefault();
        if (chatMuted || !chatInput.trim()) return;

        console.log(`Message sent to Backend: ${activeRoomId}, ${chatInput.trim()}`);
        
        socket.emit("chat-message", { roomId: activeRoomId, text: chatInput.trim() });
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
                    <div className={`player${correctGuessers.has(player.id) ? " correct-guesser" : ""}`} key={player.id || idx}>
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
              <div className="room-round-info">
                <span className="room-code">Room: {activeRoomId}</span>
                <span className="round-timer" aria-label={`Time remaining ${formattedTime}`}>
                  {formattedTime}
                </span>
              </div>
              {joinError && <p className="room-join-error" role="alert">{joinError}</p>}
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
              <button className="eraser-tool" type="button" onClick={SelectEraser}>
                Eraser
              </button>
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
                placeholder={chatMuted ? "Chat locked briefly after a correct guess" : "Type a guess or message..."}
                value={chatInput}
                disabled={chatMuted}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button type="submit" disabled={chatMuted}>Send</button>
            </form>
          </div>
        </div>
    );
};

export default Draw;
