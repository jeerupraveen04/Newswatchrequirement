import type { Server as HttpServer } from "node:http";
import { Server as SocketServer, type Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { verifyAccessToken } from "../services/token.service";

/**
 * Socket.IO realtime gateway (docs/architecture/03 §13).
 * - Verifies the access token on handshake (REQ-SYS-390).
 * - Scales across instances via the Redis adapter (REQ-SYS-391).
 * - Rooms: `article:<id>` and `user:<id>`; emits are best-effort (REQ-SYS-393).
 */

let io: SocketServer | null = null;

export function initRealtime(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    path: env.SOCKET_PATH,
    cors: { origin: env.SOCKET_CORS_ORIGIN === "*" ? true : env.SOCKET_CORS_ORIGIN.split(",") },
  });

  try {
    const pub = new Redis(env.REDIS_URL);
    const sub = pub.duplicate();
    io.adapter(createAdapter(pub, sub));
    logger.info("Socket.IO Redis adapter enabled");
  } catch (err) {
    logger.warn({ err }, "Socket.IO Redis adapter unavailable; running single-instance");
  }

  io.use((socket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.headers.authorization?.replace("Bearer ", "") as string | undefined);
    if (!token) return next(); // guest sockets allowed for public rooms
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
    } catch {
      // ignore; treated as guest
    }
    next();
  });

  io.on("connection", (socket: Socket) => {
    logger.debug({ id: socket.id, userId: socket.data.userId }, "socket connected");

    if (socket.data.userId) {
      void socket.join(`user:${socket.data.userId}`);
    }

    socket.on("join", (room: string) => {
      if (typeof room === "string" && /^(article|user):/.test(room)) void socket.join(room);
    });
    socket.on("leave", (room: string) => {
      if (typeof room === "string") void socket.leave(room);
    });

    socket.on("disconnect", () => {
      logger.debug({ id: socket.id }, "socket disconnected");
    });
  });

  return io;
}

/** Emit to a room (no-op when realtime is disabled). */
export function emitToRoom(room: string, event: string, payload: unknown): void {
  io?.to(room).emit(event, payload);
}

export const realtime = {
  commentNew(articleId: string, comment: unknown) {
    emitToRoom(`article:${articleId}`, "comment:new", comment);
  },
  commentUpdated(articleId: string, comment: unknown) {
    emitToRoom(`article:${articleId}`, "comment:updated", comment);
  },
  commentDeleted(articleId: string, commentId: string) {
    emitToRoom(`article:${articleId}`, "comment:deleted", { id: commentId });
  },
  reactionUpdate(articleId: string, counts: unknown) {
    emitToRoom(`article:${articleId}`, "reaction:update", counts);
  },
  commentCount(articleId: string, count: number) {
    emitToRoom(`article:${articleId}`, "comment:count", { count });
  },
  notificationNew(userId: string, notification: unknown) {
    emitToRoom(`user:${userId}`, "notification:new", notification);
  },
  articleStatus(userId: string, article: unknown) {
    emitToRoom(`user:${userId}`, "article:status", article);
  },
};

export function getIo(): SocketServer | null {
  return io;
}
