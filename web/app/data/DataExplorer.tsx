"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import styles from "./page.module.css";
import { setCategory } from "./actions";
import BudgetBarChart from "./charts/BudgetBarChart";
import { CATEGORIES, UNSET, catHex, unitLabel } from "./categories";

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
  category_std: string | null;
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

// 일반 숫자 (건수·지원수 등)
const fmt = (n: number | null | undefined) =>
  n == null ? "—" : Number(n).toLocaleString("ko-KR");
// 정확한 원 단위 (per-row·상세)
const won = (n: number | null | undefined) =>
  n == null ? "—" : Number(n).toLocaleString("ko-KR") + "원";
// 반올림 억원 (요약·합계·차트) — 원과 같은 줄에 쓰지 않는다
const eokwon = (n: number | null | undefined) =>
  n == null
    ? "—"
    : (Number(n) / 1e8).toLocaleString("ko-KR", { maximumFractionDigits: 1 }) +
      "억원";

// 백서(2003-2022 누적)는 report_year가 2022지만 표시는 기간으로
const yearLabel = (r: { basis: string; report_year: number | null }) =>
  r.basis === "whitepaper" ? "2003–2022" : r.report_year ?? "—";

const keyOf = (r: { program_id: string; basis: string }) =>
  `${r.program_id}::${r.basis}`;

// 표준분류 컬러 닷 + 라벨 (그래프와 통일 — 미분류도 회색 닷)
function CatChip({ cat }: { cat: string | null }) {
  return (
    <span className={styles.catChip}>
      <span className={styles.catDot} style={{ background: catHex(cat) }} />
      <span className={cat ? undefined : styles.unsetText}>{cat ?? "미분류"}</span>
    </span>
  );
}

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
  // 기준 다중 선택 (체크된 기준만 표시).
  // 레이어 모델: 정제 레이어=보고서(2023-2025)+백서(2003-2022), 원본 레이어=원장.
  // 기본=정제 레이어 전체(보고서+백서). 원장은 같은 기간을 정제 전 raw로 적은 것이라
  // 보고서와 함께 합산하면 이중계상 → 합계 시 한 레이어만.
  const [bases, setBases] = useState<Set<string>>(
    () => new Set(["report", "whitepaper"])
  );
  const [year, setYear] = useState("");
  const [area, setArea] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [selected, setSelected] = useState<ProgramRow | null>(null);

  const toggleBasis = (b: string) =>
    setBases((prev) => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b);
      else next.add(b);
      return next;
    });

  // 다중선택 + 표준분류 설정
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [catInput, setCatInput] = useState(""); // 설정 드롭다운 값, ""=분류 해제
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

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return programs.filter((r) => {
      // 체크된 기준만 표시 (하나도 안 고르면 전체 표시)
      if (bases.size > 0 && !bases.has(r.basis)) return false;
      if (year && String(r.report_year) !== year) return false;
      if (area && r.area_name !== area) return false;
      if (catFilter) {
        if (catFilter === UNSET) {
          if (r.category_std) return false;
        } else if (r.category_std !== catFilter) return false;
      }
      if (query) {
        const hay = `${r.program_name ?? ""} ${r.memo ?? ""} ${(r.funders ?? [])
          .map((f) => f.funder ?? "")
          .join(" ")} ${r.support_type ?? ""} ${r.category_std ?? ""}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [programs, q, bases, year, area, catFilter]);

  const sum = rows.reduce((s, r) => s + (r.budget_krw ?? 0), 0);

  const resetFilters = () => {
    setQ("");
    setBases(new Set(["report", "whitepaper"]));
    setYear("");
    setArea("");
    setCatFilter("");
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

  const runSetCategory = () => {
    // 버그 수정: 선택 키를 필터된 rows가 아니라 전체 programs에서 추출.
    // (필터를 바꿔 화면에서 사라진 선택도 누락 없이 저장)
    const keys = programs
      .filter((r) => picked.has(keyOf(r)))
      .map((r) => ({ id: r.program_id, basis: r.basis }));
    if (!keys.length) {
      setMsg("선택된 사업이 없습니다.");
      return;
    }
    const cat = catInput.trim() || null; // "" → 분류 해제
    setMsg("");
    startTransition(async () => {
      const res = await setCategory(keys, cat);
      if (res.ok) {
        setMsg(
          cat
            ? `'${cat}' 표준분류 설정 완료 — ${res.affected}건 반영`
            : `표준분류 해제 완료 — ${res.affected}건 반영`
        );
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
            aria-label="사업 검색"
            placeholder="사업명·메모·기금처·표준분류 검색…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span className={styles.basisGroup}>
            <span className={styles.basisLabel}>기준</span>
            <label className={styles.basisChk}>
              <input
                type="checkbox"
                checked={bases.has("report")}
                onChange={() => toggleBasis("report")}
              />
              보고서
            </label>
            <label className={styles.basisChk}>
              <input
                type="checkbox"
                checked={bases.has("ledger")}
                onChange={() => toggleBasis("ledger")}
              />
              원장
            </label>
            <label className={styles.basisChk}>
              <input
                type="checkbox"
                checked={bases.has("whitepaper")}
                onChange={() => toggleBasis("whitepaper")}
              />
              백서(누적)
            </label>
          </span>
          <select className={styles.sel} aria-label="연도 필터" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">전체 연도</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>
                {y === 2022 ? "2003–2022" : y}
              </option>
            ))}
          </select>
          <select className={styles.sel} aria-label="원본 영역 필터" value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">전체 영역</option>
            {areaNames.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            className={styles.sel}
            aria-label="표준분류 필터"
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            <option value="">전체 표준분류</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={UNSET}>{UNSET}</option>
          </select>
          <button className={styles.reset} onClick={resetFilters}>
            필터 초기화
          </button>
        </div>

        {tab === "table" ? (
          <div className={`container ${styles.toolbar}`}>
            <p className={styles.count}>
              <b>{fmt(rows.length)}</b>개 사업 · 예산 합계{" "}
              <b className={styles.num}>{eokwon(sum)}</b>{" "}
              <span className={styles.muted}>— 기준·단위가 섞이면 단순 합계는 참고용</span>
            </p>
            {picked.size > 0 ? (
              <div className={styles.tagBar}>
                <span className={styles.tagBarCount}>
                  {picked.size}건 선택 · 표준분류 설정
                </span>
                <select
                  className={styles.sel}
                  aria-label="선택 항목에 설정할 표준분류"
                  value={catInput}
                  onChange={(e) => setCatInput(e.target.value)}
                  disabled={pending}
                >
                  <option value="">— 분류 해제 —</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <button
                  className={styles.tagAdd}
                  onClick={runSetCategory}
                  disabled={pending}
                >
                  {pending ? "저장 중…" : "저장"}
                </button>
              </div>
            ) : null}
            {msg ? <p className={styles.msg}>{msg}</p> : null}
          </div>
        ) : null}
      </div>

      {tab === "table" ? (
        <TableView
          rows={rows}
          picked={picked}
          allVisiblePicked={allVisiblePicked}
          toggleOne={toggleOne}
          toggleAllVisible={toggleAllVisible}
          onSelect={setSelected}
        />
      ) : (
        <Dashboard
          rows={rows}
          areaSummary={areaSummary}
          bothReportLedger={bases.has("report") && bases.has("ledger")}
        />
      )}

      {selected ? (
        <Drawer row={selected} onClose={() => setSelected(null)} />
      ) : null}
    </main>
  );
}

function TableView({
  rows,
  picked,
  allVisiblePicked,
  toggleOne,
  toggleAllVisible,
  onSelect,
}: {
  rows: ProgramRow[];
  picked: Set<string>;
  allVisiblePicked: boolean;
  toggleOne: (k: string) => void;
  toggleAllVisible: () => void;
  onSelect: (r: ProgramRow) => void;
}) {
  return (
    <div className={`container ${styles.tablePane}`}>
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
              <th>영역(원본)</th>
              <th>사업명 / 표준분류</th>
              <th className={styles.num}>지원 수</th>
              <th className={styles.num}>예산</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const k = keyOf(r);
              return (
                <tr
                  key={k}
                  className={`${styles.row} ${picked.has(k) ? styles.pickedRow : ""}`}
                  tabIndex={0}
                  aria-label={`${r.program_name ?? "사업"} 상세 보기`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onSelect(r);
                    }
                  }}
                >
                  <td className={styles.chk} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={picked.has(k)}
                      onChange={() => toggleOne(k)}
                      aria-label="선택"
                    />
                  </td>
                  <td onClick={() => onSelect(r)}>{yearLabel(r)}</td>
                  <td onClick={() => onSelect(r)}>
                    <span className={`${styles.tag} ${styles["b_" + r.basis]}`}>
                      {BLABEL[r.basis]}
                    </span>
                  </td>
                  <td onClick={() => onSelect(r)}>{r.area_name ?? "—"}</td>
                  <td onClick={() => onSelect(r)}>
                    <div className={styles.pname}>{r.program_name}</div>
                    {r.period ? <div className={styles.sub}>{r.period}</div> : null}
                    <div className={styles.chips}>
                      <CatChip cat={r.category_std} />
                    </div>
                  </td>
                  <td className={`${styles.num} ${styles.numFont}`} onClick={() => onSelect(r)}>
                    {r.headline_value != null
                      ? fmt(r.headline_value) + (r.headline_unit ?? "")
                      : "—"}
                  </td>
                  <td className={`${styles.num} ${styles.numFont}`} onClick={() => onSelect(r)}>
                    {won(r.budget_krw)}
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
  bothReportLedger,
}: {
  rows: ProgramRow[];
  areaSummary: AreaSummaryRow[];
  bothReportLedger: boolean;
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

  // 표준분류별 요약 (현재 필터 기준)
  const byCategory = useMemo(() => {
    const m = new Map<string, { n: number; budget: number }>();
    for (const r of rows) {
      const key = r.category_std ?? UNSET;
      const cur = m.get(key) ?? { n: 0, budget: 0 };
      cur.n += 1;
      cur.budget += r.budget_krw ?? 0;
      m.set(key, cur);
    }
    return [...CATEGORIES, UNSET]
      .map((c) => ({ cat: c, ...(m.get(c) ?? { n: 0, budget: 0 }) }))
      .filter((x) => x.n > 0);
  }, [rows]);

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
      {bothReportLedger ? (
        <p className={styles.dashWarn}>
          ⚠ 보고서와 원장을 함께 선택했습니다. 둘은 같은 활동의 두 기록(원장=재무결산
          원본, 보고서=정제본)이라 합계가 <b>이중계상</b>됩니다. 정확한 합계를 보려면
          기준에서 하나만 선택하세요.
        </p>
      ) : (
        <p className={styles.dashNote}>
          정제 레이어(보고서 2023–2025 + 백서 2003–2022)를 합산 중입니다 — 둘은 같은
          레이어라 연도가 겹치지 않아 함께 더하면 2003–2025 전체 흐름이 됩니다. 원장은
          같은 기간을 정제 전 원본으로 적은 별도 레이어라, 보고서와 함께 더하면 중복됩니다.
        </p>
      )}

      {/* 요약 카드 */}
      <div className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>사업 개수</div>
          <div className={`${styles.cardValue} ${styles.numFont}`}>
            {fmt(rows.length)}
            <span className={styles.cardUnit}>개</span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>예산 합계</div>
          <div className={`${styles.cardValue} ${styles.numFont}`}>
            {eokwon(budgetSum)}
          </div>
          <div className={`${styles.cardSub} ${styles.numFont}`}>{won(budgetSum)}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>지원 수 합계 (단위별)</div>
          {byUnit.length ? (
            <div className={styles.unitList}>
              {byUnit.map(([u, v]) => (
                <div key={u} className={styles.unitRow}>
                  <span className={styles.unitName}>{unitLabel(u)}</span>
                  <b className={styles.numFont}>
                    {fmt(v)}
                    <span className={styles.unitSuffix}>{u}</span>
                  </b>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.cardSub}>대표실적 수치 없음</div>
          )}
        </div>
      </div>

      {/* 표준분류별 요약 */}
      <h3 className={styles.dashH}>표준분류별 요약</h3>
      <BudgetBarChart
        data={byCategory.map((x) => ({ name: x.cat, value: x.budget }))}
      />
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>표준분류</th>
              <th className={styles.num}>사업 수</th>
              <th className={styles.num}>예산</th>
            </tr>
          </thead>
          <tbody>
            {byCategory.map((x) => (
              <tr key={x.cat}>
                <td>
                  <CatChip cat={x.cat === UNSET ? null : x.cat} />
                </td>
                <td className={`${styles.num} ${styles.numFont}`}>{fmt(x.n)}</td>
                <td className={`${styles.num} ${styles.numFont}`}>{eokwon(x.budget)}</td>
              </tr>
            ))}
            {byCategory.length === 0 ? (
              <tr>
                <td colSpan={3} className={styles.sub}>
                  표시할 사업이 없습니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
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
                <td className={`${styles.num} ${styles.numFont}`}>{fmt(x.n)}</td>
                <td className={`${styles.num} ${styles.numFont}`}>{won(x.mineSum)}</td>
                <td className={`${styles.num} ${styles.numFont}`}>
                  {x.offSum == null ? "공식치 없음" : won(x.offSum)}
                </td>
                <td className={`${styles.num} ${styles.numFont}`}>
                  {x.diff == null
                    ? "—"
                    : `${x.diff >= 0 ? "+" : ""}${won(x.diff)}${
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

  // Esc 로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className={styles.ov} onClick={onClose} />
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <button
          className={styles.close}
          onClick={onClose}
          aria-label="상세 닫기"
          autoFocus
        >
          닫기 ✕
        </button>
        <h3 id="drawer-title" className={styles.dTitle}>
          {row.program_name}
        </h3>
        <p className={styles.dMeta}>
          {row.program_id} ·{" "}
          <span className={`${styles.tag} ${styles["b_" + row.basis]}`}>
            {BLABEL[row.basis]}
          </span>
        </p>

        <div className={styles.chips}>
          <CatChip cat={row.category_std} />
        </div>

        <dl className={styles.kv}>
          <dt>표준분류</dt>
          <dd>{row.category_std ?? "미분류"}</dd>
          <dt>영역(원본)</dt>
          <dd>
            {row.area_name ?? "—"} ({row.area_code})
          </dd>
          <dt>연도</dt>
          <dd>
            {yearLabel(row)}
            {row.period ? ` · ${row.period}` : ""}
          </dd>
          <dt>대표실적</dt>
          <dd className={styles.numFont}>
            {row.headline_value != null
              ? fmt(row.headline_value) + (row.headline_unit ?? "")
              : "—"}
          </dd>
          <dt>예산</dt>
          <dd>
            <span className={styles.numFont}>{won(row.budget_krw)}</span>
            {row.budget_krw != null ? (
              <div className={`${styles.sub} ${styles.numFont}`}>{eokwon(row.budget_krw)}</div>
            ) : null}
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
