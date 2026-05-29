"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  deadline: string;
}

export function CountdownTimer({ deadline }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOver: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(deadline) - +new Date();
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isOver: false,
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  if (timeLeft.isOver) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
        <Clock className="h-3 w-3" />
        Closed
      </span>
    );
  }

  const { days, hours, minutes } = timeLeft;
  
  // Decide visual urgency color
  let colorClass = "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400";
  if (days === 0 && hours < 24) {
    colorClass = "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400 animate-pulse";
  } else if (days < 3) {
    colorClass = "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400";
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${colorClass}`}>
      <Clock className="h-3.5 w-3.5" />
      {days > 0 ? `${days}d ` : ""}{hours > 0 ? `${hours}h ` : ""}{minutes}m remaining
    </span>
  );
}
