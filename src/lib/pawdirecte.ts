import { teacherLevelsList, teacherClassCouncil, teacherGrades, setAccessToken, Session, DoubleAuthRequired, login } from "pawdirecte-teacher";
  
export const uuid = "your-device-uuid";

export async function loginUsingCredentials(
  username: string,
  password: string
) {
  console.info("Initializing a session using credentials...");
  const session: Session = { username, device_uuid: uuid };

  const accounts = await login(session, password).catch(async (error) => {
    // Handle double authentication, if required.
    if (error instanceof DoubleAuthRequired) {
        console.error("Double authentication required.");
    }
    throw error;
  });

  // Grab the first account, and show some information.
  const account = accounts[0];
  setAccessToken(session, account);
  console.log(
    "Logged in to",
    account.firstName,
    account.lastName,
    "from",
    account.schoolName
  );

  return { session, account };
}

export async function validateSession(
  session: Session,
  password: string
) {
  console.info("Validating session with password...");
  
  const accounts = await login(session, password).catch(async (error) => {
    if (error instanceof DoubleAuthRequired) {
      console.error("Double authentication required.");
    }
    throw error;
  });

  const account = accounts[0];
  setAccessToken(session, account);
  console.log(
    "Session validated for",
    account.firstName,
    account.lastName,
    "from",
    account.schoolName
  );

  return { session, account };
}

export async function fullProcedure() {
    const credentials = {
        teacher_username: "test@test.com",
        teacher_password: "test"
    };
  
    const { session, account } = await loginUsingCredentials(
      credentials.teacher_username,
      credentials.teacher_password
    );
  
    const teacherId = account.id;
    const levels = await teacherLevelsList(session, teacherId);
  
    const principalClasses: Array<{
      schoolName: string;
      levelName: string;
      classId: number;
      classLabel: string;
      periodCode: string;
    }> = [];
  
    for (const school of levels.schools) {
      for (const level of school.levels) {
        for (const classItem of level.classes) {
          if (!classItem.isCurrentUserPrincipal) continue;
          const firstPeriod = classItem.periods[0];
          if (!firstPeriod) continue;
          principalClasses.push({
            schoolName: school.label,
            levelName: level.label,
            classId: classItem.id,
            classLabel: classItem.label,
            periodCode: firstPeriod.code
          });
        }
      }
    }
  
    if (!principalClasses.length)
      throw new Error("No class found where the current account is principal teacher.");
  
    const selected = principalClasses[0];
    console.log(
      `Using class ${selected.classLabel} (${selected.levelName}) at ${selected.schoolName}`
    );
  
    const council = await teacherClassCouncil(
      session,
      teacherId,
      selected.classId,
      selected.periodCode
    );
  
    if (!council.students.length)
      throw new Error("No students returned by the class council endpoint.");
  
    const studentMap = new Map<number, string>();
    council.students.forEach((student) => {
      studentMap.set(student.id, `${student.firstName} ${student.lastName}`.trim());
    });
  
    const studentIds = Array.from(studentMap.keys());
    console.log("Tracked student ids:", studentIds);
  
    const allSubjectsAppreciations: Array<{
      studentId: number;
      studentName: string;
      subject: string;
      period: string;
      teachers: string;
      appreciation: string;
    }> = [];
  
    for (const student of council.students) {
      const gradeResponse = await teacherGrades(session, student.id, "");
  
      const summary = gradeResponse.periods[0].subjectsSummary;
      if (!summary) continue;
  
      summary.subjects.forEach((subject) => {
          const text = subject.appreciations[0] ?? "";
          const trimmed = text.trim();
  
          allSubjectsAppreciations.push({
            studentId: student.id,
            studentName: studentMap.get(student.id) ?? `${student.id}`,
            subject: subject.name,
            period: gradeResponse.periods[0].name,
            teachers: subject.teachers.map((teacher) => teacher.name).join(", "),
            appreciation: trimmed
          });
      });
  
  
      for (const subjectAppreciation of allSubjectsAppreciations) {
        console.log(subjectAppreciation.appreciation);
        if (!subjectAppreciation.appreciation) {
          console.log(`########################## NO APPRECIATION FOR ${subjectAppreciation.studentName} - ${subjectAppreciation.subject} - ${subjectAppreciation.period} ##########################`);
          process.exit(1);
        }
      }
      break;
    }
  
    console.log("Collected appreciations:");
    console.log(JSON.stringify(allSubjectsAppreciations, null, 2));
};