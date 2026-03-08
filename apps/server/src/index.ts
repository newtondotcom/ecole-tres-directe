import "dotenv/config";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { appRouter } from "@etd/api/routers/index";
import { createContext } from "@etd/api/context";
import { env } from "@etd/env/server";

const app = new Hono();

const corsOrigins = env.CORS_ORIGINS.split(",");
console.log(corsOrigins);

app.use(logger());
app.use(
  "/*",
  cors({
    origin: corsOrigins,
    allowMethods: ["GET", "POST", "OPTIONS"],
  }),
);

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  }),
);

app.get("/", (c) => {
  return c.text("OK");
});

export default {
  port: 3001,
  fetch: app.fetch,
};
