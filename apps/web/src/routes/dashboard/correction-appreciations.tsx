import { LevelSelect } from "@/components/etd/level-select";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/correction-appreciations")({
  component: CorrectionAppreciationsPage,
});

function CorrectionAppreciationsPage() {
  return (
    <div className="flex flex-col gap-4">
      <LevelSelect />
    </div>
  );
}
