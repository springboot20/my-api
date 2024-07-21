import { Request } from "express";

interface CustomUser {
  _id?: string;
  role: string;
  isEmailVerified: boolean;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: CustomUser;
  }
}
