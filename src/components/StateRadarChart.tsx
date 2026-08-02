"use client";

import React from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

interface RadarChartProps {
  data: { axis: string; v: number }[];
}

export default function StateRadarChart({ data }: RadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="#D8CDBB" />
        <PolarAngleAxis dataKey="axis" tick={{ fill: "#4A423A", fontSize: 13 }} />
        <PolarRadiusAxis domain={[0, 4]} tick={false} axisLine={false} />
        <Radar dataKey="v" stroke="#C7302A" fill="#C7302A" fillOpacity={0.32} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
