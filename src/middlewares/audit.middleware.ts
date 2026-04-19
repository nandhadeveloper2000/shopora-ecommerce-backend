import { Request, Response, NextFunction } from "express";
import { AuditLogModel } from "../models/auditLog.model";

export function auditMiddleware(params: {
  action: string;
  entityType: string;
  getEntityId?: (req: Request) => string | undefined;
  getMeta?: (req: Request, res: Response) => Record<string, unknown>;
}) {
  const { action, entityType, getEntityId, getMeta } = params;

  return function audit(req: any, res: Response, next: NextFunction) {
    const originalJson = res.json.bind(res);

    res.json = function patchedJson(body: any) {
      const actorId = req.user?.id || null;
      const actorRole = req.user?.role || "";
      const requestId = req.requestId || "";
      const statusCode = res.statusCode || 200;

      setImmediate(async () => {
        try {
          await AuditLogModel.create({
            actorId,
            actorRole,
            action,
            entityType,
            entityId: getEntityId ? getEntityId(req) || "" : "",
            method: req.method,
            path: req.originalUrl,
            statusCode,
            requestId,
            ip: req.ip || "",
            userAgent: req.headers["user-agent"] || "",
            meta: getMeta ? getMeta(req, res) : {},
          });
        } catch {
          // ignore audit failures
        }
      });

      return originalJson(body);
    };

    next();
  };
}