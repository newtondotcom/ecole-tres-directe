export const FIREFOX_UPDATE_URL =
  "https://raw.githubusercontent.com/newtondotcom/Ecole-Tres-Directe-Unblock/refs/heads/main/updates.json";

export const FIREFOX_STORE_URL =
  "https://www.firefox.com/fr/";

export async function getFirefoxExtensionLatestVersion() {
  try {
    const response = await fetch(FIREFOX_UPDATE_URL);
    const data = await response.json();
    return data.addons["{etdu-firefox-self-host@ecole-tres-directe.vercel.app}"].updates[data.addons["{etdu-firefox-self-host@ecole-tres-directe.vercel.app}"].updates.length - 1].version;
  } catch (error) {
    console.error("Failed to fetch Firefox extension latest version:", error);
    return undefined;
  }
}

export async function getFirefoxExtensionLatestUpdateLink() {
  try {
    const response = await fetch(FIREFOX_UPDATE_URL);
    const data = await response.json();
    const updates =
      data.addons["{etdu-firefox-self-host@ecole-tres-directe.vercel.app}"].updates;
    return updates[updates.length - 1].update_link;
  } catch (error) {
    console.error("Failed to fetch Firefox URL:", error);
    return FIREFOX_STORE_URL;
  }
}

export function getBrowser(): string {
  if (typeof window === "undefined") return "Unknown";
  const userAgent = window.navigator.userAgent.toLowerCase();
  if (userAgent.includes("firefox")) return "Firefox";
  if (userAgent.includes("edg")) return "Edge";
  if (userAgent.includes("chrome") && !userAgent.includes("edg"))
    return "Chrome";
  if (userAgent.includes("safari") && !userAgent.includes("chrome"))
    return "Safari";
  if (userAgent.includes("opera")) return "Opera";
  return "Unknown";
}

export function getOS(): string {
  if (typeof window === "undefined") return "Unknown";
  const userAgent = window.navigator.userAgent.toLowerCase();
  if (userAgent.includes("iphone") || userAgent.includes("ipad"))
    return "iOS";
  if (userAgent.includes("android")) return "Android";
  if (userAgent.includes("mac")) return "MacOS";
  if (userAgent.includes("win")) return "Windows";
  if (userAgent.includes("linux")) return "Linux";
  return "Unknown";
}