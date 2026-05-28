"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import styles from "./page.module.css";
import { applyTag } from "./actions";

type Funder = {
  funder?: string;
  result?: string;
  fund_size_krw?: number | null;
};
type Detail = {
  item?: string;
  value?: number | null;
  unit?: string;
  amount_krw?: number | null;
  aggregation?: string;
};
type Kpi = { metric?: string; value?: number | null; unit?: string };

export type ProgramRow = {
  program_id: string;
  basis: "report" | "ledger" | "whitepaper";
  report_year: number | null;
  area_code: string | null;
  area_name: string | null;
  program_name: string | null;
  period: string | null;
  headline_value: number | null;
  headline_unit: string | null;
  budget_krw: number | null;
  target: string | null;
  support_type: string | null;
  source_document: string | null;
  memo: string | null;
  funders: Funder[] | null;
  details: Detail[] | null;
  kpis: Kpi[] | null;
  tags: string[] | null;
};

export type AreaSummaryRow = {
  basis: string;
  report_year: number | null;
  area_code: string | null;
  area_name: string | null;
  budget_krw: number | null;
};

const BLABEL: Record<string, string> = {
  report: "보고서",
  ledger: "원장",
  whitepaper: "백서(누적)",
};

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : Number(n).toLocaleString("ko-KR");
const eok = (n: number | null | undefined) =>
  n == null
    ? "—"
    : (Number(n) / 1e8).toLocaleString("ko-KR", { maximumFractionDigits: 1 });

const keyOf = (r: { program_id: string; basis: string }) =>
  `${r.program_id}::${r.basis}`;

export default function DataExplorer({
  programs,
  areaSummary,
  email,
}: {
  programs: ProgramRow[];
  areaSummary: AreaSummaryRow[];
  email: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [tab, setTab] = useState<"table" | "dashboard">("table");
  const [q, setQ] = useState("");
  const [basis, setBasis] = useState("");
  const [year, setYear] = useState("");
  const [area, setArea] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [includeWP, setIncludeWP] = useState(false);
  const [selected, setSelected] = useState<ProgramRow | null>(null);

  // 다중선택 + 태깅
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [tagInput, setTagInput] = useState("");
  const [msg, setMsg] = useState<string>("");

  const years = useMemo(
    () =>
      [...new Set(programs.map((p) => p.report_year).filter((y): y is number => y != null))].sort(
        (a, b) => b - a
      ),
    [programs]
  );
  const areaNames = useMemo(
    () =>
      [...new Set(programs.map((p) => p.area_name).filter((a): a is string => !!a))].sort(),
    [programs]
  );
  const allTags = useMemo(
    () =>
      [...new Set(programs.flatMap((p) => p.tags ?? []))].sort((a, b) =>
        a.localeCompare(b, "ko-KR")
      ),
    [programs]
  );

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return programs.filter((r) => {
      if (!includeWP && r.basis === "whitepaper") return false;
      if (basis && r.basis !== basis) return false;
      if (year && String(r.report_year) !== year) return false;
      if (area && r.area_name !== area) return false;
      if (tagFilter && !(r.tags ?? []).includes(tagFilter)) return false;
      if (query) {
        const hay = `${r.program_name ?? ""} ${r.memo ?? ""} ${(r.funders ?? [])
          .map((f) => f.funder ?? "")
          .join(" ")} ${r.support_type ?? ""} ${(r.tags ?? []).join(" ")}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [programs, q, basis, year, area, tagFilter, includeWP]);

  const sum = rows.reduce((s, r) => s + (r.budget_krw ?? 0), 0);

  const resetFilters = () => {
    setQ("");
    setBasis("");
    setYear("");
    setArea("");
    setTagFilter("");
  };

  // ── 다중선택 헬퍼 ──
  const visibleKeys = useMemo(() => rows.map(keyOf), [rows]);
  const allVisiblePicked =
    visibleKeys.length > 0 && visibleKeys.every((k) => picked.has(k));
  const toggleOne = (k: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  const toggleAllVisible = () =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (allVisiblePicked) visibleKeys.forEach((k) => next.delete(k));
      else visibleKeys.forEach((k) => next.add(k));
      return next;
    });

  const runTag = (op: "add" | "remove") => {
    const tag = tagInput.trim();
    if (!tag) {
      setMsg("태그를 입력해 주세요.");
      return;
    }
    const keys = rows
      .filter((r) => picked.has(keyOf(r)))
      .map((r) => ({ id: r.program_id, basis: r.basis }));
    if (!keys.length) {
      setMsg("선택된 사업이 없습니다.");
      return;
    }
    setMsg("");
    startTransition(async () => {
      const res = await applyTag(keys, tag, op);
      if (res.ok) {
        setMsg(
          `'${tag}' 태그 ${op === "add" ? "추가" : "제거"} 완료 — ${res.affected}건 반영`
        );
        setTagInput("");
        setPicked(new Set());
        router.refresh();
      } else {
        setMsg(res.message);
      }
    });
  };

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <div className={`container ${styles.headRow}`}>
          <Link href="/" className={styles.brand}>
            ← 사업 데이터
          </Link>
          <span className={styles.who}>{email}</span>
        </div>
      </header>

      {/* 탭 */}
      <div className={styles.tabsWrap}>
        <div className={`container ${styles.tabs}`}>
          <button
            className={`${styles.tabBtn} ${tab === "table" ? styles.tabOn : ""}`}
            onClick={() => setTab("table")}
          >
            표
          </button>
          <button
            className={`${styles.tabBtn} ${tab === "dashboard" ? styles.tabOn : ""}`}
            onClick={() => setTab("dashboard")}
          >
            대시보드
          </button>
        </div>
      </div>

      {/* 공통 필터 바 */}
      <div className={styles.barWrap}>
        <div className={`container ${styles.bar}`}>
          <input
            className={styles.search}
            type="search"
            placeholder="사업명·메모·기금처·태그 검색…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className={styles.sel} value={basis} onChange={(e) => setBasis(e.target.value)}>
            <option value="">전체 기준</option>
            <option value="report">보고서</option>
            <option value="ledger">원장</option>
            {includeWP ? <option value="whitepaper">백서(누적)</option> : null}
          </select>
          <select className={styles.sel} value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">전체 연도</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
          <select className={styles.sel} value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">전체 영역</option>
            {areaNames.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            className={styles.sel}
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
          >
            <option value="">전체 태그</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>
          <label className={styles.wpToggle}>
            <input
              type="checkbox"
              checked={includeWP}
              onChange={(e) => {
                setIncludeWP(e.target.checked);
                if (!e.target.checked && basis === "whitepaper") setBasis("");
              }}
            />
            백서(누적) 포함
          </label>
          <button className={styles.reset} onClick={resetFilters}>
            초기화
          </button>
        </div>
      </div>

      {tab === "table" ? (
        <TableView
          rows={rows}
          sum={sum}
          picked={picked}
          allVisiblePicked={allVisiblePicked}
          toggleOne={toggleOne}
          toggleAllVisible={toggleAllVisible}
          onSelect={setSelected}
          tagInput={tagInput}
          setTagInput={setTagInput}
          allTags={allTags}
          runTag={runTag}
          pending={pending}
          msg={msg}
        />
      ) : (
        <Dashboard rows={rows} areaSummary={areaSummary} includeWP={includeWP} />
      )}

      {selected ? (
        <Drawer row={selected} onClose={() => setSelected(null)} />
      ) : null}
    </main>
  );
}

function TableView({
  rows,
  sum,
  picked,
  allVisiblePicked,
  toggleOne,
  toggleAllVisible,
  onSelect,
  tagInput,
  setTagInput,
  allTags,
  runTag,
  pending,
  msg,
}: {
  rows: ProgramRow[];
  sum: number;
  picked: Set<string>;
  allVisiblePicked: boolean;
  toggleOne: (k: string) => void;
  toggleAllVisible: () => void;
  onSelect: (r: ProgramRow) => void;
  tagInput: string;
  setTagInput: (v: string) => void;
  allTags: string[];
  runTag: (op: "add" | "remove") => void;
  pending: boolean;
  msg: string;
}) {
  return (
    <div className="container">
      <p className={styles.count}>
        <b>{rows.length}</b>개 사업 · 예산 합계 <b>{fmt(sum)}</b>원 (약 {eok(sum)}억){" "}
        <span className={styles.muted}>— 기준·단위가 섞이면 단순 합계는 참고용</span>
      </p>

      {/* 일괄 태깅 바 */}
      {picked.size > 0 ? (
        <div className={styles.tagBar}>
          <span className={styles.tagBarCount}>{picked.size}건 선택</span>
          <input
            className={styles.tagInput}
            list="all-tags"
            placeholder="태그 입력 (예: 재단지원)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            disabled={pending}
          />
          <datalist id="all-tags">
            {allTags.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <button
            className={styles.tagAdd}
            onClick={() => runTag("add")}
            disabled={pending}
          >
            태그 추가
          </button>
          <button
            className={styles.tagRemove}
            onClick={() => runTag("remove")}
            disabled={pending}
          >
            태그 제거
          </button>
          {pending ? <span className={styles.muted}>저장 중…</span> : null}
        </div>
      ) : null}
      {msg ? <p className={styles.msg}>{msg}</p> : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.chk}>
                <input
                  type="checkbox"
                  checked={allVisiblePicked}
                  onChange={toggleAllVisible}
                  aria-label="전체 선택"
                />
              </th>
              <th>연도</th>
              <th>기준</th>
              <th>영역</th>
              <th>사업명 / 태그</th>
              <th className={styles.num}>지원수</th>
              <th className={styles.num}>예산(원)</th>
              <th className={styles.num}>억</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const k = keyOf(r);
              return (
                <tr key={k} className={picked.has(k) ? styles.pickedRow : ""}>
                  <td className={styles.chk} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={picked.has(k)}
                      onChange={() => toggleOne(k)}
                      aria-label="선택"
                    />
                  </td>
                  <td onClick={() => onSelect(r)}>{r.report_year ?? "—"}</td>
                  <td onClick={() => onSelect(r)}>
                    <span className={`${styles.tag} ${styles["b_" + r.basis]}`}>
                      {BLABEL[r.basis]}
                    </span>
                  </td>
                  <td onClick={() => onSelect(r)}>{r.area_name ?? "—"}</td>
                  <td onClick={() => onSelect(r)}>
                    <div className={styles.pname}>{r.program_name}</div>
                    {r.period ? <div className={styles.sub}>{r.period}</div> : null}
                    {r.tags && r.tags.length ? (
                      <div className={styles.chips}>
                        {r.tags.map((t) => (
                          <span key={t} className={styles.chip}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </td>
                  <td className={styles.num} onClick={() => onSelect(r)}>
                    {r.headline_value != null
                      ? fmt(r.headline_value) + (r.headline_unit ?? "")
                      : "—"}
                  </td>
                  <td className={styles.num} onClick={() => onSelect(r)}>
                    {fmt(r.budget_krw)}
                  </td>
                  <td className={styles.num} onClick={() => onSelect(r)}>
                    {eok(r.budget_krw)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Dashboard({
  rows,
  areaSummary,
  includeWP,
}: {
  rows: ProgramRow[];
  areaSummary: AreaSummaryRow[];
  includeWP: boolean;
}) {
  // 단위별 지원수 합계 (단위 섞임 방지)
  const byUnit = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      if (r.headline_value == null || !r.headline_unit) continue;
      m.set(r.headline_unit, (m.get(r.headline_unit) ?? 0) + r.headline_value);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const budgetSum = rows.reduce((s, r) => s + (r.budget_krw ?? 0), 0);

  // 내 합계 vs 공식 합계: (basis, report_year, area_code) 기준 그룹 비교.
  // 백서는 area_summary에 없고 누적이므로 대조에서 제외.
  const recon = useMemo(() => {
    const mine = new Map<string, { row: ProgramRow; sum: number; n: number }>();
    for (const r of rows) {
      if (r.basis === "whitepaper") continue;
      if (r.report_year == null || !r.area_code) continue;
      const k = `${r.basis}|${r.report_year}|${r.area_code}`;
      const cur = mine.get(k) ?? { row: r, sum: 0, n: 0 };
      cur.sum += r.budget_krw ?? 0;
      cur.n += 1;
      mine.set(k, cur);
    }
    const official = new Map<string, AreaSummaryRow>();
    for (const a of areaSummary) {
      official.set(`${a.basis}|${a.report_year}|${a.area_code}`, a);
    }
    const keys = new Set([...mine.keys(), ...official.keys()]);
    return [...keys]
      .map((k) => {
        const [b, y, ac] = k.split("|");
        const m = mine.get(k);
        const o = official.get(k);
        const mineSum = m?.sum ?? null;
        const offSum = o?.budget_krw ?? null;
        const diff =
          mineSum != null && offSum != null ? mineSum - offSum : null;
        const pct =
          diff != null && offSum
            ? (diff / offSum) * 100
            : diff != null && offSum === 0 && diff !== 0
            ? Infinity
            : 0;
        return {
          key: k,
          basis: b,
          year: y,
          areaCode: ac,
          areaName: m?.row.area_name ?? o?.area_name ?? ac,
          n: m?.n ?? 0,
          mineSum,
          offSum,
          diff,
          pct,
          match: diff != null && Math.abs(pct) <= 1,
        };
      })
      // 현재 필터 그룹에 속한 키만 (내 합계가 있는 것) — 필터 반영
      .filter((x) => x.mineSum != null)
      .sort((a, b) => a.basis.localeCompare(b.basis) || b.year.localeCompare(a.year) || a.areaCode.localeCompare(b.areaCode));
  }, [rows, areaSummary]);

  return (
    <div className={`container ${styles.dash}`}>
      {!includeWP ? (
        <p className={styles.dashNote}>
          백서(2003–2022 누적)는 합산·대조에서 제외돼 있습니다. 필터 바의
          “백서(누적) 포함”을 켜면 누적 데이터도 볼 수 있습니다.
        </p>
      ) : (
        <p className={styles.dashWarn}>
          ⚠ 백서(누적)가 포함돼 있습니다. 연도별 실적과 합치면 이중계상될 수 있으니
          참고용으로만 보세요.
        </p>
      )}

      {/* 요약 카드 */}
      <div className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>사업 개수</div>
          <div className={styles.cardValue}>{fmt(rows.length)}개</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>예산 합계</div>
          <div className={styles.cardValue}>{eok(budgetSum)}억</div>
          <div className={styles.cardSub}>{fmt(budgetSum)}원</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>지원수 합계 (단위별)</div>
          {byUnit.length ? (
            <div className={styles.unitList}>
              {byUnit.map(([u, v]) => (
                <div key={u} className={styles.unitRow}>
                  <span className={styles.unitName}>{u}</span>
                  <b>{fmt(v)}</b>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.cardSub}>대표실적 수치 없음</div>
          )}
        </div>
      </div>

      {/* 대조: 내 합계 vs 공식 합계 */}
      <h3 className={styles.dashH}>내 합계 vs 공식 합계 (area_summary)</h3>
      <p className={styles.muted}>
        현재 필터로 묶인 사업들의 예산 합을 보고서가 명시한 영역별 공식 합계와 대조합니다.
        차이 ±1% 이내면 일치로 봅니다.
      </p>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>기준</th>
              <th>연도</th>
              <th>영역</th>
              <th className={styles.num}>사업수</th>
              <th className={styles.num}>내 합계(원)</th>
              <th className={styles.num}>공식 합계(원)</th>
              <th className={styles.num}>차이</th>
              <th>판정</th>
            </tr>
          </thead>
          <tbody>
            {recon.map((x) => (
              <tr key={x.key}>
                <td>
                  <span className={`${styles.tag} ${styles["b_" + x.basis]}`}>
                    {BLABEL[x.basis] ?? x.basis}
                  </span>
                </td>
                <td>{x.year}</td>
                <td>{x.areaName}</td>
                <td className={styles.num}>{x.n}</td>
                <td className={styles.num}>{fmt(x.mineSum)}</td>
                <td className={styles.num}>
                  {x.offSum == null ? "공식치 없음" : fmt(x.offSum)}
                </td>
                <td className={styles.num}>
                  {x.diff == null
                    ? "—"
                    : `${x.diff >= 0 ? "+" : ""}${fmt(x.diff)}${
                        Number.isFinite(x.pct) ? ` (${x.pct.toFixed(1)}%)` : ""
                      }`}
                </td>
                <td>
                  {x.offSum == null ? (
                    <span className={styles.badgeNa}>대조불가</span>
                  ) : x.match ? (
                    <span className={styles.badgeOk}>일치</span>
                  ) : (
                    <span className={styles.badgeDiff}>차이</span>
                  )}
                </td>
              </tr>
            ))}
            {recon.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.sub}>
                  대조할 그룹이 없습니다. (필터를 조정하거나 백서 외 데이터를 선택하세요)
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Drawer({ row, onClose }: { row: ProgramRow; onClose: () => void }) {
  const details = row.details ?? [];
  const funders = row.funders ?? [];
  const kpis = row.kpis ?? [];
  const tags = row.tags ?? [];
  return (
    <>
      <div className={styles.ov} onClick={onClose} />
      <aside className={styles.drawer}>
        <button className={styles.close} onClick={onClose}>
          닫기 ✕
        </button>
        <h3 className={styles.dTitle}>{row.program_name}</h3>
        <p className={styles.dMeta}>
          {row.program_id} ·{" "}
          <span className={`${styles.tag} ${styles["b_" + row.basis]}`}>
            {BLABEL[row.basis]}
          </span>
        </p>

        {tags.length ? (
          <div className={styles.chips}>
            {tags.map((t) => (
              <span key={t} className={styles.chip}>
                #{t}
              </span>
            ))}
          </div>
        ) : null}

        <dl className={styles.kv}>
          <dt>영역</dt>
          <dd>
            {row.area_name ?? "—"} ({row.area_code})
          </dd>
          <dt>연도</dt>
          <dd>
            {row.report_year ?? "—"}
            {row.period ? ` · ${row.period}` : ""}
          </dd>
          <dt>대표실적</dt>
          <dd>
            {row.headline_value != null
              ? fmt(row.headline_value) + (row.headline_unit ?? "")
              : "—"}
          </dd>
          <dt>예산</dt>
          <dd>
            {fmt(row.budget_krw)}원 (약 {eok(row.budget_krw)}억)
          </dd>
          <dt>대상</dt>
          <dd>{row.target || "—"}</dd>
          <dt>지원유형</dt>
          <dd>{row.support_type || "—"}</dd>
          <dt>출처</dt>
          <dd>{row.source_document || "—"}</dd>
        </dl>

        {row.memo ? (
          <>
            <h4 className={styles.sec}>메모</h4>
            <div className={styles.memo}>{row.memo}</div>
          </>
        ) : null}

        <h4 className={styles.sec}>세부실적 ({details.length})</h4>
        {details.length ? (
          details.map((d, i) => (
            <div key={i} className={styles.dt}>
              {d.item} — <b>{fmt(d.value)}{d.unit ?? ""}</b>
              {d.amount_krw != null ? ` / ${fmt(d.amount_krw)}원` : ""}
              {d.aggregation ? <span className={styles.agg}>{d.aggregation}</span> : null}
            </div>
          ))
        ) : (
          <div className={styles.sub}>세부 없음</div>
        )}

        <h4 className={styles.sec}>기금처 ({funders.length})</h4>
        {funders.length ? (
          funders.map((f, i) => (
            <div key={i} className={styles.dt}>
              {f.funder}
              {f.result ? ` — ${f.result}` : ""}
              {f.fund_size_krw != null ? ` / ${fmt(f.fund_size_krw)}원` : ""}
            </div>
          ))
        ) : (
          <div className={styles.sub}>기금처 정보 없음</div>
        )}

        <h4 className={styles.sec}>KPI ({kpis.length})</h4>
        {kpis.length ? (
          kpis.map((k, i) => (
            <div key={i} className={styles.dt}>
              {k.metric} — <b>{fmt(k.value)}{k.unit ?? ""}</b>
            </div>
          ))
        ) : (
          <div className={styles.sub}>KPI 없음</div>
        )}
      </aside>
    </>
  );
}
