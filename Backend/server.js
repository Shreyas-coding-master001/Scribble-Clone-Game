import app from "./src/app.js";
import { createServer } from "node:http"
import initServer from "./src/socket/socket.server.js";
import config from "./src/config/config.js";

const httpServer = createServer(app);

initServer(httpServer);

httpServer.listen(config.port, () => {console.log(`Server is Running on port ${config.port}`)});