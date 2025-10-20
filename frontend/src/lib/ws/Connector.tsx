'use client';

import { FC, useEffect } from "react";
import { useWSClient, useWSMessage, useWSReady } from ".";

interface Props {
  children?: React.ReactNode;
}

const WSConnector: FC<Props> = ({ children }) => {
  const [ws, setWS] = useWSClient();
  const [, setMessage] = useWSMessage();
  const [, setReady] = useWSReady();

  useEffect(() => {
    if (!ws) {
      const client = new WebSocket("ws://localhost:4000/ws");
      client.onopen = () => {
        console.log("WebSocket Client Connected");
        setWS(client);
        setReady(true);
      };

      client.onclose = () => {
        console.log("WebSocket Client Disconnected");
        setWS(null);
        setReady(false);
      }

      client.onmessage = (message) => {
        console.log("WebSocket Message Received:", message.data);
        setMessage(JSON.parse(message.data));
      };
    }
  }, []);

  return <>{children}</>;
}

export default WSConnector