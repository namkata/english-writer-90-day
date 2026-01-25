package database

import (
	"english-learning-app/internal/models"
	"fmt"
	"log"
	"math/rand"
	"strings"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

// Connect initializes the database connection
func Connect() {
	var err error
	DB, err = gorm.Open(sqlite.Open("english_learning.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto Migrate
	err = DB.AutoMigrate(&models.Pattern{}, &models.UserProgress{}, &models.DailyCompletion{}, &models.QuizAttempt{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	fmt.Println("Database connected and migrated successfully")

	// Seed data if empty or needed
	SeedData()
}

type Theme struct {
	Name        string
	StartDay    int
	EndDay      int
	Level       int // 1=A1, 2=A2
	Description string
	Templates   []Template
}

type Template struct {
	EngPattern  string // e.g. "I like {food}"
	VietPattern string // e.g. "Tôi thích {food}"
	Structure   string
	Explanation string
	Context     string
	Vocab       map[string][]WordPair
}

type WordPair struct {
	Eng  string
	Viet string
}

// SeedData inserts initial data
func SeedData() {
	var count int64
	DB.Model(&models.Pattern{}).Count(&count)

	// Simple check to avoid re-seeding if we have a substantial amount of data
	// Modify this condition if you want to force re-seed
	// We'll set this to > 3000 to allow re-seeding if we have old data (approx 90 days * 25 = 2250)
	// Or we can just drop the table manually.
	// For now, let's assume if it's < 100 we seed.
	// Or better, let's just clear it as per user request to "Create whole plan"
	fmt.Println("Re-seeding comprehensive curriculum data (Days 1-90)...")
	DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&models.Pattern{})

	patterns := []models.Pattern{}

	// --- A1 LEVEL (Days 1-45) ---

	// Theme 1: Greetings & Introduction (Day 1-5)
	patterns = append(patterns, generateThemePatterns(Theme{
		Name: "Greetings & Introduction", StartDay: 1, EndDay: 5, Level: 1,
		Templates: []Template{
			{
				EngPattern: "I am {adj}", VietPattern: "Tôi {adj}",
				Structure: "S + am + Adjective", Explanation: "Diễn tả cảm xúc hoặc trạng thái bản thân.", Context: "Standard conversation",
				Vocab: map[string][]WordPair{"adj": {{"happy", "vui"}, {"sad", "buồn"}, {"tired", "mệt"}, {"busy", "bận"}, {"hungry", "đói"}}},
			},
			{
				EngPattern: "He is a {job}", VietPattern: "Anh ấy là một {job}",
				Structure: "S + is + a + Noun", Explanation: "Giới thiệu nghề nghiệp của ai đó.", Context: "Introduction",
				Vocab: map[string][]WordPair{"job": {{"teacher", "giáo viên"}, {"doctor", "bác sĩ"}, {"student", "học sinh"}, {"engineer", "kỹ sư"}, {"worker", "công nhân"}}},
			},
			{
				EngPattern: "Are you {adj}?", VietPattern: "Bạn có {adj} không?",
				Structure: "To be + S + Adjective?", Explanation: "Hỏi về trạng thái của người khác.", Context: "Asking questions",
				Vocab: map[string][]WordPair{"adj": {{"ready", "sẵn sàng"}, {"busy", "bận"}, {"okay", "ổn"}, {"tired", "mệt"}}},
			},
		},
	})...)

	// Theme 2: Family & Possessives (Day 6-10)
	patterns = append(patterns, generateThemePatterns(Theme{
		Name: "Family & Possessives", StartDay: 6, EndDay: 10, Level: 1,
		Templates: []Template{
			{
				EngPattern: "This is my {member}", VietPattern: "Đây là {member} của tôi",
				Structure: "This is + Possessive + Noun", Explanation: "Giới thiệu thành viên gia đình.", Context: "Introducing family",
				Vocab: map[string][]WordPair{"member": {{"father", "bố"}, {"mother", "mẹ"}, {"brother", "anh/em trai"}, {"sister", "chị/em gái"}, {"friend", "bạn"}}},
			},
			{
				EngPattern: "My {member} is {adj}", VietPattern: "{member} của tôi thì {adj}",
				Structure: "Possessive + Noun + is + Adjective", Explanation: "Mô tả tính cách/trạng thái người thân.", Context: "Describing family",
				Vocab: map[string][]WordPair{
					"member": {{"father", "bố"}, {"mother", "mẹ"}, {"brother", "anh trai"}},
					"adj":    {{"kind", "tốt bụng"}, {"strict", "nghiêm khắc"}, {"tall", "cao"}, {"funny", "vui tính"}},
				},
			},
		},
	})...)

	// Theme 3: Daily Routine (Day 11-20)
	patterns = append(patterns, generateThemePatterns(Theme{
		Name: "Daily Routine", StartDay: 11, EndDay: 20, Level: 1,
		Templates: []Template{
			{
				EngPattern: "I {action} at {time}", VietPattern: "Tôi {action} lúc {time}",
				Structure: "S + V + at + Time", Explanation: "Kể về thói quen hàng ngày.", Context: "Daily routine",
				Vocab: map[string][]WordPair{
					"action": {{"wake up", "thức dậy"}, {"eat breakfast", "ăn sáng"}, {"go to work", "đi làm"}, {"go home", "về nhà"}, {"sleep", "đi ngủ"}},
					"time":   {{"6 AM", "6 giờ sáng"}, {"7 AM", "7 giờ sáng"}, {"12 PM", "12 giờ trưa"}, {"5 PM", "5 giờ chiều"}, {"10 PM", "10 giờ tối"}},
				},
			},
			{
				EngPattern: "She {action} every day", VietPattern: "Cô ấy {action} mỗi ngày",
				Structure: "S + V(s/es) + Time phrase", Explanation: "Thói quen của người khác (Ngôi thứ 3 số ít).", Context: "Describing habits",
				Vocab: map[string][]WordPair{
					"action": {{"cooks", "nấu ăn"}, {"reads", "đọc sách"}, {"runs", "chạy bộ"}, {"studies", "học bài"}},
				},
			},
		},
	})...)

	// Theme 4: Jobs & Work (Day 21-30)
	patterns = append(patterns, generateThemePatterns(Theme{
		Name: "Jobs & Work", StartDay: 21, EndDay: 30, Level: 1,
		Templates: []Template{
			{
				EngPattern: "I work at a {place}", VietPattern: "Tôi làm việc tại một {place}",
				Structure: "S + work + at + Place", Explanation: "Nói về nơi làm việc.", Context: "Workplace",
				Vocab: map[string][]WordPair{"place": {{"bank", "ngân hàng"}, {"school", "trường học"}, {"hospital", "bệnh viện"}, {"office", "văn phòng"}}},
			},
			{
				EngPattern: "Do you like your job?", VietPattern: "Bạn có thích công việc của mình không?",
				Structure: "Do/Does + S + like + Noun?", Explanation: "Hỏi về sở thích công việc.", Context: "Work conversation",
				Vocab: nil, // Fixed sentence
			},
		},
	})...)

	// Theme 5: Food & Drink (Day 31-40)
	patterns = append(patterns, generateThemePatterns(Theme{
		Name: "Food & Drink", StartDay: 31, EndDay: 40, Level: 1,
		Templates: []Template{
			{
				EngPattern: "I would like some {food}", VietPattern: "Tôi muốn một chút {food}",
				Structure: "S + would like + some + Noun", Explanation: "Gọi món hoặc bày tỏ mong muốn lịch sự.", Context: "Restaurant/Ordering",
				Vocab: map[string][]WordPair{"food": {{"water", "nước"}, {"coffee", "cà phê"}, {"rice", "cơm"}, {"chicken", "thịt gà"}, {"bread", "bánh mì"}}},
			},
			{
				EngPattern: "This {food} is {taste}", VietPattern: "Món {food} này {taste}",
				Structure: "This + Noun + is + Adjective", Explanation: "Nhận xét về đồ ăn.", Context: "Eating out",
				Vocab: map[string][]WordPair{
					"food":  {{"soup", "súp"}, {"cake", "bánh ngọt"}, {"tea", "trà"}},
					"taste": {{"delicious", "ngon"}, {"hot", "nóng"}, {"sweet", "ngọt"}, {"salty", "mặn"}},
				},
			},
		},
	})...)

	// Theme 6: Hobbies & Likes (Day 41-45) - End of A1
	patterns = append(patterns, generateThemePatterns(Theme{
		Name: "Hobbies", StartDay: 41, EndDay: 45, Level: 1,
		Templates: []Template{
			{
				EngPattern: "I like {activity}", VietPattern: "Tôi thích {activity}",
				Structure: "S + like + V-ing/Noun", Explanation: "Nói về sở thích.", Context: "Hobbies",
				Vocab: map[string][]WordPair{"activity": {{"swimming", "bơi lội"}, {"reading", "đọc sách"}, {"cooking", "nấu ăn"}, {"traveling", "du lịch"}}},
			},
		},
	})...)

	// --- A2 LEVEL (Days 46-90) ---

	// Theme 7: Past Events (Day 46-60)
	patterns = append(patterns, generateThemePatterns(Theme{
		Name: "Past Events", StartDay: 46, EndDay: 60, Level: 2,
		Templates: []Template{
			{
				EngPattern: "I {verb_past} yesterday", VietPattern: "Tôi đã {verb_past} hôm qua",
				Structure: "S + V-ed/V2 + Time", Explanation: "Kể về việc đã làm trong quá khứ.", Context: "Past narrative",
				Vocab: map[string][]WordPair{"verb_past": {{"worked", "làm việc"}, {"played", "chơi"}, {"visited mom", "thăm mẹ"}, {"stayed home", "ở nhà"}}},
			},
			{
				EngPattern: "Did you {verb_base} last week?", VietPattern: "Bạn có {verb_base} tuần trước không?",
				Structure: "Did + S + V-inf?", Explanation: "Hỏi về quá khứ.", Context: "Past questions",
				Vocab: map[string][]WordPair{"verb_base": {{"go out", "đi chơi"}, {"see him", "gặp anh ấy"}, {"buy it", "mua nó"}, {"watch TV", "xem TV"}}},
			},
		},
	})...)

	// Theme 8: Future Plans (Day 61-75)
	patterns = append(patterns, generateThemePatterns(Theme{
		Name: "Future Plans", StartDay: 61, EndDay: 75, Level: 2,
		Templates: []Template{
			{
				EngPattern: "I am going to {verb}", VietPattern: "Tôi dự định sẽ {verb}",
				Structure: "S + be going to + V-inf", Explanation: "Nói về kế hoạch chắc chắn trong tương lai.", Context: "Future plans",
				Vocab: map[string][]WordPair{"verb": {{"buy a car", "mua ô tô"}, {"travel", "đi du lịch"}, {"visit Hanoi", "thăm Hà Nội"}, {"study English", "học tiếng Anh"}}},
			},
			{
				EngPattern: "I will {verb} tomorrow", VietPattern: "Tôi sẽ {verb} ngày mai",
				Structure: "S + will + V-inf", Explanation: "Nói về quyết định tức thì hoặc dự đoán.", Context: "Future promise/prediction",
				Vocab: map[string][]WordPair{"verb": {{"call you", "gọi bạn"}, {"help you", "giúp bạn"}, {"be there", "có mặt ở đó"}}},
			},
		},
	})...)

	// Theme 9: Travel & Experiences (Day 76-90) - End of A2
	patterns = append(patterns, generateThemePatterns(Theme{
		Name: "Travel", StartDay: 76, EndDay: 90, Level: 2,
		Templates: []Template{
			{
				EngPattern: "Have you ever been to {place}?", VietPattern: "Bạn đã từng đến {place} chưa?",
				Structure: "Have + S + ever + V3/ed?", Explanation: "Hỏi về trải nghiệm (Hiện tại hoàn thành).", Context: "Experiences",
				Vocab: map[string][]WordPair{"place": {{"Paris", "Paris"}, {"London", "Luân Đôn"}, {"Vietnam", "Việt Nam"}, {"America", "Mỹ"}}},
			},
			{
				EngPattern: "I need to book a {item}", VietPattern: "Tôi cần đặt một {item}",
				Structure: "S + need to + V", Explanation: "Nói về nhu cầu khi đi du lịch.", Context: "Travel arrangements",
				Vocab: map[string][]WordPair{"item": {{"flight", "chuyến bay"}, {"hotel room", "phòng khách sạn"}, {"ticket", "vé"}, {"taxi", "taxi"}}},
			},
		},
	})...)

	// Inject Manual High-Quality Data for Day 1 to override/supplement generated ones
	// This ensures the first impression is perfect as per previous user request
	day1Override := []models.Pattern{
		{
			English: "Hello, how are you?", Vietnamese: "Xin chào, bạn khỏe không?",
			Structure: "Greeting", Explanation: "Chào hỏi lịch sự thông thường.", Level: 1, Day: 1,
			Alternatives:           []string{"Hi, how are you?", "What's up bro?", "Are you okay?"},
			VietnameseAlternatives: []string{"Chào, bạn thế nào?", "Chào, mày ổn không?", "Lô, khỏe không?"},
			Context:                "Standard/Casual - Chào hỏi",
		},
		{
			English: "My name is Nam.", Vietnamese: "Tên tôi là Nam.",
			Structure: "Possessive + Noun + be + Name", Explanation: "Giới thiệu tên.", Level: 1, Day: 1,
			Alternatives:           []string{"I am Nam.", "Call me Nam."},
			VietnameseAlternatives: []string{"Mình là Nam.", "Tớ tên Nam."},
			Context:                "Introduction",
		},
	}
	patterns = append(patterns, day1Override...)

	// Batch Insert
	batchSize := 100
	for i := 0; i < len(patterns); i += batchSize {
		end := i + batchSize
		if end > len(patterns) {
			end = len(patterns)
		}
		if err := DB.Create(patterns[i:end]).Error; err != nil {
			log.Printf("Error seeding batch %d-%d: %v", i, end, err)
		}
	}

	// Initialize User Progress if not exists
	var progressCount int64
	DB.Model(&models.UserProgress{}).Count(&progressCount)
	if progressCount == 0 {
		DB.Create(&models.UserProgress{
			UserID:        1,
			CurrentDay:    1,
			Streak:        0,
			LastStudyDate: time.Now().AddDate(0, 0, -1),
		})
	}

	fmt.Println("Seeding completed successfully!")
}

func generateThemePatterns(theme Theme) []models.Pattern {
	var patterns []models.Pattern

	// For each day in the theme
	for day := theme.StartDay; day <= theme.EndDay; day++ {
		// Generate 25 patterns per day
		for i := 0; i < 25; i++ {
			// Pick a random template
			tmpl := theme.Templates[rand.Intn(len(theme.Templates))]

			eng := tmpl.EngPattern
			viet := tmpl.VietPattern

			// Replace placeholders
			if tmpl.Vocab != nil {
				for key, words := range tmpl.Vocab {
					// Pick random word pair
					pair := words[rand.Intn(len(words))]
					eng = replacePlaceholder(eng, key, pair.Eng)
					viet = replacePlaceholder(viet, key, pair.Viet)
				}
			}

			// Generate simple variations for Alternatives (Basic logic)
			// In a real system, we'd have explicit alternatives in templates
			alts := []string{}
			valts := []string{}

			patterns = append(patterns, models.Pattern{
				English:                eng,
				Vietnamese:             viet,
				Structure:              tmpl.Structure,
				Explanation:            tmpl.Explanation,
				Level:                  theme.Level,
				Day:                    day,
				Alternatives:           alts,
				VietnameseAlternatives: valts,
				Context:                tmpl.Context,
			})
		}
	}
	return patterns
}

func replacePlaceholder(text, key, value string) string {
	return strings.ReplaceAll(text, "{"+key+"}", value)
}
