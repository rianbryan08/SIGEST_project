import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

export interface TokenPayload {
  sub: string; // user id
<<<<<<< HEAD
  role: "ADMIN" | "ANALISTA" | "TECHNICIAN" | "USER";
=======
  role: "ADMIN" | "TECHNICIAN" | "USER";
>>>>>>> 048f4529bb52f0a83fe5de287c36c2b7def0d7e2
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
