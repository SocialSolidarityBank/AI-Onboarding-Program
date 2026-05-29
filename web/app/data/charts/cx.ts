import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Tremor식 className 머지 헬퍼 (clsx + tailwind-merge)
export function cx(...args: ClassValue[]) {
  return twMerge(clsx(...args));
}
