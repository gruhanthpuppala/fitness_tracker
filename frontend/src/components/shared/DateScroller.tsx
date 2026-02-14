"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { classNames, formatDate, isFutureDate } from "@/lib/utils";

interface DateScrollerProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  loggedDates: Set<string>;
}

export default function DateScroller({ selectedDate, onDateSelect, loggedDates }: DateScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLButtonElement>(null);

  const dates: Date[] = [];
  for (let i = 14; i >= -7; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d);
  }

  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, []);

  const today = formatDate(new Date());

  return (
    <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
      {dates.map((date) => {
        const dateStr = formatDate(date);
        const isToday = dateStr === today;
        const isSelected = dateStr === selectedDate;
        const isFuture = isFutureDate(dateStr);
        const isLogged = loggedDates.has(dateStr);

        return (
          <motion.button
            key={dateStr}
            ref={isToday ? todayRef : undefined}
            whileTap={!isFuture ? { scale: 0.95 } : undefined}
            onClick={() => !isFuture && onDateSelect(dateStr)}
            disabled={isFuture}
            className={classNames(
              "flex flex-col items-center min-w-[52px] py-2 px-2 rounded-card snap-center transition-colors",
              isSelected && "bg-accent-primary text-bg-primary",
              !isSelected && !isFuture && "bg-bg-surface hover:bg-bg-elevated text-text-primary",
              isFuture && "opacity-30 cursor-not-allowed text-text-muted"
            )}
          >
            <span className="text-xs font-medium">
              {date.toLocaleDateString("en", { weekday: "short" })}
            </span>
            <span className="text-lg font-bold">{date.getDate()}</span>
            <span
              className={classNames(
                "w-1.5 h-1.5 rounded-full mt-1",
                isFuture && "bg-text-muted",
                !isFuture && isLogged && "bg-status-success",
                !isFuture && !isLogged && "bg-bg-elevated border border-border"
              )}
            />
          </motion.button>
        );
      })}
    </div>
  );
}
