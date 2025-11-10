import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { cors } from "@elysiajs/cors";
import { openapi } from '@elysiajs/openapi';
import { Elysia, t } from "elysia";
import { auth, JwtService } from "./auth/index.js";
import { db } from "./database.js";
import { WSParamsType, WSType } from "./model.js";
import { user } from "./user/index.js";
import { wallet } from "./wallet/index.js";
import { game } from "./game/index.js";
import { addUserToGameRoom, getGameByRoomCode, getGameRoomById } from "./game/query.js";
import { jwt } from "@elysiajs/jwt";
import { RoomRoute } from "./room";
import { logger } from '@grotto/logysia';

new Elysia()
  .use(cors())
  .use(openapi())
  .use(logger({
    logIP: false,
    writer: {
      write(msg: string) {
        console.log(msg)
      }
    }
  }))
  .use(auth)
  .use(user)
  .use(wallet)
  .use(game)
  .use(RoomRoute)
  .use(JwtService)
  .ws("/ws/games/:id", {
    body: WSType,
    params: WSParamsType,
    headers: t.Object({
      'sec-websocket-protocol': t.Optional(t.String()),
    }),
    async open(ws) {
      try {
        const protocol = ws.data.headers['sec-websocket-protocol'];
        if (!protocol) {
          ws.close(1008, "Unauthorized");
          return;
        }

        const token = protocol.split(",").map(s => s.trim())[1];
        if (!token) {
          ws.close(1008, "Unauthorized");
          return;
        }

        const payload = await ws.data.jwt.verify(token.replace("Bearer ", ""));
        if (!payload) {
          ws.close(1008, "Invalid token");
          return;
        }

        const id = ws.data.params.id;

        const { Item } = await getGameRoomById(id);
        if (!Item) {
          // either just close:
          ws.send({ type: "error", payload: { message: "Game room not found" } });
          ws.close(1000, "Game room not found");
          return;
        }

        const result = await addUserToGameRoom(id, payload.uuid);
        if (!result) {
          ws.send({ type: "error", payload: { message: "Failed to join game room" } });
          ws.close(1000, "Failed to join game room");
          return;
        }

        ws.send({ type: "lobby", payload: { message: `Connected to game room ${id}` } });
      } catch (err) {
        console.error(err);
        ws.send({ type: "error", payload: { message: "Internal error" } });
        ws.close(1011, "Internal error");
      }
    },
    async message(ws, { type, payload }) {
      ws.send({ type, payload });
    },
  })
  .onError(({ error, code }) => {
    console.error(`Error occurred with code ${code}:`, error);
  })
  .get("/", () => "Hello Elysia")
  .listen(4000, ({ hostname, port }) => {
    console.log(`🦊 Elysia is running at http://${hostname}:${port}`);
  });
