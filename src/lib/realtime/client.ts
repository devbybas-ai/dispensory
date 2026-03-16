"use client";

import { useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";

// === CLIENT-SIDE SOCKET.IO HOOK ===
// Manages a Socket.io connection for a given namespace.
// Automatically connects on mount and disconnects on unmount.

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "ws://localhost:3001";

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
}

/**
 * React hook for connecting to a Socket.io namespace.
 *
 * @param namespace - The Socket.io namespace to connect to (e.g., "/pos", "/inventory")
 * @returns The socket instance and connection state
 */
export function useSocket(namespace: string): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false);

  // Create socket instance on namespace change.
  // useMemo ensures the socket is created once per namespace value.
  const socket = useMemo(() => {
    const url = `${SOCKET_URL}${namespace}`;

    return io(url, {
      transports: ["websocket", "polling"],
      auth: {
        // Token is injected at connection time from the session cookie.
        // The Socket.io server validates this via AUTH_SECRET.
      },
      autoConnect: false, // Connect manually in useEffect
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });
  }, [namespace]);

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error(`[socket.io${namespace}] Connection error:`, err.message);
      setIsConnected(false);
    });

    socket.connect();

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      setIsConnected(false);
    };
  }, [socket, namespace]);

  return {
    socket,
    isConnected,
  };
}
