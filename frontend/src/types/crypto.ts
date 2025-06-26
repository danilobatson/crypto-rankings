export interface CryptoData {
  coin: string;
  value: string;
  original_field?: string; // The original field name from API
}

export interface MCPResponse {
  message: string;
  mcp_status: {
    api_key_configured: boolean;
    source: string;
    fetched_at: string;
  };
  markdown_table: string;
  parsed_data: CryptoData[];
  table_info: {
    total_rows: number;
    sort_by: string;
    limit: number;
  };
}

export interface ApiResponse {
  success: boolean;
  data: CryptoData[];
  error?: string;
}

export type SortOption = 'alt_rank' | 'galaxy_score' | 'sentiment' | 'social_dominance' | 'market_cap';

export const SORT_OPTIONS: { value: SortOption; label: string; description: string }[] = [
  { value: 'alt_rank', label: 'AltRank™', description: 'Overall performance ranking' },
  { value: 'galaxy_score', label: 'Galaxy Score™', description: 'Social + technical indicators' },
  { value: 'sentiment', label: 'Sentiment', description: 'Social sentiment percentage' },
  { value: 'social_dominance', label: 'Social Dominance', description: 'Share of social volume' },
  { value: 'market_cap', label: 'Market Cap', description: 'Market capitalization ranking' },
];
