import type { CryptoData, MCPResponse, SortOption } from '@/types/crypto';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function fetchCryptoData(sort: SortOption, limit: number): Promise<CryptoData[]> {
  try {
    const url = `${API_BASE_URL}/api/v1/mcp/fetch?sort=${sort}&limit=${limit}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: MCPResponse = await response.json();
    console.log('API Response:', data);

    if (!data.parsed_data || !Array.isArray(data.parsed_data)) {
      throw new Error('Invalid data format received from API');
    }

    return data.parsed_data;
  } catch (error) {
    console.error('Failed to fetch crypto data:', error);
    throw error;
  }
}

export function formatValue(value: string, sortType: SortOption): string {
  if (!value || value === '' || value === '—') return '—';

  // For ranking values (AltRank, Galaxy Score), add appropriate formatting
  switch (sortType) {
    case 'alt_rank':
      return `#${value}`;
    case 'galaxy_score':
      return value;
    case 'sentiment':
      // If it's a percentage, ensure it has %
      if (!isNaN(Number(value)) && !value.includes('%')) {
        return `${value}%`;
      }
      return value;
    case 'social_dominance':
      // If it's a percentage, ensure it has %
      if (!isNaN(Number(value)) && !value.includes('%')) {
        return `${value}%`;
      }
      return value;
    case 'market_cap':
      // For market cap, format as currency if it's a number
      if (!isNaN(Number(value))) {
        return `$${Number(value).toLocaleString()}`;
      }
      return value;
    default:
      return value;
  }
}
