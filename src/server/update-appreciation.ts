import { TeacherClassCouncilStudentUpdatePayload, updateTeacherClassCouncilStudent } from "pawdirecte-teacher";

export async function generateGeneralAppreciation(){
const council = await teacherClassCouncil(session, teacherId, classId, periodId);
if (!council.students.length) {
  throw new Error("No students returned by the class council endpoint.");
}

const [student] = council.students;
const payload : TeacherClassCouncilStudentUpdatePayload = {
  student: {
    ...student,
    appreciationPrincipalTeacher: {
      ...student.appreciationPrincipalTeacher,
      text: `Updated via example on ${new Date().toISOString()}`,
      date: new Date()
    },
  },
  classAppreciation: {
    ...council.classAppreciation,
    date: new Date()
  }
};

const result = await updateTeacherClassCouncilStudent(
  session,
  teacherId,
  classId,
  periodId,
  payload
);

}