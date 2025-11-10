import { Elysia, t } from "elysia";

export const RoomModel = new Elysia({ name: "model.room" }).model({
  "room.join": t.Object({
    roomId: t.String(),
  }),
  "room.leave": t.Object({
    roomId: t.String(),
  }),
  "room.message": t.Object({
    roomId: t.String(),
    message: t.String(),
  }),
  "room.start": t.Object({
    roomId: t.String(),
  }),
  "room.setting": t.Object({
    roomId: t.String(),
    minPlayer: t.Numeric(),
  }),
});
