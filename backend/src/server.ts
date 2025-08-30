import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";


import taskRoutes from "./routes/tasks.js";
import { registerAutomationSocket } from "./sockets/automationSocket.js";

dotenv.config();
console.log("API Key loaded:", process.env.OPENAI_API_KEY ? "✅ found" : "❌ missing");


const app = express();
app.use(express.json());

// REST routes
app.use("/api/tasks", taskRoutes);

const server = createServer(app);

// WebSocket for live automation
const wss = new WebSocketServer({ server });
wss.on("connection", (ws) => {
  console.log("Client connected via WS");
  registerAutomationSocket(ws);
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
