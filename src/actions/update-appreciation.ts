"use client";

import {
  teacherClassCouncil,
  updateTeacherClassCouncilStudent,
  type TeacherClassCouncilStudentUpdatePayload
} from "pawdirecte-teacher";

import { useAuthStore } from "@/store/auth";

type UpdateStudentAppreciationParams = {
  studentId: number;
  classId: number;
  periodCode: string;
  appreciationText: string;
};

export async function updateStudentAppreciation({
  studentId,
  classId,
  periodCode,
  appreciationText
}: UpdateStudentAppreciationParams) {
  const authStore = useAuthStore.getState();

  if (
    !authStore.session ||
    !authStore.account ||
    !authStore.credentials
  ) {
    throw new Error(
      "Aucune session active. Veuillez vous connecter depuis la page de connexion."
    );
  }

  const session = authStore.session;
  const accountId = authStore.account.id;

  // Fetch the council to get current student data
  const council = await teacherClassCouncil(
    session,
    accountId,
    classId,
    periodCode
  );

  if (!council.students.length) {
    throw new Error("Aucun élève trouvé dans cette classe.");
  }

  // Find the specific student
  const student = council.students.find((s) => s.id === studentId);

  if (!student) {
    throw new Error(
      `Élève avec l'ID ${studentId} introuvable dans cette classe.`
    );
  }

  // Build the update payload
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
      ? {
          ...council.classAppreciation,
          date: new Date()
        }
      : undefined
  };

  // Update the student's appreciation
  const result = await updateTeacherClassCouncilStudent(
    session,
    accountId,
    classId,
    periodCode,
    payload
  );

  return {
    success: true,
    result
  };
}