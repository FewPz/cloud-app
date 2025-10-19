import { Elysia, t } from "elysia";
import { node } from "@elysiajs/node";
import { wallet } from "./route/wallet.js";

new Elysia({ adapter: node() })
  .use(wallet)
  .ws("/ws", {
    body: t.Object({
      type: t.String(),
      payload: t.Optional(t.Any()),
    }),
    message(ws, { type, payload }) {
      console.log("Received:", payload);
      ws.send(payload);
    },
  })
  .get("/", () => "Hello Elysia")
  .listen(4000, ({ hostname, port }) => {
    console.log(`🦊 Elysia is running at ${hostname}:${port}`);
  });
