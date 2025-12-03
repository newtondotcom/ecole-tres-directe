import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndexComponent,
});

function DashboardIndexComponent() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground mt-2">
          Bienvenue sur votre tableau de bord. Sélectionnez une option dans le menu pour commencer.
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">De nouvelles fonctionnalités sont en cours de développement</h2>
        <ul className="text-muted-foreground mt-2">
          <li>Relecture des appréciations pour vérifier la cohérence de la ponctuation, des éventuelles fautes d'orthographe, l'utilisation d'un mauvais prénom etc.</li>
          <li>Entrée des notes en parlant pour accélérer considérablement ce temps de saisie</li>
        </ul>
      </div>
    </div>
  );
}

