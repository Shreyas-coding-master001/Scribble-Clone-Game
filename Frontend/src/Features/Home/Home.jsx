import React,{useEffect, useState} from 'react'
import { BsPencilFill } from "react-icons/bs";
import useContext from "../../hooks/useContext.js";
import "./Home.scss";
import { socket } from '../../API/socket.io.js';

const Home = () => {
  const { username, setUsername } = useContext();

  useEffect(() => {
    
  }, []);

  const handlePlay = () => {
    if (!username.trim()) return;
    // TODO: hook this up to your join-public-room logic / socket call
    console.log("Joining public room as:", username);
  };
 
  const handleCreatePrivateRoom = () => {
    if (!username.trim()) return;
    // TODO: hook this up to your create-private-room logic / socket call
    console.log("Creating private room as:", username);
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
              onClick={handleCreatePrivateRoom}
            >
              Create Private Room
            </button>
          </div>
        </div>
      </div>
 
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
