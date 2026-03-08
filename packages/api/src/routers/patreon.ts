import { router, publicProcedure } from "../index";
import { checkPatreonSchema, checkPatreonSubscription } from "../lib/check-patreon";

export const patreonRouter = router({
  checkPatreonSubscription: publicProcedure
    .input(checkPatreonSchema)
    .mutation(async ({ input }) => {
      return await checkPatreonSubscription(input);
    }),
});
