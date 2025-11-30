import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/feedback")({
  component: FeedbackComponent,
});

function FeedbackComponent() {
  return <div>FeedbackPage</div>;
}