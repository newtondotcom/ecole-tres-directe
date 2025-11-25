"use client";

import { type FormEvent, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import {
  type Step,
  useAppreciationsStore
} from "../../store/appreciations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    reset
  } = useAppreciationsStore();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [promptInstruction, setPromptInstruction] = useState("");
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
                        Appercu de la rédaction de l&apos;appréciation générale
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
                          placeholder='Ex: "Rédige ces appréciations avec un ton encourageant si la moyenne est bonne."'
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
                    <CardFooter className="justify-end">
                      <Button>Voir l&apos;appréciation générale générée</Button>
                    </CardFooter>
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