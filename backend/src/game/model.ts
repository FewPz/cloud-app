import type { User } from "../user/model";

export interface LobbyInfo {
  id: string;
  roomCode: string;
  title: string;
  users: User[];
  type: string;
}