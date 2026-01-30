import { setAccessToken, type Session, DoubleAuthRequired, login } from "pawdirecte-teacher";
  
export const uuid = "your-device-uuid";

export async function loginUsingCredentials(
  username: string,
  password: string
) {
  try {
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
  } catch (error) {
    console.error(error);
  }
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