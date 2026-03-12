import { PERIOD_TIME_MAP } from "../constants/periodTime";

export const isPeriodAllowedNow = (period) => {
  if (!period) return false;

  const cfg = PERIOD_TIME_MAP[period];
  if (!cfg) return false;

  const now = new Date();
  const today = now.toISOString().split("T")[0];

  const start = new Date(`${today}T${cfg.start}:00`);
  const end = new Date(`${today}T${cfg.end}:00`);

  return now >= start && now <= end;
};
