import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { RoadmapData } from '../types';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Trophy, Flame } from 'lucide-react';
import clsx from 'clsx';

export default function Dashboard() {
  const [data, setData] = useState<RoadmapData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    api.getRoadmap().then(setData).catch(console.error);
  }, []);

  if (!data) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  const daysPerMonth = 30;
  const startDay = (selectedMonth - 1) * daysPerMonth + 1;
  const endDay = selectedMonth * daysPerMonth;
  const days = Array.from({ length: daysPerMonth }, (_, i) => startDay + i);

  const isCompleted = (day: number) => data.completions.some((c) => c.day === day && c.completed);
  const isLocked = (day: number) => day > data.current_day;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">English Roadmap</h1>
          <p className="text-gray-600">Daily practice for mastery</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full font-bold">
            <Flame size={20} />
            <span>{data.streak} Day Streak</span>
          </div>
          <button 
            onClick={() => navigate('/quiz')}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            <Trophy size={20} />
            Challenge Quiz
          </button>
        </div>
      </header>

      {/* Month Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6].map((month) => (
          <button
            key={month}
            onClick={() => setSelectedMonth(month)}
            className={clsx(
              "px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition",
              selectedMonth === month 
                ? "bg-blue-600 text-white" 
                : "bg-white text-gray-600 hover:bg-gray-100"
            )}
          >
            Month {month} (Day {(month - 1) * 30 + 1}-{month * 30})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {days.map((day) => {
          const completed = isCompleted(day);
          const locked = isLocked(day);
          const current = day === data.current_day;

          return (
            <div
              key={day}
              onClick={() => !locked && navigate(`/lesson/${day}`)}
              className={clsx(
                "aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer border-2 transition-all",
                completed ? "bg-green-100 border-green-500 text-green-700" : 
                current ? "bg-blue-100 border-blue-500 text-blue-700 ring-4 ring-blue-200" :
                locked ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" :
                "bg-white border-gray-300 hover:border-blue-400"
              )}
            >
              <CalendarIcon size={24} className="mb-2 opacity-50" />
              <span className="text-xl font-bold">Day {day}</span>
              {completed && <span className="text-xs font-semibold">Done</span>}
              {current && <span className="text-xs font-semibold">Current</span>}
              {locked && <span className="text-xs">Locked</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
