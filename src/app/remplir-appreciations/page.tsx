"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";

import {
  type Step,
  useAppreciationsStore
} from "@/store/appreciations";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
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
  generateBatchAppreciations
} from "@/actions/generate-appreciation";
import { updateStudentAppreciation } from "@/actions/update-appreciation";
import type { GeneratedAppreciation } from "@/types/appreciations";
import { DEFAULT_APPRECIATION, DEFAULT_PROMPT } from "@/actions/appreciations";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { generateGeneralAppreciation } from "@/actions/mistral";

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
    getAppreciationsData,
    reset
  } = useAppreciationsStore();
  const authStore = useAuthStore();

  const [promptInstruction, setPromptInstruction] = useState("");
  const [userAppreciations, setUserAppreciations] = useState("");
  const [generatedAppreciation, setGeneratedAppreciation] = useState("");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGenerating, startGeneration] = useTransition();
  const [batchResults, setBatchResults] = useState<GeneratedAppreciation[] | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [isBatching, startBatchGeneration] = useTransition();
  const [isUploading, startUpload] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const hasRecap = Boolean(firstStudentRecap);
  const isAuthenticated = authStore.isAuthenticated;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold">Remplir les appréciations</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Après vous être connecté depuis la page dédiée, récupérez votre classe
          principale et générez vos appréciations en quelques clics.
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
                  <CardTitle>Récupération des données</CardTitle>
                  <CardDescription>
                    Lancez la synchronisation de vos classes et de vos élèves.
                    L’authentification se fait depuis la page de connexion.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isAuthenticated ? (
                    <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                      Connecté en tant que{" "}
                      <span className="font-semibold">
                        {authStore.account?.firstName}{" "}
                        {authStore.account?.lastName}
                      </span>
                      .
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-md border border-dashed border-amber-400 bg-amber-50 px-3 py-3 text-sm text-amber-700">
                      <p>
                        Aucune session active. Veuillez vous authentifier via la{" "}
                        <Link className="underline" href="/login">
                          page de connexion
                        </Link>{" "}
                        avant de lancer la récupération.
                      </p>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/login">Aller à la page de connexion</Link>
                      </Button>
                    </div>
                  )}
                  {error && (
                    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {error}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={getAppreciationsData}
                    disabled={!isAuthenticated || isLoading}
                    className="flex-1"
                  >
                    {isLoading ? "Chargement…" : "Charger ma classe principale"}
                  </Button>
                  {(step === "ready" || step === "error") && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={reset}
                      className="flex-1"
                      disabled={isLoading}
                    >
                      Réinitialiser
                    </Button>
                  )}
                </CardFooter>
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
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="prompt">
                          <AccordionTrigger>Consigne pour la rédaction</AccordionTrigger>
                          <AccordionContent>
                            <Textarea
                              id="prompt"
                              placeholder={DEFAULT_PROMPT}
                              rows={3}
                              value={promptInstruction}
                              onChange={(event) =>
                                setPromptInstruction(event.target.value)
                              }
                            />
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="appreciations">
                          <AccordionTrigger>Appréciations de référence</AccordionTrigger>
                          <AccordionContent>
                            <Label htmlFor="user-appreciations" className="mb-2 block">
                              Collez ici vos appréciations pour servir de modèle de style
                            </Label>
                            <Textarea
                              id="user-appreciations"
                              placeholder={DEFAULT_APPRECIATION}
                              rows={8}
                              value={userAppreciations}
                              onChange={(event) =>
                                setUserAppreciations(event.target.value)
                              }
                            />
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="test">
                          <AccordionTrigger>Test de génération</AccordionTrigger>
                          <AccordionContent className="space-y-4">
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
                                        subjects: firstStudentRecap.subjects,
                                        studentFirstName: firstStudentRecap.studentFirstName,
                                        studentGender: firstStudentRecap.studentGender,
                                        userAppreciations: userAppreciations || undefined
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
                              className="w-full"
                            >
                              {isGenerating
                                ? "Génération en cours..."
                                : "Voir l'appréciation générale générée pour le premier élève"}
                            </Button>
                            {generationError && (
                              <p className="text-sm text-red-600">{generationError}</p>
                            )}
                            {generatedAppreciation && (
                              <div className="space-y-2">
                                <Label className="mb-2 block" htmlFor="generatedText">
                                  Appréciation générée
                                </Label>
                                <Textarea
                                  id="generatedText"
                                  readOnly
                                  value={generatedAppreciation}
                                  className="min-h-32"
                                />
                                <Button
                                  type="button"
                                  disabled={
                                    isUploading ||
                                    !authStore.session ||
                                    !authStore.account ||
                                    !classSummary ||
                                    !firstStudentRecap
                                  }
                                  onClick={() => {
                                    if (
                                      !authStore.session ||
                                      !authStore.account ||
                                      !classSummary ||
                                      !firstStudentRecap
                                    ) {
                                      setUploadError(
                                        "Données manquantes pour l'upload."
                                      );
                                      return;
                                    }
                                    startUpload(async () => {
                                      try {
                                        setUploadError(null);
                                        setUploadSuccess(false);
                                        await updateStudentAppreciation({
                                          studentId: firstStudentRecap.studentId,
                                          classId: classSummary.classId,
                                          periodCode: classSummary.periodCode,
                                          appreciationText: generatedAppreciation
                                        });
                                        setUploadSuccess(true);
                                      } catch (error) {
                                        const message =
                                          error instanceof Error
                                            ? error.message
                                            : "Impossible d'uploader l'appréciation.";
                                        setUploadError(message);
                                        setUploadSuccess(false);
                                      }
                                    });
                                  }}
                                  className="w-full"
                                >
                                  {isUploading
                                    ? "Upload en cours..."
                                    : "Uploader l'appréciation"}
                                </Button>
                                {uploadError && (
                                  <p className="text-sm text-red-600">{uploadError}</p>
                                )}
                                {uploadSuccess && (
                                  <p className="text-sm text-green-600">
                                    Appréciation uploadée avec succès !
                                  </p>
                                )}
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                    <CardFooter className="flex flex-wrap items-center justify-end gap-3">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="destructive"
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
                                  startBatchGeneration(async () => {
                                    try {
                                      const results =
                                        await generateBatchAppreciations({
                                          prompt: promptInstruction,
                                          userAppreciations: userAppreciations || undefined,
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