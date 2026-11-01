'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { SensorReading, AlertThresholds, TimeRange } from '../lib/types';
import { Calendar, RefreshCw } from 'lucide-react';

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
  isLoading,
}) => {
  // Extract time, temp, and humidity series
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

  // ECharts Option for Temperature
  const temperatureChartOption = useMemo(() => {
    return {
      title: {
        text: 'Brood Nest Temperature (°C)',
        textStyle: { fontSize: 14, fontWeight: 600, color: '#334155' },
        left: 'left',
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = params[0];
          return `<div class="text-xs">
            <span class="font-bold text-slate-700">${p.name}</span><br/>
            Temperature: <span class="font-bold text-orange-600">${p.value} °C</span><br/>
            Target: ${thresholds.minTemp}–${thresholds.maxTemp} °C
          </div>`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '18%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: timestamps,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        name: '°C',
        min: (value: { min: number }) => Math.floor(Math.min(value.min, thresholds.minTemp - 2)),
        max: (value: { max: number }) => Math.ceil(Math.max(value.max, thresholds.maxTemp + 2)),
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
      },
      series: [
        {
          name: 'Temperature',
          type: 'line',
          smooth: true,
          showSymbol: history.length < 30,
          symbolSize: 6,
          data: temperatures,
          lineStyle: { width: 3, color: '#ea580c' },
          itemStyle: { color: '#ea580c' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(234, 88, 12, 0.35)' },
                { offset: 1, color: 'rgba(234, 88, 12, 0.02)' },
              ],
            },
          },
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              {
                yAxis: thresholds.maxTemp,
                name: 'Max Target',
                lineStyle: { color: '#ef4444', type: 'dashed', width: 1.5 },
                label: { formatter: `Max ${thresholds.maxTemp}°C`, position: 'insideEndTop', color: '#ef4444', fontSize: 10 },
              },
              {
                yAxis: thresholds.minTemp,
                name: 'Min Target',
                lineStyle: { color: '#3b82f6', type: 'dashed', width: 1.5 },
                label: { formatter: `Min ${thresholds.minTemp}°C`, position: 'insideEndBottom', color: '#3b82f6', fontSize: 10 },
              },
            ],
          },
        },
      ],
    };
  }, [timestamps, temperatures, thresholds, history.length]);

  // ECharts Option for Humidity
  const humidityChartOption = useMemo(() => {
    return {
      title: {
        text: 'Relative Humidity (% RH)',
        textStyle: { fontSize: 14, fontWeight: 600, color: '#334155' },
        left: 'left',
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = params[0];
          return `<div class="text-xs">
            <span class="font-bold text-slate-700">${p.name}</span><br/>
            Humidity: <span class="font-bold text-blue-600">${p.value} %</span><br/>
            Target: ${thresholds.minHumidity}–${thresholds.maxHumidity} %
          </div>`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '18%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: timestamps,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        name: '%',
        min: 0,
        max: 100,
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
      },
      series: [
        {
          name: 'Humidity',
          type: 'line',
          smooth: true,
          showSymbol: history.length < 30,
          symbolSize: 6,
          data: humidities,
          lineStyle: { width: 3, color: '#0284c7' },
          itemStyle: { color: '#0284c7' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(2, 132, 199, 0.35)' },
                { offset: 1, color: 'rgba(2, 132, 199, 0.02)' },
              ],
            },
          },
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              {
                yAxis: thresholds.maxHumidity,
                name: 'Max Target',
                lineStyle: { color: '#f97316', type: 'dashed', width: 1.5 },
                label: { formatter: `Max ${thresholds.maxHumidity}%`, position: 'insideEndTop', color: '#f97316', fontSize: 10 },
              },
              {
                yAxis: thresholds.minHumidity,
                name: 'Min Target',
                lineStyle: { color: '#3b82f6', type: 'dashed', width: 1.5 },
                label: { formatter: `Min ${thresholds.minHumidity}%`, position: 'insideEndBottom', color: '#3b82f6', fontSize: 10 },
              },
            ],
          },
        },
      ],
    };
  }, [timestamps, humidities, thresholds, history.length]);

  return (
    <div className="space-y-4">
      {/* Time Range Selector Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-800">Historical Telemetry Range</span>
          <span className="text-xs text-slate-500">({history.length} data points)</span>
        </div>

        {/* Range Buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg">
          {(
            [
              { id: '15m', label: '15 Min' },
              { id: '1h', label: '1 Hour' },
              { id: '6h', label: '6 Hours' },
              { id: '24h', label: '24 Hours' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setTimeRange(item.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                timeRange === item.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Temperature Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-h-[340px] flex flex-col justify-between">
          {history.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mb-2 text-slate-300" />
              <p className="text-sm">Awaiting telemetry data points...</p>
            </div>
          ) : (
            <ReactECharts
              option={temperatureChartOption}
              style={{ height: '320px', width: '100%' }}
              notMerge={true}
              lazyUpdate={true}
            />
          )}
        </div>

        {/* Humidity Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-h-[340px] flex flex-col justify-between">
          {history.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mb-2 text-slate-300" />
              <p className="text-sm">Awaiting telemetry data points...</p>
            </div>
          ) : (
            <ReactECharts
              option={humidityChartOption}
              style={{ height: '320px', width: '100%' }}
              notMerge={true}
              lazyUpdate={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

