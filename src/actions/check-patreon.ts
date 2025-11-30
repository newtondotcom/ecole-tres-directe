"use server";

import * as Sentry from "@sentry/nextjs";
import { sendDiscordMessage } from "@/actions/discord-webhook";

type CheckPatreonParams = {
  accountId: number;
  firstName: string;
  lastName: string;
  schoolName?: string;
  username?: string;
};

export async function checkPatreonSubscription({
  accountId,
  firstName,
  lastName,
  schoolName,
  username,
}: CheckPatreonParams) {
  try {
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
    } catch (discordError) {
      // Log Discord error but don't fail the request
      Sentry.captureException(discordError, {
        tags: { function: "checkPatreonSubscription", step: "discord_notification" },
      });
    }

    return {
      subscribed: isSubscribed,
      message: isSubscribed
        ? "Vous êtes abonné à Patreon"
        : "Vous n'êtes pas abonné à Patreon",
    };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { function: "checkPatreonSubscription" },
      extra: { accountId, firstName, lastName },
    });
    throw error;
  }
}

