"use client";

import { type FormEvent, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";

import {
  type Step,
  useAppreciationsStore
} from "../../store/appreciations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  generateBatchAppreciations,
  generateGeneralAppreciation
} from "@/server/generate-appreciation";
import type { GeneratedAppreciation } from "@/types/appreciations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const STEP_LABELS: Record<Step, string> = {
  idle: "En attente",
  authenticating: "Authentification",
  class_lookup: "Recherche de la classe principale",
  council_fetch: "Récupération des élèves",
  grades_fetch: "Chargement des appréciations",
  ready: "Récapitulatif disponible",
  error: "Erreur"
};

const STEP_ORDER: Step[] = [
  "authenticating",
  "class_lookup",
  "council_fetch",
  "grades_fetch",
  "ready"
];

export default function RemplirAppreciations() {
  const {
    step,
    isLoading,
    error,
    classSummary,
    firstStudentRecap,
    students,
    authenticate,
    reset,
    credentials
  } = useAppreciationsStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [promptInstruction, setPromptInstruction] = useState("");
  const [generatedAppreciation, setGeneratedAppreciation] = useState("");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGenerating, startGeneration] = useTransition();
  const [batchResults, setBatchResults] = useState<GeneratedAppreciation[] | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [isBatching, startBatchGeneration] = useTransition();
  const hasRecap = Boolean(firstStudentRecap);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await authenticate({ username, password });
  };

  const disableSubmit = !username || !password || isLoading;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">Remplir les appréciations</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Connectez-vous pour récupérer votre classe principale et afficher le
          premier récapitulatif d&apos;appréciations.
        </p>
      </header>

      <div className="relative overflow-hidden">
        <motion.div
          className="flex w-full"
          animate={{ x: hasRecap ? "-100%" : "0%" }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        >
          <div className="w-full flex-shrink-0 pr-0 lg:pr-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Connexion professeur</CardTitle>
                  <CardDescription>
                    Identifiez-vous pour récupérer vos données de classe.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="username">Nom d&apos;utilisateur</Label>
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        required
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        placeholder="professeur@ecole.fr"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Mot de passe</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="••••••••"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button type="submit" disabled={disableSubmit}>
                        {isLoading ? "Connexion..." : "Se connecter"}
                      </Button>
                      {(step === "ready" || step === "error") && (
                        <Button
                          type="button"
                          variant="link"
                          onClick={reset}
                          className="px-0"
                        >
                          Réinitialiser
                        </Button>
                      )}
                    </div>

                    {error && (
                      <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                      </p>
                    )}
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Étapes</CardTitle>
                  <CardDescription>
                    Suivez la progression des requêtes côté serveur.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {STEP_ORDER.map((stepKey) => {
                      const isCompleted =
                        STEP_ORDER.indexOf(step) > STEP_ORDER.indexOf(stepKey);
                      const isCurrent = step === stepKey;
                      return (
                        <div
                          key={stepKey}
                          className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
                            isCurrent
                              ? "border-neutral-900 bg-neutral-50"
                              : "border-neutral-200"
                          }`}
                        >
                          <span>{STEP_LABELS[stepKey]}</span>
                          {isCurrent && (
                            <span className="text-neutral-500">En cours</span>
                          )}
                          {isCompleted && (
                            <span className="text-green-600">OK</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {classSummary && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Classe principale</CardTitle>
                    <CardDescription>
                      Résumé de la classe où vous êtes professeur principal.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-neutral-600">
                      {classSummary.classLabel} · {classSummary.levelName} ·{" "}
                      {classSummary.schoolName}
                    </p>
                    {students && (
                      <p className="mt-1 text-sm text-neutral-500">
                        {students.length} élèves récupérés.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div className="w-full flex-shrink-0 pl-0 lg:pl-6">
            <AnimatePresence mode="wait">
              {firstStudentRecap && (
                <motion.div
                  key={firstStudentRecap.studentId}
                  initial={{ opacity: 0, x: 120 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 120 }}
                  transition={{ type: "spring", stiffness: 120, damping: 18 }}
                  className="h-full"
                >
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>
                        Appercu de la génération de l&apos;appréciation générale
                      </CardTitle>
                      <CardDescription>
                        {firstStudentRecap.studentName} —{" "}
                        {firstStudentRecap.periodName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label htmlFor="prompt">Consigne pour la rédaction</Label>
                        <Textarea
                          id="prompt"
                          placeholder='Ex: "Rédige une appréciation globale encourageante et précise, avec un ton neutre."'
                          rows={3}
                          value={promptInstruction}
                          onChange={(event) =>
                            setPromptInstruction(event.target.value)
                          }
                          className="mt-2"
                        />
                      </div>

                      <ScrollArea className="max-h-[20rem] h-72 rounded-md border border-neutral-100">
                        <div className="space-y-3 p-3 pr-4">
                          {firstStudentRecap.subjects.map((subject) => (
                            <Card key={`${subject.subjectName}-${subject.teachers}`}>
                              <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-base font-semibold">
                                  {subject.subjectName}
                                </CardTitle>
                                {subject.teachers && (
                                  <CardDescription className="text-xs">
                                    {subject.teachers}
                                  </CardDescription>
                                )}
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                <p className="text-sm text-neutral-700">
                                  {subject.appreciation ||
                                    "Aucune appréciation disponible."}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                    <CardFooter className="flex flex-wrap items-center justify-end gap-3">
                      <Button
                        type="button"
                        disabled={isGenerating}
                        onClick={() => {
                          if (!firstStudentRecap) return;
                          startGeneration(async () => {
                            try {
                              const appreciation = await generateGeneralAppreciation(
                                {
                                  prompt: promptInstruction,
                                  subjects: firstStudentRecap.subjects
                                }
                              );
                              setGeneratedAppreciation(appreciation);
                              setGenerationError(null);
                            } catch (error) {
                              const message =
                                error instanceof Error
                                  ? error.message
                                  : "Impossible de générer l'appréciation.";
                              setGenerationError(message);
                            }
                          });
                        }}
                      >
                        {isGenerating
                          ? "Génération en cours..."
                          : "Voir l'appréciation générale générée"}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isBatching}
                          >
                            {isBatching
                              ? "Génération des 30 élèves..."
                              : "Générer pour 30 élèves"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Confirmer la génération en lot
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action va relancer toutes les requêtes pour
                              récupérer les élèves et générer une appréciation
                              pour chacun (jusqu&apos;à 30). Cela peut prendre
                              quelques minutes et consommer des crédits API
                              supplémentaires. Voulez-vous continuer ?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction asChild>
                              <Button
                                type="button"
                                disabled={isBatching}
                                onClick={() => {
                                  if (!credentials) {
                                    setBatchError(
                                      "Veuillez vous reconnecter pour lancer la génération de lot."
                                    );
                                    return;
                                  }
                                  startBatchGeneration(async () => {
                                    try {
                                      const results =
                                        await generateBatchAppreciations({
                                          credentials,
                                          prompt: promptInstruction,
                                          limit: 30
                                        });
                                      setBatchResults(results);
                                      setBatchError(null);
                                    } catch (error) {
                                      const message =
                                        error instanceof Error
                                          ? error.message
                                          : "Impossible de générer le lot d'appréciations.";
                                      setBatchError(message);
                                    }
                                  });
                                }}
                              >
                                Confirmer
                              </Button>
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardFooter>
                    {generationError && (
                      <CardFooter>
                        <p className="text-sm text-red-600">{generationError}</p>
                      </CardFooter>
                    )}
                    {generatedAppreciation && (
                      <CardContent>
                        <Label className="mb-2 block" htmlFor="generatedText">
                          Appréciation générée
                        </Label>
                        <Textarea
                          id="generatedText"
                          readOnly
                          value={generatedAppreciation}
                          className="min-h-32"
                        />
                      </CardContent>
                    )}
                    {batchError && (
                      <CardFooter>
                        <p className="text-sm text-red-600">{batchError}</p>
                      </CardFooter>
                    )}
                    {batchResults && batchResults.length > 0 && (
                      <CardContent>
                        <Label className="mb-2 block">
                          Appréciations générées pour 30 élèves
                        </Label>
                        <ScrollArea className="max-h-[22rem] rounded-md border border-neutral-100">
                          <div className="space-y-3 p-3 pr-4">
                            {batchResults.map((result) => (
                              <Card key={result.studentId}>
                                <CardHeader className="p-4 pb-2">
                                  <CardTitle className="text-base">
                                    {result.studentName}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0">
                                  <p className="text-sm text-neutral-700">
                                    {result.appreciation}
                                  </p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </main>
  );
}