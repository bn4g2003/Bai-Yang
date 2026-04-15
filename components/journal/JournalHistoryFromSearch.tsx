"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { JournalHistoryScreen } from "@/components/journal/JournalHistoryScreen";

function JournalHistoryWithQuery() {
  const sp = useSearchParams();
  const pond = sp.get("pond");
  const key = pond?.trim() ? pond.trim() : "__all__";
  return <JournalHistoryScreen key={key} initialPondId={pond} />;
}

export function JournalHistoryFromSearch() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Đang tải…</p>}>
      <JournalHistoryWithQuery />
    </Suspense>
  );
}
