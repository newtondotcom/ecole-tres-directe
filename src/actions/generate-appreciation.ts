"use client";

import * as Sentry from "@sentry/nextjs";
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
import { generateGeneralAppreciation } from "@/actions/mistral";
import { useAuthStore } from "@/store/auth";


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
        tags: { function: "generateBatchAppreciations" }
      });
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
      Sentry.captureException(error, {
        tags: { function: "generateBatchAppreciations" },
        extra: { classId: classSummary.classId }
      });
      throw error;
    }

    const results: GeneratedAppreciation[] = [];

    for (const student of council.students) {
      try {
        const recap = await buildStudentRecap(session, student);
        const appreciation = await generateGeneralAppreciation({
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
        Sentry.captureException(error, {
          tags: { function: "generateBatchAppreciations", step: "student_processing" },
          extra: { studentId: student.id, studentName: `${student.firstName} ${student.lastName}` }
        });
        // Continue with next student instead of failing entire batch
        continue;
      }
    }

    return results;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { function: "generateBatchAppreciations" }
    });
    throw error;
  }
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
    Sentry.captureException(error, {
      tags: { function: "uploadGeneratedAppreciation" },
      extra: { studentId: student.id, classId, periodCode }
    });
    throw error;
  }
}

