import React, { useState, useEffect } from 'react';
import './CryptoDashboard.css';

const CryptoDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://localhost:8080/api/crypto/data');

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No crypto data available yet. Data updates every 5 minutes.');
        }
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      setLastRefresh(new Date());

    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const triggerManualFetch = async () => {
    try {
      const response = await fetch('http://localhost:8080/dev/trigger', { method: 'POST' });
      if (response.ok) {
        alert('Manual fetch triggered! Data will update in ~30 seconds.');
        setTimeout(fetchData, 30000);
      }
    } catch (err) {
      console.error('Failed to trigger manual fetch:', err);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleCard = (metricKey) => {
    setExpandedCards(prev => ({
      ...prev,
      [metricKey]: !prev[metricKey]
    }));
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#3b82f6';
      case 'medium': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  if (loading && !data) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading crypto metrics...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <h2>⚠️ Unable to Load Data</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={fetchData} className="btn-primary">
              Retry
            </button>
            <button onClick={triggerManualFetch} className="btn-secondary">
              Trigger Manual Fetch
            </button>
          </div>
        </div>
      </div>
    );
  }

  const metrics = data?.all_metrics || {};
  const metricKeys = Object.keys(metrics);

  // Sort metrics by priority
  const sortedMetricKeys = metricKeys.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = priorityOrder[metrics[a].priority] || 3;
    const bPriority = priorityOrder[metrics[b].priority] || 3;
    return aPriority - bPriority;
  });

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🚀 Crypto Analytics Dashboard</h1>
          <p>Real-time social sentiment and market data powered by LunarCrush</p>
        </div>

        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-label">Metrics</span>
            <span className="stat-value">{data?.total_metrics || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Success</span>
            <span className="stat-value">{data?.fetch_stats?.successful_fetches || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Failed</span>
            <span className="stat-value">{data?.fetch_stats?.failed_fetches || 0}</span>
          </div>
        </div>

        <div className="header-controls">
          <button onClick={fetchData} className="btn-primary" disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={triggerManualFetch} className="btn-secondary">
            Manual Fetch
          </button>
        </div>
      </header>

      {/* Last Update Info */}
      <div className="update-info">
        <p>
          <strong>Last Updated:</strong> {data ? formatTimestamp(data.timestamp) : 'Never'}
          <span className="refresh-time">(Refreshed: {lastRefresh.toLocaleTimeString()})</span>
        </p>
        <p>
          <strong>Fetch Duration:</strong> {data?.fetch_stats?.total_duration_ms || 0}ms
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        {sortedMetricKeys.map((metricKey) => {
          const metric = metrics[metricKey];
          const isExpanded = expandedCards[metricKey];
          const displayData = isExpanded ? metric.all_data : metric.top_3_preview;

          return (
            <div
              key={metricKey}
              className={`metric-card ${metric.success ? 'success' : 'error'}`}
              style={{ borderLeftColor: getPriorityColor(metric.priority) }}
            >
              {/* Card Header */}
              <div className="card-header">
                <div className="card-title">
                  <h3>{metric.name}</h3>
                  <span className={`priority-badge priority-${metric.priority}`}>
                    {metric.priority}
                  </span>
                </div>
                <p className="card-description">{metric.description}</p>
              </div>

              {/* Card Status */}
              <div className="card-status">
                {metric.success ? (
                  <div className="status-success">
                    ✅ {metric.data_count} items • {metric.fetch_time_ms}ms
                  </div>
                ) : (
                  <div className="status-error">
                    ❌ {metric.error || 'Failed to fetch'}
                  </div>
                )}
              </div>

              {/* Card Content */}
              {metric.success && (
                <>
                  <div className="card-content">
                    {displayData?.map((crypto, index) => (
                      <div key={`${crypto.symbol}-${index}`} className="crypto-item">
                        <div className="crypto-rank">#{index + 1}</div>
                        <div className="crypto-info">
                          <span className="crypto-name">{crypto.name}</span>
                          <span className="crypto-symbol">{crypto.symbol}</span>
                        </div>
                        <div className="crypto-value">{crypto.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Toggle Button */}
                  <div className="card-footer">
                    <button
                      onClick={() => toggleCard(metricKey)}
                      className="toggle-btn"
                    >
                      {isExpanded ?
                        `Show Top 3 ↑` :
                        `Show All ${metric.data_count} ↓`
                      }
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* No Data Message */}
      {metricKeys.length === 0 && (
        <div className="no-data-message">
          <h2>📊 No Metrics Data Available</h2>
          <p>Click "Manual Fetch" to trigger data collection, or wait for the next scheduled update.</p>
          <button onClick={triggerManualFetch} className="btn-primary">
            Trigger Manual Fetch
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>
          Powered by <strong>LunarCrush API</strong> •
          Updates every 5 minutes •
          {data?.total_metrics || 0} metrics tracked
        </p>
      </footer>
    </div>
  );
};

export default CryptoDashboard;
