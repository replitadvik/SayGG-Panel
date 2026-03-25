import { useEffect, useRef, useCallback } from "react";
import { queryClient } from "./queryClient";
import { useAuth } from "./auth";

type WsEventType = string;

interface WsMessage {
  type: WsEventType;
  payload?: any;
  timestamp: number;
}

const EVENT_TO_QUERY_KEYS: Record<string, string[][]> = {
  "keys:created": [["/api/keys"], ["/api/dashboard/stats"], ["/api/auth/me"]],
  "keys:updated": [["/api/keys"], ["/api/dashboard/stats"]],
  "keys:deleted": [["/api/keys"], ["/api/dashboard/stats"]],
  "keys:bulk-deleted": [["/api/keys"], ["/api/dashboard/stats"]],
  "keys:extended": [["/api/keys"]],
  "keys:device-reset": [["/api/keys"]],
  "keys:bulk-reset": [["/api/keys"], ["/api/dashboard/stats"]],
  "users:created": [["/api/users"], ["/api/dashboard/stats"]],
  "users:approved": [["/api/users"], ["/api/dashboard/stats"]],
  "users:declined": [["/api/users"], ["/api/dashboard/stats"]],
  "users:updated": [["/api/users"], ["/api/dashboard/stats"]],
  "users:deleted": [["/api/users"], ["/api/dashboard/stats"]],
  "users:device-reset": [["/api/users"]],
  "balance:topup": [["/api/users"], ["/api/dashboard/stats"], ["/api/auth/me"]],
  "referrals:created": [["/api/referrals"]],
  "referrals:used": [["/api/referrals"]],
  "games:created": [["/api/games"], ["/api/games/active"]],
  "games:updated": [["/api/games"], ["/api/games/active"]],
  "games:deleted": [["/api/games"], ["/api/games/active"]],
  "durations:created": [["/api/games"]],
  "durations:updated": [["/api/games"]],
  "durations:deleted": [["/api/games"]],
  "settings:updated": [["/api/settings/site-name"], ["/api/settings/features"], ["/api/settings/modname"], ["/api/settings/ftext"], ["/api/settings/maintenance"], ["/api/settings/session"]],
  "connect:updated": [["/api/connect-config"], ["/api/connect-config/audit-logs"]],
  "dashboard:refresh": [["/api/dashboard/stats"]],
};

export function useWebSocket() {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempt = useRef(0);
  const maxReconnectDelay = 30000;
  const unmountedRef = useRef(false);

  const invalidateForEvent = useCallback((eventType: string, payload?: any) => {
    const queryKeys = EVENT_TO_QUERY_KEYS[eventType];
    if (!queryKeys) return;

    const seen = new Set<string>();
    for (const qk of queryKeys) {
      const key = JSON.stringify(qk);
      if (seen.has(key)) continue;
      seen.add(key);
      queryClient.invalidateQueries({ queryKey: qk });
    }

    if (eventType.startsWith("durations:") && payload?.gameId) {
      queryClient.invalidateQueries({
        queryKey: ["/api/games", String(payload.gameId), "durations"],
      });
    }
  }, []);

  const connect = useCallback(() => {
    if (!user || unmountedRef.current) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttempt.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        if (msg.type === "connected") return;
        invalidateForEvent(msg.type, msg.payload);
      } catch {}
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (unmountedRef.current || !user) return;
      if (reconnectAttempt.current >= 10) return;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempt.current), maxReconnectDelay);
      reconnectAttempt.current++;
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [user, invalidateForEvent]);

  useEffect(() => {
    unmountedRef.current = false;
    if (user) {
      connect();
    }
    return () => {
      unmountedRef.current = true;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user, connect]);
}
