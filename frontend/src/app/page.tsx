'use client';

import { useState, useEffect } from 'react';

interface CryptoData {
  name: string;
  symbol: string;
  value: string;
  sort: string;
}

interface MetricData {
  name: string;
  priority: string;
  description: string;
  success: boolean;
  data_count: number;
  all_data: CryptoData[];
  top_3_preview: CryptoData[];
  fetch_time_ms: number;
  error?: string;
}

interface CryptoDataResponse {
  timestamp: string;
  total_metrics: number;
  all_metrics: Record<string, MetricData>;
  fetch_stats: {
    total_duration_ms: number;
    successful_fetches: number;
    failed_fetches: number;
    last_update: string;
  };
}

export default function Dashboard() {
  const [data, setData] = useState<CryptoDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch data only once when component mounts
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/crypto/data');

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (mounted) {
          setData(result);
          setLastUpdate(new Date());
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch data');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchData();

    // Auto-refresh every 5 minutes (since backend updates every 5 minutes)
    const interval = setInterval(fetchData, 5 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div>🔄 Loading crypto analytics...</div>
          <div style={{ fontSize: '0.9rem', marginTop: '10px' }}>
            Fetching real-time social data from LunarCrush
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">
          <div>❌ Error loading data</div>
          <div style={{ fontSize: '0.9rem', marginTop: '10px' }}>
            {error}
          </div>
          <div style={{ fontSize: '0.8rem', marginTop: '15px', color: '#a0a0a0' }}>
            Make sure your Go server is running on localhost:8080
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container">
        <div className="error">No data available</div>
      </div>
    );
  }

  // Sort metrics by priority (high first)
  const sortedMetrics = Object.entries(data.all_metrics).sort(([, a], [, b]) => {
    if (a.priority === 'high' && b.priority !== 'high') return -1;
    if (b.priority === 'high' && a.priority !== 'high') return 1;
    return 0;
  });

  return (
    <div className="container">
      <header className="header">
        <h1>🚀 Crypto Analytics</h1>
        <p>Real-time cryptocurrency social sentiment and market data</p>
        {lastUpdate && (
          <div style={{ fontSize: '0.9rem', color: '#a0a0a0', marginTop: '10px' }}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </header>

      <div className="stats-section">
        <h2>📊 System Overview</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{data.total_metrics}</div>
            <div className="stat-label">Total Metrics</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{data.fetch_stats.successful_fetches}</div>
            <div className="stat-label">Successful</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{data.fetch_stats.failed_fetches}</div>
            <div className="stat-label">Failed</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{data.fetch_stats.total_duration_ms}ms</div>
            <div className="stat-label">Fetch Time</div>
          </div>
        </div>
      </div>

      <div className="metrics-grid">
        {sortedMetrics.map(([key, metric]) => (
          <div key={key} className="metric-card">
            <div className="metric-header">
              <div className="metric-title">{metric.name}</div>
              <div className={`metric-priority priority-${metric.priority}`}>
                {metric.priority}
              </div>
            </div>

            <div style={{ fontSize: '0.9rem', color: '#a0a0a0', marginBottom: '16px' }}>
              {metric.description}
            </div>

            {metric.success ? (
              <ul className="crypto-list">
                {metric.top_3_preview.map((crypto, index) => (
                  <li key={index} className="crypto-item">
                    <div>
                      <span className="crypto-name">{crypto.name}</span>
                      <span className="crypto-symbol">({crypto.symbol})</span>
                    </div>
                    <div className="crypto-value">{crypto.value}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>
                ❌ {metric.error || 'Failed to load'}
              </div>
            )}

            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '12px' }}>
              {metric.success ? `${metric.data_count} items • ${metric.fetch_time_ms}ms` : 'Data unavailable'}
            </div>
          </div>
        ))}
      </div>

      <footer style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
        <div>Built with Go + Gin + PostgreSQL + Inngest + LunarCrush API</div>
        <div style={{ fontSize: '0.8rem', marginTop: '5px' }}>
          Data updates automatically every 5 minutes
        </div>
      </footer>
    </div>
  );
}
