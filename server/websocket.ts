import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { IncomingMessage } from "http";
import { storage } from "./storage";

export type WsEventType =
  | "keys:created" | "keys:updated" | "keys:deleted" | "keys:bulk-deleted" | "keys:bulk-reset" | "keys:extended" | "keys:device-reset"
  | "users:created" | "users:approved" | "users:declined" | "users:updated" | "users:deleted" | "users:device-reset"
  | "balance:topup"
  | "referrals:created" | "referrals:used"
  | "games:created" | "games:updated" | "games:deleted"
  | "durations:created" | "durations:updated" | "durations:deleted"
  | "settings:updated" | "connect:updated"
  | "dashboard:refresh";

export interface WsEvent {
  type: WsEventType;
  payload?: any;
  timestamp: number;
}

interface AuthenticatedClient {
  ws: WebSocket;
  userId: number;
  username: string;
  userLevel: number;
  uplink?: string;
  isAlive: boolean;
}

const clients = new Map<WebSocket, AuthenticatedClient>();
let wss: WebSocketServer | null = null;

export function setupWebSocket(httpServer: Server, sessionParser: any): void {
  wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (request: IncomingMessage, socket, head) => {
    if (request.url !== "/ws") {
      socket.destroy();
      return;
    }

    sessionParser(request as any, {} as any, async () => {
      const session = (request as any).session;
      if (!session?.userId) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      const user = await storage.getUser(session.userId);
      if (!user || user.status !== 1) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      wss!.handleUpgrade(request, socket, head, (ws) => {
        const client: AuthenticatedClient = {
          ws,
          userId: user.id,
          username: user.username,
          userLevel: user.level,
          uplink: user.uplink || undefined,
          isAlive: true,
        };
        clients.set(ws, client);

        ws.on("pong", () => {
          const c = clients.get(ws);
          if (c) c.isAlive = true;
        });

        ws.on("close", () => {
          clients.delete(ws);
        });

        ws.on("error", () => {
          clients.delete(ws);
        });

        ws.send(JSON.stringify({ type: "connected", timestamp: Date.now() }));
      });
    });
  });

  const heartbeat = setInterval(() => {
    clients.forEach((client, ws) => {
      if (!client.isAlive) {
        clients.delete(ws);
        ws.terminate();
        return;
      }
      client.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(heartbeat);
  });
}

export function broadcastEvent(event: WsEvent, filter?: {
  level?: number;
  username?: string;
  minLevel?: number;
  maxLevel?: number;
}): void {
  const message = JSON.stringify(event);

  clients.forEach((client) => {
    if (client.ws.readyState !== WebSocket.OPEN) return;

    if (filter) {
      if (filter.level !== undefined && client.userLevel !== filter.level) return;
      if (filter.minLevel !== undefined && client.userLevel < filter.minLevel) return;
      if (filter.maxLevel !== undefined && client.userLevel > filter.maxLevel) return;
      if (filter.username !== undefined && client.username !== filter.username) return;
    }

    client.ws.send(message);
  });
}

export function emitToUser(userId: number, event: WsEvent): void {
  const message = JSON.stringify(event);
  clients.forEach((client) => {
    if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}

export function emitToOwners(event: WsEvent): void {
  broadcastEvent(event, { level: 1 });
}

export function emitToAdminsAndAbove(event: WsEvent): void {
  broadcastEvent(event, { maxLevel: 2 });
}

export function emitToAll(event: WsEvent): void {
  broadcastEvent(event);
}

export function emitScopedKeyEvent(event: WsEvent, registrator: string): void {
  const message = JSON.stringify(event);
  clients.forEach((client) => {
    if (client.ws.readyState !== WebSocket.OPEN) return;
    if (client.userLevel === 1) {
      client.ws.send(message);
    } else if (client.username === registrator) {
      client.ws.send(message);
    }
  });
}

export function emitScopedUserEvent(event: WsEvent, uplink?: string): void {
  const message = JSON.stringify(event);
  clients.forEach((client) => {
    if (client.ws.readyState !== WebSocket.OPEN) return;
    if (client.userLevel === 1) {
      client.ws.send(message);
    } else if (uplink && client.username === uplink) {
      client.ws.send(message);
    }
  });
}
