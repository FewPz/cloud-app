import { User } from "@/lib/user";
import axios from "axios";

export const getLobbyInfo = async (gameId: string) => {
  try {
    const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/games/${gameId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      }
    });
    return data;
  } catch (error) {
    console.error("Failed to get users in lobby:", error);
    throw error;
  }
}