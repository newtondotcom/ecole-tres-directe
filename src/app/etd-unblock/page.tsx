"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FIREFOX_STORE_URL, getBrowser, getFirefoxExtensionLatestUpdateLink, getOS } from "@/app/etd-unblock/utils";

export default function EtdUnblock({
  isEtdUnblockActuallyInstalled = false,
}: {
  isEtdUnblockActuallyInstalled?: boolean;
}) {
  const [userBrowser, setUserBrowser] = useState<string>("Unknown");
  const [userOS, setUserOS] = useState<string>("Unknown");
  const [url, setUrl] = useState<string | undefined>(FIREFOX_STORE_URL);
  const aboutRef = useRef<HTMLDivElement>(null);
  const aboutButtonRef = useRef<HTMLAnchorElement>(null);
  const heroBannerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const browser = getBrowser();
    const os = getOS();
    setUserBrowser(browser);
    setUserOS(os);
    setUrl(FIREFOX_STORE_URL);
  }, []);

  const compatibilityCondition = userBrowser !== "Firefox";

  function scrollToAbout() {
    if (typeof window !== "undefined" && window.location.hash === "#about") {
      aboutRef.current?.scrollIntoView({
        block: "start",
        inline: "nearest",
        behavior: "smooth",
      });
    }
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!heroBannerRef.current || !aboutButtonRef.current || !aboutRef.current)
        return;

      const heroRect = heroBannerRef.current.getBoundingClientRect();
      const aboutButtonRect = aboutButtonRef.current.getBoundingClientRect();
      const aboutRect = aboutRef.current.getBoundingClientRect();

      if (event.key === "ArrowDown" && aboutRect.top > 60) {
        event.preventDefault();
        aboutRef.current.scrollIntoView({
          block: "start",
          inline: "nearest",
          behavior: "smooth",
        });
      } else if (
        event.key === "ArrowUp" &&
        heroRect.bottom >= aboutButtonRect.height
      ) {
        event.preventDefault();
        heroBannerRef.current.scrollIntoView({
          block: "start",
          inline: "nearest",
          behavior: "smooth",
        });
      } else if (
        event.key === "ArrowUp" &&
        aboutRect.top > -60 &&
        aboutRect.top <= aboutButtonRect.height
      ) {
        event.preventDefault();
        aboutButtonRef.current.scrollIntoView({
          block: "start",
          inline: "nearest",
          behavior: "smooth",
        });
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    scrollToAbout();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleHashChange = () => {
        scrollToAbout();
      };
      window.addEventListener("hashchange", handleHashChange);
      return () => window.removeEventListener("hashchange", handleHashChange);
    }
  }, []);

  useEffect(() => {
    if (userBrowser === "Firefox") {
      getFirefoxExtensionLatestUpdateLink().then((firefoxUrl) => {
        if (firefoxUrl) {
          setUrl(firefoxUrl);
        } else {
          setUrl(FIREFOX_STORE_URL);
        }
      });
    } else {
      setUrl(FIREFOX_STORE_URL);
    }
  }, [userBrowser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />

      {/* Header navigation */}
      <div className="absolute top-6 left-6 z-10">
        <Button variant="ghost" asChild>
          <Link href="/" className="flex items-center gap-2">
            <span>←</span>
            <span>Retour</span>
          </Link>
        </Button>
      </div>

      {/* Social links */}
      {/*
      <div className="absolute top-6 right-6 z-10 flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <a
            href="https://discord.gg/ecole-directe-plus"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm"
          >
            Discord
          </a>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <a
            href="https://github.com/Magic-Fishes/Ecole-Directe-Plus-Unblock"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm"
          >
            GitHub
          </a>
        </Button>
      </div>
      */}
      
      {/* Help link */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
        <Button variant="link" asChild>
          <Link href="/feedback" className="text-sm">
            Besoin d&apos;aide ?
          </Link>
        </Button>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <main ref={heroBannerRef} className="space-y-8">
          <Card className="border-2 shadow-lg">
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="flex justify-center">
                <div className="relative h-20 w-20">
                  <Image
                    src="/firefox.svg"
                    alt="Firefox"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl md:text-4xl">
                  Installez l&apos;extension
                </CardTitle>
                <CardDescription className="text-xl md:text-2xl">
                  Ecole Directe Plus Unblock
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-muted-foreground text-lg">
                Ecole Directe Plus a besoin de cette extension de navigateur pour{" "}
                <span className="font-bold text-foreground">
                  fonctionner correctement
                </span>{" "}
                et accéder à l&apos;API d&apos;EcoleDirecte. Pour des raisons de
                vie privée et de choix techniques, nous ne supportons{" "}
                <span className="font-semibold">que Firefox</span> (et les
                navigateurs strictement basés sur son moteur).
              </p>

              {compatibilityCondition &&
                (userOS === "iOS" ? (
                  <Card className="border-destructive bg-destructive/10">
                    <CardContent className="pt-6">
                      <p className="text-destructive">
                        ETD Unblock ne peut pas fonctionner sur les navigateurs
                        iOS/iPadOS en raison des restrictions imposées par Apple.
                        Merci d&apos;utiliser un ordinateur ou un appareil Android
                        avec Firefox.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-destructive bg-destructive/10">
                    <CardContent className="pt-6 space-y-2">
                      <p className="text-destructive">
                        Votre navigateur actuel n&apos;est pas supporté.
                        Microsoft et Google restreignent l&apos;usage
                        d&apos;extensions comme ETD Unblock sur les navigateurs
                        Chromium (Chrome, Edge, Opera, Brave, etc.).
                      </p>
                      <p className="text-destructive">
                        Merci d&apos;installer un{" "}
                        <a
                          href={FIREFOX_STORE_URL}
                          className="font-semibold underline hover:no-underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          navigateur Firefox
                        </a>
                        .
                      </p>
                    </CardContent>
                  </Card>
                ))}

              <div className="flex justify-center pt-4">
                <Button
                  asChild
                  size="lg"
                  variant={
                    isEtdUnblockActuallyInstalled
                      ? "secondary"
                      : compatibilityCondition
                        ? "outline"
                        : "default"
                  }
                  disabled={compatibilityCondition && !url}
                  className="min-w-[280px] h-auto py-6 flex flex-col items-center gap-3"
                >
                  <a
                    href={url}
                    target={userBrowser === "Firefox" ? "_self" : "_blank"}
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="relative h-14 w-14">
                      <Image
                        src="/firefox.svg"
                        alt="Firefox"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      {isEtdUnblockActuallyInstalled ? (
                        <>
                          <span className="font-semibold">
                            Extension installée
                          </span>
                          <span className="text-2xl">✓</span>
                        </>
                      ) : compatibilityCondition ? (
                        <>
                          <span className="font-semibold">
                            Navigateur incompatible
                          </span>
                          <span className="text-2xl">✕</span>
                        </>
                      ) : (
                        <>
                          <span className="font-semibold">
                            Ajouter l&apos;extension
                          </span>
                        </>
                      )}
                    </div>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* About button */}
          <div className="flex justify-center">
            <Button variant="ghost" asChild className="flex flex-col items-center gap-2">
              <Link
                ref={aboutButtonRef}
                href="#about"
                onClick={(e) => {
                  e.preventDefault();
                  if (
                    typeof window !== "undefined" &&
                    window.location.hash === "#about"
                  ) {
                    scrollToAbout();
                  } else {
                    window.location.hash = "#about";
                    setTimeout(scrollToAbout, 100);
                  }
                }}
              >
                <span className="text-sm font-medium">En savoir plus</span>
                <span className="text-xl">↓</span>
              </Link>
            </Button>
          </div>
        </main>

        {/* About section */}
        <div
          ref={aboutRef}
          className="mt-32 space-y-8 scroll-mt-20"
          id="about"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Qu&apos;est-ce qu&apos;Ecole Directe Plus Unblock ?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                ETD Unblock est une extension de navigateur qui offre un accès
                ininterrompu à Ecole Directe Plus en donnant l&apos;accès en continu
                aux données fournies par l&apos;API d&apos;EcoleDirecte. Cette
                extension est nécessaire au bon fonctionnement d&apos;Ecole Directe
                Plus.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Où et comment installer ETD Unblock ?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                ETD Unblock étant une extension de navigateur, la source
                d&apos;installation diffère en fonction de votre navigateur et votre
                OS. Cliquez sur le bouton &quot;Ajouter l&apos;extension&quot;
                ci-dessus et vous devriez être redirigé automatiquement vers la
                boutique d&apos;extensions compatible avec votre navigateur. Mise
                en garde : ETD Unblock n&apos;est pas disponible sur tous les
                navigateurs suivant les plateformes. Si vous êtes sur MacOS, tous
                les navigateurs hormis Safari devraient être compatibles avec EDP
                Unblock. Si vous utilisez un ordinateur sous Windows ou Linux, la
                grande majorité des navigateurs devraient être compatibles avec
                l&apos;extension.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Vie privée et confidentialité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                ETD Unblock est exclusivement active sur les domaines{" "}
                <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                  ecole-tres-directe.vercel.app
                </code>{" "}
                ainsi que{" "}
                <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                  ecoledirecte.com
                </code>
                . L&apos;extension ne peut pas accéder aux informations provenant de
                n&apos;importe quel autre site web. De plus, ETD Unblock ne lit
                aucune donnée : l&apos;extension joue simplement le rôle de passerelle
                aux requêtes pour &quot;les amener correctement à destination&quot;,
                mais n&apos;a pas accès à leur contenu. Ainsi, ETD Unblock ne
                collecte aucune donnée et effectue toutes ces opérations en local sur
                l&apos;appareil client.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Divers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                L&apos;extension Ecole Directe Plus Unblock, tout comme le site Ecole
                Directe Plus, est un projet open-source sous license MIT, le code
                source est donc disponible en ligne :{" "}
                <a
                  href="https://github.com/newtondotcom/Ecole-Tres-Directe-Unblock"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary hover:underline"
                >
                  dépôt Github
                </a>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
