import "dotenv/config";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { appRouter } from "@ecole-tres-directe/api/routers/index";
import { createContext } from "@ecole-tres-directe/api/context";
import { serveStatic } from "hono/bun";
import { join } from "path";

const app = new Hono();

console.log(process.env.CORS_ORIGIN);

app.use(logger());
app.use(
	"/*",
	cors({
		origin: process.env.CORS_ORIGIN || "",
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

// Serve static files (assets, images, etc.)
app.get("*", serveStatic({ root: "./public" }));

// Fallback to index.html for SPA routes (all non-API routes that don't match static files)
app.get("*", async (c) => {
	try {
		const indexHtml = Bun.file(join(process.cwd(), "public", "index.html"));
		return c.html(await indexHtml.text());
	} catch {
		return c.notFound();
	}
});

export default {
	port: 3001,
	fetch: app.fetch,
}
