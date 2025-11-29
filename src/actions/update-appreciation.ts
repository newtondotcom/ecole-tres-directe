"use client";

import * as Sentry from "@sentry/nextjs";
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
  try {
    const authStore = useAuthStore.getState();

    if (
      !authStore.session ||
      !authStore.account ||
      !authStore.credentials
    ) {
      const error = new Error(
        "Aucune session active. Veuillez vous connecter depuis la page de connexion."
      );
      Sentry.captureException(error, {
        tags: { function: "updateStudentAppreciation" }
      });
      throw error;
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
      const error = new Error("Aucun élève trouvé dans cette classe.");
      Sentry.captureException(error, {
        tags: { function: "updateStudentAppreciation" },
        extra: { classId, periodCode }
      });
      throw error;
    }

    // Find the specific student
    const student = council.students.find((s) => s.id === studentId);

    if (!student) {
      const error = new Error(
        `Élève avec l'ID ${studentId} introuvable dans cette classe.`
      );
      Sentry.captureException(error, {
        tags: { function: "updateStudentAppreciation" },
        extra: { studentId, classId, periodCode }
      });
      throw error;
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
  } catch (error) {
    Sentry.captureException(error, {
      tags: { function: "updateStudentAppreciation" },
      extra: { studentId, classId, periodCode }
    });
    throw error;
  }
}