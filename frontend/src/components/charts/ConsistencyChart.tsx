"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { colors } from "@/styles/theme";

interface ConsistencyChartProps {
  data: { month: string; consistency_score: number }[];
}

export default function ConsistencyChart({ data }: ConsistencyChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-text-muted text-sm">
        No monthly data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
        <XAxis
          dataKey="month"
          tick={{ fill: colors.text.secondary, fontSize: 11 }}
          tickFormatter={(val) => val.slice(0, 7)}
          stroke={colors.border}
        />
        <YAxis
          tick={{ fill: colors.text.secondary, fontSize: 11 }}
          domain={[0, 100]}
          stroke={colors.border}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: colors.bg.elevated,
            border: `1px solid ${colors.border}`,
            borderRadius: "6px",
            color: colors.text.primary,
          }}
        />
        <Bar
          dataKey="consistency_score"
          fill={colors.accent.secondary}
          radius={[4, 4, 0, 0]}
          animationDuration={800}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
