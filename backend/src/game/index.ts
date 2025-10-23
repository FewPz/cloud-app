import { Elysia, t } from "elysia";
import { getGameByRoomCode, getGameRoomById } from "./query.js";
import { AuthService } from "../auth/index.js";

export const game = new Elysia({
  prefix: "/games",
})
  .use(AuthService)
  .post("/join", async ({ body: { roomCode }, status, }) => {
    const { Item } = await getGameByRoomCode(roomCode);

    if (!Item) {
      return status(404, { message: "Game room not found" });
    }

    return { message: "Game room found.", gameId: Item.id!.S };
  }, {
    body: t.Object({
      roomCode: t.String()
    }),
    isSignIn: true
  })
  .onError(({ error, code }) => {
    console.error(`Error occurred with code ${code}:`, error);
  })
  .get("/:id", async ({ params: { id }, status }) => {
    const { Item } = await getGameRoomById(id);
    if (!Item) {
      return status(404, { message: "Game room not found." });
    }

    return {
      id: Item.id!.S,
      roomCode: Item.roomCode!.S,
      hostId: Item.hostId!.S,
      players: Item.players ? JSON.parse(Item.players!.S || "[]") : [],
      status: Item.status!.S,
    };
  }, {
    params: t.Object({
      id: t.String()
    }),
    isSignIn: true
  }); 