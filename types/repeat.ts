export type RepeatFrequency = "day" | "week" | "month" | "year";

export type RepeatEndType = "never" | "date";

export type RepeatConfig = {
  frequency: RepeatFrequency;
  interval: number;
  daysOfWeek: string[];
  startDate: string;
  endType: RepeatEndType;
  endDate: string | null;
};
