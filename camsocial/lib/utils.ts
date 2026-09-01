import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "ឥឡូវនេះ";
  if (minutes < 60) return `${minutes} នាទីមុន`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ម៉ោងមុន`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ថ្ងៃមុន`;

  return d.toLocaleDateString("km-KH");
}
