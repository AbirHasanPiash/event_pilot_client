// app/events/page.tsx
import { Suspense } from "react";
import EventsPage from "./EventsPage";

export default function EventsPageWrapper() {
  return (
    <Suspense fallback={<div className="pt-28 text-center">Loading...</div>}>
      <EventsPage />
    </Suspense>
  );
}
