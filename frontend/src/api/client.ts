import axios from 'axios';
import type { RoadmapData, Pattern, QuizResponse, QuizResult } from '../types';

const API_URL = 'http://localhost:8080/api';

export const api = {
  getRoadmap: async () => {
    const res = await axios.get<RoadmapData>(`${API_URL}/roadmap`);
    return res.data;
  },
  getLesson: async (day: number) => {
    const res = await axios.get<{ day: string; patterns: Pattern[] }>(`${API_URL}/lesson/${day}`);
    return res.data;
  },
  completeDay: async (day: number, score: number) => {
    const res = await axios.post(`${API_URL}/complete`, { day, score });
    return res.data;
  },
  getQuiz: async () => {
      const res = await axios.get<QuizResponse>(`${API_URL}/quiz`);
      return res.data;
  },
  submitQuiz: async (answers: Record<number, string>) => {
    const res = await axios.post<QuizResult>(`${API_URL}/quiz/submit`, { answers });
    return res.data;
  },
  getAdminPatterns: async () => {
    const res = await axios.get<{ patterns: Pattern[], total: number }>(`${API_URL}/admin/patterns`);
    return res.data;
  },

  importPatterns: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post(`${API_URL}/admin/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
};
