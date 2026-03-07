import { NextFunction, Request, Response } from "express";
import crypto from "crypto";

export default function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = req.headers["x-request-id"]?.toString() || crypto.randomUUID();

  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    if (process.env.NODE_ENV !== "test") {
      console.log(`[${requestId}] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`);
    }
  });

  next();
}
