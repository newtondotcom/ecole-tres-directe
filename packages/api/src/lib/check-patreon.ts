import { sendDiscordMessage } from "./discord-webhook";
import { z } from "zod";

export type CheckPatreonParams = {
  accountId: number;
  firstName: string;
  lastName: string;
  schoolName?: string;
  username?: string;
};

export const checkPatreonSchema = z.object({
  accountId: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  schoolName: z.string().optional(),
  username: z.string().optional(),
});

export async function checkPatreonSubscription({
  accountId,
  firstName,
  lastName,
  schoolName,
  username,
}: CheckPatreonParams) {
  // For now, just send user info to Discord
  // TODO: Add actual Patreon subscription check via Patreon API
  const isSubscribed = false;

  // Send Discord notification
  try {
    await sendDiscordMessage({
      embeds: [
        {
          title: "🔍 Vérification abonnement Patreon",
          description: "Un enseignant a tenté de vérifier son abonnement Patreon",
          color: isSubscribed ? 0x00ff00 : 0xff9900, // Green if subscribed, orange if not
          fields: [
            {
              name: "👤 Nom",
              value: `${firstName} ${lastName}`,
              inline: true,
            },
            {
              name: "🆔 ID Compte",
              value: accountId.toString(),
              inline: true,
            },
            {
              name: "🏫 École",
              value: schoolName || "Non spécifiée",
              inline: true,
            },
            {
              name: "📧 Nom d'utilisateur",
              value: username || "Non spécifié",
              inline: true,
            },
            {
              name: "✅ Abonné Patreon",
              value: isSubscribed ? "Oui" : "Non",
              inline: true,
            },
            {
              name: "⏰ Date",
              value: new Date().toLocaleString("fr-FR"),
              inline: true,
            },
          ],
          footer: {
            text: "Ecole Tres Directe - Patreon Check",
          },
          timestamp: new Date().toISOString(),
        },
      ],
    });
  } catch (_discordError) {
    // Log Discord error but don't fail the request
    // Error silently ignored
    console.error(_discordError);
  }

  return {
    subscribed: isSubscribed,
    message: isSubscribed ? "Vous êtes abonné à Patreon" : "Vous n'êtes pas abonné à Patreon",
  };
}
