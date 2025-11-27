"use client";

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
} from "@/actions/appreciations";
import type {
  Credentials,
  GeneratedAppreciation,
} from "@/types/appreciations";
import { generateGeneralAppreciation } from "@/actions/mistral";


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
  const results: GeneratedAppreciation[] = [];

  for (const student of selectedStudents) {
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

    results.push({
      studentId: recap.studentId,
      studentName: recap.studentName,
      appreciation
    });
  }

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

