import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type ProgramType = "whole" | "study" | "facilitator";

export type Session = {
  index: number;
  duration: string;
  content: string;
  outcome: string;
};

export type ProgramTools = {
  primary?: string[];
  secondary?: string[];
};

export type Program = {
  id: string;
  type: ProgramType;
  order: number;
  title: string;
  subtitle?: string;
  /** 스터디 그룹용 - 비교표에서 사용 */
  groupLabel?: string;
  groupName?: string;
  oneLineDef?: string;
  goal?: string;
  contentSummary?: string[];
  audience?: string;
  selectionCriteria?: string;
  tools?: ProgramTools;
  deadline?: string;
  sessions?: Session[];
  /** 퍼실리테이터 전용 */
  roles?: string[];
  benefits?: string[];
  /** Markdown 본문 */
  body: string;
};

const PROGRAMS_DIR = path.join(process.cwd(), "content", "programs");

let cached: Program[] | null = null;

export function getAllPrograms(): Program[] {
  if (cached) return cached;
  const files = fs
    .readdirSync(PROGRAMS_DIR)
    .filter((f) => f.endsWith(".md"));

  const programs = files.map((file) => {
    const fullPath = path.join(PROGRAMS_DIR, file);
    const raw = fs.readFileSync(fullPath, "utf-8");
    const { data, content } = matter(raw);
    return {
      ...(data as Omit<Program, "body">),
      body: content.trim(),
    } as Program;
  });

  cached = programs.sort((a, b) => {
    if (a.type !== b.type) {
      const order: Record<ProgramType, number> = {
        whole: 0,
        study: 1,
        facilitator: 2,
      };
      return order[a.type] - order[b.type];
    }
    return (a.order ?? 0) - (b.order ?? 0);
  });
  return cached;
}

export function getProgramsByType(type: ProgramType): Program[] {
  return getAllPrograms().filter((p) => p.type === type);
}

export function getProgramById(id: string): Program | undefined {
  return getAllPrograms().find((p) => p.id === id);
}
