"use server";

import * as Sentry from "@sentry/nextjs";
import type {
  SubjectAppreciation
} from "@/types/appreciations";
import { DEFAULT_APPRECIATION, DEFAULT_PROMPT } from "@/actions/appreciations";

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

type GenerateAppreciationParams = {
  prompt: string;
  subjects: SubjectAppreciation[];
  studentFirstName: string;
  studentGender: "M" | "F";
  userAppreciations?: string;
};

export async function generateGeneralAppreciation({
  prompt,
  subjects,
  studentFirstName,
  studentGender,
  userAppreciations
}: GenerateAppreciationParams) {
  try {
    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
      const error = new Error(
        "La clé MISTRAL_API_KEY est manquante dans les variables d'environnement."
      );
      Sentry.captureException(error, {
        tags: { function: "generateGeneralAppreciation" }
      });
      throw error;
    }

    if (!subjects.length) {
      const error = new Error(
        "Impossible de générer l'appréciation sans données de matières."
      );
      Sentry.captureException(error, {
        tags: { function: "generateGeneralAppreciation" }
      });
      throw error;
    }

    const placeholderName = studentGender === "F" ? "Marie" : "Pierre";
    const nameTransformer = createNameTransformer(
      studentFirstName,
      placeholderName
    );
    const sanitizedPrompt = nameTransformer.anonymize(prompt ?? "");
    const sanitizedSubjects = subjects.map((subject) => ({
      ...subject,
      appreciation: nameTransformer.anonymize(subject.appreciation)
    }));

    const messages = [
      {
        role: "system",
        content:
          "Tu es un professeur principal français. Tu rédiges des appréciations globales synthétiques en te basant sur les appréciations matières existantes."
      },
      {
        role: "user",
        content: buildUserPrompt(sanitizedPrompt, sanitizedSubjects, userAppreciations)
      }
    ];

    const response = await fetch(MISTRAL_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages,
        temperature: 0.4,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const details = await response.text();
      const error = new Error(
        `Échec de la génération de l'appréciation (code ${response.status}): ${details}`
      );
      Sentry.captureException(error, {
        tags: { function: "generateGeneralAppreciation" },
        extra: { status: response.status, details }
      });
      throw error;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      const error = new Error(
        "La réponse de Mistral ne contient pas de contenu exploitable."
      );
      Sentry.captureException(error, {
        tags: { function: "generateGeneralAppreciation" },
        extra: { responseData: data }
      });
      throw error;
    }

    try {
      return nameTransformer.deanonymize(sanitizeAppreciation(content));
    } catch (error) {
      Sentry.captureException(error, {
        tags: { function: "generateGeneralAppreciation" },
        extra: { content }
      });
      throw error;
    }
  } catch (error) {
    if (error instanceof Error) {
      Sentry.captureException(error, {
        tags: { function: "generateGeneralAppreciation" },
        extra: { studentFirstName, studentGender, subjectsCount: subjects.length }
      });
    }
    throw error;
  }
}

function buildUserPrompt(prompt: string, subjects: SubjectAppreciation[], userAppreciations?: string) {
  const instruction = prompt?.trim()
    ? prompt.trim()
    : DEFAULT_PROMPT;

  const subjectsSummary = subjects
    .map((subject) => {
      const lines = [
        `- Matière: ${subject.subjectName}`,
        subject.teachers ? `  Enseignant(s): ${subject.teachers}` : null,
        subject.appreciation
          ? `  Appréciation: ${subject.appreciation}`
          : "  Appréciation: (vide)"
      ].filter(Boolean);
      return lines.join("\n");
    })
    .join("\n");

  const styleExamples = userAppreciations?.trim() || DEFAULT_APPRECIATION;

  return `Consigne: ${instruction}

Contraintes de sortie:
- Le texte doit être une seule appréciation générale (1 à 3 phrases assez courtes en maximum 300 caractères).
- Aucune phrase introductive ou conclusion de type "Voici..." ou "En résumé".
- Pas de mise en forme Markdown ni de caractères gras (**).
- Réponds uniquement avec l'appréciation finale, rien d'autre.

Voici les appréciations matières existantes pour l'élève :
${subjectsSummary}

Inspires toi des appréciations suivantes pour le style :
${styleExamples}

Rédige l'appréciation conforme aux contraintes.`;
}

function sanitizeAppreciation(raw: string) {
  return raw.replace(/\*\*/g, "").trim();
}



type NameTransformer = {
  anonymize: (value: string) => string;
  deanonymize: (value: string) => string;
};

function createNameTransformer(
  studentFirstName: string,
  placeholderName: string
): NameTransformer {
  const trimmedStudentName = studentFirstName.trim();

  if (!trimmedStudentName) {
    return {
      anonymize: (value: string) => value,
      deanonymize: (value: string) => value
    };
  }

  const studentPattern = new RegExp(escapeRegExp(trimmedStudentName), "gi");
  const placeholderPattern = new RegExp(escapeRegExp(placeholderName), "gi");

  return {
    anonymize: (value: string) =>
      replaceWithMatchedCase(value, studentPattern, placeholderName),
    deanonymize: (value: string) =>
      replaceWithMatchedCase(value, placeholderPattern, trimmedStudentName)
  };
}

function replaceWithMatchedCase(
  value: string,
  pattern: RegExp,
  replacement: string
) {
  if (!value) {
    return value;
  }

  pattern.lastIndex = 0;
  return value.replace(pattern, (match) =>
    applyCasePattern(match, replacement)
  );
}

function applyCasePattern(source: string, target: string) {
  if (!source) {
    return target;
  }

  const isUpperCase = source === source.toUpperCase();
  const isLowerCase = source === source.toLowerCase();
  const isCapitalized =
    source[0] === source[0].toUpperCase() &&
    source.slice(1) === source.slice(1).toLowerCase();

  if (isUpperCase) {
    return target.toUpperCase();
  }

  if (isLowerCase) {
    return target.toLowerCase();
  }

  if (isCapitalized) {
    return target.charAt(0).toUpperCase() + target.slice(1).toLowerCase();
  }

  return target;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}