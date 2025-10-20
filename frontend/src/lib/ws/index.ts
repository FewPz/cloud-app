import { atom, useAtom } from "jotai";
import WSConnector from "./Connector";

/** Public hook: returns a type-safe send() */
type WSMessage = { type: string; payload?: unknown };

const wsMessage = atom<WSMessage | null>(null);
const wsClient = atom<WebSocket | null>(null);
const wsReady = atom<boolean>(false);

export const useWSMessage = () => useAtom(wsMessage);
export const useWSClient = () => useAtom(wsClient);
export const useWSReady = () => useAtom(wsReady);
export const useWSSend = () => {
  const [client] = useWSClient();
  const [ready] = useWSReady();

  function send(msg: WSMessage) {
    const frame = typeof msg === "string" ? (msg as unknown as string) : JSON.stringify(msg);

    if (client && client.readyState === WebSocket.OPEN && ready) {
      client.send(frame);
    }
  }

  return send;
}

export { WSConnector };
