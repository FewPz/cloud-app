import { Elysia, t } from "elysia";
import { RoomModel } from "./model";
import { auth } from "../auth";
import { createRoom, getRoom, joinRoom, leaveRoom, setRoom, startGame } from "./query";
import { getUserByUUID } from "../auth/query";

let countdowns: Record<string, NodeJS.Timeout> = {};

export const RoomRoute = new Elysia({ prefix: "/room" })
  .use(RoomModel)
  .use(auth)
  .derive(async ({ request, jwt }) => {
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return { user: null };
    }
    const payload = await jwt.verify(token);
    if (!payload) {
      return { user: null };
    }
    const { Item } = await getUserByUUID(payload.uuid);
    if (!Item || !Item.id?.S || !Item.username?.S) {
      return { user: null };
    }
    return {
      user: {
        id: Item.id.S,
        name: Item.username.S,
      },
    };
  })
  .post(
    "/",
    async ({ body, user }) => {
      if (!user) {
        throw new Error("Unauthorized");
      }
      const room = await createRoom(user.id, body.minPlayer);
      return room;
    },
    {
      body: t.Object({
        minPlayer: t.Numeric(),
      }),
    }
  )
  .ws("/:id", {
    headers: t.Object({
      'sec-websocket-protocol': t.Optional(t.String()),
    }),
    async open(ws) {
      try {
        const { id } = ws.data.params;
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

        const { Item } = await getUserByUUID(payload.uuid);
        if (!Item || !Item.id?.S || !Item.username?.S) {
          ws.close(1008, "User not found");
          return;
        }

        const user = { id: Item.id.S, name: Item.username.S };

        await joinRoom(id, user.id);
        const room = await getRoom(id);

        ws.subscribe(`room:${id}`);
        
        // Send initial room state to the connecting user
        ws.send(JSON.stringify({
          type: "room_update",
          room,
          message: `Connected to room`,
        }));
        
        // Check if room is full and start countdown
        if (room && room.players.length >= room.minPlayer && room.status === "waiting") {
          await startGame(id);
          let countdown = 5;
          
          if (countdowns[id]) {
            clearInterval(countdowns[id]);
          }
          
          countdowns[id] = setInterval(() => {
            ws.publish(
              `room:${id}`,
              JSON.stringify({ 
                type: "countdown", 
                countdown, 
                message: `Game starting in ${countdown} seconds` 
              })
            );
            countdown--;
            if (countdown < 0) {
              clearInterval(countdowns[id]);
              delete countdowns[id];
              ws.publish(
                `room:${id}`, 
                JSON.stringify({ type: "game_start", message: "Game started!" })
              );
            }
          }, 1000);
        }

        // Notify other users about the new player
        ws.publish(
          `room:${id}`,
          JSON.stringify({
            type: "room_update",
            room,
            message: `${user.name} joined the room`,
          })
        );
      } catch (error) {
        console.error("WebSocket open error:", error);
        ws.close(1011, "Internal error");
      }
    },
    async close(ws) {
      try {
        const { id } = ws.data.params;
        const protocol = ws.data.headers['sec-websocket-protocol'];
        if (!protocol) return;

        const token = protocol.split(",").map(s => s.trim())[1];
        if (!token) return;

        const payload = await ws.data.jwt.verify(token.replace("Bearer ", ""));
        if (!payload) return;

        const { Item } = await getUserByUUID(payload.uuid);
        if (!Item || !Item.id?.S || !Item.username?.S) return;

        const user = { id: Item.id.S, name: Item.username.S };

        await leaveRoom(id, user.id);
        const room = await getRoom(id);
        
        ws.unsubscribe(`room:${id}`);
        ws.publish(
          `room:${id}`,
          JSON.stringify({
            type: "room_update",
            room,
            message: `${user.name} left the room`,
          })
        );
      } catch (error) {
        console.error("WebSocket close error:", error);
      }
    },
    async message(ws, message) {
      try {
        const { id } = ws.data.params;
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

        const { Item } = await getUserByUUID(payload.uuid);
        if (!Item || !Item.id?.S || !Item.username?.S) {
          ws.close(1008, "User not found");
          return;
        }

        const user = { id: Item.id.S, name: Item.username.S };
        const room = await getRoom(id);
        
        if (room?.hostId !== user.id) {
          ws.send(JSON.stringify({ type: "error", message: "You are not the host" }));
          return;
        }

        if (typeof message !== "object" || message === null) {
          ws.send(JSON.stringify({ type: "error", message: "Invalid message" }));
          return;
        }

        if ("minPlayer" in message) {
          const { minPlayer } = message as { minPlayer: number };
          await setRoom(id, { minPlayer });
          const updatedRoom = await getRoom(id);
          
          // Send to the host who made the change
          ws.send(JSON.stringify({
            type: "room_update",
            room: updatedRoom,
            message: `Minimum players set to ${minPlayer}`,
          }));
          
          // Notify other users in the room
          ws.publish(
            `room:${id}`,
            JSON.stringify({
              type: "room_update",
              room: updatedRoom,
              message: `Host set minimum players to ${minPlayer}`,
            })
          );
        }

        if ("start" in message) {
          const room = await getRoom(id);
          if (room && room.players.length >= room.minPlayer && room.status === "waiting") {
            await startGame(id);
            let countdown = 5;
            
            if (countdowns[id]) {
              clearInterval(countdowns[id]);
            }
            
            countdowns[id] = setInterval(() => {
              ws.publish(
                `room:${id}`,
                JSON.stringify({ 
                  type: "countdown", 
                  countdown, 
                  message: `Game starting in ${countdown} seconds` 
                })
              );
              countdown--;
              if (countdown < 0) {
                clearInterval(countdowns[id]);
                delete countdowns[id];
                ws.publish(
                  `room:${id}`, 
                  JSON.stringify({ type: "game_start", message: "Game started!" })
                );
              }
            }, 1000);
          } else {
            ws.send(JSON.stringify({ 
              type: "error", 
              message: "Cannot start game: not enough players or game already started" 
            }));
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(JSON.stringify({ type: "error", message: "Internal error" }));
      }
    },
    body: t.Union([
      t.Object({ minPlayer: t.Number() }),
      t.Object({ start: t.Boolean() }),
    ]),
  });
