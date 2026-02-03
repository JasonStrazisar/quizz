import { useEffect, useState } from "react";
import { getSocket } from "../lib/socket";

export default function useSocket(connect = true) {
  const [socket] = useState(() => getSocket());

  useEffect(() => {
    if (!connect) return;
    if (!socket.connected) socket.connect();
    return () => {
      if (socket.connected) socket.disconnect();
    };
  }, [connect, socket]);

  return socket;
}
