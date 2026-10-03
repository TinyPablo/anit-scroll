import { TallyBoard } from "@/components/tally-board";
import { listTallies } from "@/lib/db";
import { DAY_LIST, localNow } from "@/lib/range";

export const dynamic = "force-dynamic";

export default function Page() {
  return <TallyBoard days={DAY_LIST} tallies={listTallies()} now={localNow()} />;
}
