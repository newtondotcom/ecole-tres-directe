import { z } from "zod";
import { publicProcedure, router } from "../index";
import { env } from "@ecole-tres-directe/env/server";

const feedbackInputSchema = z.object({
  message: z.string().min(1, "Le message est obligatoire").max(2000),
  page: z.string().optional(),
  accountId: z.number().optional(),
  accountName: z.string().optional(),
});

export const feedbackRouter = router({
  submit: publicProcedure
    .input(feedbackInputSchema)
    .mutation(async ({ input }) => {
      const webhookUrl = env.DISCORD_WEBHOOK_URL;
      const lines: string[] = [];

      lines.push(`**Nouveau feedback ${env.NODE_ENV === "production" ? "Ecole Très Directe" : "Ecole Très Directe (DEV)"}**`);
      if (input.accountName || input.accountId) {
        lines.push(
          `Auteur: ${input.accountName ?? "Inconnu"}${
            input.accountId ? ` (ID: ${input.accountId})` : ""
          }`,
        );
      } else {
        lines.push("Auteur: Anonyme ou non connecté");
      }

      if (input.page) {
        lines.push(`Page: \`${input.page}\``);
      }

      lines.push("");
      lines.push(input.message);

      const payload = {
        content: lines.join("\n"),
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Impossible d'envoyer le feedback au webhook Discord (code ${response.status}): ${text}`,
        );
      }

      return { success: true };
    }),
});

