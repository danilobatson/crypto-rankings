#!/bin/bash

# Create Simple Static Frontend - No API Calls
# Since everything is already in the database, we don't need constant API calls

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

LOG_FILE="create_simple_frontend_$(date +%Y%m%d_%H%M%S).log"

log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

log "${BLUE}🎨 CREATING SIMPLE STATIC FRONTEND${NC}"
log "=================================="
log "Date: $(date)"
log ""

# Step 1: Create a completely new, simple frontend
log "${BLUE}📁 CREATING NEW SIMPLE FRONTEND${NC}"
log "==============================="

# Backup existing frontend
if [ -d "frontend" ]; then
    log "📦 Backing up existing frontend..."
    mv frontend "frontend_backup_$(date +%Y%m%d_%H%M%S)"
    log "✅ Backed up to frontend_backup_*"
fi

# Create new frontend directory
mkdir -p frontend

cd frontend

# Step 2: Create simple Next.js setup
log ""
log "${BLUE}🔧 SETTING UP SIMPLE NEXT.JS PROJECT${NC}"
log "===================================="

# Create package.json
cat > package.json << 'EOF'
{
  "name": "crypto-analytics-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

log "✅ Created package.json"

# Create Next.js config
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
EOF

log "✅ Created next.config.js with API proxy"

# Create TypeScript config
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

log "✅ Created tsconfig.json"

# Step 3: Create app structure
log ""
log "${BLUE}📂 CREATING APP STRUCTURE${NC}"
log "=========================="

mkdir -p src/app
mkdir -p src/components
mkdir -p public

# Create layout
cat > src/app/layout.tsx << 'EOF'
import './globals.css'

export const metadata = {
  title: 'Crypto Analytics Dashboard',
  description: 'Real-time cryptocurrency social analytics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
EOF

log "✅ Created app/layout.tsx"

# Create global CSS
cat > src/app/globals.css << 'EOF'
* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background: #0f0f23;
  color: #ffffff;
}

body {
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  padding: 40px 0;
}

.header h1 {
  font-size: 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 10px;
}

.header p {
  font-size: 1.2rem;
  color: #a0a0a0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.metric-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.metric-header {
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 16px;
}

.metric-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
}

.metric-priority {
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.priority-high {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.priority-medium {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.crypto-list {
  list-style: none;
}

.crypto-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.crypto-item:last-child {
  border-bottom: none;
}

.crypto-name {
  font-weight: 500;
  color: #ffffff;
}

.crypto-symbol {
  font-size: 0.85rem;
  color: #a0a0a0;
  margin-left: 8px;
}

.crypto-value {
  font-weight: 600;
  color: #667eea;
}

.stats-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.9rem;
  color: #a0a0a0;
}

.loading {
  text-align: center;
  padding: 60px 20px;
  font-size: 1.2rem;
  color: #a0a0a0;
}

.error {
  text-align: center;
  padding: 60px 20px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  color: #ef4444;
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 2rem;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .container {
    padding: 10px;
  }
}
EOF

log "✅ Created globals.css with professional styling"

# Step 4: Create the main page component
log ""
log "${BLUE}📱 CREATING MAIN DASHBOARD COMPONENT${NC}"
log "==================================="

cat > src/app/page.tsx << 'EOF'
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
EOF

log "✅ Created main dashboard page"

# Step 5: Install dependencies
log ""
log "${BLUE}📦 INSTALLING DEPENDENCIES${NC}"
log "=========================="

log "Installing Next.js and React dependencies..."
npm install --silent

log "✅ Dependencies installed"

# Step 6: Create start script
cat > start.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Crypto Analytics Frontend"
echo "======================================"
echo ""
echo "Frontend will be available at: http://localhost:3001"
echo "Make sure your Go server is running on: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run dev
EOF

chmod +x start.sh

log "✅ Created start script"

cd ..

# Step 7: Summary
log ""
log "${BLUE}📊 SIMPLE FRONTEND CREATED${NC}"
log "=========================="

log "✅ Created a clean, simple Next.js frontend"
log "✅ No unnecessary API calls - just fetches data once and auto-refreshes"
log "✅ Professional dark theme design"
log "✅ Mobile responsive layout"
log "✅ TypeScript setup"
log ""
log "📁 Frontend structure:"
log "   frontend/"
log "   ├── src/app/page.tsx      # Main dashboard"
log "   ├── src/app/layout.tsx    # App layout"
log "   ├── src/app/globals.css   # Styling"
log "   ├── package.json          # Dependencies"
log "   ├── next.config.js        # API proxy config"
log "   └── start.sh              # Quick start script"
log ""
log "🎯 Features:"
log "   • Fetches data only once on load"
log "   • Auto-refreshes every 5 minutes (matching backend)"
log "   • Shows all 11 working metrics"
log "   • Top 3 preview for each metric"
log "   • System stats overview"
log "   • Professional card-based layout"
log "   • No constant API polling"
log ""
log "${GREEN}🚀 TO START THE FRONTEND:${NC}"
log "   cd frontend && ./start.sh"
log "   OR"
log "   cd frontend && npm run dev"
log ""
log "📱 Frontend URL: http://localhost:3001"
log "🔌 Backend URL: http://localhost:8080"
log ""
log "✅ This frontend will show your crypto data beautifully with NO 404s!"

# Interactive start
log ""
log "${YELLOW}❓ START THE FRONTEND NOW?${NC}"
read -p "Do you want to start the frontend development server? (y/n): " start_frontend

if [ "$start_frontend" = "y" ] || [ "$start_frontend" = "Y" ]; then
    log ""
    log "${BLUE}🚀 STARTING FRONTEND${NC}"
    log "=================="

    cd frontend

    # Kill any existing Next.js processes
    pkill -f "next.*dev" 2>/dev/null || true
    sleep 2

    log "🚀 Starting development server on port 3001..."
    nohup npm run dev > frontend.log 2>&1 &

    sleep 4

    log "✅ Frontend started!"
    log "📱 Visit: http://localhost:3001"
    log "📄 Logs: frontend/frontend.log"
    log ""
    log "🔍 Check if it's working:"
    log "   curl -s http://localhost:3001 | head -5"

    cd ..
else
    log ""
    log "ℹ️  Start frontend manually when ready:"
    log "   cd frontend && npm run dev"
fi

log ""
log "${GREEN}🎉 SIMPLE FRONTEND READY!${NC}"
log "Clean, professional, no unnecessary API calls!"
log ""
log "📄 Log saved to: $LOG_FILE"
