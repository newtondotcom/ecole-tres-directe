"use server";

import type { SubjectAppreciation } from "@/types/appreciations";

const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

type GenerateAppreciationParams = {
  prompt: string;
  subjects: SubjectAppreciation[];
};

export async function generateGeneralAppreciation({
  prompt,
  subjects
}: GenerateAppreciationParams) {
  const apiKey = process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    throw new Error(
      "La clé MISTRAL_API_KEY est manquante dans les variables d'environnement."
    );
  }

  if (!subjects.length) {
    throw new Error(
      "Impossible de générer l'appréciation sans données de matières."
    );
  }

  const messages = [
    {
      role: "system",
      content:
        "Tu es un professeur principal français. Tu rédiges des appréciations globales synthétiques en te basant sur les appréciations matières existantes."
    },
    {
      role: "user",
      content: buildUserPrompt(prompt, subjects)
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
    throw new Error(
      `Échec de la génération de l'appréciation (code ${response.status}): ${details}`
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error(
      "La réponse de Mistral ne contient pas de contenu exploitable."
    );
  }

  return sanitizeAppreciation(content);
}

function buildUserPrompt(prompt: string, subjects: SubjectAppreciation[]) {
  const instruction = prompt?.trim()
    ? prompt.trim()
    : "Rédige une appréciation globale encourageante et précise, avec un ton neutre et un vocabulaire accessible.";

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

  return `Consigne: ${instruction}

Contraintes de sortie:
- Le texte doit être une seule appréciation générale (1 à 3 phrases assez courtes en maximum 300 caractères).
- Aucune phrase introductive ou conclusion de type "Voici..." ou "En résumé".
- Pas de mise en forme Markdown ni de caractères gras (**).
- Réponds uniquement avec l'appréciation finale, rien d'autre.

Voici les appréciations matières existantes pour l'élève :
${subjectsSummary}

Inspires toi des appréciations suivantes pour le style :
Un trimestre avec des résultats hétérogènes pour Adam. Vous produisez un travail sérieux manquant de régularité dans certaines disciplines. Vous avez montré une belle implication en classe soulignée par plusieurs professeurs, il faut maintenant l'étendre à toutes les disciplines. Allez Adam !
Un deuxième trimestre dans la continuité du premier au niveau des résultats. La participation est active et Louis est davantage impliqué en classe. Cependant, des efforts sont toujours attendus quant à votre concentration et attitude qui se montrent trop fluctuantes. Le travail personnel est sérieux, mais se doit de gagner en rigueur afin de progresser.
Un deuxième trimestre avec des résultats satisfaisants. La participation de Gabriel en classe est appréciée, mais est, dans certaines disciplines, effacée par un comportement qui n'est pas toujours au travail. Le travail fourni est satisfaisant. Pour autant, nous sommes convaincus que vous avez encore la capacité de progresser en approfondissant le travail personnel.

Rédige l'appréciation conforme aux contraintes.`;
}

function sanitizeAppreciation(raw: string) {
  return raw.replace(/\*\*/g, "").trim();
}

