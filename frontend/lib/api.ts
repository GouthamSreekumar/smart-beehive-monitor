import { SensorReading, Device, HealthResponse } from './types';

/**
 * Normalized API Base URL from process.env.NEXT_PUBLIC_API_URL.
 * Supports both root domain base URLs (e.g. 'http://localhost:8000')
 * and subpath base URLs (e.g. 'https://beehive.gouthamsreekumar.dev/api').
 */
function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  // Strip trailing slash if present
  const trimmed = envUrl.replace(/\/+$/, '');
  // If the user provided URL ends with '/api', strip it so endpoint appending is uniform
  return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed;
}

const BASE_URL = getApiBaseUrl();

/**
 * Check backend API and PostgreSQL database health.
 * Backend provides both GET /health and GET /api/health.
 */
export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${BASE_URL}/api/health`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch the latest reading, optionally filtered by deviceId.
 * Calls GET /api/readings/latest
 */
export async function fetchLatestReading(deviceId?: string): Promise<SensorReading | null> {
  const url = deviceId 
    ? `${BASE_URL}/api/readings/latest?device_id=${encodeURIComponent(deviceId)}`
    : `${BASE_URL}/api/readings/latest`;

  const res = await fetch(url, { cache: 'no-store' });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch latest reading (${res.status})`);
  }
  return res.json();
}

/**
 * Fetch readings history for time-series charts.
 * Calls GET /api/readings/history
 */
export async function fetchReadingsHistory(deviceId?: string, hours: number = 1): Promise<SensorReading[]> {
  let url = `${BASE_URL}/api/readings/history?hours=${hours}&limit=2000`;
  if (deviceId) {
    url += `&device_id=${encodeURIComponent(deviceId)}`;
  }

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch history (${res.status})`);
  }
  return res.json();
}

/**
 * Fetch all registered or observed devices and their status.
 * Calls GET /api/devices
 */
export async function fetchDevices(): Promise<Device[]> {
  const res = await fetch(`${BASE_URL}/api/devices`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to fetch devices (${res.status})`);
  }
  return res.json();
}

/**
 * Post a new sensor reading.
 * Calls POST /api/readings
 */
export async function postReading(data: {
  device_id: string;
  temperature_c: number;
  humidity_pct: number;
}): Promise<SensorReading> {
  const res = await fetch(`${BASE_URL}/api/readings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Ingestion failed (${res.status})`);
  }
  return res.json();
}
