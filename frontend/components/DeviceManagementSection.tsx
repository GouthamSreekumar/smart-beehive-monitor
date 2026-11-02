'use client';

import React from 'react';
import { Device, SensorReading } from '../lib/types';
import { Cpu, Radio, Thermometer, Droplets, Clock, ShieldCheck, Wifi, CheckCircle2, AlertCircle } from 'lucide-react';

interface DeviceManagementSectionProps {
  devices: Device[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
  latestReading: SensorReading | null;
  secondsSinceLastPacket: number | null;
  backendConnected: boolean;
}

export const DeviceManagementSection: React.FC<DeviceManagementSectionProps> = ({
  devices,
  selectedDeviceId,
  onSelectDevice,
  latestReading,
  secondsSinceLastPacket,
  backendConnected,
}) => {
  // If devices array is empty but we have a latestReading, show fallback node
  const displayDevices: Device[] = devices.length > 0 ? devices : [
    {
      device_id: latestReading?.device_id || 'beehive-001',
      name: 'Brood Monitor Node 1',
      description: 'ESP32 microcontroller with calibrated DHT22 digital microclimate sensor',
      last_seen: latestReading?.timestamp || null,
      last_temperature_c: latestReading?.temperature_c || null,
      last_humidity_pct: latestReading?.humidity_pct || null,
      status: (secondsSinceLastPacket !== null && secondsSinceLastPacket <= 30 && backendConnected) ? 'online' : (secondsSinceLastPacket !== null && secondsSinceLastPacket <= 120) ? 'stale' : 'offline',
    }
  ];

  return (
    <div className="space-y-4">
      
      {/* Device Section Header */}
      <div className="panel-card rounded-lg p-4 bg-industrial-900 border-industrial-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-honey-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Monitored Apiary Fleet & Hardware Telemetry
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-industrial-850 text-industrial-400 border border-industrial-800">
          {displayDevices.length} Monitored Node{displayDevices.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Fleet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayDevices.map((dev) => {
          const isSelected = selectedDeviceId === dev.device_id || (selectedDeviceId === '' && displayDevices.length === 1);
          const isDevOnline = dev.status === 'online' && backendConnected;
          const isDevStale = dev.status === 'stale' && backendConnected;

          return (
            <div
              key={dev.device_id}
              onClick={() => onSelectDevice(dev.device_id)}
              className={`panel-card rounded-lg p-5 cursor-pointer transition-all ${
                isSelected
                  ? 'border-honey-500/50 bg-industrial-850 shadow-glow-amber'
                  : 'bg-industrial-900 border-industrial-800 hover:border-industrial-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-md bg-industrial-950 border border-industrial-800 flex items-center justify-center text-honey-400">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white font-mono tracking-tight">
                      {dev.device_id}
                    </h3>
                    <p className="text-[10px] text-industrial-400">
                      {dev.name || 'Apis mellifera Brood Node'}
                    </p>
                  </div>
                </div>

                {/* Status Pill */}
                <div
                  className={`flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    isDevOnline
                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/40'
                      : isDevStale
                      ? 'bg-honey-950/40 text-honey-400 border border-honey-500/40'
                      : 'bg-rose-950/40 text-rose-400 border border-rose-500/40'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isDevOnline ? 'bg-emerald-400 animate-pulse' : isDevStale ? 'bg-honey-400' : 'bg-rose-400'
                    }`}
                  />
                  <span>{dev.status}</span>
                </div>
              </div>

              {/* Hardware Specifications */}
              <div className="space-y-1.5 my-3 text-[11px] font-mono bg-industrial-950/60 p-3 rounded border border-industrial-800/80">
                <div className="flex justify-between text-industrial-400">
                  <span>Microcontroller:</span>
                  <span className="text-white">ESP32-WROOM-32</span>
                </div>
                <div className="flex justify-between text-industrial-400">
                  <span>Sensor Probe:</span>
                  <span className="text-white">DHT22 (GPIO 4)</span>
                </div>
                <div className="flex justify-between text-industrial-400">
                  <span>Radio Protocol:</span>
                  <span className="text-white">Wi-Fi 802.11 b/g/n (2.4 GHz)</span>
                </div>
                <div className="flex justify-between text-industrial-400">
                  <span>Transport:</span>
                  <span className="text-white">HTTP POST REST JSON</span>
                </div>
              </div>

              {/* Live Telemetry Snapshot for this node */}
              <div className="grid grid-cols-2 gap-2 my-3">
                <div className="p-2 rounded bg-industrial-950/40 border border-industrial-800 flex items-center space-x-2">
                  <Thermometer className="w-3.5 h-3.5 text-honey-500" />
                  <div>
                    <span className="text-[9px] text-industrial-500 block">Temperature</span>
                    <span className="text-xs font-bold font-mono text-white">
                      {dev.last_temperature_c !== null && dev.last_temperature_c !== undefined
                        ? `${dev.last_temperature_c.toFixed(1)} °C`
                        : '--'}
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded bg-industrial-950/40 border border-industrial-800 flex items-center space-x-2">
                  <Droplets className="w-3.5 h-3.5 text-sky-400" />
                  <div>
                    <span className="text-[9px] text-industrial-500 block">Humidity</span>
                    <span className="text-xs font-bold font-mono text-white">
                      {dev.last_humidity_pct !== null && dev.last_humidity_pct !== undefined
                        ? `${dev.last_humidity_pct.toFixed(1)} %`
                        : '--'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer / Last Seen */}
              <div className="pt-2.5 border-t border-industrial-800 flex items-center justify-between text-[10px] text-industrial-400">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-industrial-500" />
                  <span>Last Seen:</span>
                </span>
                <span className="font-mono text-industrial-300">
                  {dev.last_seen ? new Date(dev.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Never'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

