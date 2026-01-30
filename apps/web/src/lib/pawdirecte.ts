import { v4 as uuidv4 } from "uuid";
import { setAccessToken, type Session, DoubleAuthRequired, login } from "pawdirecte-teacher";

const DEVICE_UUID_COOKIE = "device_uuid";
const DEVICE_UUID_MAX_AGE = 60 * 60 * 24 * 365 * 2;

function readCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1];
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; path=/; max-age=${DEVICE_UUID_MAX_AGE}; samesite=lax`;
}

export function getDeviceUuid() {
  const existing = readCookie(DEVICE_UUID_COOKIE);
  if (existing) return existing;
  const created = uuidv4();
  writeCookie(DEVICE_UUID_COOKIE, created);
  return created;
}

export async function loginUsingCredentials(username: string, password: string) {
  try {
    console.info("Initializing a session using credentials...");
    const session: Session = { username, device_uuid: getDeviceUuid() };

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
    console.log("Logged in to", account.firstName, account.lastName, "from", account.schoolName);

    return { session, account };
  } catch (error) {
    console.error(error);
  }
}

export async function validateSession(session: Session, password: string) {
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
    account.schoolName,
  );

  return { session, account };
}
