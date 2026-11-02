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
  Info,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Layers,
  ChevronRight,
} from 'lucide-react';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface BiomeStudioViewProps {
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

export const BiomeStudioView: React.FC<BiomeStudioViewProps> = ({
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

  // Temperature threshold evaluation
  const isTempLow = currentTemp !== null && currentTemp < thresholds.minTemp;
  const isTempHigh = currentTemp !== null && currentTemp > thresholds.maxTemp;
  const isTempNormal = currentTemp !== null && !isTempLow && !isTempHigh;

  // Humidity threshold evaluation
  const isHumLow = currentHum !== null && currentHum < thresholds.minHumidity;
  const isHumHigh = currentHum !== null && currentHum > thresholds.maxHumidity;
  const isHumNormal = currentHum !== null && !isHumLow && !isHumHigh;

  // Biological Diagnosis
  let verdictTitle = 'Awaiting Sensor Telemetry';
  let verdictSeverity: 'optimal' | 'warning' | 'critical' = 'optimal';
  let verdictDescription = 'Connect your ESP32 transmitter or push a diagnostic test reading to begin live microclimate evaluation.';

  if (latestReading) {
    if (isTempNormal && isHumNormal) {
      verdictTitle = 'Optimal Incubation Equilibrium';
      verdictSeverity = 'optimal';
      verdictDescription = 'Brood cluster thermoregulation is stable. Temperature and humidity are strictly within the physiological safety corridor for healthy worker bee larvae.';
    } else if (isTempLow && isHumHigh) {
      verdictTitle = 'Chilled Brood & Condensation Warning';
      verdictSeverity = 'critical';
      verdictDescription = `Brood temperature is ${currentTemp!.toFixed(1)}°C (below ${thresholds.minTemp}°C safe floor) while humidity is elevated at ${currentHum!.toFixed(1)}%. Low heat combined with high moisture dramatically increases pupae mortality and fungal chalkbrood risk.`;
    } else if (isTempLow) {
      verdictTitle = 'Hypothermia Risk (Chilled Brood)';
      verdictSeverity = 'critical';
      verdictDescription = `Brood chamber temperature is ${currentTemp!.toFixed(1)}°C, below the ${thresholds.minTemp}°C minimum. Larvae require steady ~34.5°C warmth; inspect entrance reducers and cluster tightness.`;
    } else if (isTempHigh) {
      verdictTitle = 'Brood Hyperthermia Alert';
      verdictSeverity = 'critical';
      verdictDescription = `Temperature has reached ${currentTemp!.toFixed(1)}°C (exceeds ${thresholds.maxTemp}°C). Worker bees will fan wings to ventilate; prolonged heat risks comb softening and brood death.`;
    } else if (isHumHigh) {
      verdictTitle = 'Elevated Moisture / Condensation Risk';
      verdictSeverity = 'warning';
      verdictDescription = `Relative humidity is ${currentHum!.toFixed(1)}% (exceeds ${thresholds.maxHumidity}% ceiling). Check upper hive ventilation and moisture quilt boards.`;
    } else {
      verdictTitle = 'Low Microclimate Humidity';
      verdictSeverity = 'warning';
      verdictDescription = `Relative humidity is ${currentHum!.toFixed(1)}% (below ${thresholds.minHumidity}%). Ensure nearby apiary water sources are available.`;
    }
  }

  // Calculate coordinates for the Bi-Axial Comfort Matrix
  // Temperature axis: 26°C to 40°C (span 14°C)
  // Humidity axis: 35% to 85% (span 50%)
  const matrixCoords = useMemo(() => {
    if (currentTemp === null || currentHum === null) return null;
    const clampedTemp = Math.max(26, Math.min(40, currentTemp));
    const clampedHum = Math.max(35, Math.min(85, currentHum));

    const xPercent = ((clampedTemp - 26) / 14) * 100;
    // Y-axis: 0% is top (85% humidity), 100% is bottom (35% humidity)
    const yPercent = 100 - ((clampedHum - 35) / 50) * 100;

    return { x: xPercent, y: yPercent };
  }, [currentTemp, currentHum]);

  // Safe Zone Rectangular percentage bounds on the matrix
  const safeZoneBounds = useMemo(() => {
    const left = ((thresholds.minTemp - 26) / 14) * 100;
    const right = ((thresholds.maxTemp - 26) / 14) * 100;
    const width = right - left;

    const top = 100 - ((thresholds.maxHumidity - 35) / 50) * 100;
    const bottom = 100 - ((thresholds.minHumidity - 35) / 50) * 100;
    const height = bottom - top;

    return { left, top, width, height };
  }, [thresholds]);

  // Continuous Ribbon ECharts Option
  const timestamps = useMemo(() => {
    return history.map((r) => {
      const d = new Date(r.timestamp);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
  }, [history]);

  const temperatures = useMemo(() => history.map((r) => r.temperature_c), [history]);
  const humidities = useMemo(() => history.map((r) => r.humidity_pct), [history]);

  const ribbonChartOption = useMemo(() => ({
    animationDuration: 400,
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#FFFFFF',
      borderColor: '#DFE5DC',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: '#18261C', fontSize: 12 },
      shadowColor: 'rgba(24, 38, 28, 0.05)',
      shadowBlur: 10,
    },
    legend: {
      data: ['Brood Temperature (°C)', 'Relative Humidity (% RH)'],
      textStyle: { color: '#5C6C5E', fontSize: 11 },
      top: 0,
      right: 0,
      icon: 'circle',
    },
    grid: {
      left: '2%',
      right: '2%',
      bottom: '6%',
      top: '12%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: timestamps,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#E0E6DD' } },
      axisTick: { show: false },
      axisLabel: { color: '#6E7F72', fontSize: 11 },
    },
    yAxis: [
      {
        type: 'value',
        name: '°C',
        position: 'left',
        min: (v: { min: number }) => Math.floor(Math.min(v.min, thresholds.minTemp - 1)),
        max: (v: { max: number }) => Math.ceil(Math.max(v.max, thresholds.maxTemp + 1)),
        splitLine: { lineStyle: { color: '#F0F4EF', type: 'solid' } },
        axisLabel: { color: '#6E7F72', fontSize: 11 },
        nameTextStyle: { color: '#2D5A3C', fontSize: 11 },
      },
      {
        type: 'value',
        name: '% RH',
        position: 'right',
        min: (v: { min: number }) => Math.floor(Math.min(v.min, thresholds.minHumidity - 5)),
        max: (v: { max: number }) => Math.ceil(Math.max(v.max, thresholds.maxHumidity + 5)),
        splitLine: { show: false },
        axisLabel: { color: '#6E7F72', fontSize: 11 },
        nameTextStyle: { color: '#D98A26', fontSize: 11 },
      },
    ],
    series: [
      {
        name: 'Brood Temperature (°C)',
        type: 'line',
        yAxisIndex: 0,
        smooth: 0.35,
        showSymbol: false,
        data: temperatures,
        lineStyle: { width: 2.2, color: '#2D5A3C' },
        itemStyle: { color: '#2D5A3C' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(45, 90, 60, 0.18)' },
              { offset: 1, color: 'rgba(45, 90, 60, 0.0)' },
            ],
          },
        },
      },
      {
        name: 'Relative Humidity (% RH)',
        type: 'line',
        yAxisIndex: 1,
        smooth: 0.35,
        showSymbol: false,
        data: humidities,
        lineStyle: { width: 2.2, color: '#D98A26' },
        itemStyle: { color: '#D98A26' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(217, 138, 38, 0.16)' },
              { offset: 1, color: 'rgba(217, 138, 38, 0.0)' },
            ],
          },
        },
      },
    ],
  }), [timestamps, temperatures, humidities, thresholds]);

  return (
    <div className="space-y-6 animate-stage-enter">
      
      {/* Asymmetric 60/40 Hero Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT STAGE: The Bi-Axial Comfort Matrix (7 cols / ~60%) */}
        <div className="lg:col-span-7 studio-stage p-6 flex flex-col justify-between">
          <div>
            {/* Stage Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#DFE5DC]">
              <div>
                <h2 className="text-base font-bold text-[#18261C] tracking-tight">
                  Colony Microclimate Comfort Matrix
                </h2>
                <p className="text-xs text-[#6E7F72] mt-0.5">
                  Two-dimensional thermoregulation and moisture stability state
                </p>
              </div>

              <span className="text-[11px] font-semibold text-[#2D5A3C] bg-[#EDF5EF] px-2.5 py-1 rounded-full border border-[#C6DACB]">
                Psychrometric Stage
              </span>
            </div>

            {/* The Interactive Comfort Grid */}
            <div className="mt-5 comfort-matrix h-64 w-full relative p-4 flex flex-col justify-between">
              
              {/* Shaded Safe Incubation Corridor */}
              <div
                style={{
                  left: `${safeZoneBounds.left}%`,
                  top: `${safeZoneBounds.top}%`,
                  width: `${safeZoneBounds.width}%`,
                  height: `${safeZoneBounds.height}%`,
                }}
                className="absolute bg-[#EDF5EF]/80 border-2 border-dashed border-[#2D5A3C]/40 rounded-lg flex items-center justify-center pointer-events-none"
              >
                <span className="text-[10px] font-bold tracking-wider text-[#2D5A3C]/70 uppercase">
                  Safe Brood Zone
                </span>
              </div>

              {/* Quadrant Legend Markers */}
              <div className="absolute top-2 left-3 text-[10px] text-[#8C6420] font-medium">
                High Moisture / Cold
              </div>
              <div className="absolute top-2 right-3 text-[10px] text-rose-700 font-medium">
                High Moisture / Heat
              </div>
              <div className="absolute bottom-2 left-3 text-[10px] text-blue-700 font-medium">
                Chilled / Dry
              </div>
              <div className="absolute bottom-2 right-3 text-[10px] text-amber-700 font-medium">
                Ventilation / Fanning
              </div>

              {/* Dynamic Beacon for Current Microclimate Position */}
              {matrixCoords && (
                <div
                  style={{
                    left: `${matrixCoords.x}%`,
                    top: `${matrixCoords.y}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center group pointer-events-auto"
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center transition-all ${
                      verdictSeverity === 'optimal'
                        ? 'bg-[#2D5A3C] animate-beacon'
                        : 'bg-rose-600 animate-beacon'
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>

                  {/* Floating Telemetry Callout */}
                  <div className="mt-1 px-2.5 py-1 bg-[#18261C] text-white rounded-md text-[11px] font-bold shadow-lg whitespace-nowrap">
                    {currentTemp!.toFixed(1)}°C · {currentHum!.toFixed(1)}% RH
                  </div>
                </div>
              )}

              {/* Matrix Axis Indicators */}
              <div className="mt-auto pt-2 flex justify-between text-[10px] text-[#6E7F72] border-t border-[#DFE5DC]/50">
                <span>26°C Cold</span>
                <span className="font-semibold text-[#18261C]">Target Incubation: 34.5°C</span>
                <span>40°C Heat</span>
              </div>
            </div>
          </div>

          {/* Matrix Footnote / Telemetry State */}
          <div className="mt-4 pt-3 border-t border-[#DFE5DC] flex items-center justify-between text-xs text-[#6E7F72]">
            <span>Current Status: <strong className="text-[#18261C]">{verdictTitle}</strong></span>
            <button
              onClick={() => onNavigateToTab('settings')}
              className="text-[#2D5A3C] hover:text-[#18261C] font-medium flex items-center space-x-1"
            >
              <span>Adjust incubation boundaries</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* RIGHT LEDGER: Biological Verdict & Telemetry Inspector (5 cols / ~40%) */}
        <div className="lg:col-span-5 studio-stage p-6 flex flex-col justify-between">
          <div>
            {/* Primary Biological Verdict */}
            <div className="pb-4 border-b border-[#DFE5DC]">
              <div className="flex items-center space-x-2 mb-2">
                {verdictSeverity === 'optimal' ? (
                  <ShieldCheck className="w-5 h-5 text-[#2D5A3C]" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                )}
                <span className="text-xs font-bold uppercase tracking-wider text-[#6E7F72]">
                  Brood Nest Biological Diagnosis
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-[#18261C] leading-snug tracking-tight">
                {verdictTitle}
              </h3>

              <p className="text-xs text-[#435447] mt-2 leading-relaxed">
                {verdictDescription}
              </p>
            </div>

            {/* Real Numerals & Target Offsets */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-[#DFE5DC]">
              
              {/* Temperature block */}
              <div className="p-3 bg-[#F6F8F5] rounded-xl border border-[#DFE5DC]">
                <div className="flex items-center justify-between text-xs text-[#6E7F72] mb-1">
                  <span className="flex items-center space-x-1">
                    <Thermometer className="w-3.5 h-3.5 text-[#2D5A3C]" />
                    <span>Temperature</span>
                  </span>
                  <span>{thresholds.minTemp}–{thresholds.maxTemp}°C</span>
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-extrabold text-[#18261C]">
                    {currentTemp !== null ? currentTemp.toFixed(1) : '--'}
                  </span>
                  <span className="text-sm font-semibold text-[#6E7F72]">°C</span>
                </div>
                <div className="mt-1 text-[11px] font-medium text-rose-600 flex items-center">
                  {isTempLow && <TrendingDown className="w-3 h-3 mr-1" />}
                  {isTempLow ? `${(thresholds.minTemp - currentTemp!).toFixed(1)}° below safe floor` : isTempHigh ? `${(currentTemp! - thresholds.maxTemp).toFixed(1)}° above safe ceiling` : 'Optimal range'}
                </div>
              </div>

              {/* Humidity block */}
              <div className="p-3 bg-[#F6F8F5] rounded-xl border border-[#DFE5DC]">
                <div className="flex items-center justify-between text-xs text-[#6E7F72] mb-1">
                  <span className="flex items-center space-x-1">
                    <Droplets className="w-3.5 h-3.5 text-[#D98A26]" />
                    <span>Humidity</span>
                  </span>
                  <span>{thresholds.minHumidity}–{thresholds.maxHumidity}%</span>
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-extrabold text-[#18261C]">
                    {currentHum !== null ? currentHum.toFixed(1) : '--'}
                  </span>
                  <span className="text-sm font-semibold text-[#6E7F72]">% RH</span>
                </div>
                <div className="mt-1 text-[11px] font-medium text-amber-700 flex items-center">
                  {isHumHigh && <TrendingUp className="w-3 h-3 mr-1" />}
                  {isHumHigh ? `${(currentHum! - thresholds.maxHumidity).toFixed(1)}% excess moisture` : isHumLow ? `${(thresholds.minHumidity - currentHum!).toFixed(1)}% low moisture` : 'Optimal range'}
                </div>
              </div>

            </div>

            {/* Hardware & Telemetry Diagnostic Ledger */}
            <div className="py-4 space-y-2 text-xs">
              <div className="flex justify-between text-[#6E7F72]">
                <span>Transmitter Node:</span>
                <span className="font-semibold text-[#18261C]">
                  {activeDevice?.device_id || latestReading?.device_id || 'beehive-001'}
                </span>
              </div>
              <div className="flex justify-between text-[#6E7F72]">
                <span>Microcontroller:</span>
                <span className="font-medium text-[#18261C]">ESP32-WROOM-32</span>
              </div>
              <div className="flex justify-between text-[#6E7F72]">
                <span>Sensor Probe:</span>
                <span className="font-medium text-[#18261C]">DHT22 (GPIO 4)</span>
              </div>
              <div className="flex justify-between text-[#6E7F72]">
                <span>Last Telemetry Packet:</span>
                <span className="font-medium text-[#18261C]">
                  {latestReading ? new Date(latestReading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Footer */}
          <div className="pt-3 border-t border-[#DFE5DC] flex items-center justify-between text-xs">
            <button
              onClick={onOpenTestModal}
              className="text-[#8C6420] hover:text-[#18261C] font-semibold flex items-center space-x-1"
            >
              <span>Push diagnostic packet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onNavigateToTab('alerts')}
              className="text-[#2D5A3C] hover:text-[#18261C] font-semibold flex items-center space-x-1"
            >
              <span>View alerts log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* LOWER STAGE: Continuous Panoramic Telemetry Ribbon (Full Width) */}
      <div className="studio-stage p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#DFE5DC] gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#2D5A3C]" />
              <h3 className="text-base font-bold text-[#18261C] tracking-tight">
                Panoramic Telemetry Stream
              </h3>
            </div>
            <p className="text-xs text-[#6E7F72] mt-0.5">
              Continuous thermal and moisture records ({history.length} data points in active window)
            </p>
          </div>

          {/* Window Filter Pills */}
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

        {/* The Full Width Ribbon Plot */}
        <div className="h-72 w-full">
          {history.length > 0 ? (
            <ReactECharts
              option={ribbonChartOption}
              style={{ height: '100%', width: '100%' }}
              notMerge={true}
              lazyUpdate={true}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#EDF5EF] flex items-center justify-center text-[#2D5A3C]">
                <Clock className="w-5 h-5 animate-pulse" />
              </div>
              <p className="text-xs font-semibold text-[#18261C]">
                No telemetry packets in the selected {timeRange} window.
              </p>
              <button
                onClick={() => onSelectTimeRange('session')}
                className="text-xs text-[#2D5A3C] font-semibold underline"
              >
                View latest recorded session (72h window)
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

