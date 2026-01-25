package main

import (
	"english-learning-app/internal/database"
	"english-learning-app/internal/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize Database
	database.Connect()

	r := gin.Default()

	// CORS Config
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:5173"} // Frontend URL
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type"}
	r.Use(cors.New(config))

	// Routes
	api := r.Group("/api")
	{
		api.GET("/roadmap", handlers.GetRoadmap)
		api.GET("/lesson/:day", handlers.GetDailyLesson)
		api.POST("/complete", handlers.CompleteDay)
		api.GET("/quiz", handlers.GetQuiz)
		api.POST("/quiz/submit", handlers.SubmitQuiz)
		api.GET("/admin/patterns", handlers.GetAdminPatterns)
		api.POST("/admin/import", handlers.ImportPatterns)
	}

	r.Run(":8080")
}
