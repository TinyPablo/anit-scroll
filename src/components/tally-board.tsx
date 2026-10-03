"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cellKey, isFuture, type Day } from "@/lib/range";

type Cell = { date: string; hour: number };
type Now = { date: string; hour: number };

type Props = {
  days: Day[];
  tallies: Cell[];
  now: Now;
};

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function clientNow(): Now {
  const date = new Date();
  const iso = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return { date: iso, hour: date.getHours() };
}

export function TallyBoard({ days, tallies, now: initialNow }: Props) {
  const [marks, setMarks] = useState(
    () => new Set(tallies.map((tally) => cellKey(tally.date, tally.hour))),
  );
  const [now, setNow] = useState(initialNow);
  const [selected, setSelected] = useState<Cell | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setNow(clientNow());
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, []);

  const flash = useCallback((message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(null), 2400);
  }, []);

  const write = useCallback(
    async (cell: Cell, on: boolean) => {
      const key = cellKey(cell.date, cell.hour);

      setMarks((previous) => {
        const next = new Set(previous);
        if (on) next.add(key);
        else next.delete(key);
        return next;
      });

      const response = await fetch("/api/tallies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ date: cell.date, hour: cell.hour, on }),
      }).catch(() => null);

      if (!response?.ok) {
        setMarks((previous) => {
          const next = new Set(previous);
          if (on) next.delete(key);
          else next.add(key);
          return next;
        });
        flash("Nie udało się zapisać");
      }
    },
    [flash],
  );

  const saveNow = useCallback(() => {
    const cell = { date: now.date, hour: now.hour };

    if (!days.some((day) => day.date === cell.date)) {
      flash("Dzisiejszy dzień jest poza zakresem tabeli");
      return;
    }

    if (marks.has(cellKey(cell.date, cell.hour))) {
      flash(`${pad(cell.hour)}:00 jest już zapisana`);
      return;
    }

    void write(cell, true);
    flash(`Zapisano ${pad(cell.hour)}:00`);
  }, [days, flash, marks, now, write]);

  const shift = useCallback(
    (deltaDay: number, deltaHour: number) => {
      if (!selected) return;

      const index = days.findIndex((day) => day.date === selected.date);
      const nextIndex = Math.min(days.length - 1, Math.max(0, index + deltaDay));
      const nextHour = Math.min(23, Math.max(0, selected.hour + deltaHour));
      const next = { date: days[nextIndex].date, hour: nextHour };

      if (isFuture(next.date, next.hour, now)) return;
      setSelected(next);
    },
    [days, now, selected],
  );

  const hourSums = useMemo(
    () => HOURS.map((hour) => days.filter((day) => marks.has(cellKey(day.date, hour))).length),
    [days, marks],
  );

  const daySums = useMemo(
    () => days.map((day) => HOURS.filter((hour) => marks.has(cellKey(day.date, hour))).length),
    [days, marks],
  );

  const peakSum = Math.max(...hourSums);
  const columns = `var(--tally-gutter) repeat(${days.length}, var(--tally-cell)) var(--tally-gutter)`;
  const selectedDay = selected ? days.find((day) => day.date === selected.date) : undefined;
  const selectedMarked = selected ? marks.has(cellKey(selected.date, selected.hour)) : false;

  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <header className="flex items-baseline justify-between px-4 pt-5 pb-3">
        <div>
          <h1 className="text-sm font-bold tracking-[0.14em] uppercase">Tally</h1>
          <p className="text-muted-foreground mt-1 text-[10px] tracking-wide">
            {days[0].dayOfMonth}-{days[days.length - 1].dayOfMonth}.10 &middot; {days.length} dni
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl leading-none font-medium">{marks.size}</p>
          <p className="text-muted-foreground text-[9px] tracking-[0.1em] uppercase">kresek</p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto px-4">
        <div className="mx-auto grid w-fit items-end gap-px pb-1.5" style={{ gridTemplateColumns: columns }}>
          <div />
          {days.map((day) => (
            <div key={day.date} className="text-center leading-[1.25]">
              <div className="text-muted-foreground text-[8px]">{day.weekday}</div>
              <div
                className={
                  day.date === now.date
                    ? "text-foreground text-[10px] font-bold"
                    : "text-muted-foreground text-[10px]"
                }
              >
                {day.dayOfMonth}
              </div>
            </div>
          ))}
          <div className="text-muted-foreground text-center text-[8px]">&Sigma;</div>
        </div>

        <div className="bg-border mx-auto grid w-fit gap-px py-px" style={{ gridTemplateColumns: columns }}>
          {HOURS.map((hour) => {
            const sum = hourSums[hour];
            const loud = peakSum > 0 && sum >= peakSum * 0.7;

            return (
              <Fragment key={hour}>
                <div
                  className="bg-background text-muted-foreground flex items-center justify-end pr-1 text-[10px]"
                  style={{ height: "var(--tally-row)" }}
                >
                  {pad(hour)}
                </div>

                {days.map((day) => {
                  const marked = marks.has(cellKey(day.date, hour));
                  const future = isFuture(day.date, hour, now);
                  const current = day.date === now.date && hour === now.hour;

                  return (
                    <button
                      key={day.date}
                      type="button"
                      disabled={future}
                      onClick={() => setSelected({ date: day.date, hour })}
                      aria-label={`${marked ? "Kreska" : "Brak kreski"}, ${day.dayOfMonth}.10, godzina ${pad(hour)}`}
                      className={[
                        "flex items-center justify-center",
                        future ? "bg-background cursor-default" : "bg-card cursor-pointer",
                        current ? "ring-foreground ring-1 ring-inset" : "",
                      ].join(" ")}
                      style={{ height: "var(--tally-row)" }}
                    >
                      {marked ? (
                        <span className="bg-foreground block h-[64%] w-[2px] md:w-[3px]" />
                      ) : null}
                    </button>
                  );
                })}

                <div
                  className={[
                    "bg-background flex items-center justify-center text-[10px]",
                    loud ? "text-foreground font-bold" : "text-muted-foreground",
                  ].join(" ")}
                  style={{ height: "var(--tally-row)" }}
                >
                  {sum === 0 ? "" : sum}
                </div>
              </Fragment>
            );
          })}
        </div>

        <div className="mx-auto grid w-fit gap-px pt-1.5" style={{ gridTemplateColumns: columns }}>
          <div />
          {daySums.map((sum, index) => (
            <div
              key={days[index].date}
              className={[
                "text-center text-[9px]",
                sum >= 6 ? "text-foreground" : "text-muted-foreground",
              ].join(" ")}
            >
              {sum === 0 ? "" : sum}
            </div>
          ))}
          <div />
        </div>
      </div>

      <div
        className="shrink-0 px-4 pt-3"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        <p
          aria-live="polite"
          className="text-muted-foreground mb-2 min-h-4 text-center text-[10px] tracking-wide"
        >
          {notice}
        </p>
        <Button
          onClick={saveNow}
          className="h-14 w-full rounded-none text-[13px] font-bold tracking-[0.16em] uppercase"
        >
          Zapisz teraz
        </Button>
      </div>

      <Drawer
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        showSwipeHandle
      >
        <DrawerContent>
          <DrawerHeader className="mx-auto w-full max-w-xs">
            <DrawerTitle className="text-[10px] font-normal tracking-[0.12em] uppercase">
              {selectedDay ? `${selectedDay.weekday}, październik` : ""}
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Postaw lub usuń kreskę w wybranym dniu i godzinie.
            </DrawerDescription>
          </DrawerHeader>

          <div className="mx-auto w-full max-w-xs space-y-2.5 px-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                aria-label="Dzień wcześniej"
                onClick={() => shift(-1, 0)}
                className="size-11 rounded-none"
              >
                <ChevronLeft />
              </Button>
              <p className="text-2xl font-medium">
                {selectedDay ? `${selectedDay.dayOfMonth}.10` : ""}
              </p>
              <Button
                variant="outline"
                size="icon"
                aria-label="Dzień później"
                onClick={() => shift(1, 0)}
                className="size-11 rounded-none"
              >
                <ChevronRight />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                aria-label="Godzina wcześniej"
                onClick={() => shift(0, -1)}
                className="size-11 rounded-none"
              >
                <ChevronLeft />
              </Button>
              <p className="text-2xl font-medium">{selected ? `${pad(selected.hour)}:00` : ""}</p>
              <Button
                variant="outline"
                size="icon"
                aria-label="Godzina później"
                onClick={() => shift(0, 1)}
                className="size-11 rounded-none"
              >
                <ChevronRight />
              </Button>
            </div>
          </div>

          <DrawerFooter className="mx-auto w-full max-w-xs">
            <Button
              variant={selectedMarked ? "secondary" : "default"}
              onClick={() => {
                if (!selected) return;
                void write(selected, !selectedMarked);
                setSelected(null);
              }}
              className="h-12 w-full rounded-none text-xs font-bold tracking-[0.14em] uppercase"
            >
              {selectedMarked ? "Usuń kreskę" : "Postaw kreskę"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </main>
  );
}
