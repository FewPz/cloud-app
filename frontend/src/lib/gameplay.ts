import { atom, useAtom } from "jotai";

const gameState = atom<
  | "none"
  | "lobby"
  | "waiting"
  | "select"
  | "ready"
  | "wheel"
  | "voting"
  | "results"
  | "leaderboard"
  | "playing"
  | "paused"
  | "ended"
>("none");
export const useGameState = () => useAtom(gameState);

const gameRoomId = atom<string>("");
export const useGameRoomId = () => useAtom(gameRoomId);
