import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";

import { useAuthStore } from "@/stores/auth";
import { trpcClient } from "@/utils/trpc";
import { Button } from "@etd/ui/components/button";
import { Textarea } from "@etd/ui/components/textarea";
import { Label } from "@etd/ui/components/label";

export const Route = createFileRoute("/dashboard/feedback")({
  component: FeedbackComponent,
});

function FeedbackComponent() {
  const { account } = useAuthStore();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!message.trim()) {
      setError("Merci d'écrire un message avant d'envoyer.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await trpcClient.feedback.submit.mutate({
        message,
        page: router.state.location.pathname,
        accountId: account?.id,
        accountName: account
          ? `${account.firstName} ${account.lastName} @ ${account.schoolName}`
          : undefined,
      });

      setSuccess(true);
      setMessage("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible d'envoyer le feedback pour le moment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">Envoyer un feedback</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Une idée d&apos;amélioration, un bug, un besoin particulier ?
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="feedback-message">
            Message <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="feedback-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={6}
            placeholder="Décrivez ce qui fonctionne bien, ce qui manque, ou ce qui pourrait être amélioré…"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && (
          <p className="text-sm text-green-600">
            Merci pour votre feedback, il a bien été envoyé !
          </p>
        )}
        <div className="flex justify-start">
          <Button type="submit" disabled={isSubmitting || !message.trim()}>
            {isSubmitting ? "Envoi en cours..." : "Envoyer le feedback"}
          </Button>
        </div>
      </form>
    </main>
  );
}
