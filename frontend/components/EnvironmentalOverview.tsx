'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { SensorReading, AlertThresholds, Device, TimeRange, NavTab } from '../lib/types';
import {
  Thermometer,
  Droplets,
  Radio,
  Clock,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Layers,
  Send,
  WifiOff,
} from 'lucide-react';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface EnvironmentalOverviewProps {
  latestReading: SensorReading | null;
  history: SensorReading[];
  thresholds: AlertThresholds;
  activeDevice: Device | null;
  backendConnected: boolean;
  nodeConnected: boolean;
  secondsSinceLastPacket: number | null;
  timeRange: TimeRange;
  onSelectTimeRange: (range: TimeRange) => void;
  onNavigateToTab: (tab: NavTab) => void;
  onOpenTestModal: () => void;
}

export const EnvironmentalOverview: React.FC<EnvironmentalOverviewProps> = ({
  latestReading,
  history,
  thresholds,
  activeDevice,
  backendConnected,
  nodeConnected,
  secondsSinceLastPacket,
  timeRange,
  onSelectTimeRange,
  onNavigateToTab,
  onOpenTestModal,
}) => {
  const currentTemp = latestReading ? latestReading.temperature_c : null;
  const currentHum = latestReading ? latestReading.humidity_pct : null;

  // Temperature status
  const isTempLow = currentTemp !== null && currentTemp < thresholds.minTemp;
  const isTempHigh = currentTemp !== null && currentTemp > thresholds.maxTemp;
  const isTempWithin = currentTemp !== null && !isTempLow && !isTempHigh;

  // Humidity status
  const isHumLow = currentHum !== null && currentHum < thresholds.minHumidity;
  const isHumHigh = currentHum !== null && currentHum > thresholds.maxHumidity;
  const isHumWithin = currentHum !== null && !isHumLow && !isHumHigh;

  // Concise Environmental Condition Interpretation (Strictly from readings & thresholds, no biological speculation)
  let conditionState: 'normal' | 'warning' | 'critical' | 'offline' = 'normal';
  let conditionTitle = 'Within Configured Operating Ranges';
  let conditionDetail = 'Current temperature and relative humidity readings are within configured thresholds.';

  if (!nodeConnected && (secondsSinceLastPacket === null || secondsSinceLastPacket > 120)) {
    conditionState = 'offline';
    conditionTitle = 'Sensor Offline or Telemetry Delayed';
    conditionDetail = secondsSinceLastPacket !== null
      ? `No sensor telemetry packets received for ${Math.round(secondsSinceLastPacket)} seconds. Transmitter is currently idle.`
      : 'Awaiting initial telemetry connection from ESP32.';
  } else if (latestReading) {
    if (isTempLow && isHumHigh) {
      conditionState = 'critical';
      conditionTitle = 'Temperature Below Range · Humidity Above Range';
      conditionDetail = `Temperature (${currentTemp!.toFixed(1)}°C) is below minimum (${thresholds.minTemp}°C), and humidity (${currentHum!.toFixed(1)}%) exceeds maximum (${thresholds.maxHumidity}%).`;
    } else if (isTempLow && isHumLow) {
      conditionState = 'critical';
      conditionTitle = 'Temperature Below Range · Humidity Below Range';
      conditionDetail = `Temperature (${currentTemp!.toFixed(1)}°C) is below minimum (${thresholds.minTemp}°C), and humidity (${currentHum!.toFixed(1)}%) is below minimum (${thresholds.minHumidity}%).`;
    } else if (isTempHigh && isHumHigh) {
      conditionState = 'critical';
      conditionTitle = 'Temperature Above Range · Humidity Above Range';
      conditionDetail = `Temperature (${currentTemp!.toFixed(1)}°C) exceeds maximum (${thresholds.maxTemp}°C), and humidity (${currentHum!.toFixed(1)}%) exceeds maximum (${thresholds.maxHumidity}%).`;
    } else if (isTempHigh && isHumLow) {
      conditionState = 'critical';
      conditionTitle = 'Temperature Above Range · Humidity Below Range';
      conditionDetail = `Temperature (${currentTemp!.toFixed(1)}°C) exceeds maximum (${thresholds.maxTemp}°C), and humidity (${currentHum!.toFixed(1)}%) is below minimum (${thresholds.minHumidity}%).`;
    } else if (isTempLow) {
      conditionState = 'warning';
      conditionTitle = 'Temperature Below Configured Range';
      conditionDetail = `Current temperature is ${currentTemp!.toFixed(1)}°C, below configured minimum threshold of ${thresholds.minTemp}°C.`;
    } else if (isTempHigh) {
      conditionState = 'warning';
      conditionTitle = 'Temperature Above Configured Range';
      conditionDetail = `Current temperature is ${currentTemp!.toFixed(1)}°C, above configured maximum threshold of ${thresholds.maxTemp}°C.`;
    } else if (isHumHigh) {
      conditionState = 'warning';
      conditionTitle = 'Humidity Above Configured Range';
      conditionDetail = `Current relative humidity is ${currentHum!.toFixed(1)}%, above configured maximum threshold of ${thresholds.maxHumidity}%.`;
    } else if (isHumLow) {
      conditionState = 'warning';
      conditionTitle = 'Humidity Below Configured Range';
      conditionDetail = `Current relative humidity is ${currentHum!.toFixed(1)}%, below configured minimum threshold of ${thresholds.minHumidity}%.`;
    } else {
      conditionState = 'normal';
      conditionTitle = 'Within Configured Operating Ranges';
      conditionDetail = `Both temperature (${currentTemp!.toFixed(1)}°C) and relative humidity (${currentHum!.toFixed(1)}%) are within configured thresholds.`;
    }
  }

  // Formatting timestamp
  const formatTime = (ts?: string | null) => {
    if (!ts) return '--:--:--';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const timestamps = useMemo(() => {
    return history.map((r) => {
      const d = new Date(r.timestamp);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
  }, [history]);

  const temperatures = useMemo(() => history.map((r) => r.temperature_c), [history]);
  const humidities = useMemo(() => history.map((r) => r.humidity_pct), [history]);

  // Temperature EChart Option
  const tempChartOption = useMemo(() => ({
    animationDuration: 300,
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#FFFFFF',
      borderColor: '#DFE5DC',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: '#18261C', fontSize: 12 },
      shadowColor: 'rgba(24, 38, 28, 0.05)',
      shadowBlur: 8,
      formatter: (params: any) => {
        const p = params[0];
        return `<div style="font-family: inherit;">
          <div style="font-size: 11px; color: #6E7F72; margin-bottom: 2px;">${p.name}</div>
          <div style="font-weight: 700; color: #2D5A3C;">Temperature: ${p.value} °C</div>
          <div style="font-size: 11px; color: #6E7F72; margin-top: 2px;">Safe: ${thresholds.minTemp}–${thresholds.maxTemp} °C</div>
        </div>`;
      },
    },
    grid: { left: '3%', right: '3%', bottom: '8%', top: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: timestamps,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#E0E6DD' } },
      axisTick: { show: false },
      axisLabel: { color: '#6E7F72', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: '°C',
      nameTextStyle: { color: '#2D5A3C', fontSize: 11 },
      min: (v: { min: number }) => Math.floor(Math.min(v.min, thresholds.minTemp - 1)),
      max: (v: { max: number }) => Math.ceil(Math.max(v.max, thresholds.maxTemp + 1)),
      splitLine: { lineStyle: { color: '#F0F4EF', type: 'solid' } },
      axisLabel: { color: '#6E7F72', fontSize: 11 },
    },
    series: [
      {
        name: 'Temperature',
        type: 'line',
        smooth: 0.3,
        showSymbol: history.length < 20,
        symbolSize: 6,
        data: temperatures,
        lineStyle: { width: 2.2, color: '#2D5A3C' },
        itemStyle: { color: '#2D5A3C' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(45, 90, 60, 0.20)' },
              { offset: 1, color: 'rgba(45, 90, 60, 0.0)' },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [
            { yAxis: thresholds.minTemp, lineStyle: { color: '#6E7F72', type: 'dashed' }, label: { formatter: `Min ${thresholds.minTemp}°C`, position: 'insideEndTop', color: '#435447', fontSize: 10 } },
            { yAxis: thresholds.maxTemp, lineStyle: { color: '#D9534F', type: 'dashed' }, label: { formatter: `Max ${thresholds.maxTemp}°C`, position: 'insideEndTop', color: '#D9534F', fontSize: 10 } },
          ],
        },
      },
    ],
  }), [timestamps, temperatures, thresholds, history.length]);

  // Humidity EChart Option
  const humChartOption = useMemo(() => ({
    animationDuration: 300,
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#FFFFFF',
      borderColor: '#DFE5DC',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: '#18261C', fontSize: 12 },
      shadowColor: 'rgba(24, 38, 28, 0.05)',
      shadowBlur: 8,
      formatter: (params: any) => {
        const p = params[0];
        return `<div style="font-family: inherit;">
          <div style="font-size: 11px; color: #6E7F72; margin-bottom: 2px;">${p.name}</div>
          <div style="font-weight: 700; color: #D98A26;">Humidity: ${p.value} % RH</div>
          <div style="font-size: 11px; color: #6E7F72; margin-top: 2px;">Safe: ${thresholds.minHumidity}–${thresholds.maxHumidity}%</div>
        </div>`;
      },
    },
    grid: { left: '3%', right: '3%', bottom: '8%', top: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: timestamps,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#E0E6DD' } },
      axisTick: { show: false },
      axisLabel: { color: '#6E7F72', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: '% RH',
      nameTextStyle: { color: '#D98A26', fontSize: 11 },
      min: (v: { min: number }) => Math.floor(Math.min(v.min, thresholds.minHumidity - 5)),
      max: (v: { max: number }) => Math.ceil(Math.max(v.max, thresholds.maxHumidity + 5)),
      splitLine: { lineStyle: { color: '#F0F4EF', type: 'solid' } },
      axisLabel: { color: '#6E7F72', fontSize: 11 },
    },
    series: [
      {
        name: 'Relative Humidity',
        type: 'line',
        smooth: 0.3,
        showSymbol: history.length < 20,
        symbolSize: 6,
        data: humidities,
        lineStyle: { width: 2.2, color: '#D98A26' },
        itemStyle: { color: '#D98A26' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(217, 138, 38, 0.20)' },
              { offset: 1, color: 'rgba(217, 138, 38, 0.0)' },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [
            { yAxis: thresholds.minHumidity, lineStyle: { color: '#6E7F72', type: 'dashed' }, label: { formatter: `Min ${thresholds.minHumidity}%`, position: 'insideEndTop', color: '#435447', fontSize: 10 } },
            { yAxis: thresholds.maxHumidity, lineStyle: { color: '#D9534F', type: 'dashed' }, label: { formatter: `Max ${thresholds.maxHumidity}%`, position: 'insideEndTop', color: '#D9534F', fontSize: 10 } },
          ],
        },
      },
    ],
  }), [timestamps, humidities, thresholds, history.length]);

  return (
    <div className="space-y-6 animate-stage-enter">
      
      {/* 1. Concise Environmental Condition & Observation Window Header */}
      <div className="studio-stage p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Combined Environmental Condition Interpretation */}
        <div className="flex items-start sm:items-center space-x-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
              conditionState === 'normal'
                ? 'bg-[#EDF5EF] border-[#C6DACB] text-[#2D5A3C]'
                : conditionState === 'warning'
                ? 'bg-[#F9F5EC] border-[#E8DCBF] text-[#8C6420]'
                : conditionState === 'critical'
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-[#F6F8F5] border-[#DFE5DC] text-[#6E7F72]'
            }`}
          >
            {conditionState === 'normal' ? (
              <CheckCircle2 className="w-5 h-5 text-[#2D5A3C]" />
            ) : conditionState === 'offline' ? (
              <WifiOff className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-[#18261C]">
                {conditionTitle}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  conditionState === 'normal'
                    ? 'bg-[#EDF5EF] text-[#2D5A3C] border-[#C6DACB]'
                    : conditionState === 'warning'
                    ? 'bg-[#F9F5EC] text-[#8C6420] border-[#E8DCBF]'
                    : conditionState === 'critical'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-[#F6F8F5] text-[#6E7F72] border-[#DFE5DC]'
                }`}
              >
                {conditionState}
              </span>
            </div>
            <p className="text-xs text-[#6E7F72] mt-0.5 leading-relaxed">
              {conditionDetail}
            </p>
          </div>
        </div>

        {/* Right: Time-Range Window Selector */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          <span className="text-xs text-[#6E7F72] font-semibold hidden lg:inline">
            Window:
          </span>
          <div className="flex items-center space-x-1 bg-[#F6F8F5] p-1 rounded-lg border border-[#DFE5DC] text-xs">
            {(['session', '1h', '6h', '24h', '72h'] as const).map((rng) => (
              <button
                key={rng}
                onClick={() => onSelectTimeRange(rng)}
                className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                  timeRange === rng
                    ? 'bg-white text-[#18261C] shadow-xs'
                    : 'text-[#6E7F72] hover:text-[#18261C]'
                }`}
              >
                {rng === 'session' ? 'Latest Session' : rng}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Side-by-Side Environmental Monitoring Panels (50/50 Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TEMPERATURE MONITORING PANEL */}
        <div className="studio-stage p-6 flex flex-col justify-between">
          <div>
            {/* Panel Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#DFE5DC]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#EDF5EF] border border-[#C6DACB] flex items-center justify-center text-[#2D5A3C]">
                  <Thermometer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#18261C]">
                    Temperature Monitoring
                  </h3>
                  <p className="text-xs text-[#6E7F72]">
                    Configured safe limits: {thresholds.minTemp}°C – {thresholds.maxTemp}°C
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                  isTempWithin
                    ? 'bg-[#EDF5EF] text-[#2D5A3C] border-[#C6DACB]'
                    : isTempLow
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {isTempWithin ? 'Within Safe Limits' : isTempLow ? `Low (<${thresholds.minTemp}°C)` : `High (>${thresholds.maxTemp}°C)`}
              </span>
            </div>

            {/* Readout Numbers & Timestamps */}
            <div className="flex items-baseline justify-between py-4 border-b border-[#DFE5DC]">
              <div>
                <span className="text-xs text-[#6E7F72] block">Current Reading</span>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-4xl font-extrabold text-[#18261C] tracking-tight">
                    {currentTemp !== null ? currentTemp.toFixed(1) : '--'}
                  </span>
                  <span className="text-base font-semibold text-[#6E7F72]">°C</span>
                </div>
              </div>

              <div className="text-right text-xs">
                <span className="text-[#6E7F72] block">Last Packet</span>
                <span className="font-semibold text-[#18261C]">
                  {formatTime(latestReading?.timestamp)}
                </span>
                <span className="text-[11px] text-[#6E7F72] block mt-0.5">
                  Target: {((thresholds.minTemp + thresholds.maxTemp) / 2).toFixed(1)}°C
                </span>
              </div>
            </div>

            {/* Interactive Temperature Chart */}
            <div className="h-64 w-full mt-4">
              {history.length > 0 ? (
                <ReactECharts
                  option={tempChartOption}
                  style={{ height: '100%', width: '100%' }}
                  notMerge={true}
                  lazyUpdate={true}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-2">
                  <div className="w-9 h-9 rounded-full bg-[#EDF5EF] flex items-center justify-center text-[#2D5A3C]">
                    <Clock className="w-4 h-4 animate-pulse" />
                  </div>
                  <p className="text-xs font-semibold text-[#18261C]">
                    Waiting for temperature telemetry packets...
                  </p>
                  <button
                    onClick={onOpenTestModal}
                    className="text-xs font-semibold text-[#2D5A3C] underline"
                  >
                    Send test reading
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Panel Footer */}
          <div className="pt-3 mt-2 border-t border-[#DFE5DC] flex items-center justify-between text-xs text-[#6E7F72]">
            <span>Threshold lines: Min {thresholds.minTemp}°C / Max {thresholds.maxTemp}°C</span>
            <button
              onClick={() => onNavigateToTab('settings')}
              className="text-[#2D5A3C] hover:text-[#18261C] font-semibold flex items-center space-x-1"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Configure</span>
            </button>
          </div>
        </div>

        {/* HUMIDITY MONITORING PANEL */}
        <div className="studio-stage p-6 flex flex-col justify-between">
          <div>
            {/* Panel Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#DFE5DC]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#F9F5EC] border border-[#E8DCBF] flex items-center justify-center text-[#D98A26]">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#18261C]">
                    Humidity Monitoring
                  </h3>
                  <p className="text-xs text-[#6E7F72]">
                    Configured safe limits: {thresholds.minHumidity}% – {thresholds.maxHumidity}%
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                  isHumWithin
                    ? 'bg-[#EDF5EF] text-[#2D5A3C] border-[#C6DACB]'
                    : isHumHigh
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {isHumWithin ? 'Within Safe Limits' : isHumHigh ? `High (>${thresholds.maxHumidity}%)` : `Low (<${thresholds.minHumidity}%)`}
              </span>
            </div>

            {/* Readout Numbers & Timestamps */}
            <div className="flex items-baseline justify-between py-4 border-b border-[#DFE5DC]">
              <div>
                <span className="text-xs text-[#6E7F72] block">Current Reading</span>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-4xl font-extrabold text-[#18261C] tracking-tight">
                    {currentHum !== null ? currentHum.toFixed(1) : '--'}
                  </span>
                  <span className="text-base font-semibold text-[#6E7F72]">% RH</span>
                </div>
              </div>

              <div className="text-right text-xs">
                <span className="text-[#6E7F72] block">Last Packet</span>
                <span className="font-semibold text-[#18261C]">
                  {formatTime(latestReading?.timestamp)}
                </span>
                <span className="text-[11px] text-[#6E7F72] block mt-0.5">
                  Target: {((thresholds.minHumidity + thresholds.maxHumidity) / 2).toFixed(0)}% RH
                </span>
              </div>
            </div>

            {/* Interactive Humidity Chart */}
            <div className="h-64 w-full mt-4">
              {history.length > 0 ? (
                <ReactECharts
                  option={humChartOption}
                  style={{ height: '100%', width: '100%' }}
                  notMerge={true}
                  lazyUpdate={true}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-2">
                  <div className="w-9 h-9 rounded-full bg-[#F9F5EC] flex items-center justify-center text-[#D98A26]">
                    <Clock className="w-4 h-4 animate-pulse" />
                  </div>
                  <p className="text-xs font-semibold text-[#18261C]">
                    Waiting for humidity telemetry packets...
                  </p>
                  <button
                    onClick={onOpenTestModal}
                    className="text-xs font-semibold text-[#D98A26] underline"
                  >
                    Send test reading
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Panel Footer */}
          <div className="pt-3 mt-2 border-t border-[#DFE5DC] flex items-center justify-between text-xs text-[#6E7F72]">
            <span>Threshold lines: Min {thresholds.minHumidity}% / Max {thresholds.maxHumidity}%</span>
            <button
              onClick={() => onNavigateToTab('settings')}
              className="text-[#D98A26] hover:text-[#18261C] font-semibold flex items-center space-x-1"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Configure</span>
            </button>
          </div>
        </div>

      </div>

      {/* 3. Bottom Device & Telemetry Diagnostic Ledger */}
      <div className="studio-stage p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#EDF5EF] border border-[#C6DACB] flex items-center justify-center text-[#2D5A3C]">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-[#18261C]">
                {activeDevice?.device_id || latestReading?.device_id || 'beehive-001'}
              </span>
              <span className="text-[#6E7F72]">·</span>
              <span className="text-[#6E7F72]">ESP32-WROOM-32 · DHT22 (GPIO 4) · HTTP POST</span>
            </div>
            <p className="text-[#6E7F72] text-[11px] mt-0.5">
              {history.length} stored telemetry readings rendered in current window ({timeRange})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            onClick={() => onNavigateToTab('stream')}
            className="text-[#2D5A3C] hover:text-[#18261C] font-semibold flex items-center space-x-1"
          >
            <span>Full historical analytics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
