'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StudioHeader } from '../components/StudioHeader';
import { BiomeStudioView } from '../components/BiomeStudioView';
import { TelemetryStreamView } from '../components/TelemetryStreamView';
import { AlertsLogView } from '../components/AlertsLogView';
import { HardwareFleetView } from '../components/HardwareFleetView';
import { IncubationSettingsView, DEFAULT_THRESHOLDS } from '../components/IncubationSettingsView';
import { TestIngestModal } from '../components/TestIngestModal';
import {
  fetchHealth,
  fetchLatestReading,
  fetchReadingsHistory,
  fetchDevices,
  fetchThresholdSettings,
} from '../lib/api';
import {
  SensorReading,
  Device,
  AlertThresholds,
  TimeRange,
  NavTab,
} from '../lib/types';
import { CheckCircle2, X } from 'lucide-react';

export default function DashboardPage() {
  const [currentTab, setCurrentTab] = useState<NavTab>('studio');
  const [testModalOpen, setTestModalOpen] = useState<boolean>(false);

  // Telemetry & Device State
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [thresholds, setThresholds] = useState<AlertThresholds>(DEFAULT_THRESHOLDS);
  // Default to 'session' (72h) so existing database history is rendered immediately
  const [timeRange, setTimeRange] = useState<TimeRange>('session');

  // Connection State
  const [backendConnected, setBackendConnected] = useState<boolean>(true);
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [secondsSinceLastPacket, setSecondsSinceLastPacket] = useState<number | null>(null);

  // 1. Fetch Thresholds
  useEffect(() => {
    async function loadThresholds() {
      try {
        const backendThresholds = await fetchThresholdSettings();
        setThresholds(backendThresholds);
      } catch (err) {
        try {
          const saved = localStorage.getItem('beehive_thresholds');
          if (saved) setThresholds(JSON.parse(saved));
        } catch {
          // Defaults
        }
      }
    }
    loadThresholds();
  }, []);

  const handleThresholdsUpdated = (newThresholds: AlertThresholds) => {
    setThresholds(newThresholds);
    if (typeof window !== 'undefined') {
      localStorage.setItem('beehive_thresholds', JSON.stringify(newThresholds));
    }
  };

  const getHoursForTimeRange = (range: TimeRange): number => {
    switch (range) {
      case '1h': return 1.0;
      case '6h': return 6.0;
      case '24h': return 24.0;
      case '72h': return 72.0;
      case 'session': return 72.0;
    }
  };

  // 2. Refresh Telemetry Function
  const refreshTelemetry = useCallback(async () => {
    try {
      await fetchHealth();
      setBackendConnected(true);

      const latest = await fetchLatestReading(selectedDeviceId || undefined);
      setLatestReading(latest);

      const hours = getHoursForTimeRange(timeRange);
      const hist = await fetchReadingsHistory(selectedDeviceId || undefined, hours);
      setHistory(hist);

      const devs = await fetchDevices();
      setDevices(devs);
    } catch (err) {
      console.warn('Backend sync failed:', err);
      setBackendConnected(false);
    }
  }, [selectedDeviceId, timeRange]);

  // 3. Polling Lifecycle
  useEffect(() => {
    refreshTelemetry();
    if (!isPolling) return;
    const interval = setInterval(refreshTelemetry, 3000);
    return () => clearInterval(interval);
  }, [isPolling, refreshTelemetry]);

  // 4. Exact Packet Freshness Timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (latestReading?.timestamp) {
        const lastPacketMs = new Date(latestReading.timestamp).getTime();
        const diffSeconds = Math.max(0, (Date.now() - lastPacketMs) / 1000);
        setSecondsSinceLastPacket(diffSeconds);
      } else {
        setSecondsSinceLastPacket(null);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [latestReading]);

  // Derived Node Connectivity (consistent source of truth)
  const nodeConnected = backendConnected && latestReading !== null && secondsSinceLastPacket !== null && secondsSinceLastPacket <= 120;

  // Active Alerts count calculation
  const activeAlertCount = React.useMemo(() => {
    let count = 0;
    if (!backendConnected) count++;
    if (!nodeConnected && secondsSinceLastPacket !== null && secondsSinceLastPacket > 120) count++;
    if (latestReading) {
      if (latestReading.temperature_c < thresholds.minTemp || latestReading.temperature_c > thresholds.maxTemp) count++;
      if (latestReading.humidity_pct < thresholds.minHumidity || latestReading.humidity_pct > thresholds.maxHumidity) count++;
    }
    return count;
  }, [backendConnected, nodeConnected, secondsSinceLastPacket, latestReading, thresholds]);

  const activeDevice = devices.find((d) => d.device_id === selectedDeviceId) || null;

  const handleTestIngestSuccess = async (msg: string) => {
    setToastMessage(msg);
    await refreshTelemetry();
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="min-h-screen bg-[#F6F8F5] text-[#18261C] flex flex-col biome-canvas">
      
      {/* 1. Studio Header */}
      <StudioHeader
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        devices={devices}
        selectedDeviceId={selectedDeviceId}
        onSelectDevice={setSelectedDeviceId}
        backendConnected={backendConnected}
        nodeConnected={nodeConnected}
        secondsSinceLastPacket={secondsSinceLastPacket}
        latestReadingTimestamp={latestReading?.timestamp}
        activeAlertCount={activeAlertCount}
        onRefresh={refreshTelemetry}
        onOpenTestModal={() => setTestModalOpen(true)}
      />

      {/* 2. Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Toast Feedback */}
        {toastMessage && (
          <div className="p-4 rounded-xl bg-white border border-[#2D5A3C]/30 text-[#2D5A3C] text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-[#6E7F72] hover:text-[#18261C]">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab 1: Biome Studio (Asymmetric Hero Stage) */}
        {currentTab === 'studio' && (
          <BiomeStudioView
            latestReading={latestReading}
            history={history}
            thresholds={thresholds}
            activeDevice={activeDevice}
            backendConnected={backendConnected}
            nodeConnected={nodeConnected}
            secondsSinceLastPacket={secondsSinceLastPacket}
            timeRange={timeRange}
            onSelectTimeRange={setTimeRange}
            onNavigateToTab={setCurrentTab}
            onOpenTestModal={() => setTestModalOpen(true)}
          />
        )}

        {/* Tab 2: Longitudinal Telemetry Stream */}
        {currentTab === 'stream' && (
          <TelemetryStreamView
            history={history}
            thresholds={thresholds}
            timeRange={timeRange}
            onSelectTimeRange={setTimeRange}
          />
        )}

        {/* Tab 3: Alerts Log */}
        {currentTab === 'alerts' && (
          <AlertsLogView
            latestReading={latestReading}
            thresholds={thresholds}
            backendConnected={backendConnected}
            nodeConnected={nodeConnected}
            secondsSinceLastReading={secondsSinceLastPacket}
          />
        )}

        {/* Tab 4: Hardware Fleet */}
        {currentTab === 'device' && (
          <HardwareFleetView
            devices={devices}
            selectedDeviceId={selectedDeviceId}
            onSelectDevice={setSelectedDeviceId}
            latestReading={latestReading}
            secondsSinceLastPacket={secondsSinceLastPacket}
            backendConnected={backendConnected}
            nodeConnected={nodeConnected}
          />
        )}

        {/* Tab 5: Incubation Limits Settings */}
        {currentTab === 'settings' && (
          <IncubationSettingsView
            currentThresholds={thresholds}
            onThresholdsUpdated={handleThresholdsUpdated}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-[#DFE5DC] bg-white py-4 px-6 text-xs text-[#6E7F72] text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <span>Smart Beehive Monitor · Agricultural Observability Platform</span>
        <span>ESP32 + DHT22 · FastAPI · PostgreSQL · Next.js 14</span>
      </footer>

      {/* Diagnostic Ingest Modal */}
      <TestIngestModal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        selectedDeviceId={selectedDeviceId}
        onSuccess={handleTestIngestSuccess}
      />

    </div>
  );
}
