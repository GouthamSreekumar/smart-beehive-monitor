'use client';

import React from 'react';
import { Device } from '../lib/types';
import { Layers } from 'lucide-react';

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
    return null;
  }

  return (
    <div className="flex items-center space-x-2 py-1 text-xs">
      <div className="flex items-center space-x-1.5 text-stone-500 font-medium">
        <Layers className="w-3.5 h-3.5" />
        <span>Monitored Hives:</span>
      </div>

      <button
        onClick={() => onSelectDevice('')}
        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
          selectedDeviceId === ''
            ? 'bg-amber-600 text-white shadow-xs'
            : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
        }`}
      >
        All Colonies
      </button>

      {devices.map((d) => (
        <button
          key={d.device_id}
          onClick={() => onSelectDevice(d.device_id)}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            selectedDeviceId === d.device_id
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          <span>{d.device_id}</span>
          <span
            className={`w-2 h-2 rounded-full ${
              d.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
        </button>
      ))}
    </div>
  );
};
