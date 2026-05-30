"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import styles from "./page.module.css";
import { setCategory } from "./actions";
import BudgetBarChart from "./charts/BudgetBarChart";
import { CATEGORIES, UNSET, catHex, unitLabel, sortUnits } from "./categories";

// 다크 모드 컨텍스트 — CatChip/차트가 색을 테마에 맞게 고른다.
const DarkCtx = createContext(false);

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
  report: "연차보고서",
  ledger: "재무결산",
  whitepaper: "백서(누적)",
};

// 일반 숫자 (상세 박스 내 세부값 등 — 문자열)
const fmt = (n: number | null | undefined) =>
  n == null ? "—" : Number(n).toLocaleString("ko-KR");

// 백서(2003-2022 누적)는 report_year가 2022지만 표시는 기간으로
const yearLabel = (r: { basis: string; report_year: number | null }) =>
  r.basis === "whitepaper" ? "2003–2022" : r.report_year ?? "—";

const keyOf = (r: { program_id: string; basis: string }) =>
  `${r.program_id}::${r.basis}`;

// 숫자 강조: 볼드 + sky 컬러. 단위(명/원/억원)는 일반 텍스트로 분리해 구분.
function Num({
  value,
  unit,
}: {
  value: number | null | undefined;
  unit?: string;
}) {
  if (value == null) return <span className={styles.numDash}>-</span>;
  return (
    <span className={styles.numWrap}>
      <span className={styles.numHi}>{Number(value).toLocaleString("ko-KR")}</span>
      {unit ? <span className={styles.numUnit}>{unit}</span> : null}
    </span>
  );
}
function Won({ n }: { n: number | null | undefined }) {
  return <Num value={n} unit="원" />;
}
function Eokwon({ n }: { n: number | null | undefined }) {
  if (n == null) return <span className={styles.numDash}>-</span>;
  return (
    <span className={styles.numWrap}>
      <span className={styles.numHi}>
        {(Number(n) / 1e8).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}
      </span>
      <span className={styles.numUnit}>억원</span>
    </span>
  );
}

// 표준분류 컬러 닷 + 라벨 (그래프와 통일 — 미분류도 회색 닷, 다크 대응)
function CatChip({ cat }: { cat: string | null }) {
  const dark = useContext(DarkCtx);
  return (
    <span className={styles.catChip}>
      <span className={styles.catDot} style={{ background: catHex(cat, dark) }} />
      <span className={cat ? undefined : styles.unsetText}>{cat ?? "미분류"}</span>
    </span>
  );
}

// 현재 필터된 행을 CSV로 내보내기 (Excel 한글 대응 위해 BOM 추가)
function downloadCsv(rows: ProgramRow[], unitColumns: string[]) {
  const headers = [
    "연도",
    "기준",
    "영역(원본)",
    "표준분류",
    "사업명",
    "기간",
    ...unitColumns.map((u) => unitLabel(u)),
    "예산(원)",
  ];
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows.map((r) =>
    [
      yearLabel(r),
      BLABEL[r.basis] ?? r.basis,
      r.area_name ?? "",
      r.category_std ?? "미분류",
      r.program_name ?? "",
      r.period ?? "",
      ...unitColumns.map((u) =>
        r.headline_unit === u && r.headline_value != null
          ? r.headline_value
          : ""
      ),
      r.budget_krw ?? "",
    ]
      .map(esc)
      .join(",")
  );
  const csv = "﻿" + [headers.join(","), ...body].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `사업데이터_${rows.length}건.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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

  const [tab, setTab] = useState<"table" | "dashboard">("dashboard");
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
  // 표준분류 필터 — 다중선택(빈 Set = 전체 표시). 대시보드에서 여러 분류 비교용.
  const [catFilter, setCatFilter] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<ProgramRow | null>(null);
  const toggleCat = (c: string) =>
    setCatFilter((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });

  // 다크 모드 (localStorage 유지)
  const [dark, setDark] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem("data-theme") === "dark") setDark(true);
    } catch {}
  }, []);
  const toggleDark = () =>
    setDark((d) => {
      const next = !d;
      try {
        localStorage.setItem("data-theme", next ? "dark" : "light");
      } catch {}
      return next;
    });

  // 지원수 단위 컬럼 (전체 데이터 기준 — 필터 바뀌어도 컬럼 고정)
  const unitColumns = useMemo(
    () =>
      sortUnits([
        ...new Set(
          programs.map((p) => p.headline_unit).filter((u): u is string => !!u)
        ),
      ]),
    [programs]
  );

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
      if (catFilter.size > 0) {
        const key = r.category_std ?? UNSET;
        if (!catFilter.has(key)) return false;
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

  const resetFilters = () => {
    setQ("");
    setBases(new Set(["report", "whitepaper"]));
    setYear("");
    setArea("");
    setCatFilter(new Set());
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
    // 선택 키는 필터된 rows가 아니라 전체 programs에서 추출
    // (필터를 바꿔 화면에서 사라진 선택도 누락 없이 저장).
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
    <DarkCtx.Provider value={dark}>
    <main className={styles.page} data-theme={dark ? "dark" : "light"}>
      <header className={styles.head}>
        <div className={`container ${styles.headRow}`}>
          <span className={styles.who}>{email}</span>
        </div>
      </header>

      {/* 탭 + 테마 토글 */}
      <div className={styles.tabsWrap}>
        <div className={`container ${styles.tabs}`}>
          <div className={styles.tabGroup}>
            <button
              className={`${styles.tabBtn} ${tab === "dashboard" ? styles.tabOn : ""}`}
              onClick={() => setTab("dashboard")}
            >
              대시보드
            </button>
            <button
              className={`${styles.tabBtn} ${tab === "table" ? styles.tabOn : ""}`}
              onClick={() => setTab("table")}
            >
              표
            </button>
          </div>
          <div className={styles.themeToggle} role="group" aria-label="테마 전환">
            <button
              type="button"
              className={`${styles.themeOpt} ${!dark ? styles.themeOptOn : ""}`}
              onClick={() => dark && toggleDark()}
              aria-pressed={!dark}
            >
              Light
            </button>
            <button
              type="button"
              className={`${styles.themeOpt} ${dark ? styles.themeOptOn : ""}`}
              onClick={() => !dark && toggleDark()}
              aria-pressed={dark}
            >
              Dark
            </button>
          </div>
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
              연차보고서
            </label>
            <label className={styles.basisChk}>
              <input
                type="checkbox"
                checked={bases.has("ledger")}
                onChange={() => toggleBasis("ledger")}
              />
              재무결산
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
          <span className={styles.basisGroup}>
            <span className={styles.basisLabel}>표준분류</span>
            {[...CATEGORIES, UNSET].map((c) => (
              <label key={c} className={styles.basisChk}>
                <input
                  type="checkbox"
                  checked={catFilter.has(c)}
                  onChange={() => toggleCat(c)}
                />
                {c}
              </label>
            ))}
          </span>
          <button className={styles.reset} onClick={resetFilters}>
            필터 초기화
          </button>
        </div>

        {tab === "table" && (picked.size > 0 || msg) ? (
          <div className={`container ${styles.toolbar}`}>
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
          unitColumns={unitColumns}
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
          unitColumns={unitColumns}
          bothReportLedger={bases.has("report") && bases.has("ledger")}
          dark={dark}
        />
      )}

      {selected ? (
        <Drawer row={selected} onClose={() => setSelected(null)} />
      ) : null}
    </main>
    </DarkCtx.Provider>
  );
}

// 가로 스크롤 영역 — 상단에 본문 표와 동기화된 스크롤바를 둔다(하단 안 보임 해결).
function HScroll({ children, label }: { children: ReactNode; label: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const [scrollW, setScrollW] = useState(0);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScrollW(el.scrollWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    // 표 내용 폭 변화(컬럼/행 변동)는 wrap의 border-box를 안 바꾸므로 table도 관찰
    const tableEl = el.firstElementChild;
    if (tableEl) ro.observe(tableEl);
    return () => ro.disconnect();
  }, []);
  const syncFromTop = () => {
    if (wrapRef.current && topRef.current)
      wrapRef.current.scrollLeft = topRef.current.scrollLeft;
  };
  const syncFromWrap = () => {
    if (wrapRef.current && topRef.current)
      topRef.current.scrollLeft = wrapRef.current.scrollLeft;
  };
  return (
    <>
      <div
        className={styles.topScroll}
        ref={topRef}
        onScroll={syncFromTop}
        aria-hidden
      >
        <div className={styles.topScrollInner} style={{ width: scrollW }} />
      </div>
      <div
        className={styles.tableWrap}
        ref={wrapRef}
        onScroll={syncFromWrap}
        role="region"
        aria-label={label}
        tabIndex={0}
      >
        {children}
      </div>
    </>
  );
}

function TableView({
  rows,
  unitColumns,
  picked,
  allVisiblePicked,
  toggleOne,
  toggleAllVisible,
  onSelect,
}: {
  rows: ProgramRow[];
  unitColumns: string[];
  picked: Set<string>;
  allVisiblePicked: boolean;
  toggleOne: (k: string) => void;
  toggleAllVisible: () => void;
  onSelect: (r: ProgramRow) => void;
}) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({
    key: "",
    dir: "asc",
  });
  const onSort = (key: string) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  // 정렬 가능 컬럼은 기본으로 ↕ 표시(눌러야 보이는 문제 해결), 활성 시 ▲/▼
  const sortInd = (key: string) => (
    <span
      className={sort.key === key ? styles.sortOn : styles.sortIdle}
      aria-hidden
    >
      {sort.key === key ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}
    </span>
  );
  const ariaSort = (key: string): "ascending" | "descending" | "none" =>
    sort.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none";

  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    const dir = sort.dir === "asc" ? 1 : -1;
    const val = (r: ProgramRow): number | string | null => {
      if (sort.key === "name") return r.program_name ?? "";
      if (sort.key === "budget") return r.budget_krw;
      if (sort.key.startsWith("unit:")) {
        const u = sort.key.slice(5);
        return r.headline_unit === u ? r.headline_value : null;
      }
      return null;
    };
    return [...rows].sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1; // 값 없음은 항상 뒤로
      if (vb == null) return -1;
      if (typeof va === "string" || typeof vb === "string")
        return String(va).localeCompare(String(vb), "ko-KR") * dir;
      return (va - vb) * dir;
    });
  }, [rows, sort]);

  const budgetSum = rows.reduce((s, r) => s + (r.budget_krw ?? 0), 0);

  // ── 컬럼 정의 + 순서 변경(좌/우 이동, localStorage 저장) ──
  type ColDef = {
    id: string;
    header: string;
    sortKey?: string;
    num?: boolean;
    render: (r: ProgramRow) => ReactNode;
  };
  const cols = useMemo<ColDef[]>(
    () => [
      { id: "year", header: "연도", render: (r) => yearLabel(r) },
      {
        id: "basis",
        header: "기준",
        render: (r) => (
          <span className={`${styles.tag} ${styles["b_" + r.basis]}`}>
            {BLABEL[r.basis]}
          </span>
        ),
      },
      {
        id: "area",
        header: "영역(원본)",
        render: (r) =>
          r.area_name ? (
            <span className={styles.areaTag}>{r.area_name}</span>
          ) : (
            <span className={styles.unsetText}>—</span>
          ),
      },
      {
        id: "category",
        header: "표준분류",
        render: (r) => <CatChip cat={r.category_std} />,
      },
      {
        id: "name",
        header: "사업명",
        sortKey: "name",
        render: (r) => (
          <>
            <div className={styles.pname}>{r.program_name}</div>
            {r.period ? <div className={styles.sub}>{r.period}</div> : null}
          </>
        ),
      },
      {
        id: "budget",
        header: "예산",
        sortKey: "budget",
        num: true,
        render: (r) => <Won n={r.budget_krw} />,
      },
      ...unitColumns.map(
        (u): ColDef => ({
          id: `unit:${u}`,
          header: unitLabel(u),
          sortKey: `unit:${u}`,
          num: true,
          render: (r) =>
            r.headline_unit === u && r.headline_value != null ? (
              <Num value={r.headline_value} />
            ) : (
              <span className={styles.numDash}>-</span>
            ),
        })
      ),
    ],
    [unitColumns]
  );

  const [order, setOrder] = useState<string[]>(() => cols.map((c) => c.id));
  // 저장된 순서 불러오기 + 현재 컬럼과 reconcile (없어진 단위 id 제거, 새 id 추가)
  useEffect(() => {
    const avail = cols.map((c) => c.id);
    let stored: string[] = [];
    try {
      stored = JSON.parse(localStorage.getItem("data-colorder") || "[]");
    } catch {}
    setOrder([
      ...stored.filter((id) => avail.includes(id)),
      ...avail.filter((id) => !stored.includes(id)),
    ]);
  }, [cols]);

  const moveCol = (id: string, dir: -1 | 1) =>
    setOrder((prev) => {
      const i = prev.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      try {
        localStorage.setItem("data-colorder", JSON.stringify(next));
      } catch {}
      return next;
    });

  const colMap = new Map(cols.map((c) => [c.id, c]));
  const orderedCols = order
    .map((id) => colMap.get(id))
    .filter((c): c is ColDef => !!c);

  return (
    <div className={`container ${styles.tablePane}`}>
      {/* 표 위 캡션 — 사업 수 · 예산 합계 (테이블 위에 떠 있는 느낌) */}
      <div className={styles.tableCap}>
        <div className={styles.statStrip}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>사업 수</span>
            <span className={styles.statNum}>
              {fmt(rows.length)}
              <span className={styles.statUnit}>개</span>
            </span>
          </div>
          <span className={styles.statDiv} aria-hidden />
          <div className={styles.stat}>
            <span className={styles.statLabel}>예산 합계</span>
            <span className={styles.statNum}>
              {(budgetSum / 1e8).toLocaleString("ko-KR", {
                maximumFractionDigits: 1,
              })}
              <span className={styles.statUnit}>억원</span>
            </span>
          </div>
        </div>
        <button
          type="button"
          className={styles.csvBtn}
          onClick={() => downloadCsv(sorted, unitColumns)}
          disabled={rows.length === 0}
        >
          ↓ CSV 다운로드
        </button>
      </div>
      <p className={styles.statNote}>
        기준·단위가 섞이면 단순 합계는 참고용 — 정확한 합계는 기준을 하나만
        선택하세요.
      </p>

      <HScroll label="사업 데이터 표 (좌우 스크롤 가능)">
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
              {orderedCols.map((c, idx) => (
                <th
                  key={c.id}
                  className={c.num ? styles.num : undefined}
                  aria-sort={c.sortKey ? ariaSort(c.sortKey) : undefined}
                >
                  <div
                    className={`${styles.colHead} ${c.num ? styles.colHeadNum : ""}`}
                  >
                    {c.sortKey ? (
                      <button
                        type="button"
                        className={styles.sortBtn}
                        onClick={() => onSort(c.sortKey!)}
                      >
                        {c.header} {sortInd(c.sortKey)}
                      </button>
                    ) : (
                      <span className={styles.colTitle}>{c.header}</span>
                    )}
                    <span className={styles.colMove}>
                      <button
                        type="button"
                        className={styles.moveBtn}
                        onClick={() => moveCol(c.id, -1)}
                        disabled={idx === 0}
                        aria-label={`${c.header} 열 왼쪽으로`}
                        title="왼쪽으로 이동"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className={styles.moveBtn}
                        onClick={() => moveCol(c.id, 1)}
                        disabled={idx === orderedCols.length - 1}
                        aria-label={`${c.header} 열 오른쪽으로`}
                        title="오른쪽으로 이동"
                      >
                        ›
                      </button>
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
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
                  {orderedCols.map((c) => (
                    <td
                      key={c.id}
                      className={c.num ? styles.num : undefined}
                      onClick={() => onSelect(r)}
                    >
                      {c.render(r)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </HScroll>
    </div>
  );
}

function Dashboard({
  rows,
  areaSummary,
  unitColumns,
  bothReportLedger,
  dark,
}: {
  rows: ProgramRow[];
  areaSummary: AreaSummaryRow[];
  unitColumns: string[];
  bothReportLedger: boolean;
  dark: boolean;
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

  // 표준분류별 요약 (현재 필터 기준) — 지원수는 단위별로 분리 집계
  const byCategory = useMemo(() => {
    const m = new Map<
      string,
      { n: number; budget: number; units: Record<string, number> }
    >();
    for (const r of rows) {
      const key = r.category_std ?? UNSET;
      const cur = m.get(key) ?? { n: 0, budget: 0, units: {} };
      cur.n += 1;
      cur.budget += r.budget_krw ?? 0;
      if (r.headline_unit && r.headline_value != null) {
        cur.units[r.headline_unit] =
          (cur.units[r.headline_unit] ?? 0) + r.headline_value;
      }
      m.set(key, cur);
    }
    return [...CATEGORIES, UNSET]
      .map((c) => ({ cat: c, ...(m.get(c) ?? { n: 0, budget: 0, units: {} }) }))
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
        return {
          key: k,
          basis: b,
          year: y,
          areaCode: ac,
          areaName: m?.row.area_name ?? o?.area_name ?? ac,
          n: m?.n ?? 0,
          offSum: o?.budget_krw ?? null,
        };
      })
      // 공식 합계가 명시된 그룹만 표시 (세부 사업 합산·차이는 데이터 보완 후 제공)
      .filter((x) => x.offSum != null)
      .sort((a, b) => a.basis.localeCompare(b.basis) || b.year.localeCompare(a.year) || a.areaCode.localeCompare(b.areaCode));
  }, [rows, areaSummary]);

  return (
    <div className={`container ${styles.dash}`}>
      {bothReportLedger ? (
        <p className={styles.dashWarn}>
          ⚠ 연차보고서와 재무결산을 함께 선택했습니다. 둘은 같은 활동의 두 기록(재무결산=원본
          장부, 연차보고서=정제본)이라 합계가 <b>이중계상</b>됩니다. 정확한 합계를 보려면
          기준에서 하나만 선택하세요.
        </p>
      ) : (
        <p className={styles.dashNote}>
          정제 레이어(연차보고서 2023–2025 + 백서 2003–2022)를 합산 중입니다 — 둘은 같은
          레이어라 연도가 겹치지 않아 함께 더하면 2003–2025 전체 흐름이 됩니다. 재무결산은
          같은 기간을 정제 전 원본으로 적은 별도 레이어라, 연차보고서와 함께 더하면 중복됩니다.
        </p>
      )}

      {/* 요약 카드 */}
      <div className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>사업 개수</div>
          <div className={styles.cardValue}>
            <Num value={rows.length} unit="개" />
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>예산 합계</div>
          <div className={styles.cardValue}>
            <Eokwon n={budgetSum} />
          </div>
          <div className={styles.cardSub}>
            <Won n={budgetSum} />
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>지원 수 합계 (단위별)</div>
          {byUnit.length ? (
            <div className={styles.unitList}>
              {byUnit.map(([u, v]) => (
                <div key={u} className={styles.unitRow}>
                  <span className={styles.unitName}>{unitLabel(u)}</span>
                  <span className={styles.unitVal}>
                    {Number(v).toLocaleString("ko-KR")}
                  </span>
                  <span className={styles.unitU}>{u}</span>
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
        dark={dark}
      />
      <HScroll label="표준분류별 요약 표 (좌우 스크롤 가능)">
        <table className={`${styles.table} ${styles.leftTable}`}>
          <thead>
            <tr>
              <th>표준분류</th>
              <th className={styles.num}>사업 수</th>
              {unitColumns.map((u) => (
                <th key={u} className={styles.num}>
                  {unitLabel(u)}
                </th>
              ))}
              <th className={styles.num}>예산</th>
            </tr>
          </thead>
          <tbody>
            {byCategory.map((x) => (
              <tr key={x.cat}>
                <td>
                  <CatChip cat={x.cat === UNSET ? null : x.cat} />
                </td>
                <td className={styles.num}><Num value={x.n} /></td>
                {unitColumns.map((u) => (
                  <td key={u} className={styles.num}>
                    {x.units[u] != null ? (
                      <Num value={x.units[u]} unit={u} />
                    ) : (
                      <span className={styles.numDash}>-</span>
                    )}
                  </td>
                ))}
                <td className={styles.num}><Eokwon n={x.budget} /></td>
              </tr>
            ))}
            {byCategory.length === 0 ? (
              <tr>
                <td colSpan={3 + unitColumns.length} className={styles.sub}>
                  표시할 사업이 없습니다.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </HScroll>

      {/* 사업 결과 데이터 — 보고서 공식 영역별 총액 */}
      <h3 className={styles.dashH}>사업 결과 데이터</h3>
      <p className={styles.muted}>
        각 보고서(연차보고서·재무결산)가 명시한 <b>영역별 공식 총 사업비</b>입니다.
        세부 사업별 데이터가 아직 완전하지 않아 개별 합산·차이 대조는 데이터 보완 후
        제공할 예정입니다.
      </p>
      <HScroll label="사업 결과 데이터 표 (좌우 스크롤 가능)">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>기준</th>
              <th>연도</th>
              <th>영역</th>
              <th className={styles.num}>사업수</th>
              <th className={styles.num}>공식 데이터 합계</th>
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
                <td className={styles.num}><Num value={x.n} /></td>
                <td className={styles.num}><Won n={x.offSum} /></td>
              </tr>
            ))}
            {recon.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.sub}>
                  표시할 공식 합계가 없습니다. (필터를 조정하거나 백서 외 데이터를 선택하세요)
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </HScroll>
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
          <dd>
            <Num value={row.headline_value} unit={row.headline_unit ?? undefined} />
          </dd>
          <dt>예산</dt>
          <dd>
            <Won n={row.budget_krw} />
            {row.budget_krw != null ? (
              <div className={styles.sub}>
                <Eokwon n={row.budget_krw} />
              </div>
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
