"use client";

import { useEffect, useState } from "react";

/**
 * Listens for messages from the ETD Unblock browser extension.
 * Exposes a body data attribute and dispatches a custom event when the
 * extension confirms it is installed.
 */
export function UnblockListener() {
  const [isInstalled, setIsInstalled] = useState(false);

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


