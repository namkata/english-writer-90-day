package handlers

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"english-learning-app/internal/database"
	"english-learning-app/internal/models"

	"github.com/gin-gonic/gin"
)

// GetRoadmap returns the user's progress and roadmap status
func GetRoadmap(c *gin.Context) {
	var progress models.UserProgress
	if err := database.DB.First(&progress, "user_id = ?", 1).Error; err != nil {
		// Create if not exists
		progress = models.UserProgress{UserID: 1, CurrentDay: 1}
		database.DB.Create(&progress)
	}

	var completions []models.DailyCompletion
	database.DB.Where("user_id = ?", 1).Find(&completions)

	c.JSON(http.StatusOK, gin.H{
		"current_day": progress.CurrentDay,
		"streak":      progress.Streak,
		"completions": completions,
	})
}

// GetDailyLesson returns patterns for a specific day
func GetDailyLesson(c *gin.Context) {
	day := c.Param("day")
	var patterns []models.Pattern
	database.DB.Where("day = ?", day).Find(&patterns)

	c.JSON(http.StatusOK, gin.H{
		"day":      day,
		"patterns": patterns,
	})
}

// CompleteDay marks a day as completed and updates progress
func CompleteDay(c *gin.Context) {
	var req struct {
		Day   int `json:"day"`
		Score int `json:"score"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Record completion
	completion := models.DailyCompletion{
		UserID:    1,
		Day:       req.Day,
		Completed: true,
		Score:     req.Score,
		Date:      time.Now(),
	}

	// Check if already completed
	var existing models.DailyCompletion
	if err := database.DB.Where("user_id = ? AND day = ?", 1, req.Day).First(&existing).Error; err == nil {
		// Update score if better
		if req.Score > existing.Score {
			existing.Score = req.Score
			database.DB.Save(&existing)
		}
	} else {
		database.DB.Create(&completion)
	}

	// Update UserProgress
	var progress models.UserProgress
	database.DB.First(&progress, "user_id = ?", 1)

	// Update streak
	today := time.Now().Truncate(24 * time.Hour)
	lastStudy := progress.LastStudyDate.Truncate(24 * time.Hour)

	if today.Equal(lastStudy.AddDate(0, 0, 1)) {
		progress.Streak++
	} else if today.After(lastStudy.AddDate(0, 0, 1)) {
		progress.Streak = 1
	} else if today.Equal(lastStudy) {
		// Same day, do nothing to streak
	} else {
		// New user or reset
		progress.Streak = 1
	}

	progress.LastStudyDate = time.Now()
	// Unlock next day if it's the current day
	if req.Day == progress.CurrentDay {
		progress.CurrentDay++
	}

	database.DB.Save(&progress)

	c.JSON(http.StatusOK, gin.H{"message": "Progress saved", "next_day": progress.CurrentDay})
}

// GetQuiz returns a random set of questions from learned patterns
func GetQuiz(c *gin.Context) {
	// Check attempt limit for today
	today := time.Now().Truncate(24 * time.Hour)
	var count int64
	database.DB.Model(&models.QuizAttempt{}).
		Where("user_id = ? AND created_at >= ?", 1, today).
		Count(&count)

	if count >= 3 {
		c.JSON(http.StatusForbidden, gin.H{
			"error":         "Daily attempt limit reached",
			"limit_reached": true,
		})
		return
	}

	// Get patterns up to current progress
	var progress models.UserProgress
	database.DB.First(&progress, "user_id = ?", 1)

	var patterns []models.Pattern
	// Fetch patterns from day 1 to current_day
	// Limit to 10 random questions
	database.DB.Where("day < ?", progress.CurrentDay+1).Order("RANDOM()").Limit(10).Find(&patterns)

	// If not enough patterns (e.g. Day 1), just fetch what we have
	if len(patterns) == 0 {
		database.DB.Limit(10).Find(&patterns)
	}

	c.JSON(http.StatusOK, gin.H{
		"questions":     patterns,
		"attempts_left": 3 - count,
	})
}

type QuizSubmission struct {
	Answers map[uint]string `json:"answers"` // PatternID -> User Answer
}

// SubmitQuiz processes quiz submission and returns detailed results
func SubmitQuiz(c *gin.Context) {
	// Check attempt limit again (double check)
	today := time.Now().Truncate(24 * time.Hour)
	var count int64
	database.DB.Model(&models.QuizAttempt{}).
		Where("user_id = ? AND created_at >= ?", 1, today).
		Count(&count)

	if count >= 3 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Daily attempt limit reached"})
		return
	}

	var req QuizSubmission
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var details []gin.H
	correctCount := 0
	totalQuestions := len(req.Answers)

	normalize := func(s string) string {
		s = strings.ToLower(s)
		// Remove accents (simple mapping for common Vietnamese chars)
		// Note: A full normalization library like golang.org/x/text/transform would be better,
		// but for now we'll do basic punctuation and case.
		// User asked to ignore punctuation and case primarily.
		s = strings.ReplaceAll(s, ".", "")
		s = strings.ReplaceAll(s, ",", "")
		s = strings.ReplaceAll(s, "?", "")
		s = strings.ReplaceAll(s, "!", "")
		return strings.TrimSpace(s)
	}

	for id, userAns := range req.Answers {
		var pattern models.Pattern
		if err := database.DB.First(&pattern, id).Error; err != nil {
			continue
		}

		// Check primary English answer
		isCorrect := normalize(userAns) == normalize(pattern.English)

		// Check alternatives if not correct yet
		if !isCorrect {
			for _, alt := range pattern.Alternatives {
				if normalize(userAns) == normalize(alt) {
					isCorrect = true
					break
				}
			}
		}

		if isCorrect {
			correctCount++
		}

		details = append(details, gin.H{
			"question_id":             pattern.ID,
			"question":                pattern.Vietnamese,
			"user_answer":             userAns,
			"correct_answer":          pattern.English,
			"alternatives":            pattern.Alternatives,
			"vietnamese_alternatives": pattern.VietnameseAlternatives,
			"is_correct":              isCorrect,
			"explanation":             pattern.Explanation,
			"structure":               pattern.Structure,
			"context":                 pattern.Context,
		})
	}

	score := 0
	if totalQuestions > 0 {
		score = (correctCount * 100) / totalQuestions
	}

	// Save attempt
	attempt := models.QuizAttempt{
		UserID:    1,
		Score:     score,
		Passed:    score >= 50,
		CreatedAt: time.Now(),
	}
	database.DB.Create(&attempt)

	c.JSON(http.StatusOK, gin.H{
		"score":         score,
		"details":       details,
		"attempts_left": 2 - count, // 3 - (count + 1)
	})
}

// GetAdminPatterns returns all patterns grouped by day (Admin only)
func GetAdminPatterns(c *gin.Context) {
	var patterns []models.Pattern
	// Order by Day, then ID
	if err := database.DB.Order("day ASC, id ASC").Find(&patterns).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch patterns"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"patterns": patterns,
		"total":    len(patterns),
	})
}

// ImportPatterns handles CSV file upload to bulk create/update patterns
func ImportPatterns(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	f, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file"})
		return
	}
	defer f.Close()

	reader := csv.NewReader(f)
	// Allow variable number of fields to handle "sep=," line which might have only 1 field
	reader.FieldsPerRecord = -1
	records, err := reader.ReadAll()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse CSV"})
		return
	}

	var newPatterns []models.Pattern

	if len(records) > 0 {
		// Remove BOM if present in the first cell
		records[0][0] = strings.TrimPrefix(records[0][0], "\uFEFF")
	}

	startIndex := 0
	// Skip "sep=," line if present (Excel helper)
	if len(records) > 0 && strings.HasPrefix(records[0][0], "sep=") {
		startIndex = 1
	}

	// Skip header row if exists
	if len(records) > startIndex && (strings.ToLower(records[startIndex][0]) == "day") {
		startIndex++
	}

	for i := startIndex; i < len(records); i++ {
		record := records[i]
		if len(record) < 4 {
			continue // Skip invalid rows
		}

		day, _ := strconv.Atoi(record[0])
		level, _ := strconv.Atoi(record[1])
		english := record[2]
		vietnamese := record[3]

		structure := ""
		if len(record) > 4 {
			structure = record[4]
		}

		explanation := ""
		if len(record) > 5 {
			explanation = record[5]
		}

		context := ""
		if len(record) > 6 {
			context = record[6]
		}

		var alternatives []string
		if len(record) > 7 && record[7] != "" {
			alternatives = strings.Split(record[7], "|")
			for k, v := range alternatives {
				alternatives[k] = strings.TrimSpace(v)
			}
		} else {
			alternatives = []string{}
		}

		var vietAlternatives []string
		if len(record) > 8 && record[8] != "" {
			vietAlternatives = strings.Split(record[8], "|")
			for k, v := range vietAlternatives {
				vietAlternatives[k] = strings.TrimSpace(v)
			}
		} else {
			vietAlternatives = []string{}
		}

		pattern := models.Pattern{
			Day:                    day,
			Level:                  level,
			English:                english,
			Vietnamese:             vietnamese,
			Structure:              structure,
			Explanation:            explanation,
			Context:                context,
			Alternatives:           alternatives,
			VietnameseAlternatives: vietAlternatives,
		}
		newPatterns = append(newPatterns, pattern)
	}

	if len(newPatterns) > 0 {
		if err := database.DB.Create(&newPatterns).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save patterns to database"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Successfully imported %d patterns", len(newPatterns)),
	})
}
