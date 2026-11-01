'use client';

import React from 'react';
import { Box, Layers } from 'lucide-react';
import { Device } from '../lib/types';

interface DeviceSelectorProps {
  devices: Device[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  devices,
  selectedDeviceId,
  onSelectDevice,
}) => {
  if (devices.length <= 1) {
    return null; // No need for switcher if only single hive
  }

  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Layers className="w-4 h-4 text-slate-500" />
        <span className="text-xs font-semibold text-slate-700">Monitored Hives:</span>
      </div>

      <div className="flex items-center space-x-1.5 overflow-x-auto">
        <button
          onClick={() => onSelectDevice('')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
            selectedDeviceId === ''
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Hives
        </button>

        {devices.map((d) => (
          <button
            key={d.device_id}
            onClick={() => onSelectDevice(d.device_id)}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              selectedDeviceId === d.device_id
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>{d.device_id}</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                d.status === 'online'
                  ? 'bg-emerald-500'
                  : d.status === 'stale'
                  ? 'bg-amber-500'
                  : 'bg-slate-400'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

