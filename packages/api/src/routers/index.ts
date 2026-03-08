import { publicProcedure, router } from "../index";
import { mistralRouter } from "./mistral";
import { feedbackRouter } from "./feedback";
import { patreonRouter } from "./patreon";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  mistral: mistralRouter,
  feedback: feedbackRouter,
  patreon: patreonRouter,
});
export type AppRouter = typeof appRouter;
