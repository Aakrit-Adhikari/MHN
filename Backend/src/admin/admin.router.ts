import AdminJSExpress from "@adminjs/express";
import { admin } from "./admin.js";
import { authenticateAdmin } from "./admin.auth.js";
import { env } from "../config/env.js";

export const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
  admin,
  {
    authenticate: authenticateAdmin,
    cookieName: env.ADMIN_COOKIE_NAME,
    cookiePassword: env.ADMIN_COOKIE_SECRET,
  },
  null,
  {
    secret: env.ADMIN_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
    },
  }
);
