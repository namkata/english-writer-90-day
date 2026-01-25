export interface Pattern {
  id: number;
  english: string;
  vietnamese: string;
  structure: string;
  explanation: string;
  level: number;
  day: number;
  alternatives?: string[];
  vietnamese_alternatives?: string[];
  context?: string;
}

export interface DailyCompletion {
  id: number;
  day: number;
  completed: boolean;
  score: number;
  date: string;
}

export interface RoadmapData {
  current_day: number;
  streak: number;
  completions: DailyCompletion[];
}

export interface QuizResponse {
    questions: Pattern[];
    attempts_left: number;
}

export interface QuizDetail {
  question_id: number;
  question: string;
  user_answer: string;
  correct_answer: string;
  alternatives?: string[];
  vietnamese_alternatives?: string[];
  is_correct: boolean;
  explanation: string;
  structure: string;
  context?: string;
}

export interface QuizResult {
  score: number;
  details: QuizDetail[];
  attempts_left: number;
}
