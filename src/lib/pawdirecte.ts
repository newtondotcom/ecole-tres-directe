import { teacherLevelsList, teacherClassCouncil, teacherGrades, setAccessToken, Session, DoubleAuthRequired, login } from "pawdirecte-teacher";
  
export const uuid = "your-device-uuid";

async function setupGtkToken() {
  await new Promise<void>((resolve, reject) => {
      const handleMessage = (event: { data: { type: string; payload: any; }; }) => {
          if (event.data && event.data.type === "EDPU_MESSAGE") {
              window.removeEventListener("message", handleMessage);
              const message = event.data.payload;
              console.log(message);
              if (message.action === "gtkRulesUpdated") {
                  resolve();
              } else if (message.action === "noGtkCookie" || message.action === "noCookie") {
                  reject(new Error("EDPUNoCookie"));
              }
          }
      }

      window.addEventListener("message", handleMessage);
      fetch(`https://api.ecoledirecte.com/v3/login.awp?gtk=1&v=4.69.1`)
          .then(() => {
              setTimeout(() => {
                  window.removeEventListener("message", handleMessage);
                  reject(new Error("NoEDPUResponse"));
              }, 3000);
          })
          .catch(() => {
              if (navigator.onLine)
                  // the error is probably due to the extension not being installed
                  throw new Error("EDPUNotInstalled");
          });
  }).catch((error) => {
      console.error(error);
      throw error;
  });
}

export async function loginUsingCredentials(
  username: string,
  password: string
) {
  console.info("Initializing a session using credentials...");

  try {
    await setupGtkToken();
} catch (error) {
    console.error(error);
    console.log("Échec de la connexion");
    if (error instanceof Error && error.message === "NoEDPUResponse") {
        console.log("Nous n'avons pas réussi à communiquer avec l'extension EDP Unblock, vérifiez qu'elle soit à jour et/ou qu'elle ait les permissions nécessaires.");
    } else if (error instanceof Error && error.message === "EDPUNoCookie") {
        console.log("L'extension EDP Unblock n'a pas réussi à accéder aux cookies nécessaires pour votre connexion, vérifiez qu'elle soit à jour et/ou qu'elle ait les permissions nécessaires.");
    } else if (error instanceof Error && error.message === "EDPUNotInstalled") {
        console.log("L'extension EDP Unblock n'est pas installée, veuillez l'installer.");
    } else {
        console.log("Il y a eu un problème lors de l'obtention des cookies nécessaires à votre connexion, réessayez plus tard.");
    }
    throw new Error("LoginFailed");
}

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