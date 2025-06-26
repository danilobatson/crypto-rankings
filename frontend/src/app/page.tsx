'use client';

import CryptoDashboard from "@/components/CryptoDashboard";
import { useState, useEffect } from 'react';

interface APIResponse {
  message: string;
  event_id: string;
  sort: string;
  limit: number;
  cors: string;
}

interface CryptoData {
  name: string;
  symbol: string;
  value: string;
  sort: string;
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<APIResponse | null>(null);
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState('market_cap');
  const [limit, setLimit] = useState(10);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    setCryptoData([]);
    setProcessingStatus('Triggering Inngest function...');

    try {
      const response = await fetch(
        `http://localhost:8080/list/cryptocurrencies/${sort}/${limit}?key=demo`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      setProcessingStatus('Inngest function triggered! Processing crypto data...');

      // Start polling for results
      if (result.event_id) {
        pollForResults(result.event_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
      setProcessingStatus('');
    }
  };

  const pollForResults = async (eventId: string) => {
    // Poll for results every 2 seconds for up to 30 seconds
    let attempts = 0;
    const maxAttempts = 15;

    const poll = async () => {
      attempts++;
      setProcessingStatus(`Processing... (${attempts}/${maxAttempts})`);

      try {
        // Try to get results from Inngest
        const resultResponse = await fetch(
          `http://localhost:8080/results/${eventId}`
        );

        if (resultResponse.ok) {
          const resultData = await resultResponse.json();
          if (resultData.data && resultData.data.length > 0) {
            setCryptoData(resultData.data);
            setLoading(false);
            setProcessingStatus('✅ Data loaded successfully!');
            return;
          }
        }

        // If no results yet and we haven't exceeded max attempts, try again
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          // Max attempts reached, show demo data
          setProcessingStatus('⏱️ Processing taking longer than expected. Showing demo data...');
          showDemoData();
        }
      } catch (pollError) {
        console.log('Polling error:', pollError);
        // If polling fails, show demo data after a few attempts
        if (attempts < 5) {
          setTimeout(poll, 2000);
        } else {
          showDemoData();
        }
      }
    };

    // Start polling after 2 seconds
    setTimeout(poll, 2000);
  };

  const showDemoData = () => {
    // Generate demo data based on the selected sort method
    const demoData: CryptoData[] = [];
    const cryptoNames = [
      { name: 'Bitcoin', symbol: 'BTC' },
      { name: 'Ethereum', symbol: 'ETH' },
      { name: 'Tether', symbol: 'USDT' },
      { name: 'Solana', symbol: 'SOL' },
      { name: 'Cardano', symbol: 'ADA' },
      { name: 'Chainlink', symbol: 'LINK' },
      { name: 'Polygon', symbol: 'MATIC' },
      { name: 'Avalanche', symbol: 'AVAX' },
      { name: 'Polkadot', symbol: 'DOT' },
      { name: 'Shiba Inu', symbol: 'SHIB' }
    ];

    for (let i = 0; i < Math.min(limit, cryptoNames.length); i++) {
      const crypto = cryptoNames[i];
      let value = '';

      switch (sort) {
        case 'market_cap':
          value = `$${(Math.random() * 1000000000000).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
          break;
        case 'price':
          value = `$${(Math.random() * 100000).toFixed(2)}`;
          break;
        case 'volume_24h':
          value = `$${(Math.random() * 50000000000).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
          break;
        case 'sentiment':
          value = `${(Math.random() * 100).toFixed(1)}%`;
          break;
        case 'alt_rank':
          value = `${i + 1}`;
          break;
        case 'galaxy_score':
          value = `${(Math.random() * 100).toFixed(1)}`;
          break;
        default:
          value = `${(Math.random() * 1000).toFixed(2)}`;
      }

      demoData.push({
        name: crypto.name,
        symbol: crypto.symbol,
        value: value,
        sort: sort
      });
    }

    setCryptoData(demoData);
    setLoading(false);
    setProcessingStatus('📊 Demo data displayed (Inngest processing may still be running)');
  };

  const getSortLabel = (sortType: string) => {
    const labels: { [key: string]: string } = {
      'market_cap': 'Market Cap',
      'price': 'Price',
      'volume_24h': '24h Volume',
      'sentiment': 'Sentiment',
      'alt_rank': 'AltRank',
      'galaxy_score': 'Galaxy Score'
    };
    return labels[sortType] || sortType;
  };

  return <CryptoDashboard />;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🚀 Crypto Rankings Dashboard</h1>

        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">API Controls</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sort Method:</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full p-2 border rounded-md"
                disabled={loading}
              >
                <option value="market_cap">Market Cap</option>
                <option value="price">Price</option>
                <option value="volume_24h">24h Volume</option>
                <option value="sentiment">Sentiment</option>
                <option value="alt_rank">AltRank</option>
                <option value="galaxy_score">Galaxy Score</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Limit:</label>
              <input
                type="number"
                min="1"
                max="100"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="w-full p-2 border rounded-md"
                disabled={loading}
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchData}
                disabled={loading}
                className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
              >
                {loading ? 'Processing...' : 'Fetch Rankings'}
              </button>
            </div>
          </div>

          {processingStatus && (
            <div className="text-sm text-blue-600 mb-2">
              <strong>Status:</strong> {processingStatus}
            </div>
          )}

          <div className="text-sm text-gray-600">
            <strong>Backend:</strong> http://localhost:8080 | <strong>Inngest:</strong> Background processing
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600 mr-3"></div>
              <span className="text-yellow-800">Processing with Inngest background jobs...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
            <h3 className="text-red-800 font-semibold">❌ Error</h3>
            <p className="text-red-700">{error}</p>
            <div className="mt-2 text-sm text-red-600">
              <strong>Troubleshooting:</strong>
              <ul className="list-disc list-inside mt-1">
                <li>Make sure backend is running: <code>cd server && go run main.go</code></li>
                <li>Make sure Inngest dev server is running</li>
                <li>Check that port 8080 is accessible</li>
              </ul>
            </div>
          </div>
        )}

        {/* API Response Info */}
        {data && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
            <h3 className="text-green-800 font-semibold">✅ Inngest Function Triggered</h3>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><strong>Event ID:</strong> <code className="bg-gray-100 px-1 rounded">{data.event_id}</code></div>
              <div><strong>Sort Method:</strong> {getSortLabel(data.sort)}</div>
              <div><strong>Requested Limit:</strong> {data.limit}</div>
              <div><strong>Status:</strong> Background processing</div>
            </div>
          </div>
        )}

        {/* Crypto Data Table */}
        {cryptoData.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">📊 Crypto Rankings - {getSortLabel(sort)}</h3>
              <p className="text-sm text-gray-600">Showing top {cryptoData.length} cryptocurrencies</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cryptocurrency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {getSortLabel(sort)}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cryptoData.map((crypto, index) => (
                    <tr key={crypto.symbol} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{crypto.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {crypto.symbol}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {crypto.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Debug Section */}
        {data && (
          <div className="mt-8 bg-gray-50 border p-4 rounded-lg">
            <details>
              <summary className="font-semibold mb-2 cursor-pointer">🐛 Debug Information</summary>
              <div className="mt-2">
                <h4 className="font-medium mb-2">API Response:</h4>
                <pre className="bg-black text-green-400 p-4 rounded-md overflow-auto text-sm">
                  {JSON.stringify(data, null, 2)}
                </pre>

                {cryptoData.length > 0 && (
                  <>
                    <h4 className="font-medium mb-2 mt-4">Crypto Data:</h4>
                    <pre className="bg-black text-green-400 p-4 rounded-md overflow-auto text-sm">
                      {JSON.stringify(cryptoData.slice(0, 3), null, 2)}
                    </pre>
                  </>
                )}
              </div>
            </details>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="text-blue-800 font-semibold">💡 How This Works</h3>
          <div className="text-blue-700 text-sm mt-1 space-y-1">
            <p><strong>1. Trigger:</strong> Frontend calls your Go backend API</p>
            <p><strong>2. Process:</strong> Backend triggers Inngest function for background processing</p>
            <p><strong>3. Response:</strong> You get immediate confirmation with Event ID</p>
            <p><strong>4. Results:</strong> Frontend polls for results or shows demo data</p>
            <p><strong>Note:</strong> This demonstrates async processing patterns used in production systems</p>
          </div>
        </div>
      </div>
    </div>
  );
}
