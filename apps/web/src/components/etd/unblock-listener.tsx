
import { getFirefoxExtensionLatestVersion } from "@/lib/etd-unblock/utils";
import { useEffect, useState } from "react";
import { toast } from "sonner";

/**
 * Listens for messages from the ETD Unblock browser extension.
 * Exposes a body data attribute and dispatches a custom event when the
 * extension confirms it is installed.
 */
export function UnblockListener() {
  const [isInstalled, setIsInstalled] = useState(false);

  async function checkIfLatestVersionIsInstalled(version: string) {
    const latestVersion = await getFirefoxExtensionLatestVersion();
    if (version !== latestVersion) {
      toast.info(`Une nouvelle version de l'extension ETD Unblock est disponible. Veuillez la mettre à jour`,
        {
          action: {
            label: "MàJ",
            onClick: () => window.open("/etd-unblock", "_self"),
          },
        }
      );
      return false;
    }
    toast.success("L'extension ETD Unblock est à jour.");
    return true;
  }

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "ETD_UNBLOCK") {
        const version = event.data?.payload?.version;
        console.info(
          `[ETD Unblock] Extension détectée${version ? ` (v${version})` : ""}.`
        );
        setIsInstalled(true);
        document.body.dataset.etdUnblock = "installed";
        window.dispatchEvent(
          new CustomEvent("etd-unblock-installed", {
            detail: event.data?.payload ?? null,
          })
        );
        checkIfLatestVersionIsInstalled(version);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      delete document.body.dataset.etdUnblock;
    };
  }, []);

  useEffect(() => {
    if (!isInstalled) {
      delete document.body.dataset.etdUnblock;
    }
  }, [isInstalled]);

  return null;
}


