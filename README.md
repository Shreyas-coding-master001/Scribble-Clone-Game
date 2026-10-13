# Scribble Clone Game

A multiplayer drawing-and-guessing game inspired by classic browser-based party games. This project combines a React frontend with a Node.js + Socket.IO backend to let players join rooms, draw on a shared canvas, and chat while trying to guess the word.

## Features

- Player nickname flow on the landing screen
- Public room creation and room joining
- Private room creation and join flow
- Shared whiteboard drawing with brush color and eraser support
- Real-time chat with guess interactions
- Basic room state syncing for players, drawers, and round data
- Responsive single-page frontend built with Vite + React

## Tech Stack

- Frontend: React 19, Vite, React Router, Sass
- Backend: Node.js, Express, Socket.IO
- Realtime communication: Socket.IO
- Environment configuration: dotenv

## Project Structure

```text
Drawing-Project/
├── Backend/
│   ├── server.js                    # Socket.IO and HTTP server startup
│   ├── src/
│   │   ├── app.js                  # Express app + health route
│   │   ├── config/
│   │   │   └── config.js           # Environment configuration
│   │   └── socket/
│   │       └── socket.server.js    # Room, drawing, and chat logic
│   ├── .env                        # Local backend environment variables
│   ├── package.json
│   └── package-lock.json
├── Frontend/
│   ├── src/
│   │   ├── Features/
│   │   │   ├── Home/
│   │   │   └── Play/
│   │   ├── API/
│   │   ├── Routes/
│   │   ├── hooks/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── README.md
├── ReadMe.md
└── .gitignore
```

## Requirements

- Node.js 20+
- npm

## Local Setup

1. Clone the repository and open it in your terminal.
2. Install dependencies for both apps:

```bash
cd Backend
npm install

cd ../Frontend
npm install
```

3. Create a `.env` file in the `Backend` directory:

```env
PORT=3000
frontend_URL=http://localhost:5173
```

## Run the App

Start the backend in one terminal:

```bash
cd Backend
npm run dev
```

Start the frontend in a second terminal:

```bash
cd Frontend
npm run dev
```

Then open:

- Frontend: http://localhost:5173
- Backend health check: http://localhost:3000/

## Useful Commands

From the `Frontend` directory:

```bash
npm run dev
npm run build
npm run lint
```

## Current Status

This project is currently in an early prototype stage. Core gameplay pieces are in place, but some flows are still incomplete or placeholder-based, including:

- room creation and join flows may still be in progress
- the app currently relies on a default room ID in some areas
- additional game-state logic, round progression, and full multiplayer polish are still being developed

## Notes

- The backend is configured to allow the local Vite app origin (`http://localhost:5173`) and any value provided in `frontend_URL`.
- If you host the frontend elsewhere, update the CORS configuration in `Backend/src/app.js` accordingly.

## License

No project license has been specified yet.
