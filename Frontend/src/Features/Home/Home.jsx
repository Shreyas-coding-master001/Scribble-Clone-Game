import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { BsPencilFill } from "react-icons/bs";
import useContext from "../../hooks/useContext.js";
import "./Home.scss";
import { socket } from '../../API/socket.io.js';

const Home = () => {
  const { username, setUsername } = useContext();
  const navigate = useNavigate();
  const [isPrivateModalOpen, setIsPrivateModalOpen] = useState(false);
  const [privateRoomID, setPrivateRoomID] = useState("");
  const [privateRoomError, setPrivateRoomError] = useState("");

  const openPrivateRoomModal = () => {
    setPrivateRoomError("");
    setIsPrivateModalOpen(true);
  };

  const navigateToRoom = ({ roomID, name }) => {
    navigate("/play", { state: { username: name, roomID } });
  };

  const listenForPrivateRoomResult = (eventName) => {
    const handleSuccess = ({ roomID, username: roomUsername }) => {
      socket.off("private-room-error", handleError);
      navigateToRoom({ roomID, name: roomUsername });
    };
    const handleError = ({ message }) => {
      socket.off(eventName, handleSuccess);
      setPrivateRoomError(message);
    };

    socket.once(eventName, handleSuccess);
    socket.once("private-room-error", handleError);
  };

  const handlePlay = () => {
    if (!username.trim()) {
      alert("Please enter a nickname before joining a public room.");
      return;
    }

    socket.once("room-created", ({ roomID, name }) => {
      navigateToRoom({ roomID, name });
    });
    socket.emit("create-room", { username: username.trim() });
  };
 
  const handleCreatePrivateRoom = () => {
    if (!username.trim()) {
      setPrivateRoomError("Please enter a nickname before creating a private room.");
      return;
    }

    setPrivateRoomError("");
    listenForPrivateRoomResult("private-room-created");
    socket.emit("create-private-room", { username: username.trim() });
  };

  const handleJoinPrivateRoom = (event) => {
    event.preventDefault();
    if (!username.trim()) {
      setPrivateRoomError("Please enter a nickname before joining a private room.");
      return;
    }
    if (!privateRoomID.trim()) {
      setPrivateRoomError("Enter a room code to join.");
      return;
    }

    setPrivateRoomError("");
    listenForPrivateRoomResult("private-room-joined");
    socket.emit("join-private-room", {
      roomID: privateRoomID.trim(),
      username: username.trim()
    });
  };
 
  return (
    <div className="landing-page">
      <div className="start-playing">
        <div className="header">
          <h1>
            skribble.io Clone{" "}
            <span>
              <BsPencilFill />
            </span>
          </h1>
          <p className="tagline">Draw. Guess. Laugh. Repeat.</p>
        </div>
 
        <div className="take-input">
          <input
            type="text"
            placeholder="Enter your nickname"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={16}
          />
 
          <div className="btn-group">
            <button className="btn btn-play" onClick={handlePlay}>
              Play
            </button>
            <button
              className="btn btn-private"
              onClick={openPrivateRoomModal}
            >
              Private Room
            </button>
          </div>
        </div>
      </div>

      {isPrivateModalOpen && (
        <div className="private-room-overlay" onClick={() => setIsPrivateModalOpen(false)}>
          <section
            className="private-room-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="private-room-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="private-room-close"
              type="button"
              aria-label="Close private room dialog"
              onClick={() => setIsPrivateModalOpen(false)}
            >
              ×
            </button>
            <h2 id="private-room-title">Private Room</h2>
            <p>Create a room and share its code, or join a friend's room.</p>
            <button
              className="btn btn-create-room"
              type="button"
              onClick={handleCreatePrivateRoom}
            >
              Create Room
            </button>
            <form className="join-private-room-form" onSubmit={handleJoinPrivateRoom}>
              <label htmlFor="private-room-code">Join with room code</label>
              <input
                id="private-room-code"
                type="text"
                inputMode="numeric"
                placeholder="Enter room code"
                value={privateRoomID}
                onChange={(event) => setPrivateRoomID(event.target.value)}
              />
              <button className="btn btn-join-room" type="submit">
                Join Room
              </button>
            </form>
            {privateRoomError && <p className="private-room-error" role="alert">{privateRoomError}</p>}
          </section>
        </div>
      )}
 
      <div className="Information">
        <div className="section">
          <h2>About</h2>
          <p>
            skribble.io Clone is a free multiplayer drawing and guessing game.
            Jump into a public room to play with random players around the
            world, or create a private room and invite your friends for a
            round of doodles and laughs.
          </p>
        </div>
        <div className="section">
          <h2>News</h2>
          <p>
            🎨 New brush sizes and colors added! We're also working on custom
            word packs and mobile drawing support — stay tuned for upcoming
            updates.
          </p>
        </div>
        <div className="section">
          <h2>How to Play</h2>
          <p>
            Each round, one player is chosen to draw a secret word while
            everyone else tries to guess it in the chat. Guess correctly to
            earn points — the faster you guess, the more points you get. Take
            turns drawing and see who tops the leaderboard!
          </p>
        </div>
      </div>
    </div>
  )
}

export default Home;
