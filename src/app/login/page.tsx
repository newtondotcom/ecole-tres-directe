"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { useUnblockStatus } from "@/hooks/use-unblock-status";
import { Background } from "@/components/ui/background-components";

const apiVersion = process.env.NEXT_PUBLIC_ECOLE_DIRECTE_API_VERSION ?? "7.0.1";

export default function LoginPage() {
  const { authenticate, validatePersistedSession, session, account, rememberMe } = useAuthStore();
  const extensionDetected = useUnblockStatus();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMeChecked, setRememberMeChecked] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingSession, setIsValidatingSession] = useState(false);

  // Check if there's a persisted session on mount
  useEffect(() => {
    if (rememberMe && session && account) {
      // Session exists, check if it needs validation
      // We'll always require password validation for security
      setIsValidatingSession(true);
      // Pre-fill username if available
      if (session.username) {
        setUsername(session.username);
      }
    }
  }, [rememberMe, session, account]);

  const handleValidateSession = async () => {
    if (!password) {
      setError("Veuillez entrer votre mot de passe pour valider la session.");
      return;
    }

    setError(null);
    setStatus("Initialisation avec ETD Unblock…");
    setIsSubmitting(true);

    try {
      await setupGtkToken();
      setStatus("Validation de la session en cours…");
      await validatePersistedSession(password);
      setStatus("Session validée avec succès !");
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de valider la session.";
      setError(message);
      console.error("Session validation error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const setupGtkToken = useCallback(async () => {
    if (!extensionDetected) {
      throw new Error(
        "L'extension ETD Unblock n'a pas été détectée. Installez-la avant de continuer."
      );
    }

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        window.removeEventListener("message", handleGtkMessage);
        reject(new Error("Aucune réponse de l'extension ETD Unblock."));
      }, 5000);

      function cleanup() {
        clearTimeout(timeout);
        window.removeEventListener("message", handleGtkMessage);
      }

      function handleGtkMessage(event: MessageEvent) {
        if (event.data?.type !== "EDPU_MESSAGE") return;
        const message = event.data.payload;

        if (message?.action === "gtkRulesUpdated") {
          cleanup();
          resolve();
        } else if (
          message?.action === "noGtkCookie" ||
          message?.action === "noCookie"
        ) {
          cleanup();
          reject(
            new Error(
              "Impossible de récupérer le cookie GTK."
            )
          );
        }
      }

      window.addEventListener("message", handleGtkMessage);
      fetch(
        `https://api.ecoledirecte.com/v3/login.awp?gtk=1&v=${encodeURIComponent(
          apiVersion
        )}`
      ).catch(() => {
        cleanup();
        reject(
          new Error(
            "La requête vers EcoleDirecte a échoué. Vérifiez votre connexion."
          )
        );
      });
    });
  }, [extensionDetected]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus("Initialisation avec ETD Unblock…");
    setIsSubmitting(true);

    try {
      await setupGtkToken();
      setStatus("Authentification en cours…");
      await authenticate({ username, password }, rememberMeChecked);
      setStatus("Authentifié avec succès !");
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Une erreur inattendue est survenue.";
      setError(message);
      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  const helperMessage = useMemo(() => {
    if (!extensionDetected) {
      return "Installez ETD Unblock dans Firefox et revenez sur cette page.";
    }
    if (isSubmitting) {
      return status ?? "Connexion en cours…";
    }
    return "Connectez-vous avec vos identifiants EcoleDirecte.";
  }, [extensionDetected, isSubmitting, status]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-10 relative z-10">
      <div className={cn("w-full max-w-3xl flex flex-col gap-6 relative z-10")}>
        <Card className="overflow-hidden">
          <CardContent className="grid p-0 md:grid-cols-2">
            <form className="p-6 md:p-8 space-y-6" onSubmit={handleSubmit}>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Connexion ETD</h1>
                <p className="text-muted-foreground text-sm">{helperMessage}</p>
              </div>
              {isValidatingSession ? (
                <FieldGroup className="space-y-5">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <p className="text-muted-foreground text-sm">
                      Une session a été trouvée pour <strong>{username || session?.username}</strong>. Veuillez entrer votre mot de passe pour continuer.
                    </p>
                  </div>
                  <Field>
                    <FieldLabel htmlFor="password-validation">Mot de passe</FieldLabel>
                    <Input
                      id="password-validation"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={isSubmitting}
                      required
                      autoFocus
                    />
                  </Field>
                  <Field>
                    <Button
                      type="button"
                      onClick={handleValidateSession}
                      disabled={isSubmitting || !extensionDetected || !password}
                      className="w-full"
                    >
                      {isSubmitting ? "Validation…" : "Valider la session"}
                    </Button>
                  </Field>
                  <Field>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIsValidatingSession(false);
                        setPassword("");
                        useAuthStore.getState().resetAuthData();
                      }}
                      className="w-full"
                    >
                      Utiliser un autre compte
                    </Button>
                  </Field>
                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}
                </FieldGroup>
              ) : (
                <FieldGroup className="space-y-5">
                  <Field>
                    <FieldLabel htmlFor="username">Identifiant</FieldLabel>
                    <Input
                      id="username"
                      placeholder="professeur@ecole.fr"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </Field>
                  <Field>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember-me"
                        checked={rememberMeChecked}
                        onCheckedChange={(checked) => setRememberMeChecked(checked === true)}
                        disabled={isSubmitting}
                      />
                      <label
                        htmlFor="remember-me"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Se souvenir de moi
                      </label>
                    </div>
                  </Field>
                  <Field>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !extensionDetected}
                      className="w-full"
                    >
                      {isSubmitting ? "Connexion…" : "Se connecter"}
                    </Button>
                  </Field>
                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}
                </FieldGroup>
              )}
              {!extensionDetected && (
                <div className="space-y-3 rounded-md border border-dashed border-amber-400 bg-amber-50 px-3 py-2 text-center text-sm text-amber-700">
                  <p>
                    ETD Unblock n&apos;a pas été détecté. Installez l&apos;extension sur Firefox
                    pour continuer.
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/etd-unblock">Installer ETD Unblock</Link>
                  </Button>
                </div>
              )}
            </form>
            <div className="bg-muted relative hidden md:block">
              <img
                src="/etd.svg"
                alt="Ecole Très Directe"
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.3]"
              />
            </div>
          </CardContent>
        </Card>
        <FieldDescription className="px-6 text-center text-sm text-muted-foreground">
          En continuant, vous acceptez nos {""}
          <a href="#" className="underline">
            Conditions d&apos;utilisation
          </a>{" "}
          et notre {""}
          <a href="#" className="underline">
            Politique de confidentialité
          </a>
          .
        </FieldDescription>
      </div>


    <Background />
    </div>
  );
}
