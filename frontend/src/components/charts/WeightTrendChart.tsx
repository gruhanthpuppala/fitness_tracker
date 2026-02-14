"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { colors } from "@/styles/theme";

interface WeightTrendChartProps {
  data: { date: string; weight: number }[];
}

export default function WeightTrendChart({ data }: WeightTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-text-muted text-sm">
        No weight data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
        <XAxis
          dataKey="date"
          tick={{ fill: colors.text.secondary, fontSize: 11 }}
          tickFormatter={(val) => val.slice(5)}
          stroke={colors.border}
        />
        <YAxis
          tick={{ fill: colors.text.secondary, fontSize: 11 }}
          domain={["dataMin - 1", "dataMax + 1"]}
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
        <Line
          type="monotone"
          dataKey="weight"
          stroke={colors.accent.primary}
          strokeWidth={2}
          dot={{ fill: colors.accent.primary, r: 3 }}
          animationDuration={800}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
