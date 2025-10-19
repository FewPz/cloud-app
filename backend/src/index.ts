import { Elysia } from "elysia";
import { node } from "@elysiajs/node";

const app = new Elysia({ adapter: node() })
  .ws("/ws", {
    message(ws, message) {
      ws.send(message);
    },
  })
  .get("/", () => "Hello Elysia")
  .listen(3000, ({ hostname, port }) => {
    console.log(`🦊 Elysia is running at ${hostname}:${port}`);
  });
