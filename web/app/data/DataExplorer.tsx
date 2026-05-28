"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./page.module.css";

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

export default function DataExplorer({
  programs,
  email,
}: {
  programs: ProgramRow[];
  email: string;
}) {
  const [q, setQ] = useState("");
  const [basis, setBasis] = useState("");
  const [year, setYear] = useState("");
  const [area, setArea] = useState("");
  const [selected, setSelected] = useState<ProgramRow | null>(null);

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
      if (basis && r.basis !== basis) return false;
      if (year && String(r.report_year) !== year) return false;
      if (area && r.area_name !== area) return false;
      if (query) {
        const hay = `${r.program_name ?? ""} ${r.memo ?? ""} ${(r.funders ?? [])
          .map((f) => f.funder ?? "")
          .join(" ")} ${r.support_type ?? ""}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [programs, q, basis, year, area]);

  const sum = rows.reduce((s, r) => s + (r.budget_krw ?? 0), 0);

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

      <div className={styles.barWrap}>
        <div className={`container ${styles.bar}`}>
          <input
            className={styles.search}
            type="search"
            placeholder="사업명·메모·기금처 검색…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className={styles.sel} value={basis} onChange={(e) => setBasis(e.target.value)}>
            <option value="">전체 기준</option>
            <option value="report">보고서</option>
            <option value="ledger">원장</option>
            <option value="whitepaper">백서(누적)</option>
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
          <button
            className={styles.reset}
            onClick={() => {
              setQ("");
              setBasis("");
              setYear("");
              setArea("");
            }}
          >
            초기화
          </button>
        </div>
      </div>

      <div className="container">
        <p className={styles.count}>
          <b>{rows.length}</b>개 사업 · 예산 합계 <b>{fmt(sum)}</b>원 (약 {eok(sum)}억){" "}
          <span className={styles.muted}>— 기준·단위가 섞이면 단순 합계는 참고용</span>
        </p>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>연도</th>
                <th>기준</th>
                <th>영역</th>
                <th>사업명</th>
                <th className={styles.num}>지원수</th>
                <th className={styles.num}>예산(원)</th>
                <th className={styles.num}>억</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.program_id}-${r.basis}`} onClick={() => setSelected(r)}>
                  <td>{r.report_year ?? "—"}</td>
                  <td>
                    <span className={`${styles.tag} ${styles["b_" + r.basis]}`}>
                      {BLABEL[r.basis]}
                    </span>
                  </td>
                  <td>{r.area_name ?? "—"}</td>
                  <td>
                    <div className={styles.pname}>{r.program_name}</div>
                    {r.period ? <div className={styles.sub}>{r.period}</div> : null}
                  </td>
                  <td className={styles.num}>
                    {r.headline_value != null
                      ? fmt(r.headline_value) + (r.headline_unit ?? "")
                      : "—"}
                  </td>
                  <td className={styles.num}>{fmt(r.budget_krw)}</td>
                  <td className={styles.num}>{eok(r.budget_krw)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected ? (
        <Drawer row={selected} onClose={() => setSelected(null)} />
      ) : null}
    </main>
  );
}

function Drawer({ row, onClose }: { row: ProgramRow; onClose: () => void }) {
  const details = row.details ?? [];
  const funders = row.funders ?? [];
  const kpis = row.kpis ?? [];
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
