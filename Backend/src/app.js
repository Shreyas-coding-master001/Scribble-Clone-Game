import express from "express";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors({
    origin : ["http://localhost:5173"],
    credentials: true
}))

app.get("/", (req, res) => {
    res.status(200).json({
        Success : true,
        message : "Server is Running On Port 3000",
        Last_Visit: new Date(),
        Description: "This is my Skribble Game, Backend Created to Learn Socket.IO Completely."
    });
});

export default app;