import { ModeToggle } from "@/components/theme-toggle";
import { useAuthStore } from "@/stores/auth";
import { Button } from "@etd/ui/components/button";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const router = useRouter();
  const { resetAuthData } = useAuthStore();
  const handleLogout = () => {
    resetAuthData();
    router.navigate({ to: "/login" });
  };
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Paramètres</h1>
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Thème</h2>
        <p className="flex flex-row text-muted-foreground justify-between">
          Choisissez le thème de l'application.
          <ModeToggle />
        </p>
        <h2 className="text-xl font-bold">Activité du compte</h2>
        <p className="flex flex-row text-muted-foreground justify-between">
          Se déconnecter de l'application.
          <Button variant="outline" size="icon" onClick={handleLogout}>
            <LogOut />
          </Button>
        </p>
      </div>
    </div>
  );
}
