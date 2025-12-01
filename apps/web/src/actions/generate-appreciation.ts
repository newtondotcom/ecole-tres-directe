"use client";

import {
  teacherClassCouncil,
  updateTeacherClassCouncilStudent,
  type Session,
  type TeacherClassCouncil,
  type TeacherClassCouncilStudent,
  type TeacherClassCouncilStudentUpdatePayload
} from "pawdirecte-teacher";

import {
  buildStudentRecap,
  findFirstPrincipalClass
} from "@/actions/appreciations";
import type { GeneratedAppreciation } from "@/types/appreciations";
import { useAuthStore } from "@/stores/auth";
import { trpcClient } from "@/utils/trpc";


type GenerateBatchParams = {
  prompt: string;
  userAppreciations?: string;
  onProgress?: (result: GeneratedAppreciation) => void;
};

export async function generateBatchAppreciations({
  prompt,
  userAppreciations,
  onProgress
}: GenerateBatchParams): Promise<GeneratedAppreciation[]> {
  const authStore = useAuthStore.getState();

  if (
    !authStore.session ||
    !authStore.account ||
    !authStore.credentials
  ) {
    const error = new Error(
      "Aucune session active. Veuillez vous connecter depuis la page de connexion."
    );
    throw error;
  }

  const session = authStore.session;
  const account = authStore.account;

  const classSummary = await findFirstPrincipalClass(session, account.id);
  const council = await teacherClassCouncil(
    session,
    account.id,
    classSummary.classId,
    classSummary.periodCode
  );

  if (!council.students.length) {
    const error = new Error("Aucun élève trouvé pour cette classe.");
    throw error;
  }

  const results: GeneratedAppreciation[] = [];

  for (const student of council.students) {
    try {
      const recap = await buildStudentRecap(session, student);
      const appreciation = await trpcClient.mistral.generateAppreciation.mutate({
        prompt,
        subjects: recap.subjects,
        studentFirstName: student.firstName,
        studentGender: student.gender,
        userAppreciations: userAppreciations || undefined
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

      const result: GeneratedAppreciation = {
        studentId: recap.studentId,
        studentName: recap.studentName,
        appreciation
      };
      results.push(result);
      
      // Notify progress callback if provided
      if (onProgress) {
        onProgress(result);
      }
    } catch (error) {
      console.error(error);
      // Continue with next student instead of failing entire batch
      continue;
    }
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
  try {
    const studentIndex = council.students.findIndex((s) => s.id === student.id);
    const isFirst = studentIndex === 0;
    const isLast = studentIndex === council.students.length - 1;
    const payload: TeacherClassCouncilStudentUpdatePayload = {
      student: {
        ...student,
        appreciationPrincipalTeacher: {
          ...student.appreciationPrincipalTeacher,
          text: appreciationText.trim(),
          date: new Date()
        },
        isFirst: isFirst,
        isLast: isLast,
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
  } catch (error) {
    console.error(error);
  }
}

