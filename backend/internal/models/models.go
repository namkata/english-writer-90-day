package models

import "time"

// Pattern represents a sentence pattern for learning
type Pattern struct {
	ID                     uint      `gorm:"primaryKey" json:"id"`
	English                string    `json:"english"`
	Vietnamese             string    `json:"vietnamese"`
	Structure              string    `json:"structure"` // E.g. "S + V + O"
	Explanation            string    `json:"explanation"`
	Level                  int       `json:"level"` // 1: Beginner, 2: Intermediate, etc.
	Day                    int       `json:"day"`   // Assigned day in the roadmap (1-180)
	Alternatives           []string  `gorm:"serializer:json" json:"alternatives"`
	VietnameseAlternatives []string  `gorm:"serializer:json" json:"vietnamese_alternatives"`
	Context                string    `json:"context"` // e.g. "Formal", "Slang", "Friendly"
	CreatedAt              time.Time `json:"created_at"`
	UpdatedAt              time.Time `json:"updated_at"`
}

// UserProgress tracks the user's learning progress
type UserProgress struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	UserID        int       `json:"user_id"` // Always 1 for local app
	CurrentDay    int       `json:"current_day"`
	Streak        int       `json:"streak"`
	LastStudyDate time.Time `json:"last_study_date"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// DailyCompletion tracks if a user finished a specific day
type DailyCompletion struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    int       `json:"user_id"`
	Day       int       `json:"day"`
	Completed bool      `json:"completed"`
	Score     int       `json:"score"` // Quiz score for that day
	Date      time.Time `json:"date"`
}

// QuizAttempt tracks each quiz attempt
type QuizAttempt struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    int       `json:"user_id"`
	Score     int       `json:"score"`
	Passed    bool      `json:"passed"`
	CreatedAt time.Time `json:"created_at"`
}
