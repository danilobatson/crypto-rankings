package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/inngest/inngestgo"
	"github.com/inngest/inngestgo/step"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
)

// Redis client
var rdb *redis.Client

// CryptoData represents a single cryptocurrency entry
type CryptoData struct {
	Name   string `json:"name"`
	Symbol string `json:"symbol"`
	Value  string `json:"value"`
	Sort   string `json:"sort"`
}

//  Single unified data structure for frontend
type CryptoDataResponse struct {
	Timestamp    time.Time                    `json:"timestamp"`
	TotalMetrics int                          `json:"total_metrics"`
	AllMetrics   map[string]MetricData        `json:"all_metrics"`
	FetchStats   FetchStats                   `json:"fetch_stats"`
}

type MetricData struct {
	Name         string       `json:"name"`
	Priority     string       `json:"priority"`
	Description  string       `json:"description"`
	Success      bool         `json:"success"`
	DataCount    int          `json:"data_count"`
	AllData      []CryptoData `json:"all_data"`      // All 10 items
	Top3Preview  []CryptoData `json:"top_3_preview"` // Top 3 for quick display
	FetchTimeMs  int64        `json:"fetch_time_ms"`
	Error        string       `json:"error,omitempty"`
}

type FetchStats struct {
	TotalDurationMs   int64 `json:"total_duration_ms"`
	SuccessfulFetches int   `json:"successful_fetches"`
	FailedFetches     int   `json:"failed_fetches"`
	LastUpdate        string `json:"last_update"`
}

// LunarCrushCoin represents the structure of LunarCrush API response
type LunarCrushResponse struct {
	Data []LunarCrushCoin `json:"data"`
}

// CLEANED: LunarCrushCoin struct with only working fields
type LunarCrushCoin struct {
	ID               int     `json:"id"`
	Symbol           string  `json:"symbol"`
	Name             string  `json:"name"`
	Price            float64 `json:"price"`
	MarketCap        float64 `json:"market_cap"`
	Volume24h        float64 `json:"volume_24h"`
	PercentChange1h  float64 `json:"percent_change_1h"`
	PercentChange24h float64 `json:"percent_change_24h"`
	PercentChange7d  float64 `json:"percent_change_7d"`
	AltRank          int     `json:"alt_rank"`

	// Working social metrics only
	Interactions24h     *float64 `json:"interactions_24h,omitempty"`
	SocialDominance     *float64 `json:"social_dominance,omitempty"`

	// Working supply metrics
	CirculatingSupply   *float64 `json:"circulating_supply,omitempty"`
	MarketDominance     *float64 `json:"market_dominance,omitempty"`
}

type MetricConfig struct {
	Name        string `json:"name"`
	Priority    string `json:"priority"`
	Description string `json:"description"`
}

var AllSortableMetrics = map[string]MetricConfig{
	// HIGH PRIORITY METRICS (Core working metrics)
	"market_cap":         {Name: "Market Cap", Priority: "high", Description: "Market Capitalization"},
	"alt_rank":           {Name: "AltRank™", Priority: "high", Description: "Proprietary Performance Ranking"},
	"price":              {Name: "Price", Priority: "high", Description: "Current USD Price"},
	"volume_24h":         {Name: "24h Volume", Priority: "high", Description: "24 Hour Trading Volume"},
	"interactions":       {Name: "Social Interactions", Priority: "high", Description: "Social Engagements"},
	"percent_change_1h":  {Name: "1h Change", Priority: "high", Description: "1 Hour Price Change"},
	"percent_change_24h": {Name: "24h Change", Priority: "high", Description: "24 Hour Price Change"},
	"percent_change_7d":  {Name: "7d Change", Priority: "high", Description: "7 Day Price Change"},

	// MEDIUM PRIORITY METRICS (Working social & supply metrics)
	"social_dominance":    {Name: "Social Dominance", Priority: "medium", Description: "Social Volume Percentage"},
	"circulating_supply":  {Name: "Circulating Supply", Priority: "medium", Description: "Circulating Token Supply"},
	"market_dominance":    {Name: "Market Dominance", Priority: "medium", Description: "Market Cap Percentage"},
}

// Helper functions
func formatValue(value float64, sort string) string {
	switch sort {
	case "market_cap", "volume_24h":
		return fmt.Sprintf("$%s", formatLargeNumber(int64(value)))
	case "price":
		return fmt.Sprintf("$%.2f", value)
	case "alt_rank":
		return fmt.Sprintf("%d", int(value))
	case "percent_change_24h", "percent_change_1h", "percent_change_7d":
		return fmt.Sprintf("%.2f%%", value)
	}
	return fmt.Sprintf("%.2f", value)
}

//  formatLargeNumber with better handling
func formatLargeNumber(n int64) string {
	// Handle negative numbers
	if n < 0 {
		return fmt.Sprintf("-%s", formatLargeNumber(-n))
	}

	// Handle extremely large numbers
	if n >= 9223372036854775807 {
		return "999.99T+"
	}

	if n >= 1000000000000000 { // 1 quadrillion
		return fmt.Sprintf("%.1fQ", float64(n)/1000000000000000)
	} else if n >= 1000000000000 { // 1 trillion
		return fmt.Sprintf("%.1fT", float64(n)/1000000000000)
	} else if n >= 1000000000 { // 1 billion
		return fmt.Sprintf("%.1fB", float64(n)/1000000000)
	} else if n >= 1000000 { // 1 million
		return fmt.Sprintf("%.1fM", float64(n)/1000000)
	} else if n >= 1000 { // 1 thousand
		return fmt.Sprintf("%.1fK", float64(n)/1000)
	}
	return fmt.Sprintf("%d", n)
}

// formatSupplyNumber for extremely large circulating supplies
func formatSupplyNumber(n float64) string {
	if n < 0 {
		return "0"
	}

	if n >= 1e23 { // 100 sextillion
		return fmt.Sprintf("%.1fSx", n/1e21)
	} else if n >= 1e20 { // 100 quintillion
		return fmt.Sprintf("%.1fQt", n/1e18)
	} else if n >= 1e17 { // 100 quadrillion
		return fmt.Sprintf("%.1fQd", n/1e15)
	} else if n >= 1e14 { // 100 trillion
		return fmt.Sprintf("%.1fT", n/1e12)
	} else if n >= 1e11 { // 100 billion
		return fmt.Sprintf("%.1fB", n/1e9)
	} else if n >= 1e8 { // 100 million
		return fmt.Sprintf("%.1fM", n/1e6)
	} else if n >= 1e5 { // 100 thousand
		return fmt.Sprintf("%.1fK", n/1e3)
	}
	return fmt.Sprintf("%.0f", n)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func formatValueForMetric(coin LunarCrushCoin, sortType string) string {
	switch sortType {
	case "market_cap":
		return formatValue(coin.MarketCap, sortType)
	case "price":
		return formatValue(coin.Price, sortType)
	case "volume_24h":
		return formatValue(coin.Volume24h, sortType)
	case "percent_change_1h":
		return formatValue(coin.PercentChange1h, sortType)
	case "percent_change_24h":
		return formatValue(coin.PercentChange24h, sortType)
	case "percent_change_7d":
		return formatValue(coin.PercentChange7d, sortType)
	case "alt_rank":
		return formatValue(float64(coin.AltRank), sortType)
	case "interactions":
		if coin.Interactions24h != nil {
			return formatLargeNumber(int64(*coin.Interactions24h))
		}
		return "0"
	case "social_dominance":
		if coin.SocialDominance != nil {
			return fmt.Sprintf("%.2f%%", *coin.SocialDominance)
		}
		return "0%"
	case "circulating_supply":
		if coin.CirculatingSupply != nil {
			supply := *coin.CirculatingSupply
			if supply <= 0 {
				return "0"
			}
			return formatSupplyNumber(supply)
		}
		return "0"
	case "market_dominance":
		if coin.MarketDominance != nil {
			return fmt.Sprintf("%.2f%%", *coin.MarketDominance)
		}
		return "0%"
	default:
		return formatValue(coin.Price, "price")
	}
}

// Single function to fetch one metric
func fetchSingleMetric(apiKey, sortType string, limit int) MetricData {
	startTime := time.Now()

	config, exists := AllSortableMetrics[sortType]
	if !exists {
		return MetricData{
			Name:        sortType,
			Priority:    "unknown",
			Description: "Unknown metric",
			Success:     false,
			Error:       fmt.Sprintf("Unknown sort type: %s", sortType),
		}
	}

	result := MetricData{
		Name:        config.Name,
		Priority:    config.Priority,
		Description: config.Description,
		Success:     false,
		AllData:     []CryptoData{},
		Top3Preview: []CryptoData{},
	}

	url := fmt.Sprintf("https://lunarcrush.com/api4/public/coins/list/v2?sort=%s&limit=%d", sortType, limit)
	log.Printf("🌐 Fetching %s (%s): %s", config.Name, config.Priority, url)

	client := &http.Client{Timeout: 30 * time.Second}
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to create request: %v", err)
		result.FetchTimeMs = time.Since(startTime).Milliseconds()
		return result
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to fetch data: %v", err)
		result.FetchTimeMs = time.Since(startTime).Milliseconds()
		return result
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to read response: %v", err)
		result.FetchTimeMs = time.Since(startTime).Milliseconds()
		return result
	}

	result.FetchTimeMs = time.Since(startTime).Milliseconds()

	if resp.StatusCode != 200 {
		result.Error = fmt.Sprintf("API returned status %d: %s", resp.StatusCode, string(body[:min(200, len(body))]))
		return result
	}

	var response LunarCrushResponse
	err = json.Unmarshal(body, &response)
	if err != nil {
		result.Error = fmt.Sprintf("Failed to parse JSON: %v", err)
		return result
	}

	if len(response.Data) == 0 {
		result.Error = "No data returned from API"
		return result
	}

	// Process ALL data
	var allCryptoData []CryptoData
	var top3Preview []CryptoData

	for i, coin := range response.Data {
		value := formatValueForMetric(coin, sortType)

		crypto := CryptoData{
			Name:   coin.Name,
			Symbol: coin.Symbol,
			Value:  value,
			Sort:   sortType,
		}

		// Add to full data
		allCryptoData = append(allCryptoData, crypto)

		// Also add to top 3 preview
		if i < 3 {
			top3Preview = append(top3Preview, crypto)
		}
	}

	result.Success = true
	result.DataCount = len(response.Data)
	result.AllData = allCryptoData
	result.Top3Preview = top3Preview

	log.Printf("✅ %s (%s) completed: %d items in %dms",
		config.Name, config.Priority, result.DataCount, result.FetchTimeMs)
	return result
}

// Redis functions
func initRedis() {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "redis://localhost:6379"
	}

	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Printf("⚠️  Invalid Redis URL, using defaults: %v", err)
		rdb = redis.NewClient(&redis.Options{
			Addr: "localhost:6379",
			DB:   0,
		})
	} else {
		rdb = redis.NewClient(opt)
	}

	ctx := context.Background()
	_, err = rdb.Ping(ctx).Result()
	if err != nil {
		log.Printf("⚠️  Redis connection failed: %v", err)
		rdb = nil
	} else {
		log.Printf("✅ Redis connected successfully")
	}
}

//  Single function to store latest data
func storeLatestDataInRedis(data CryptoDataResponse) {
	if rdb == nil {
		log.Printf("⚠️  Redis not available, skipping storage")
		return
	}

	ctx := context.Background()
	jsonData, err := json.Marshal(data)
	if err != nil {
		log.Printf("❌ Failed to marshal result: %v", err)
		return
	}

	// ALWAYS use the same key
	key := "crypto:latest"
	err = rdb.Set(ctx, key, jsonData, 15*time.Minute).Err()
	if err != nil {
		log.Printf("❌ Failed to store in Redis: %v", err)
	} else {
		log.Printf("✅ Stored latest crypto data: %d successful, %d failed metrics",
			data.FetchStats.SuccessfulFetches, data.FetchStats.FailedFetches)
	}
}

// Get latest data from Redis
func getLatestDataFromRedis() (CryptoDataResponse, bool) {
	if rdb == nil {
		return CryptoDataResponse{}, false
	}

	ctx := context.Background()
	key := "crypto:latest"
	data, err := rdb.Get(ctx, key).Result()
	if err != nil {
		return CryptoDataResponse{}, false
	}

	var result CryptoDataResponse
	err = json.Unmarshal([]byte(data), &result)
	if err != nil {
		log.Printf("❌ Failed to unmarshal result: %v", err)
		return CryptoDataResponse{}, false
	}

	return result, true
}

//  Single Inngest function that fetches all 11 working metrics
func createUnifiedCryptoFunction(client inngestgo.Client, apiKey string) (inngestgo.ServableFunction, error) {
	return inngestgo.CreateFunction(
		client,
		inngestgo.FunctionOpts{
			ID: "fetch-all-crypto-metrics",
		},
		inngestgo.CronTrigger("*/5 * * * *"), // Every 5 minutes
		func(ctx context.Context, input inngestgo.Input[map[string]interface{}]) (any, error) {
			log.Printf("🚀 Fetching ALL 11 working crypto metrics (cleaned function)")

			startTime := time.Now()

			// Get all metric names
			allMetrics := []string{}
			for sortType := range AllSortableMetrics {
				allMetrics = append(allMetrics, sortType)
			}

			// Fetch all metrics in parallel
			allResults, err := step.Run(ctx, "fetch-all-metrics", func(ctx context.Context) (CryptoDataResponse, error) {
				var wg sync.WaitGroup
				results := make(map[string]MetricData)
				resultsMutex := &sync.Mutex{}

				// Process in batches of 5 to avoid API rate limits
				batchSize := 5
				for i := 0; i < len(allMetrics); i += batchSize {
					end := i + batchSize
					if end > len(allMetrics) {
						end = len(allMetrics)
					}

					batch := allMetrics[i:end]

					for _, sortType := range batch {
						wg.Add(1)
						go func(st string) {
							defer wg.Done()
							result := fetchSingleMetric(apiKey, st, 10)

							resultsMutex.Lock()
							results[st] = result
							resultsMutex.Unlock()
						}(sortType)
					}

					wg.Wait()

					// Small delay between batches
					if end < len(allMetrics) {
						time.Sleep(1 * time.Second)
					}
				}

				// Count successes and failures
				successful := 0
				failed := 0
				for _, result := range results {
					if result.Success {
						successful++
					} else {
						failed++
					}
				}

				return CryptoDataResponse{
					Timestamp:    time.Now(),
					TotalMetrics: len(AllSortableMetrics),
					AllMetrics:   results,
					FetchStats: FetchStats{
						TotalDurationMs:   time.Since(startTime).Milliseconds(),
						SuccessfulFetches: successful,
						FailedFetches:     failed,
						LastUpdate:       time.Now().Format("2006-01-02 15:04:05"),
					},
				}, nil
			})

			if err != nil {
				return nil, err
			}

			// Store in Redis
			_, err = step.Run(ctx, "store-latest", func(ctx context.Context) (string, error) {
				storeLatestDataInRedis(allResults)
				return "stored", nil
			})

			if err != nil {
				return nil, err
			}

			return map[string]interface{}{
				"total_metrics":      len(allMetrics),
				"successful_fetches": allResults.FetchStats.SuccessfulFetches,
				"failed_fetches":     allResults.FetchStats.FailedFetches,
				"total_duration_ms":  allResults.FetchStats.TotalDurationMs,
				"status":            "completed",
				"stored_in_redis":   "crypto:latest",
			}, nil
		},
	)
}

// MANUAL TRIGGER: For dev testing
func createManualTriggerFunction(client inngestgo.Client, apiKey string) (inngestgo.ServableFunction, error) {
	return inngestgo.CreateFunction(
		client,
		inngestgo.FunctionOpts{
			ID: "manual-crypto-trigger",
		},
		inngestgo.EventTrigger("crypto/manual", nil),
		func(ctx context.Context, input inngestgo.Input[map[string]interface{}]) (any, error) {
			log.Printf("🧪 MANUAL crypto fetch triggered")

			startTime := time.Now()

			// Get all metric names
			allMetrics := []string{}
			for sortType := range AllSortableMetrics {
				allMetrics = append(allMetrics, sortType)
			}

			// Same logic as unified function
			allResults, err := step.Run(ctx, "manual-fetch-all", func(ctx context.Context) (CryptoDataResponse, error) {
				var wg sync.WaitGroup
				results := make(map[string]MetricData)
				resultsMutex := &sync.Mutex{}

				batchSize := 5
				for i := 0; i < len(allMetrics); i += batchSize {
					end := i + batchSize
					if end > len(allMetrics) {
						end = len(allMetrics)
					}

					batch := allMetrics[i:end]

					for _, sortType := range batch {
						wg.Add(1)
						go func(st string) {
							defer wg.Done()
							result := fetchSingleMetric(apiKey, st, 10)

							resultsMutex.Lock()
							results[st] = result
							resultsMutex.Unlock()
						}(sortType)
					}

					wg.Wait()

					if end < len(allMetrics) {
						time.Sleep(1 * time.Second)
					}
				}

				successful := 0
				failed := 0
				for _, result := range results {
					if result.Success {
						successful++
					} else {
						failed++
					}
				}

				return CryptoDataResponse{
					Timestamp:    time.Now(),
					TotalMetrics: len(AllSortableMetrics),
					AllMetrics:   results,
					FetchStats: FetchStats{
						TotalDurationMs:   time.Since(startTime).Milliseconds(),
						SuccessfulFetches: successful,
						FailedFetches:     failed,
						LastUpdate:       time.Now().Format("2006-01-02 15:04:05"),
					},
				}, nil
			})

			if err != nil {
				return nil, err
			}

			_, err = step.Run(ctx, "manual-store", func(ctx context.Context) (string, error) {
				storeLatestDataInRedis(allResults)
				return "stored", nil
			})

			if err != nil {
				return nil, err
			}

			return map[string]interface{}{
				"trigger":            "manual",
				"total_metrics":      len(allMetrics),
				"successful_fetches": allResults.FetchStats.SuccessfulFetches,
				"failed_fetches":     allResults.FetchStats.FailedFetches,
				"total_duration_ms":  allResults.FetchStats.TotalDurationMs,
				"status":            "completed",
			}, nil
		},
	)
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Printf("Warning: No .env file found: %v", err)
	}

	apiKey := os.Getenv("LUNARCRUSH_API_KEY")
	if apiKey == "" {
		log.Fatal("LUNARCRUSH_API_KEY environment variable is required")
	}

	log.Printf("✅ API Key loaded")

	initRedis()

	// Create Inngest client
	inngestClient, err := inngestgo.NewClient(inngestgo.ClientOpts{
		AppID: "crypto-simple",
	})
	if err != nil {
		log.Fatal("Failed to create Inngest client:", err)
	}

	// Create the SINGLE unified function
	unifiedFunction, err := createUnifiedCryptoFunction(inngestClient, apiKey)
	if err != nil {
		log.Fatal("Failed to create unified function:", err)
	}

	// Create manual trigger for dev testing
	manualFunction, err := createManualTriggerFunction(inngestClient, apiKey)
	if err != nil {
		log.Fatal("Failed to create manual function:", err)
	}

	log.Printf("✅ CLEANED Inngest functions created:")
	log.Printf("   1. Unified function (every 5 min): %s", unifiedFunction.Name())
	log.Printf("   2. Manual trigger (dev only): %s", manualFunction.Name())

	// Initialize Gin
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:3000",
			"http://localhost:3001",
			// Add your specific Vercel domain
			"https://crypto-rankings-2vobnla22-danilobatsons-projects.vercel.app",
			// Add the production domain (when you get a custom domain)
			"https://crypto-rankings.vercel.app",
			// Wildcard for Vercel preview deployments (optional)
			"https://crypto-rankings-*.vercel.app",
	},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Accept"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":        "healthy",
			"service":       "crypto-simple-api",
			"version":       "5.0.0",
			"architecture":  "simplified",
			"functions":     2,
			"metrics":       len(AllSortableMetrics),
			"update_freq":   "Every 5 minutes",
			"redis_key":     "crypto:latest",
			"removed":       "contributors_active, galaxy_score, posts_active, sentiment, topic_rank",
			"working":       "11 stable metrics only",
		})
	})

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "healthy",
			"redis":  rdb != nil,
		})
	})

	// MAIN FRONTEND ENDPOINT: Single endpoint for all crypto data
	r.GET("/api/crypto/data", func(c *gin.Context) {
		data, exists := getLatestDataFromRedis()
		if !exists {
			c.JSON(404, gin.H{
				"error": "No crypto data available yet",
				"message": "Data is updated every 5 minutes",
				"manual_trigger": "POST /dev/trigger",
			})
			return
		}

		c.JSON(200, data)
	})

	// Single metrics info endpoint
	r.GET("/api/crypto/info", func(c *gin.Context) {
		highPriority := []string{}
		mediumPriority := []string{}

		for k, v := range AllSortableMetrics {
			if v.Priority == "high" {
				highPriority = append(highPriority, k)
			} else if v.Priority == "medium" {
				mediumPriority = append(mediumPriority, k)
			}
		}

		c.JSON(200, gin.H{
			"metrics":         AllSortableMetrics,
			"total":           len(AllSortableMetrics),
			"high_priority":   highPriority,
			"medium_priority": mediumPriority,
			"update_schedule": "Every 5 minutes",
			"data_endpoint":   "/api/crypto/data",
			"structure": gin.H{
				"all_data":     "Full 10 items per metric",
				"top_3_preview": "Quick preview per metric",
				"fetch_stats":   "Success/failure counts and timing",
			},
			"removed_metrics": "contributors_active, galaxy_score, posts_active, sentiment, topic_rank",
			"working_metrics": 11,
		})
	})

	// DEV ONLY: Manual trigger endpoint
	r.POST("/dev/trigger", func(c *gin.Context) {
		log.Printf("🧪 DEV: Manual crypto fetch triggered via API")

		_, err := inngestClient.Send(context.Background(), map[string]interface{}{
			"name": "crypto/manual",
			"data": map[string]interface{}{
				"manual": true,
				"dev":    true,
			},
		})

		if err != nil {
			c.JSON(500, gin.H{"error": "Failed to trigger manual function"})
			return
		}

		c.JSON(200, gin.H{
			"message": "Manual crypto fetch triggered",
			"status":  "processing",
			"data_url": "/api/crypto/data",
			"wait":    "~30 seconds for completion",
			"metrics": "11 working metrics only",
		})
	})

	// Backward compatibility endpoint (simplified)
	r.GET("/list/cryptocurrencies/:sort/:limit", func(c *gin.Context) {
		sort := c.Param("sort")
		limitStr := c.Param("limit")

		validSorts := make([]string, 0, len(AllSortableMetrics))
		for sortType := range AllSortableMetrics {
			validSorts = append(validSorts, sortType)
		}

		isValidSort := false
		for _, vs := range validSorts {
			if sort == vs {
				isValidSort = true
				break
			}
		}

		if !isValidSort {
			c.JSON(400, gin.H{
				"error": "Invalid sort parameter",
				"valid": validSorts,
				"suggestion": "Use /api/crypto/data for all metrics",
			})
			return
		}

		limit, err := strconv.Atoi(limitStr)
		if err != nil || limit < 1 || limit > 100 {
			c.JSON(400, gin.H{"error": "Limit must be between 1 and 100"})
			return
		}

		// Get data from Redis
		data, exists := getLatestDataFromRedis()
		if !exists {
			c.JSON(404, gin.H{
				"error": "No data available",
				"suggestion": "Use /api/crypto/data",
			})
			return
		}

		// Return specific metric data
		if metricData, exists := data.AllMetrics[sort]; exists {
			// Limit the results
			limitedData := metricData.AllData
			if limit < len(limitedData) {
				limitedData = limitedData[:limit]
			}

			c.JSON(200, gin.H{
				"message":   "Crypto data from unified API",
				"sort":      sort,
				"limit":     limit,
				"data":      limitedData,
				"count":     len(limitedData),
				"timestamp": data.Timestamp,
				"source":    "unified-api",
				"status":    "completed",
			})
		} else {
			c.JSON(404, gin.H{
				"error": fmt.Sprintf("Metric '%s' not found", sort),
				"suggestion": "Use /api/crypto/data for all metrics",
			})
		}
	})

	r.Any("/api/inngest", gin.WrapH(inngestClient.Serve()))

	port := os.Getenv("PORT")
	if port == "" {
    port = "8080" // Local development default
	}

	log.Printf("🚀 CLEANED Crypto API Server starting on :8080")
	log.Printf("================================")
	log.Printf("🎯 FRONTEND ENDPOINT:")
	log.Printf("")
	log.Printf("📊 SYSTEM INFO:")
	log.Printf("   Health: http://localhost:%s/health", port)
	log.Printf("   Info: http://localhost:%s/api/crypto/info", port)
	log.Printf("   Status: http://localhost:%s/", port)
	log.Printf("")
	log.Printf("🔧 DEV TOOLS:")
	log.Printf("   Manual Trigger: POST http://localhost:%s/dev/trigger", port)


log.Printf("🚀 Server starting on port %s", port)
r.Run(":" + port) 
}
