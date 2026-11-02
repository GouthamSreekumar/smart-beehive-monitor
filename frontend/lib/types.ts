export interface SensorReading {
  id: number;
  device_id: string;
  temperature_c: number;
  humidity_pct: number;
  timestamp: string;
}

export interface Device {
  device_id: string;
  name?: string | null;
  description?: string | null;
  last_seen?: string | null;
  last_temperature_c?: number | null;
  last_humidity_pct?: number | null;
  status: 'online' | 'stale' | 'offline';
}

export interface AlertThresholds {
  minTemp: number;       // Default: 32.0 °C
  maxTemp: number;       // Default: 36.0 °C
  minHumidity: number;   // Default: 50.0 %
  maxHumidity: number;   // Default: 70.0 %
}

export type AlertSeverity = 'critical' | 'warning' | 'info';

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: string;
  metric: 'temperature' | 'humidity' | 'connection';
  value?: number;
  threshold?: number;
  unit?: string;
  status: 'Active' | 'Acknowledged';
}

export interface HealthResponse {
  status: string;
  database: string;
  timestamp: string;
  version: string;
}

export type TimeRange = '1h' | '6h' | '24h' | '72h' | 'session';

export type NavTab = 'studio' | 'stream' | 'alerts' | 'device' | 'settings';

export interface TelemetryStats {
  tempMin: number | null;
  tempMax: number | null;
  tempAvg: number | null;
  humidityMin: number | null;
  humidityMax: number | null;
  humidityAvg: number | null;
  sampleCount: number;
  latestTimestamp?: string | null;
}
