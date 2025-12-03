import { publicProcedure, router } from "../index";
import { mistralRouter } from "./mistral";
import { checkPatreonSchema, checkPatreonSubscription } from "../lib/check-patreon";

export const appRouter = router({
	healthCheck: publicProcedure.query(() => {
		return "OK";
	}),
	mistral: mistralRouter,
	checkPatreonSubscription: publicProcedure
		.input(checkPatreonSchema)
		.mutation(async ({ input }) => {
			return await checkPatreonSubscription(input);
		}),
});
export type AppRouter = typeof appRouter;
