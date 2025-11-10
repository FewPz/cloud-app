import { Elysia, t } from "elysia";
import { auth } from "../auth";
import { getUserByUUID, updateUserMoney } from "../auth/query";
import { createGameSession, getGameSession, addBet, updateGameStatus } from "./bet";
import { getRoom } from "../room/query";

export const BettingRoute = new Elysia({ prefix: "/betting" })
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
    "/:roomId/start",
    async ({ body, user, params }) => {
      if (!user) {
        throw new Error("Unauthorized");
      }
      
      const { roomId } = params;
      const { gameType } = body;
      
      // ตรวจสอบว่าผู้เล่นอยู่ในห้องหรือไม่
      const room = await getRoom(roomId);
      if (!room || !room.players.includes(user.id)) {
        throw new Error("Not in room");
      }
      
      // สร้าง game session ใหม่
      const gameSession = await createGameSession(roomId, gameType);
      
      return { gameSession, message: "Game session created" };
    },
    {
      params: t.Object({
        roomId: t.String(),
      }),
      body: t.Object({
        gameType: t.Union([
          t.Literal("roll-dice"),
          t.Literal("spin-wheel"),
          t.Literal("match-fixing"),
          t.Literal("vote"),
        ]),
      }),
    }
  )
  .post(
    "/:roomId/:gameId/bet",
    async ({ body, user, params }) => {
      if (!user) {
        throw new Error("Unauthorized");
      }
      
      const { roomId, gameId } = params;
      const { amount, prediction } = body;
      
      // ตรวจสอบ game session
      const gameSession = await getGameSession(gameId);
      if (!gameSession || gameSession.roomId !== roomId) {
        throw new Error("Game not found");
      }
      
      if (gameSession.status !== "betting") {
        throw new Error("Betting is closed");
      }
      
      // ตรวจสอบว่าผู้เล่นแทงแล้วหรือยัง
      if (gameSession.bets.some(bet => bet.playerId === user.id)) {
        throw new Error("Already bet");
      }
      
      // ตรวจสอบเงินผู้เล่น
      const { Item } = await getUserByUUID(user.id);
      if (!Item || !Item.money?.N || Number(Item.money.N) < amount) {
        throw new Error("Insufficient money");
      }
      
      // หักเงินผู้เล่น
      const currentMoney = Number(Item.money.N);
      await updateUserMoney(user.id, currentMoney - amount);
      
      // เพิ่มการแทง
      const bet = await addBet(gameId, {
        roomId,
        playerId: user.id,
        gameType: gameSession.gameType,
        amount,
        prediction,
        status: "pending"
      });
      
      // ตรวจสอบว่าทุกคนแทงครบแล้วหรือยัง
      const room = await getRoom(roomId);
      if (room && gameSession.bets.length + 1 >= room.players.length) {
        // ทุกคนแทงครบแล้ว เริ่มเกมได้
        await updateGameStatus(gameId, "playing");
        
        // ส่งสัญญาณไปยังทุกคน
        // TODO: ใช้ WebSocket publish แจ้งให้ทุกคนไปหน้าเกม
      }
      
      return { bet, message: "Bet placed successfully" };
    },
    {
      params: t.Object({
        roomId: t.String(),
        gameId: t.String(),
      }),
      body: t.Object({
        amount: t.Number(),
        prediction: t.Optional(t.Any()),
      }),
    }
  )
  .get(
    "/:roomId/:gameId",
    async ({ user, params }) => {
      if (!user) {
        throw new Error("Unauthorized");
      }
      
      const { gameId } = params;
      const gameSession = await getGameSession(gameId);
      
      if (!gameSession) {
        throw new Error("Game not found");
      }
      
      return { gameSession };
    },
    {
      params: t.Object({
        roomId: t.String(),
        gameId: t.String(),
      }),
    }
  )
  .ws("/ws/:roomId", {
    headers: t.Object({
      'sec-websocket-protocol': t.Optional(t.String()),
    }),
    async open(ws) {
      try {
        const { roomId } = ws.data.params;
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
        
        // Subscribe to betting updates for this room
        ws.subscribe(`betting:${roomId}`);
        console.log(`User ${user.name} joined betting room ${roomId}`);
        
      } catch (error) {
        console.error("Betting WebSocket open error:", error);
        ws.close(1011, "Internal error");
      }
    },
    
    async close(ws) {
      try {
        const { roomId } = ws.data.params;
        ws.unsubscribe(`betting:${roomId}`);
        console.log(`User left betting room ${roomId}`);
      } catch (error) {
        console.error("Betting WebSocket close error:", error);
      }
    },
    
    async message(ws, message) {
      try {
        const { roomId } = ws.data.params;
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
        
        if (typeof message !== "object" || message === null) {
          ws.send(JSON.stringify({ type: "error", message: "Invalid message" }));
          return;
        }

        // Handle different message types
        if ("type" in message) {
          switch (message.type) {
            case "get_game_session":
              // ส่งข้อมูล game session กลับไป
              // TODO: Implement get current game session
              break;
              
            case "place_bet":
              // จัดการการแทงเงิน
              // TODO: Implement bet placing through WebSocket
              break;
          }
        }
        
      } catch (error) {
        console.error("Betting WebSocket message error:", error);
        ws.send(JSON.stringify({ type: "error", message: "Internal error" }));
      }
    },
    
    body: t.Union([
      t.Object({ type: t.Literal("get_game_session"), gameType: t.String() }),
      t.Object({ type: t.Literal("place_bet"), gameSessionId: t.String(), amount: t.Number(), prediction: t.Optional(t.Any()) }),
    ]),
  });