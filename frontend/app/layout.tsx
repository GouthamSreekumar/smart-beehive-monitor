import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Smart Beehive Monitor | Industrial IoT Observability',
  description: 'Industrial-grade microclimate telemetry monitoring platform for apiary brood nests with ESP32 and DHT22.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-industrial-950 text-industrial-300 dark:bg-industrial-950 dark:text-industrial-300 antialiased selection:bg-honey-500/30 selection:text-honey-200">
        {children}
      </body>
    </html>
  );
}
