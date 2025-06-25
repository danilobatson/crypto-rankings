package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// HealthResponse represents the health check response
type HealthResponse struct {
	Status    string            `json:"status"`
	Timestamp time.Time         `json:"timestamp"`
	Service   string            `json:"service"`
	Version   string            `json:"version"`
	Uptime    string            `json:"uptime"`
	Checks    map[string]string `json:"checks"`
}

var startTime = time.Now()

// HealthHandler returns the health status of the API
func HealthHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		uptime := time.Since(startTime)

		health := HealthResponse{
			Status:    "healthy",
			Timestamp: time.Now(),
			Service:   "crypto-rankings-api",
			Version:   "1.0.0",
			Uptime:    uptime.String(),
			Checks: map[string]string{
				"api":         "healthy",
				"inngest":     "pending", // Will be updated in Step 2
				"lunarcrush":  "pending", // Will be updated in Step 4
				"storage":     "healthy",
			},
		}

		c.JSON(http.StatusOK, health)
	}
}
