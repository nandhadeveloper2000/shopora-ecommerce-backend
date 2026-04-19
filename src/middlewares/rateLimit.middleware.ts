import { Request, Response, NextFunction } from "express";

type RateEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateEntry>();

export function createRateLimiter(params: { limit: number; windowMs: number }) {
  const { limit, windowMs } = params;

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${req.method}:${req.path}:${ip}`;
    const now = Date.now();

    const current = store.get(key);

    if (!current || current.resetAt <= now) {
      store.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    if (current.count >= limit) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
      });
    }

    current.count += 1;
    store.set(key, current);
    next();
  };
}