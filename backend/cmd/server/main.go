package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"crypto-rankings-backend/internal/handlers"
	"crypto-rankings-backend/internal/middleware"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Create Gin router
	router := gin.Default()

	// Add CORS middleware
	router.Use(middleware.CORSMiddleware())

	// Add logging middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Health check endpoint
	router.GET("/health", handlers.HealthHandler())

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		v1.GET("/status", handlers.StatusHandler())
		// Crypto rankings endpoints
		v1.GET("/cryptocurrencies", handlers.CryptocurrenciesHandler())
		v1.GET("/cryptocurrencies/:sector", handlers.CryptocurrenciesBySectorHandler())
		v1.GET("/cryptocurrencies/:sector/:sort", handlers.CryptocurrenciesSortedHandler())
		v1.GET("/cryptocurrencies/:sector/:sort/:limit", handlers.CryptocurrenciesFullHandler())
	}

	// Create server with timeouts
	server := &http.Server{
		Addr:         ":8080",
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Println("🚀 Crypto Rankings API Server")
	log.Println("=============================")
	log.Println("Server starting on http://localhost:8080")
	log.Println("Health check: http://localhost:8080/health")
	log.Println("API status: http://localhost:8080/api/v1/status")
	log.Println("Crypto rankings: http://localhost:8080/api/v1/cryptocurrencies")
	log.Println("Example: http://localhost:8080/api/v1/cryptocurrencies/defi/market_cap/25")
	log.Println("Press Ctrl+C to stop")

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Failed to start server: %v", err)
	}
}
