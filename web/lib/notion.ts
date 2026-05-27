import "server-only";
import { Client } from "@notionhq/client";

/**
 * Notion 동기화 (Phase I) — applications → Notion DB
 *
 * - 단방향: Supabase 의 신청 row 를 Notion DB 에 mirror
 * - 이메일을 dedup key 로 사용 — 같은 이메일이 있으면 update, 없으면 create
 * - 운영 상태/메모/태그 등 Notion 측 입력값은 코드가 덮어쓰지 않음
 * - 동기화 트리거는 운영자 대시보드의 "노션으로 이관" 버튼
 */

export type SyncRow = {
  id: string;
  email: string;
  name: string;
  team: string;
  programTitles: string[];
  tools: string[];
  toolsOther: string | null;
  expectations: string | null;
  availableDays: string[];
  learningGoals: string[];
  createdAt: string;
};

export type SyncResult =
  | {
      kind: "ok";
      created: number;
      updated: number;
      failed: number;
      errors: string[];
    }
  | { kind: "error"; message: string };

const NOTION_TEXT_LIMIT = 2000;

function trimToLimit(value: string, limit: number = NOTION_TEXT_LIMIT): string {
  if (value.length <= limit) return value;
  return value.slice(0, limit - 1) + "…";
}

function buildProperties(row: SyncRow): Record<string, unknown> {
  // Notion multi_select option name 안에 콤마 금지 → tools_other 자유입력은
  // 콤마 (",", "，") 로 split 해서 각각 별도 option 으로 보냄.
  const otherTools = row.toolsOther
    ? row.toolsOther
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const toolList = [
    ...row.tools.filter((t) => t !== "기타"),
    ...otherTools,
  ];
  return {
    이름: {
      title: [{ type: "text", text: { content: row.name || "—" } }],
    },
    이메일: { email: row.email },
    소속: row.team ? { select: { name: row.team } } : { select: null },
    "신청 과정": {
      multi_select: row.programTitles.map((name) => ({ name })),
    },
    "학습 목표": {
      multi_select: row.learningGoals.map((name) => ({ name })),
    },
    "참여 가능 요일": {
      multi_select: row.availableDays.map((name) => ({ name })),
    },
    "사용 툴": {
      multi_select: toolList.map((name) => ({ name })),
    },
    "기대하는 바": {
      rich_text: row.expectations
        ? [
            {
              type: "text",
              text: { content: trimToLimit(row.expectations) },
            },
          ]
        : [],
    },
    신청일시: {
      date: { start: row.createdAt },
    },
  };
}

/**
 * Notion DB 의 기존 row 들을 email → page_id 로 매핑.
 * pagination 대응(1회당 100건). 신청자 수가 수백명을 넘으면 페이지 추가 조회.
 */
async function fetchExistingByEmail(
  notion: Client,
  databaseId: string
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let cursor: string | undefined;
  do {
    const res = await notion.databases.query({
      database_id: databaseId,
      page_size: 100,
      start_cursor: cursor,
    });
    for (const page of res.results) {
      if (!("properties" in page)) continue;
      const props = page.properties as Record<string, unknown>;
      const emailProp = props["이메일"] as { email?: string } | undefined;
      const email = emailProp?.email;
      if (email) map.set(email, page.id);
    }
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
  } while (cursor);
  return map;
}

export async function syncApplicationsToNotion(
  rows: SyncRow[]
): Promise<SyncResult> {
  const token = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_APPLICATIONS_DB_ID;
  if (!token) return { kind: "error", message: "NOTION_API_KEY 미설정" };
  if (!databaseId)
    return { kind: "error", message: "NOTION_APPLICATIONS_DB_ID 미설정" };

  const notion = new Client({ auth: token });
  let created = 0;
  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  let existing: Map<string, string>;
  try {
    existing = await fetchExistingByEmail(notion, databaseId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      kind: "error",
      message: `Notion DB 조회 실패: ${msg}`,
    };
  }

  for (const row of rows) {
    const properties = buildProperties(row);
    const existingPageId = existing.get(row.email);
    try {
      if (existingPageId) {
        await notion.pages.update({
          page_id: existingPageId,
          properties: properties as never,
        });
        updated += 1;
      } else {
        await notion.pages.create({
          parent: { database_id: databaseId },
          properties: properties as never,
        });
        created += 1;
      }
    } catch (err) {
      failed += 1;
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${row.email}: ${msg}`);
    }
  }

  return { kind: "ok", created, updated, failed, errors };
}
