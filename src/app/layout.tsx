import type { Metadata } from "next";
import { Roboto, Roboto_Slab} from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { UnblockListener } from "@/components/etd/unblock-listener";
import { ThemeProvider } from "@/components/etd/theme-provider";

const RobotoSans = Roboto({
  variable: "--font-roboto-sans",
  subsets: ["latin"],
});

const RobotoSlab = Roboto_Slab({
  variable: "--font-roboto-slab",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ecole Tres Directe",
  description: "Une web app pour accélérer le travail des professeurs dans Ecole Directe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${RobotoSans.variable} ${RobotoSlab.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Toaster richColors/>
        <UnblockListener />
      </body>
    </html>
  );
}