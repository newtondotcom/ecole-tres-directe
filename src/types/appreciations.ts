export type Credentials = {
  username: string;
  password: string;
};

export type PrincipalClassSummary = {
  schoolName: string;
  levelName: string;
  classId: number;
  classLabel: string;
  periodCode: string;
};

export type SubjectAppreciation = {
  subjectName: string;
  teachers: string;
  appreciation: string;
};

export type StudentRecap = {
  studentId: number;
  studentName: string;
  studentFirstName: string;
  studentGender: "M" | "F";
  periodName: string;
  subjects: SubjectAppreciation[];
};

export type StudentSummary = {
  id: number;
  firstName: string;
  lastName: string;
};

export type AppreciationsServerResult = {
  classSummary: PrincipalClassSummary;
  students: StudentSummary[];
  firstStudentRecap: StudentRecap;
};

export type GeneratedAppreciation = {
  studentId: number;
  studentName: string;
  appreciation: string;
};

