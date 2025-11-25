"use server";

import {
  teacherClassCouncil,
  updateTeacherClassCouncilStudent,
  type Session,
  type TeacherClassCouncilStudentUpdatePayload
} from "pawdirecte-teacher";

import { loginUsingCredentials } from "@/lib/pawdirecte";
import type { Credentials } from "@/types/appreciations";

type UpdateStudentAppreciationParams = {
  credentials: Credentials;
  studentId: number;
  classId: number;
  periodCode: string;
  appreciationText: string;
  // Optional: if session and account are provided, skip re-authentication
  session?: Session;
  accountId?: number;
};

export async function updateStudentAppreciation({
  credentials,
  studentId,
  classId,
  periodCode,
  appreciationText,
  session: providedSession,
  accountId: providedAccountId
}: UpdateStudentAppreciationParams) {
  // Re-authenticate only if session not provided
  let session: Session;
  let accountId: number;

  if (providedSession && providedAccountId) {
    session = providedSession;
    accountId = providedAccountId;
  } else {
    const { session: newSession, account } = await loginUsingCredentials(
      credentials.username,
      credentials.password
    );
    session = newSession;
    accountId = account.id;
  }

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