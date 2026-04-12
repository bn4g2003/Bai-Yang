import { DailyJournalScreen } from "@/components/journal/DailyJournalScreen";
import { SupabaseConfigBanner } from "@/components/system/SupabaseConfigBanner";

export default async function NhatKyTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="space-y-4">
      <SupabaseConfigBanner />
      <DailyJournalScreen token={token} />
    </div>
  );
}
