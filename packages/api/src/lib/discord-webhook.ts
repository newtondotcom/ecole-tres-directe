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
    const error = new Error(
      "DISCORD_WEBHOOK_URL n'est pas configurée dans les variables d'environnement."
    );
    throw error;
  }

  if (!content && !embeds?.length) {
    const error = new Error(
      "Le message doit contenir au moins un contenu ou un embed."
    );
    throw error;
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
      const error = new Error(
        `Échec de l'envoi du message Discord (${response.status}): ${errorText}`
      );
      throw error;
    }

    return {
      success: true,
      message: "Message envoyé avec succès à Discord.",
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Erreur lors de l'envoi à Discord: ${error.message}`);
    }
    const unknownError = new Error("Erreur inconnue lors de l'envoi à Discord.");
    throw unknownError;
  }
}

