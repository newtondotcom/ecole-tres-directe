"use server";

import {
  teacherClassCouncil,
  updateTeacherClassCouncilStudent,
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
};

export async function updateStudentAppreciation({
  credentials,
  studentId,
  classId,
  periodCode,
  appreciationText
}: UpdateStudentAppreciationParams) {
  // Re-authenticate to get fresh session
  const { session, account } = await loginUsingCredentials(
    credentials.username,
    credentials.password
  );

  // Fetch the council to get current student data
  const council = await teacherClassCouncil(
    session,
    account.id,
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
    account.id,
    classId,
    periodCode,
    payload
  );

  return {
    success: true,
    result
  };
}