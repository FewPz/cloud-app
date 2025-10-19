import { Elysia } from "elysia";

export const wallet = new Elysia({
  prefix: "/wallet",
})
  .get("/balance", () => {
    return { balance: 1000 };
  })