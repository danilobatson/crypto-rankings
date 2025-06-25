package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// StatusHandler returns API status information
func StatusHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"service":     "crypto-rankings-api",
			"version":     "1.0.0",
			"status":      "operational",
			"environment": "development",
			"description": "Cryptocurrency rankings via LunarCrush MCP",
			"features": []string{
				"health-checks",
				"cors-enabled",
				"structured-logging",
				"lunarcrush-mcp-integration",
				"crypto-rankings",
				"sector-filtering",
				"metric-sorting",
			},
			"endpoints": map[string]string{
				"health":           "/health",
				"status":           "/api/v1/status",
				"cryptocurrencies": "/api/v1/cryptocurrencies/{sector}/{sort}/{limit}",
			},
			"supported_sectors": []string{
				"all", "defi", "nft", "gaming", "layer-1", "layer-2",
				"meme", "ai", "stablecoin", "dao", "oracle", "storage",
			},
			"supported_sorts": []string{
				"market_cap", "alt_rank", "galaxy_score", "price",
				"percent_change_24h", "interactions", "sentiment",
			},
		})
	}
}

// CryptocurrenciesHandler returns default cryptocurrency list (top 25 by market cap)
func CryptocurrenciesHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Default: all sectors, market cap sort, limit 25
		c.JSON(http.StatusOK, gin.H{
			"message": "Cryptocurrency rankings endpoint",
			"default_params": gin.H{
				"sector": "all",
				"sort":   "market_cap",
				"limit":  25,
			},
			"usage": "Use /api/v1/cryptocurrencies/{sector}/{sort}/{limit}",
			"example": "/api/v1/cryptocurrencies/defi/market_cap/25",
			"note": "LunarCrush MCP integration will be added in Step 4",
		})
	}
}

// CryptocurrenciesBySectorHandler handles sector filtering
func CryptocurrenciesBySectorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		sector := c.Param("sector")

		c.JSON(http.StatusOK, gin.H{
			"message": "Sector-filtered cryptocurrency rankings",
			"sector":  sector,
			"default_params": gin.H{
				"sort":  "market_cap",
				"limit": 25,
			},
			"usage": "Add sort parameter: /api/v1/cryptocurrencies/" + sector + "/{sort}/{limit}",
			"note": "LunarCrush MCP integration will be added in Step 4",
		})
	}
}

// CryptocurrenciesSortedHandler handles sector + sorting
func CryptocurrenciesSortedHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		sector := c.Param("sector")
		sort := c.Param("sort")

		c.JSON(http.StatusOK, gin.H{
			"message": "Sorted cryptocurrency rankings",
			"sector":  sector,
			"sort":    sort,
			"default_params": gin.H{
				"limit": 25,
			},
			"usage": "Add limit parameter: /api/v1/cryptocurrencies/" + sector + "/" + sort + "/{limit}",
			"note": "LunarCrush MCP integration will be added in Step 4",
		})
	}
}

// CryptocurrenciesFullHandler handles complete endpoint with all parameters
func CryptocurrenciesFullHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		sector := c.Param("sector")
		sort := c.Param("sort")
		limit := c.Param("limit")

		// TODO: In Step 4, this will call LunarCrush MCP
		// For now, return mock response showing the endpoint structure
		c.JSON(http.StatusOK, gin.H{
			"message": "Full cryptocurrency rankings endpoint",
			"params": gin.H{
				"sector": sector,
				"sort":   sort,
				"limit":  limit,
			},
			"mcp_endpoint": "/list/cryptocurrencies/" + sector + "/" + sort + "/" + limit,
			"status": "endpoint_ready",
			"note": "LunarCrush MCP integration will be added in Step 4",
			"mock_data": []gin.H{
				{
					"rank":       1,
					"symbol":     "BTC",
					"name":       "Bitcoin",
					"market_cap": 2115599321207,
					"price":      106543.21,
					"change_24h": -3.90,
				},
				{
					"rank":       2,
					"symbol":     "ETH",
					"name":       "Ethereum",
					"market_cap": 294861280170,
					"price":      2202.24,
					"change_24h": -9.18,
				},
			},
		})
	}
}
