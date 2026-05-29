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
}: {
  active?: boolean;
  payload?: { payload: ChartDatum }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        borderRadius: 8,
        border: "1px solid #D8DEE3",
        background: "#fff",
        padding: "8px 12px",
        fontSize: 14,
        boxShadow: "0 4px 16px rgba(10,30,51,0.08)",
      }}
    >
      <div style={{ fontWeight: 600, color: "#0A1E33" }}>{d.name}</div>
      <div style={{ color: "#7B7875" }}>
        예산 <b style={{ color: "#0A1E33" }}>{eok(d.value)}억원</b>
      </div>
    </div>
  );
}

export default function BudgetBarChart({ data }: { data: ChartDatum[] }) {
  if (!data.length) {
    return (
      <div
        style={{
          height: 288,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          color: "#7B7875",
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
          <CartesianGrid horizontal={false} stroke="#ECF0F3" />
          <XAxis
            type="number"
            tickFormatter={(v) => eok(Number(v))}
            tick={{ fontSize: 13, fill: "#7B7875", fontFamily: NUM_FONT }}
            axisLine={false}
            tickLine={false}
            unit="억"
          />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={{ fontSize: 14, fill: "#0A1E33" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(10,30,51,0.06)" }}
            content={<ChartTooltip />}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
            {data.map((d) => (
              <Cell key={d.name} fill={catHex(d.name)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
