import { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';
import type { Pattern } from '../types';
import { ChevronDown, ChevronRight, Search, Download, Upload } from 'lucide-react';

export default function AdminCurriculum() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPatterns();
  }, []);

  const fetchPatterns = () => {
    setLoading(true);
    api.getAdminPatterns()
      .then((res) => {
        setPatterns(res.patterns);
        setLoading(false);
      })
      .catch(console.error);
  };

  const handleDownloadTemplate = () => {
    const header = "Day,Level,English,Vietnamese,Structure,Explanation,Context,Alternatives,Vietnamese Alternatives";
    const example = "1,1,Hello,Xin chào,Subject + Verb,Greeting,Casual/Social,Hi|Hey,Chào|Chào bạn";
    // Add BOM (\uFEFF) to fix encoding issues in Excel
    // Add "sep=," in the first line to force Excel to use comma as delimiter
    const csvContent = "\uFEFFsep=,\n" + header + "\n" + example;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "curriculum_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    try {
        await api.importPatterns(file);
        await fetchPatterns();
        alert("Import successful!");
    } catch (error) {
        console.error("Import failed", error);
        alert("Import failed. Please check the file format.");
        setLoading(false);
    } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Group patterns by day
  const patternsByDay = patterns.reduce((acc, pattern) => {
    if (!acc[pattern.day]) {
      acc[pattern.day] = [];
    }
    acc[pattern.day].push(pattern);
    return acc;
  }, {} as Record<number, Pattern[]>);

  const days = Object.keys(patternsByDay).map(Number).sort((a, b) => a - b);

  const toggleDay = (day: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(day)) {
      newExpanded.delete(day);
    } else {
      newExpanded.add(day);
    }
    setExpandedDays(newExpanded);
  };

  const expandAll = () => {
    setExpandedDays(new Set(days));
  };

  const collapseAll = () => {
    setExpandedDays(new Set());
  };

  const filteredDays = days.filter(day => {
    if (!searchTerm) return true;
    const dayPatterns = patternsByDay[day];
    return dayPatterns.some(p => 
      p.english.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.vietnamese.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.structure.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) return <div className="p-8 text-center">Loading Curriculum...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Curriculum Overview (Admin)</h1>
        <div className="flex gap-4">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept=".csv"
          />
          <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
            <Download size={18} /> Template
          </button>
          <button onClick={handleImportClick} className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200">
            <Upload size={18} /> Import CSV
          </button>
          <button onClick={expandAll} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">Expand All</button>
          <button onClick={collapseAll} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Collapse All</button>
        </div>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search patterns..."
          className="w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredDays.map(day => {
          const isExpanded = expandedDays.has(day);
          const dayPatterns = patternsByDay[day];
          
          return (
            <div key={day} className="border rounded-xl bg-white shadow-sm overflow-hidden">
              <button 
                onClick={() => toggleDay(day)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  <span className="font-bold text-lg">Day {day}</span>
                  <span className="text-sm text-gray-500">({dayPatterns.length} patterns)</span>
                  {day <= 45 ? 
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Level A1</span> :
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Level A2</span>
                  }
                </div>
              </button>
              
              {isExpanded && (
                <div className="p-4 border-t bg-white">
                  <div className="grid gap-4">
                    {dayPatterns.map(pattern => (
                      <div key={pattern.id} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-bold text-blue-600 text-lg">{pattern.english}</div>
                            <div className="text-gray-700 italic">{pattern.vietnamese}</div>
                          </div>
                          <div className="text-xs text-gray-400 font-mono">ID: {pattern.id}</div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                          <div>
                            <span className="font-bold text-gray-500 block">Structure:</span>
                            <span className="font-mono text-purple-600">{pattern.structure}</span>
                          </div>
                          <div>
                            <span className="font-bold text-gray-500 block">Context:</span>
                            <span>{pattern.context}</span>
                          </div>
                        </div>

                        {pattern.alternatives && pattern.alternatives.length > 0 && (
                          <div className="mt-3 text-sm">
                            <span className="font-bold text-gray-500 block">Alternatives:</span>
                            <ul className="list-disc list-inside text-gray-600">
                              {pattern.alternatives.map((alt, idx) => (
                                <li key={idx}>{alt}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                         {pattern.vietnamese_alternatives && pattern.vietnamese_alternatives.length > 0 && (
                          <div className="mt-3 text-sm">
                            <span className="font-bold text-gray-500 block">Vietnamese Alternatives:</span>
                            <ul className="list-disc list-inside text-gray-600">
                              {pattern.vietnamese_alternatives.map((alt, idx) => (
                                <li key={idx}>{alt}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}