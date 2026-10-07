import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthUser, Role } from "../types/auth";

export type AuthRequest = Request & { user?: AuthUser };

const secret = () => process.env.JWT_SECRET || "rappi_lab_secret";

export function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ message: "No hay token" });

  try {
    const token = header.split(" ")[1];
    req.user = jwt.verify(token, secret()) as AuthUser;
    next();
  } catch {
    return res.status(401).json({ message: "Token invalido o vencido" });
  }
}

export function onlyRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "No tienes permiso para esta accion" });
    }
    next();
  };
}
