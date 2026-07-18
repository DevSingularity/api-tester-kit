"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  Square,
  Trash2,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEnvironmentStore } from "@/store/environment-store";

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

interface Message {
  id: string;
  direction: "in" | "out";
  data: string;
  timestamp: string;
}

export default function WebSocketPage() {
  const [url, setUrl] = useState("wss://echo.websocket.org");
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [autoReconnect, setAutoReconnect] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const connectRef = useRef<() => void>(() => {});

  const resolveVariables = useEnvironmentStore((s) => s.resolveVariables);

  const addMessage = useCallback((direction: "in" | "out", data: string) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      direction,
      data,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
      return;
    }

    setStatus("connecting");
    const resolvedUrl = resolveVariables(url);

    try {
      const ws = new WebSocket(resolvedUrl);

      ws.onopen = () => {
        setStatus("connected");
        addMessage("in", `[Connected to ${resolvedUrl}]`);
      };

      ws.onmessage = (event) => {
        const data = typeof event.data === "string" ? event.data : "[Binary data]";
        addMessage("in", data);
      };

      ws.onerror = () => {
        setStatus("error");
        addMessage("in", "[Connection error]");
      };

      ws.onclose = (event) => {
        setStatus("disconnected");
        addMessage("in", `[Disconnected: ${event.code} ${event.reason || "Normal closure"}]`);

        if (autoReconnect && event.code !== 1000) {
          reconnectTimerRef.current = setTimeout(() => {
            connectRef.current();
          }, 3000);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      setStatus("error");
      addMessage("in", `[Failed to connect: ${err instanceof Error ? err.message : "Unknown error"}]`);
    }
  }, [url, autoReconnect, resolveVariables, addMessage]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    wsRef.current?.close(1000);
    wsRef.current = null;
    setStatus("disconnected");
  }, []);

  const sendMessage = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !inputMessage.trim()) {
      return;
    }

    const resolvedMessage = resolveVariables(inputMessage);
    wsRef.current.send(resolvedMessage);
    addMessage("out", resolvedMessage);
    setInputMessage("");
  }, [inputMessage, resolveVariables, addMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const copyMessage = useCallback((id: string, data: string) => {
    navigator.clipboard.writeText(data);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      wsRef.current?.close();
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 px-4 h-12 border-b bg-card">
          <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
            WebSocket
          </Badge>
          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="wss://echo.websocket.org"
                className="h-8 text-sm font-mono pr-8"
                onKeyDown={(e) => e.key === "Enter" && connect()}
                disabled={status === "connected"}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {status === "connected" ? (
                  <Wifi className="size-3.5 text-green-500" />
                ) : status === "connecting" ? (
                  <div className="size-3.5 rounded-full border-2 border-yellow-500 border-t-transparent animate-spin" />
                ) : (
                  <WifiOff className="size-3.5 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant={status === "connected" ? "destructive" : "default"}
            onClick={status === "connected" ? disconnect : connect}
            className="h-8 gap-1.5"
          >
            {status === "connected" ? (
              <>
                <Square className="size-3.5" />
                Disconnect
              </>
            ) : (
              <>
                <Play className="size-3.5" />
                Connect
              </>
            )}
          </Button>
        </header>

        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-w-0 border-r">
            <div className="flex items-center justify-between px-3 h-9 border-b bg-card/50">
              <span className="text-xs font-medium">Messages</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] gap-1"
                onClick={clearMessages}
              >
                <Trash2 className="size-3" />
                Clear
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
                    {status === "connected" ? "Send a message" : "Connect to start"}
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "group flex items-start gap-2 px-2 py-1.5 rounded text-xs font-mono",
                        msg.direction === "in"
                          ? "bg-blue-500/5 text-blue-700 dark:text-blue-300"
                          : "bg-green-500/5 text-green-700 dark:text-green-300"
                      )}
                    >
                      <ArrowDown
                        className={cn(
                          "size-3 mt-0.5 shrink-0",
                          msg.direction === "in"
                            ? "text-blue-500"
                            : "text-green-500 rotate-180"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <pre className="whitespace-pre-wrap break-all">{msg.data}</pre>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyMessage(msg.id, msg.data)}
                      >
                        {copiedId === msg.id ? (
                          <Check className="size-2.5 text-green-500" />
                        ) : (
                          <Copy className="size-2.5" />
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex flex-col w-72 min-w-0">
            <div className="flex items-center justify-between px-3 h-9 border-b bg-card/50">
              <span className="text-xs font-medium">Send Message</span>
              <Badge
                variant="outline"
                className={cn(
                  "h-4 text-[10px]",
                  status === "connected"
                    ? "bg-green-500/10 text-green-600 border-green-500/30"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {status}
              </Badge>
            </div>
            <div className="flex-1 p-3 flex flex-col gap-3">
              <div className="flex-1 min-h-0">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder='{"type": "ping"}'
                  className="h-full resize-none font-mono text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      sendMessage();
                    }
                  }}
                  disabled={status !== "connected"}
                />
              </div>
              <Button
                size="sm"
                className="h-8 gap-1.5"
                onClick={sendMessage}
                disabled={status !== "connected" || !inputMessage.trim()}
              >
                <ArrowUp className="size-3.5" />
                Send (Ctrl+Enter)
              </Button>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoReconnect}
                    onChange={(e) => setAutoReconnect(e.target.checked)}
                    className="rounded border-input"
                  />
                  Auto-reconnect
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
