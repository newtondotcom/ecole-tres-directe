import { publicProcedure, router } from "../index";
import { mistralRouter } from "./mistral";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	mistral: mistralRouter,
});
export type AppRouter = typeof appRouter;
