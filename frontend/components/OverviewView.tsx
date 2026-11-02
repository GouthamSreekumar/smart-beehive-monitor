'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { SensorReading, AlertThresholds, Device, NavTab } from '../lib/types';
import {
  Thermometer,
  Droplets,
  Radio,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Clock,
} from 'lucide-react';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface OverviewViewProps {
  latestReading: SensorReading | null;
  previousReading: SensorReading | null;
  history: SensorReading[];
  thresholds: AlertThresholds;
  activeDevice: Device | null;
  backendConnected: boolean;
  secondsSinceLastPacket: number | null;
  activeAlertCount: number;
  onNavigateToTab: (tab: NavTab) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  latestReading,
  previousReading,
  history,
  thresholds,
  activeDevice,
  backendConnected,
  secondsSinceLastPacket,
  activeAlertCount,
  onNavigateToTab,
}) => {
  const temp = latestReading ? latestReading.temperature_c : null;
  const humidity = latestReading ? latestReading.humidity_pct : null;

  // Temperature status
  let tempStatus: 'normal' | 'warning' | 'critical' = 'normal';
  let tempLabel = 'Normal incubation range';
  if (temp !== null) {
    if (temp < thresholds.minTemp) {
      tempStatus = 'critical';
      tempLabel = `Below safe minimum (${thresholds.minTemp}°C)`;
    } else if (temp > thresholds.maxTemp) {
      tempStatus = 'critical';
      tempLabel = `Above safe maximum (${thresholds.maxTemp}°C)`;
    } else {
      tempStatus = 'normal';
      tempLabel = 'Optimal brood temperature';
    }
  }

  // Humidity status
  let humStatus: 'normal' | 'warning' | 'critical' = 'normal';
  let humLabel = 'Normal humidity level';
  if (humidity !== null) {
    if (humidity < thresholds.minHumidity) {
      humStatus = 'warning';
      humLabel = `Below target (${thresholds.minHumidity}%)`;
    } else if (humidity > thresholds.maxHumidity) {
      humStatus = 'critical';
      humLabel = `Excess moisture (${thresholds.maxHumidity}%)`;
    } else {
      humStatus = 'normal';
      humLabel = 'Optimal relative humidity';
    }
  }

  // Connectivity
  const isOnline = backendConnected && secondsSinceLastPacket !== null && secondsSinceLastPacket <= 120 && latestReading !== null;
  const isDelayed = backendConnected && secondsSinceLastPacket !== null && secondsSinceLastPacket > 30 && secondsSinceLastPacket <= 120;

  // Plain-English hive condition interpretation based on genuine readings
  let conditionText = 'No sensor readings have been received yet.';
  if (latestReading) {
    if (tempStatus === 'normal' && humStatus === 'normal') {
      conditionText = 'Brood nest microclimate is healthy and within optimal biological ranges for incubation.';
    } else if (tempStatus === 'critical' && temp! < thresholds.minTemp) {
      conditionText = `Temperature is low (${temp!.toFixed(1)}°C). Risk of chilled brood; inspect hive insulation and drafts.`;
    } else if (tempStatus === 'critical' && temp! > thresholds.maxTemp) {
      conditionText = `Temperature is high (${temp!.toFixed(1)}°C). Bees may be fanning wings to ventilate; check shading.`;
    } else if (humStatus === 'critical') {
      conditionText = `Humidity is elevated (${humidity!.toFixed(1)}%). Excess moisture favors mold; check upper ventilation.`;
    } else {
      conditionText = `Humidity is low (${humidity!.toFixed(1)}%). Ensure water sources are accessible near the apiary.`;
    }
  }

  // Deltas
  const tempDelta = (temp !== null && previousReading !== null) ? temp - previousReading.temperature_c : null;
  const humDelta = (humidity !== null && previousReading !== null) ? humidity - previousReading.humidity_pct : null;

  // Overview 24h/recent trend chart options
  const timestamps = useMemo(() => {
    return history.map((r) => {
      const d = new Date(r.timestamp);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
  }, [history]);

  const temperatures = useMemo(() => history.map((r) => r.temperature_c), [history]);
  const humidities = useMemo(() => history.map((r) => r.humidity_pct), [history]);

  const overviewChartOption = useMemo(() => ({
    animationDuration: 400,
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#FFFFFF',
      borderColor: '#E5EAE3',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: '#25352B', fontSize: 12 },
      shadowColor: 'rgba(37, 53, 43, 0.04)',
      shadowBlur: 8,
    },
    legend: {
      data: ['Temperature (°C)', 'Humidity (% RH)'],
      textStyle: { color: '#5C6C5E', fontSize: 12 },
      top: 0,
      right: 0,
      icon: 'circle',
    },
    grid: {
      left: '2%',
      right: '2%',
      bottom: '5%',
      top: '12%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: timestamps,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#E5EAE3' } },
      axisTick: { show: false },
      axisLabel: { color: '#788579', fontSize: 11 },
    },
    yAxis: [
      {
        type: 'value',
        name: '°C',
        position: 'left',
        min: (v: { min: number }) => Math.floor(Math.min(v.min, thresholds.minTemp - 1)),
        max: (v: { max: number }) => Math.ceil(Math.max(v.max, thresholds.maxTemp + 1)),
        splitLine: { lineStyle: { color: '#F0F4EF', type: 'solid' } },
        axisLabel: { color: '#788579', fontSize: 11 },
        nameTextStyle: { color: '#477A55', fontSize: 11 },
      },
      {
        type: 'value',
        name: '% RH',
        position: 'right',
        min: (v: { min: number }) => Math.floor(Math.min(v.min, thresholds.minHumidity - 5)),
        max: (v: { max: number }) => Math.ceil(Math.max(v.max, thresholds.maxHumidity + 5)),
        splitLine: { show: false },
        axisLabel: { color: '#788579', fontSize: 11 },
        nameTextStyle: { color: '#D99A35', fontSize: 11 },
      },
    ],
    series: [
      {
        name: 'Temperature (°C)',
        type: 'line',
        yAxisIndex: 0,
        smooth: 0.35,
        showSymbol: false,
        data: temperatures,
        lineStyle: { width: 2.2, color: '#477A55' },
        itemStyle: { color: '#477A55' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(71, 122, 85, 0.16)' },
              { offset: 1, color: 'rgba(71, 122, 85, 0.0)' },
            ],
          },
        },
      },
      {
        name: 'Humidity (% RH)',
        type: 'line',
        yAxisIndex: 1,
        smooth: 0.35,
        showSymbol: false,
        data: humidities,
        lineStyle: { width: 2.2, color: '#D99A35' },
        itemStyle: { color: '#D99A35' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(217, 154, 53, 0.14)' },
              { offset: 1, color: 'rgba(217, 154, 53, 0.0)' },
            ],
          },
        },
      },
    ],
  }), [timestamps, temperatures, humidities, thresholds]);

  return (
    <div className="space-y-6">
      
      {/* 4 Essential Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* 1. Hive Temperature */}
        <div className="agri-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-ink-secondary mb-2">
              <span className="font-medium flex items-center space-x-1.5">
                <Thermometer className="w-4 h-4 text-primary-600" />
                <span>Brood Temperature</span>
              </span>
              <span className="text-[11px] text-ink-muted">
                Safe: {thresholds.minTemp}–{thresholds.maxTemp}°C
              </span>
            </div>

            <div className="flex items-baseline space-x-2 my-2">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-ink-primary">
                {temp !== null ? temp.toFixed(1) : '--'}
              </span>
              <span className="text-lg font-medium text-ink-muted">°C</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
            <span
              className={`inline-flex items-center space-x-1 font-medium ${
                tempStatus === 'normal'
                  ? 'text-primary-700'
                  : 'text-status-critical'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  tempStatus === 'normal' ? 'bg-primary-500' : 'bg-status-critical'
                }`}
              />
              <span>{tempLabel}</span>
            </span>

            {tempDelta !== null && Math.abs(tempDelta) >= 0.1 && (
              <span className="text-ink-muted text-[11px] flex items-center">
                {tempDelta > 0 ? (
                  <TrendingUp className="w-3 h-3 text-primary-600 mr-0.5" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-honey-600 mr-0.5" />
                )}
                {tempDelta > 0 ? `+${tempDelta.toFixed(1)}°` : `${tempDelta.toFixed(1)}°`}
              </span>
            )}
          </div>
        </div>

        {/* 2. Relative Humidity */}
        <div className="agri-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-ink-secondary mb-2">
              <span className="font-medium flex items-center space-x-1.5">
                <Droplets className="w-4 h-4 text-honey-600" />
                <span>Relative Humidity</span>
              </span>
              <span className="text-[11px] text-ink-muted">
                Safe: {thresholds.minHumidity}–{thresholds.maxHumidity}%
              </span>
            </div>

            <div className="flex items-baseline space-x-2 my-2">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-ink-primary">
                {humidity !== null ? humidity.toFixed(1) : '--'}
              </span>
              <span className="text-lg font-medium text-ink-muted">%</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
            <span
              className={`inline-flex items-center space-x-1 font-medium ${
                humStatus === 'normal'
                  ? 'text-primary-700'
                  : 'text-status-critical'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  humStatus === 'normal' ? 'bg-primary-500' : 'bg-status-critical'
                }`}
              />
              <span>{humLabel}</span>
            </span>

            {humDelta !== null && Math.abs(humDelta) >= 0.2 && (
              <span className="text-ink-muted text-[11px] flex items-center">
                {humDelta > 0 ? (
                  <TrendingUp className="w-3 h-3 text-honey-600 mr-0.5" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-primary-600 mr-0.5" />
                )}
                {humDelta > 0 ? `+${humDelta.toFixed(1)}%` : `${humDelta.toFixed(1)}%`}
              </span>
            )}
          </div>
        </div>

        {/* 3. Sensor / Device Connection */}
        <div className="agri-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-ink-secondary mb-2">
              <span className="font-medium flex items-center space-x-1.5">
                <Radio className="w-4 h-4 text-primary-600" />
                <span>Sensor Node</span>
              </span>
              <span className="text-[11px] text-ink-muted font-mono">
                {activeDevice?.device_id || latestReading?.device_id || 'beehive-001'}
              </span>
            </div>

            <div className="my-2">
              <div className="flex items-center space-x-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? 'bg-primary-500' : isDelayed ? 'bg-status-warning' : 'bg-status-critical'
                  }`}
                />
                <span className="text-2xl font-bold tracking-tight text-ink-primary">
                  {isOnline ? 'Connected' : isDelayed ? 'Delayed' : 'Offline'}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-1">
                ESP32 + DHT22 Microclimate Probe
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-ink-muted">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Last Packet:</span>
            </span>
            <span className="font-medium text-ink-secondary">
              {latestReading
                ? new Date(latestReading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : 'Never'}
            </span>
          </div>
        </div>

        {/* 4. Active Alerts & Condition Summary */}
        <div className="agri-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-ink-secondary mb-2">
              <span className="font-medium flex items-center space-x-1.5">
                <AlertTriangle className={`w-4 h-4 ${activeAlertCount > 0 ? 'text-status-warning' : 'text-primary-600'}`} />
                <span>Active Alerts</span>
              </span>
              <span className="text-[11px] font-medium text-primary-700">
                {activeAlertCount === 0 ? 'All Clear' : `${activeAlertCount} Attention Needed`}
              </span>
            </div>

            <div className="my-2">
              <div className="text-3xl sm:text-4xl font-bold tracking-tight text-ink-primary">
                {activeAlertCount}
              </div>
              <p className="text-xs text-ink-muted mt-1 line-clamp-2">
                {conditionText}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
            <button
              onClick={() => onNavigateToTab('alerts')}
              className="text-primary-600 hover:text-primary-800 font-medium flex items-center space-x-1 transition-colors"
            >
              <span>View alert details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Unified Telemetry Trend Chart */}
      <div className="agri-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-border-subtle gap-2">
          <div>
            <h3 className="text-sm font-semibold text-ink-primary">
              Recent Microclimate Telemetry
            </h3>
            <p className="text-xs text-ink-muted">
              Continuous temperature and relative humidity recordings from the brood chamber
            </p>
          </div>

          <button
            onClick={() => onNavigateToTab('live')}
            className="text-xs font-medium text-primary-600 hover:text-primary-800 flex items-center space-x-1 self-start sm:self-auto"
          >
            <span>Open live stream view</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-72 w-full">
          {history.length > 0 ? (
            <ReactECharts
              option={overviewChartOption}
              style={{ height: '100%', width: '100%' }}
              notMerge={true}
              lazyUpdate={true}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-xs text-ink-muted space-y-2">
              <Clock className="w-6 h-6 text-ink-faint animate-pulse" />
              <span>Awaiting sensor telemetry from ESP32...</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

