import { ModeToggle } from "@/components/etd/theme-toggle";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">Thème</h2>
        <p className="flex flex-row text-muted-foreground justify-between">
          Choisissez le thème de l'application.
          <ModeToggle />
        </p>
      </div>
    </div>
  );
}