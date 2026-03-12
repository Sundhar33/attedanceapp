import { PERIOD_TIME_MAP } from "../constants/periodTime";

export const isWithinPeriodTime = (period) => {
  const config = PERIOD_TIME_MAP[period];
  if (!config) return false;

  const now = new Date();
  const today = now.toISOString().split("T")[0];

  const startTime = new Date(`${today}T${config.start}:00`);
  const endTime = new Date(`${today}T${config.end}:00`);

  return now >= startTime && now <= endTime;
};
