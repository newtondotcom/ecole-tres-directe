"use client";

import { type FormEvent, useState } from "react";

import {
  type Step,
  useAppreciationsStore
} from "../../store/appreciations";

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await authenticate({ username, password });
  };

  const disableSubmit = !username || !password || isLoading;

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <header>
        <h1 className="text-3xl font-semibold">Remplir les appréciations</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Connectez-vous pour récupérer votre classe principale et afficher le
          premier récapitulatif d&apos;appréciations.
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 p-6 shadow-sm">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label
              className="text-sm font-medium text-neutral-700"
              htmlFor="username"
            >
              Nom d&apos;utilisateur
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none"
              placeholder="professeur@ecole.fr"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1">
            <label
              className="text-sm font-medium text-neutral-700"
              htmlFor="password"
            >
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-900 focus:outline-none"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={disableSubmit}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-400"
            >
              {isLoading ? "Connexion..." : "Se connecter"}
            </button>
            {(step === "ready" || step === "error") && (
              <button
                type="button"
                onClick={reset}
                className="text-sm font-medium text-neutral-500 underline-offset-2 hover:underline"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </form>

        {error && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-neutral-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Étapes</h2>
        <div className="mt-4 grid gap-2">
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
                {isCurrent && <span className="text-neutral-500">En cours</span>}
                {isCompleted && <span className="text-green-600">OK</span>}
              </div>
            );
          })}
        </div>
      </section>

      {classSummary && (
        <section className="rounded-lg border border-neutral-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Classe principale</h2>
          <p className="mt-2 text-sm text-neutral-600">
            {classSummary.classLabel} · {classSummary.levelName} ·{" "}
            {classSummary.schoolName}
          </p>
          {students && (
            <p className="mt-1 text-sm text-neutral-500">
              {students.length} élèves récupérés.
            </p>
          )}
        </section>
      )}

      {firstStudentRecap && (
        <section className="rounded-lg border border-neutral-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            Appréciations du premier élève
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            {firstStudentRecap.studentName} — {firstStudentRecap.periodName}
          </p>

          <div className="mt-4 space-y-4">
            {firstStudentRecap.subjects.map((subject) => (
              <article
                key={`${subject.subjectName}-${subject.teachers}`}
                className="rounded-md border border-neutral-200 p-4"
              >
                <h3 className="text-sm font-semibold">{subject.subjectName}</h3>
                {subject.teachers && (
                  <p className="text-xs text-neutral-500">{subject.teachers}</p>
                )}
                <p className="mt-3 text-sm text-neutral-700">
                  {subject.appreciation || "Aucune appréciation disponible."}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}