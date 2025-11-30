"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Calendar } from "@/components/ui/calendar";
import Link from "next/link";
import { 
  FileText, 
  Home, 
  MessageSquare, 
  Settings,
  LogOut,
  Toilet,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Tableau de bord",
    icon: Home,
    url: "/dashboard",
  },
  {
    title: "Remplir les appréciations",
    icon: FileText,
    url: "/dashboard/remplir-appreciations",
  },
  {
    title: "Feedback",
    icon: MessageSquare,
    url: "/dashboard/feedback",
  },
  {
    title: "Paramètres",
    icon: Settings,
    url: "/dashboard/settings",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { account, resetAuthData, isAuthenticated, isLoading, isPatreonSubscribed } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  // Fix hydration mismatch by only rendering client-side dependent content after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render anything on server side to avoid hydration mismatch
  if (typeof window === 'undefined') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  useEffect(() => {
    if (!isLoading && !isAuthenticated()) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = () => {
    resetAuthData();
    router.push("/login");
  };

  // Show nothing while checking authentication or before mount
  if (isLoading || !isMounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  // Don't render if not authenticated (redirect will happen)
  if (!isAuthenticated()) {
    return null;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Toilet className="h-4 w-4" />
            </div>
            <div className="flex flex-col flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Ecole Tres Directe</span>
              </div>
              {account && (
                <span className="text-xs text-muted-foreground">
                  {account.firstName} {account.lastName}
                </span>
              )}
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              {isMounted && (
                <div className="px-2">
                  <Calendar />
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              {isPatreonSubscribed !== undefined && (
                <SidebarMenuButton asChild>
                  <Link href="https://www.patreon.com/ecoletresdirecte" target="_blank">
                    <div className="flex items-center cursor-pointer">
                      {isPatreonSubscribed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={cn("text-xs font-bold ml-2", isPatreonSubscribed ? "text-green-500" : "text-red-500")}>
                        {isPatreonSubscribed
                          ? "Abonné au Patreon, merci !"
                          : "Pas abonné au Patreon..."}
                      </span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              )}
              <SidebarMenuButton onClick={handleLogout}>
                <LogOut />
                <span>Déconnexion</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1" />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

