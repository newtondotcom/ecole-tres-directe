"use server";

type DiscordWebhookMessage = {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: Array<{
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{
      name: string;
      value: string;
      inline?: boolean;
    }>;
    footer?: {
      text: string;
    };
    timestamp?: string;
  }>;
};

type SendDiscordMessageParams = {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordWebhookMessage["embeds"];
};

export async function sendDiscordMessage({
  content,
  username,
  avatar_url,
  embeds,
}: SendDiscordMessageParams) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error(
      "DISCORD_WEBHOOK_URL n'est pas configurée dans les variables d'environnement."
    );
  }

  if (!content && !embeds?.length) {
    throw new Error(
      "Le message doit contenir au moins un contenu ou un embed."
    );
  }

  const payload: DiscordWebhookMessage = {};

  if (content) {
    payload.content = content;
  }

  if (username) {
    payload.username = username;
  }

  if (avatar_url) {
    payload.avatar_url = avatar_url;
  }

  if (embeds && embeds.length > 0) {
    payload.embeds = embeds;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Échec de l'envoi du message Discord (${response.status}): ${errorText}`
      );
    }

    return {
      success: true,
      message: "Message envoyé avec succès à Discord.",
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Erreur lors de l'envoi à Discord: ${error.message}`);
    }
    throw new Error("Erreur inconnue lors de l'envoi à Discord.");
  }
}

