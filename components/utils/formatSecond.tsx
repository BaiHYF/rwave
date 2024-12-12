export const formatSecond = (seconds: number): string => {
  const rounded = Math.round(seconds);
  const m = Math.floor(rounded / 60);
  const s = rounded % 60;

  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};
