import { NextFunction, Request, Response } from "express";
import { TokenPayload } from "../utils/jwt";

export function requireRole(...roles: TokenPayload["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Não autenticado." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Você não tem permissão para executar esta ação." });
    }

    return next();
  };
}
