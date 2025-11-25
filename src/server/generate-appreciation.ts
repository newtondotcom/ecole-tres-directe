"use server";

import {
  teacherClassCouncil,
  updateTeacherClassCouncilStudent,
  type Session,
  type TeacherClassCouncil,
  type TeacherClassCouncilStudent,
  type TeacherClassCouncilStudentUpdatePayload
} from "pawdirecte-teacher";

import { loginUsingCredentials } from "@/lib/pawdirecte";
import {
  buildStudentRecap,
  findFirstPrincipalClass
} from "@/server/appreciations";
import type {
  Credentials,
  GeneratedAppreciation,
  SubjectAppreciation
} from "@/types/appreciations";

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
Manon est une élève très investie, qui travaille avec l'envie de bien faire. Elle rencontre des difficultés dans certaines matières, notamment dans la restitution des connaissances. Un approfondissement des leçons semble indispensable pour lui permettre de progresser et consolider durablement ses acquis. Nous l'encourageons à croire davantage en ses capacités. L'erreur n'est pas un échec.
Excellents résultats pour ce premier trimestre. Gaspard s'implique avec sérieux et rigueur dans son travail. Nous l'encourageons à continuer sur cette voie, et à s'exprimer davantage à l'oral au second trimestre.
Un excellent trimestre qui clôture une année de cinquième réussie ! Bravo, Mathis, pour votre travail et votre investissement en classe. Poursuivez ainsi !
Adam a des capacités de travail qu'il pourrait mieux exploiter par une plus grande concentration en cours et une rigueur plus soutenue à l'écrit. Nous attendons des efforts en ce sens au prochain trimestre.
Bravo pour cet excellent trimestre, Héloïse. Vos capacités sont parfaitement mises en valeur par un travail sérieux et un investissement régulier en classe. Félicitations ! Poursuivez ainsi !
Un ensemble irrégulier malgré de belles réussites. Si dans certaines matières les professeurs louent votre travail et votre investissement, dans d'autres disciplines vos enseignants vous demandent de refaire les exercices, revoir les cours et vous montrer bien concentré. Suivez bien ces conseils pour progresser Maximilien c'est indispensable pour la prochaine période
Très bons résultats. Kenzo est un élève vif et pertinent mais il doit apprendre à canaliser ses prises de parole: cela sera bénéfique pour lui comme pour ses camarades. Nous comptons sur ses efforts.
Ensemble tout à fait satisfaisant. Carla travaille avec sérieux mais peut encore progresser en généralisant les efforts de participation à toutes les matières. Nous comptons sur elle pour tenir compte de ces conseils.
Un premier trimestre encourageant.La maîtrise des connaissances et des compétences est très satisfaisante. Lucas doit montrer son implication en restant concentré. Nous l'encourageons dans cette voie.
Très bonne entrée en classe de 6ème pour Ombline. Le niveau d'ensemble témoigne d'un investissement sérieux et réfléchi. Nous vous invitons à tenir compte des remarques de vos professeurs qui vous conseillent de participer davantage à l'oral. Vos connaissances sont solides, osez donc les partager avec l'ensemble de la classe pour continuer à gagner en confiance.
Un beau premier trimestre.La maîtrise des connaissances et des compétences est très satisfaisante. Martin s'investit avec sérieux et doit poursuivre ainsi tout en s'affirmant plus régulièrement à l'oral.

Rédige l'appréciation conforme aux contraintes.`;
}

function sanitizeAppreciation(raw: string) {
  return raw.replace(/\*\*/g, "").trim();
}

type GenerateBatchParams = {
  credentials: Credentials;
  prompt: string;
  limit?: number;
};

export async function generateBatchAppreciations({
  credentials,
  prompt,
  limit = 30
}: GenerateBatchParams): Promise<GeneratedAppreciation[]> {
  const { session, account } = await loginUsingCredentials(
    credentials.username,
    credentials.password
  );

  const classSummary = await findFirstPrincipalClass(session, account.id);
  const council = await teacherClassCouncil(
    session,
    account.id,
    classSummary.classId,
    classSummary.periodCode
  );

  if (!council.students.length) {
    throw new Error("Aucun élève trouvé pour cette classe.");
  }

  const selectedStudents = council.students.slice(0, limit);

  // Traiter tous les élèves en parallèle
  const studentPromises = selectedStudents.map(async (student) => {
    try {
      const recap = await buildStudentRecap(session, student);
      const appreciation = await generateGeneralAppreciation({
        prompt,
        subjects: recap.subjects
      });

      await uploadGeneratedAppreciation({
        session,
        teacherId: account.id,
        classId: classSummary.classId,
        periodCode: classSummary.periodCode,
        council,
        student,
        appreciationText: appreciation
      });

      return {
        studentId: recap.studentId,
        studentName: recap.studentName,
        appreciation
      };
    } catch (error) {
      // En cas d'erreur, retourner un résultat avec l'erreur pour ne pas bloquer les autres
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`.trim(),
        appreciation: `[ERREUR: ${errorMessage}]`
      };
    }
  });

  const results = await Promise.all(studentPromises);
  return results;
}

type UploadGeneratedAppreciationParams = {
  session: Session;
  teacherId: number;
  classId: number;
  periodCode: string;
  council: TeacherClassCouncil;
  student: TeacherClassCouncilStudent;
  appreciationText: string;
};

async function uploadGeneratedAppreciation({
  session,
  teacherId,
  classId,
  periodCode,
  council,
  student,
  appreciationText
}: UploadGeneratedAppreciationParams) {
  const payload: TeacherClassCouncilStudentUpdatePayload = {
    student: {
      ...student,
      appreciationPrincipalTeacher: {
        ...student.appreciationPrincipalTeacher,
        text: appreciationText.trim(),
        date: new Date()
      }
    },
    classAppreciation: council.classAppreciation
      ? { ...council.classAppreciation, date: new Date() }
      : undefined
  };

  await updateTeacherClassCouncilStudent(
    session,
    teacherId,
    classId,
    periodCode,
    payload
  );
}

