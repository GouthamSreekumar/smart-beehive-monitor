'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { SensorReading, AlertThresholds, TimeRange } from '../lib/types';

// Dynamically import ReactECharts with SSR disabled
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface ChartsSectionProps {
  history: SensorReading[];
  thresholds: AlertThresholds;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  isLoading: boolean;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  history,
  thresholds,
  timeRange,
  setTimeRange,
}) => {
  const { timestamps, temperatures, humidities } = useMemo(() => {
    const times: string[] = [];
    const temps: number[] = [];
    const hums: number[] = [];

    history.forEach((r) => {
      const d = new Date(r.timestamp);
      times.push(
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      temps.push(r.temperature_c);
      hums.push(r.humidity_pct);
    });

    return { timestamps: times, temperatures: temps, humidities: hums };
  }, [history]);

  // Clean, editorial ECharts styling matching warm paper theme
  const tempChartOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#ffffff',
        borderColor: '#e8e8e3',
        textStyle: { color: '#1c1d1a', fontSize: 11, fontFamily: 'monospace' },
        formatter: (params: any) => {
          const p = params[0];
          return `<span style="color:#78756c">${p.name}</span><br/><b>${p.value} °C</b>`;
        },
      },
      grid: {
        left: '2%',
        right: '2%',
        bottom: '8%',
        top: '12%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: timestamps,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#e8e8e3' } },
        axisLabel: { color: '#9c9990', fontSize: 10, fontFamily: 'monospace' },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: (v: { min: number }) => Math.floor(Math.min(v.min, thresholds.minTemp - 1)),
        max: (v: { max: number }) => Math.ceil(Math.max(v.max, thresholds.maxTemp + 1)),
        splitLine: { lineStyle: { color: '#f3f3ef', type: 'solid' } },
        axisLabel: { color: '#9c9990', fontSize: 10, fontFamily: 'monospace' },
      },
      series: [
        {
          name: 'Temperature',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: temperatures,
          lineStyle: { width: 2, color: '#b8893d' }, // Warm beeswax amber
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(184, 137, 61, 0.15)' },
                { offset: 1, color: 'rgba(184, 137, 61, 0.0)' },
              ],
            },
          },
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              {
                yAxis: thresholds.maxTemp,
                lineStyle: { color: '#d97706', type: 'dashed', width: 1 },
                label: { formatter: `Max ${thresholds.maxTemp}°C`, position: 'insideEndTop', color: '#b45309', fontSize: 9 },
              },
              {
                yAxis: thresholds.minTemp,
                lineStyle: { color: '#2563eb', type: 'dashed', width: 1 },
                label: { formatter: `Min ${thresholds.minTemp}°C`, position: 'insideEndBottom', color: '#1d4ed8', fontSize: 9 },
              },
            ],
          },
        },
      ],
    };
  }, [timestamps, temperatures, thresholds]);

  const humChartOption = useMemo(() => {
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#ffffff',
        borderColor: '#e8e8e3',
        textStyle: { color: '#1c1d1a', fontSize: 11, fontFamily: 'monospace' },
        formatter: (params: any) => {
          const p = params[0];
          return `<span style="color:#78756c">${p.name}</span><br/><b>${p.value} %</b>`;
        },
      },
      grid: {
        left: '2%',
        right: '2%',
        bottom: '8%',
        top: '12%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: timestamps,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#e8e8e3' } },
        axisLabel: { color: '#9c9990', fontSize: 10, fontFamily: 'monospace' },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        splitLine: { lineStyle: { color: '#f3f3ef', type: 'solid' } },
        axisLabel: { color: '#9c9990', fontSize: 10, fontFamily: 'monospace' },
      },
      series: [
        {
          name: 'Humidity',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: humidities,
          lineStyle: { width: 2, color: '#4a6b4f' }, // Deep forest sage green
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(74, 107, 79, 0.15)' },
                { offset: 1, color: 'rgba(74, 107, 79, 0.0)' },
              ],
            },
          },
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              {
                yAxis: thresholds.maxHumidity,
                lineStyle: { color: '#d97706', type: 'dashed', width: 1 },
                label: { formatter: `Max ${thresholds.maxHumidity}%`, position: 'insideEndTop', color: '#b45309', fontSize: 9 },
              },
              {
                yAxis: thresholds.minHumidity,
                lineStyle: { color: '#2563eb', type: 'dashed', width: 1 },
                label: { formatter: `Min ${thresholds.minHumidity}%`, position: 'insideEndBottom', color: '#1d4ed8', fontSize: 9 },
              },
            ],
          },
        },
      ],
    };
  }, [timestamps, humidities, thresholds]);

  return (
    <div className="space-y-3.5">
      
      {/* Range switch bar: Clean tabs */}
      <div className="flex items-center justify-between border-b border-[#ecece8] pb-3">
        <div className="text-xs font-medium text-[#4a4944]">
          Longitudinal Telemetry
          <span className="ml-2 font-mono text-[11px] text-[#9c9990]">({history.length} points)</span>
        </div>

        <div className="flex items-center space-x-1">
          {(
            [
              { id: '15m', label: '15m' },
              { id: '1h', label: '1h' },
              { id: '6h', label: '6h' },
              { id: '24h', label: '24h' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors ${
                timeRange === t.id
                  ? 'bg-[#1c1d1a] text-white font-medium'
                  : 'text-[#78756c] hover:text-[#1c1d1a] hover:bg-[#f1f1ec]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        
        {/* Temperature */}
        <div className="bg-white rounded-lg p-4 border border-[#e8e8e3]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#78756c]">Temperature Trend</span>
            <span className="text-[10px] font-mono text-[#9c9990]">°C (Celsius)</span>
          </div>
          {history.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-[#a19d93]">
              Awaiting telemetry...
            </div>
          ) : (
            <ReactECharts option={tempChartOption} style={{ height: '250px', width: '100%' }} notMerge={true} />
          )}
        </div>

        {/* Humidity */}
        <div className="bg-white rounded-lg p-4 border border-[#e8e8e3]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#78756c]">Humidity Trend</span>
            <span className="text-[10px] font-mono text-[#9c9990]">% Relative Humidity</span>
          </div>
          {history.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-[#a19d93]">
              Awaiting telemetry...
            </div>
          ) : (
            <ReactECharts option={humChartOption} style={{ height: '250px', width: '100%' }} notMerge={true} />
          )}
        </div>

      </div>

    </div>
  );
};
