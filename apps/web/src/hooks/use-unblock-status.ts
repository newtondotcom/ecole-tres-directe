
import { useEffect, useState } from "react";

export function useUnblockStatus() {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const bodyFlag = document.body.dataset.etdUnblock === "installed";
    if (bodyFlag) {
      setIsInstalled(true);
    }

    const handleInstalled = () => setIsInstalled(true);
    window.addEventListener("etd-unblock-installed", handleInstalled);

    return () => {
      window.removeEventListener("etd-unblock-installed", handleInstalled);
    };
  }, []);

  return isInstalled;
}
