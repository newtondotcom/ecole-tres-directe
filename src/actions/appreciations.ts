"use client";

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

type FetchAppreciationsParams = {
  session: Session;
  account: Account;
};

export async function fetchAppreciationsData({
  session,
  account
}: FetchAppreciationsParams): Promise<AppreciationsServerResult> {
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
}

export async function findFirstPrincipalClass(
  session: Session,
  teacherId: number
): Promise<PrincipalClassSummary> {
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

  throw new Error(
    "Impossible de trouver une classe où vous êtes professeur principal."
  );
}

export async function buildStudentRecap(
  session: Session,
  student: TeacherClassCouncilStudent
): Promise<StudentRecap> {
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
}

function findPeriodWithSummary(grades: TeacherGradesResponse) {
  return grades.periods.find((period) => period.subjectsSummary);
}

