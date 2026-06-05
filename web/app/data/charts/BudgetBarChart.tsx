"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { catHex } from "../categories";

export type ChartDatum = { name: string; value: number };

const NUM_FONT = '"Satoshi", "Pretendard Variable", system-ui, sans-serif';

const eok = (n: number) =>
  (n / 1e8).toLocaleString("ko-KR", { maximumFractionDigits: 1 });

function ChartTooltip({
  active,
  payload,
  dark,
}: {
  active?: boolean;
  payload?: { payload: ChartDatum }[];
  dark?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const surface = dark ? "#16304d" : "#fff";
  const border = dark ? "rgba(255,255,255,0.16)" : "#D8DEE3";
  const strong = dark ? "#ECF0F3" : "#0A1E33";
  const muted = dark ? "#9aa3ad" : "#7B7875";
  return (
    <div
      style={{
        borderRadius: 8,
        border: `1px solid ${border}`,
        background: surface,
        padding: "8px 12px",
        fontSize: 14,
        boxShadow: "0 4px 16px rgba(10,30,51,0.18)",
      }}
    >
      <div style={{ fontWeight: 600, color: strong }}>{d.name}</div>
      <div style={{ color: muted }}>
        예산 <b style={{ color: strong }}>{eok(d.value)}억원</b>
      </div>
    </div>
  );
}

export default function BudgetBarChart({
  data,
  dark = false,
}: {
  data: ChartDatum[];
  dark?: boolean;
}) {
  const grid = dark ? "rgba(255,255,255,0.10)" : "#ECF0F3";
  const axisMuted = dark ? "#9aa3ad" : "#7B7875";
  const axisStrong = dark ? "#ECF0F3" : "#0A1E33";
  const cursorFill = dark ? "rgba(255,255,255,0.06)" : "rgba(10,30,51,0.06)";

  if (!data.length) {
    return (
      <div
        style={{
          height: 288,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          color: axisMuted,
        }}
      >
        표시할 데이터가 없습니다.
      </div>
    );
  }
  return (
    <div style={{ height: 288, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
        >
          <CartesianGrid horizontal={false} stroke={grid} />
          <XAxis
            type="number"
            tickFormatter={(v) => eok(Number(v))}
            tick={{ fontSize: 13, fill: axisMuted, fontFamily: NUM_FONT }}
            axisLine={false}
            tickLine={false}
            unit="억"
          />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fontSize: 14, fill: axisStrong }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: cursorFill }}
            content={<ChartTooltip dark={dark} />}
          />
          <Bar dataKey="value" radius={0} barSize={24}>
            {data.map((d) => (
              <Cell key={d.name} fill={catHex(d.name, dark)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
