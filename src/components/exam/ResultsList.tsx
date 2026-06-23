import React, { useState, useEffect } from 'react';
import { Search, Award, Calendar, BookOpen, ChevronRight, CheckCircle2 } from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  courseCode: string;
  date: string;
  type: string;
  status: 'upcoming' | 'active' | 'completed' | 'graded';
  score?: number;
  max_score?: number;
  grade_letter?: string;
}

export default function ResultsList() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentId, setStudentId] = useState('');

  useEffect(() => {
    const sid = localStorage.getItem('student_id') || '';
    setStudentId(sid);

    const fetchExams = async () => {
      try {
        const response = await fetch(`/api/exams/?student_id=${sid}`);
        if (response.ok) {
          const data = await response.json();
          setExams(data.exams || []);
        }
      } catch (err) {
        console.error('Error fetching exams:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  const filteredExams = exams.filter(exam =>
    (exam.status === 'completed' || exam.status === 'graded') &&
    (exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     exam.courseCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="w-8 h-8 border-4 border-[#2c6fb7] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-semibold text-sm">Loading your results...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">Exam Results</h1>
          <p className="text-slate-500 mt-1 font-medium">Review your grades and performance.</p>
        </div>
        
        <div className="relative max-w-sm w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input 
            type="text" 
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-[14px] placeholder-slate-400 focus:outline-none focus:border-[#2c6fb7] focus:ring-1 focus:ring-[#2c6fb7] bg-white shadow-sm" 
            placeholder="Search completed exams..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredExams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-sm mt-8">
          <div className="w-16 h-16 bg-blue-50 text-[#2c6fb7] rounded-full flex items-center justify-center mx-auto mb-6">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No Results Available</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            You don't have any completed exams or graded papers yet. Once your exams are marked, the results will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map(exam => (
            <div key={exam.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                      {exam.courseCode}
                    </span>
                    {exam.status === 'graded' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                        Graded
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                        Pending Grade
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight mt-2">{exam.title}</h3>
                </div>
                <div className={`p-2 rounded-lg ${exam.status === 'graded' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {exam.status === 'graded' ? <Award className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
              </div>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-slate-500">
                  <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                  <span>Submitted on: {exam.date}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-slate-800">
                <span className="font-bold text-sm">Final Score:</span>
                {exam.status === 'graded' ? (
                  (() => {
                    const pct = exam.max_score ? (exam.score! / exam.max_score) * 100 : 0;
                    let colorClass = 'text-green-600';
                    if (pct < 50) colorClass = 'text-red-500';
                    else if (pct < 70) colorClass = 'text-orange-500';
                    
                    return (
                      <div className="flex flex-col items-end">
                        <span className={`text-lg font-black ${colorClass}`}>
                          {exam.grade_letter || 'N/A'}
                        </span>
                        <span className={`text-xs font-bold ${colorClass}`}>
                          {pct.toFixed(1)}% ({exam.score}/{exam.max_score})
                        </span>
                      </div>
                    );
                  })()
                ) : (
                  <span className="text-sm font-bold text-slate-400">-- / {exam.max_score || '--'}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
