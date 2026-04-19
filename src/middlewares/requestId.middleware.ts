    import { Request, Response, NextFunction } from "express";
import { generateRequestId } from "../utils/requestId";

export interface RequestWithId extends Request {
  requestId?: string;
}

export function requestIdMiddleware(req: RequestWithId, res: Response, next: NextFunction) {
  const existing = req.headers["x-request-id"];
  const requestId = typeof existing === "string" && existing.trim() ? existing : generateRequestId();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  next();
}