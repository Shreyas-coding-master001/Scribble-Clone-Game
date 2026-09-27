# Skribble Drawing Game

A multiplayer drawing-and-guessing game prototype built with React and Socket.IO. Players can draw on a shared canvas, choose a brush color, and exchange chat messages in a room. The project is under active development; room creation and the home-page game actions are not fully wired up yet.

## Technology

- Frontend: React 19, Vite, React Router, and Sass
- Backend: Node.js, Express, and Socket.IO
- Realtime events: Socket.IO

## Project Structure

```text
Backend/
	server.js                 HTTP and Socket.IO server entry point
	src/app.js                Express app and health endpoint
	src/config/config.js      Environment-based server configuration
	src/socket/socket.server.js
														Room, drawing, and chat event handlers
Frontend/
	src/Features/Home/        Nickname and landing screen
	src/Features/Play/        Drawing canvas, player list, and chat
	src/API/                  Backend and Socket.IO client setup
```

## Requirements

- Node.js 20 or newer
- npm

## Run Locally

Install dependencies in both applications:

```bash
cd Backend
npm install
cd ../Frontend
npm install
```

Create `Backend/.env` with the backend port and the frontend origin:

```env
PORT=3000
frontend_URL=http://localhost:5173
```

Start the backend in one terminal:

```bash
cd Backend
npm run dev
```

Start the Vite development server in a second terminal:

```bash
cd Frontend
npm run dev
```

Open <http://localhost:5173>. The backend health endpoint is available at <http://localhost:3000/>.

## Frontend Checks

Run these from `Frontend/`:

```bash
npm run lint
npm run build
```

## Current Development Status

- The home screen accepts a nickname, but its Play and Create Private Room buttons are placeholders and do not yet create or join rooms.
- The play screen currently defaults to a fixed room ID; room selection and navigation are not connected to the home screen.
- The backend has Socket.IO handlers for joining rooms, drawing, and chat, but room creation and a complete round/guessing flow are unfinished.
- The backend currently allows the local Vite origin (`http://localhost:5173`) and the optional `frontend_URL` origin through Socket.IO CORS. Update the backend CORS configuration as well if you host the frontend elsewhere.

## License

No project license has been specified yet.
