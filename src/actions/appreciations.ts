"use client";

import * as Sentry from "@sentry/nextjs";
import {
  teacherClassCouncil,
  teacherGrades,
  teacherLevelsList,
  type Session,
  type Account,
  type TeacherClassCouncilStudent,
  type TeacherGradesResponse
} from "pawdirecte-teacher";

import type {
  AppreciationsServerResult,
  PrincipalClassSummary,
  StudentRecap,
  SubjectAppreciation,
  StudentSummary
} from "@/types/appreciations";

export const DEFAULT_APPRECIATION = `
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
`;

export const DEFAULT_PROMPT = "Rédige une appréciation globale encourageante et précise, avec un ton neutre et un vocabulaire accessible.";

type FetchAppreciationsParams = {
  session: Session;
  account: Account;
};

export async function fetchAppreciationsData({
  session,
  account
}: FetchAppreciationsParams): Promise<AppreciationsServerResult> {
  try {
    const classSummary = await findFirstPrincipalClass(session, account.id);

    const council = await teacherClassCouncil(
      session,
      account.id,
      classSummary.classId,
      classSummary.periodCode
    );

    if (!council.students.length) {
      const error = new Error("Aucun élève trouvé pour cette classe.");
      Sentry.captureException(error, {
        tags: { function: "fetchAppreciationsData" },
        extra: { classId: classSummary.classId, periodCode: classSummary.periodCode }
      });
      throw error;
    }

    const students: StudentSummary[] = council.students.map((student) => ({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName
    }));

    const firstStudentRecap = await buildStudentRecap(session, council.students[0]);

    return {
      classSummary,
      students,
      firstStudentRecap,
      session,
      account
    };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { function: "fetchAppreciationsData" },
      extra: { accountId: account.id }
    });
    throw error;
  }
}

export async function findFirstPrincipalClass(
  session: Session,
  teacherId: number
): Promise<PrincipalClassSummary> {
  try {
    const levels = await teacherLevelsList(session, teacherId);

    for (const school of levels.schools) {
      for (const level of school.levels) {
        for (const classItem of level.classes) {
          if (!classItem.isCurrentUserPrincipal) continue;
          const period = classItem.periods[0];
          if (!period) continue;
          return {
            schoolName: school.label,
            levelName: level.label,
            classId: classItem.id,
            classLabel: classItem.label,
            periodCode: period.code
          };
        }
      }
    }

    const error = new Error(
      "Impossible de trouver une classe où vous êtes professeur principal."
    );
    Sentry.captureException(error, {
      tags: { function: "findFirstPrincipalClass" },
      extra: { teacherId }
    });
    throw error;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { function: "findFirstPrincipalClass" },
      extra: { teacherId }
    });
    throw error;
  }
}

export async function buildStudentRecap(
  session: Session,
  student: TeacherClassCouncilStudent
): Promise<StudentRecap> {
  try {
    const gradesResponse = await teacherGrades(session, student.id, "");
    const period = findPeriodWithSummary(gradesResponse);
    const periodName = period?.name ?? "Période inconnue";
    const subjects = period?.subjectsSummary?.subjects ?? [];

    const formattedSubjects: SubjectAppreciation[] = subjects.map((subject) => ({
      subjectName: subject.name,
      teachers: (subject.teachers ?? [])
        .map((teacher) => teacher.name)
        .filter(Boolean)
        .join(", "),
      appreciation: (subject.appreciations?.[0] ?? "").trim()
    }));

    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`.trim(),
      studentFirstName: student.firstName,
      studentGender: student.gender,
      periodName,
      subjects: formattedSubjects
    };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { function: "buildStudentRecap" },
      extra: { studentId: student.id, studentName: `${student.firstName} ${student.lastName}` }
    });
    throw error;
  }
}

function findPeriodWithSummary(grades: TeacherGradesResponse) {
  return grades.periods.find((period) => period.subjectsSummary);
}

