import type WebSocket from "ws";
import { runTask } from "../services/cuaLoop.js";

export function registerAutomationSocket(ws: WebSocket) {
  ws.on("message", async (msg: WebSocket.RawData) => {
    try {
      const { type, task } = JSON.parse(msg.toString());

      if (type === "run") {
        await runTask(task, (update) => {
          ws.send(JSON.stringify(update));
        });
      }

      if (type === "stop") {
        // TODO: track sessions and close browser
        ws.send(JSON.stringify({ type: "stopped" }));
      }
    } catch (err) {
      console.error("WS error:", err);
      ws.send(JSON.stringify({ type: "error", data: String(err) }));
    }
  });
}
