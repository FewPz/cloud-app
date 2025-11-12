import { Elysia, t } from "elysia";
import { RoomModel } from "./model";
import { auth } from "../auth";
import { createRoom, getRoom, getRoomByCode, getRoomWithPlayerDetails, joinRoom, leaveRoom, setRoom, startGame } from "./query";
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
      const room = await createRoom(user.id, body.minPlayer, body.gameType, body.title);
      console.log("Created room:", room);
      return room;
    },
    {
      body: t.Object({
        minPlayer: t.Numeric(),
        gameType: t.Union([
          t.Literal("roll-dice"),
          t.Literal("spin-wheel"),
          t.Literal("match-fixing"),
          t.Literal("vote"),
        ]),
        title: t.Optional(t.String()),
      }),
    }
  )
  .post(
    "/join",
    async ({ body, user }) => {
      if (!user) {
        throw new Error("Unauthorized");
      }
      console.log("Searching for room with code:", body.roomCode);
      const room = await getRoomByCode(body.roomCode);
      console.log("Found room:", room);
      if (!room) {
        throw new Error("Room not found");
      }
      return { message: "Room found", roomId: room.id, roomCode: room.roomCode };
    },
    {
      body: t.Object({
        roomCode: t.String(),
      }),
    }
  )
  .get(
    "/:id",
    async ({ params: { id }, user, status }) => {
      if (!user) {
        return status(401, { message: "Unauthorized" });
      }

      const room = await getRoomWithPlayerDetails(id);
      if (!room) {
        return status(404, { message: "Room not found" });
      }

      return room;
    },
    {
      params: t.Object({
        id: t.String(),
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
        const room = await getRoomWithPlayerDetails(id);

        console.log(`User ${user.name} (${user.id}) subscribing to room:${id}`);
        ws.subscribe(`room:${id}`);
        
        // Send initial room state to the connecting user
        ws.send(JSON.stringify({
          type: "room_update",
          room,
          message: `Connected to room`,
        }));
        
        // Notify other users about the new player
        ws.publish(
          `room:${id}`,
          JSON.stringify({
            type: "room_update",
            room,
            message: `${user.name} joined the room`,
          })
        );
        
        console.log(`Successfully completed join process for user ${user.name} in room ${id}`);
      } catch (error) {
        console.error("WebSocket open error:", error);
        if (error instanceof Error) {
          console.error("Error details:", { message: error.message, stack: error.stack });
        }
        ws.close(1011, "Internal error");
      }
    },
    async close(ws) {
      try {
        console.log('WebSocket closing...');
        const { id } = ws.data.params;
        const protocol = ws.data.headers['sec-websocket-protocol'];
        if (!protocol) {
          console.log('Close: No protocol header');
          return;
        }

        const token = protocol.split(",").map(s => s.trim())[1];
        if (!token) {
          console.log('Close: No token found');
          return;
        }

        const payload = await ws.data.jwt.verify(token.replace("Bearer ", ""));
        if (!payload) {
          console.log('Close: Invalid token payload');
          return;
        }

        const { Item } = await getUserByUUID(payload.uuid);
        if (!Item || !Item.id?.S || !Item.username?.S) {
          console.log('Close: User not found in database');
          return;
        }

        const user = { id: Item.id.S, name: Item.username.S };
        console.log(`Processing close for user ${user.name} (${user.id}) in room ${id}`);

        // await leaveRoom(id, user.id);
        const room = await getRoomWithPlayerDetails(id);
        
        console.log(`User ${user.name} (${user.id}) unsubscribing from room:${id}`);
        ws.unsubscribe(`room:${id}`);
        ws.publish(
          `room:${id}`,
          JSON.stringify({
            type: "room_update",
            room,
            message: `${user.name} left the room`,
          })
        );
        console.log(`Successfully processed close for user ${user.name}`);
      } catch (error) {
        console.error("WebSocket close error:", error);
        if (error instanceof Error) {
          console.error("Close error details:", { message: error.message, stack: error.stack });
        }
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
          const updatedRoom = await getRoomWithPlayerDetails(id);
          
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
            let countdown = 5;
            
            if (countdowns[id]) {
              clearInterval(countdowns[id]);
            }

            const publishGameStart = async () => {
              try {
                await startGame(id);
                console.log(`🎮 Game started for room:${id}`);
                const updatedRoom = await getRoomWithPlayerDetails(id);
                const gameStartMessage = JSON.stringify({ 
                  type: "game_start", 
                  message: "Game started!",
                  room: updatedRoom
                });
                
                ws.publish(`room:${id}`, gameStartMessage);
                ws.send(gameStartMessage);
              } catch (error) {
                console.error(`Failed to start game for room ${id}:`, error);
                ws.send(JSON.stringify({ type: "error", message: "Failed to start game" }));
              }
            };
            
            countdowns[id] = setInterval(() => {
              console.log(`Manual countdown ${countdown} for room:${id}`);
              const countdownMessage = JSON.stringify({ 
                type: "countdown", 
                countdown, 
                message: `Game starting in ${countdown} seconds` 
              });
              
              ws.publish(`room:${id}`, countdownMessage);
              ws.send(countdownMessage);
              
              countdown--;
              if (countdown < 0) {
                clearInterval(countdowns[id]);
                delete countdowns[id];
                publishGameStart();
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
