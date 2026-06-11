import React, { useState, useEffect } from 'react';
import { Search, Calendar, Clock, ChevronRight, CheckCircle2, FileText, BookOpen } from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  courseCode: string;
  date: string;
  duration: string;
  type: string;
  question_count: number;
  status: 'upcoming' | 'active' | 'completed';
}

export default function ExamsList() {
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
    exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.courseCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeExams = filteredExams.filter(e => e.status !== 'completed' && e.status !== 'graded');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="w-8 h-8 border-4 border-[#2c6fb7] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-semibold text-sm">Loading your assessments...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">Exams & Assessments</h1>
          <p className="text-slate-500 mt-1 font-medium">View and manage your upcoming university exams.</p>
        </div>
        
        <div className="relative max-w-sm w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input 
            type="text" 
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-[14px] placeholder-slate-400 focus:outline-none focus:border-[#2c6fb7] focus:ring-1 focus:ring-[#2c6fb7] bg-white shadow-sm" 
            placeholder="Search for an exam..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-sm mt-8">
          <div className="w-16 h-16 bg-blue-50 text-[#2c6fb7] rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No Exams Scheduled</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            There are no active exams or assessments scheduled on your portal at this time. Exams will reflect here once they are published by the administration.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-5 py-2.5 bg-[#2c6fb7] hover:bg-[#1a5ba0] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            Check for Updates
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Active & Live Exams */}
          <section>
            <h2 className="text-[17px] font-bold text-[#2c6fb7] mb-5 pb-3 border-b border-slate-200">Live & Upcoming</h2>
            {activeExams.length === 0 ? (
              <p className="text-slate-400 text-sm italic font-medium py-4">No live or upcoming exams matches your search.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeExams.map(exam => (
                  <div key={exam.id} className="bg-white rounded-xl border p-5 shadow-sm transition-all hover:shadow-md border-green-200 ring-1 ring-green-500/30">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800">
                            {exam.courseCode}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 animate-pulse font-mono uppercase">
                            Live Now
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 border-none m-0 p-0 leading-tight">{exam.title}</h3>
                      </div>
                      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <FileText className="w-5 h-5" />
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center text-sm text-slate-600">
                        <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                        <span>{exam.date}</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <Clock className="w-4 h-4 mr-2 text-slate-400" />
                        <span>{exam.duration} ({exam.question_count} Questions)</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100">
                      <a href={`/verify/${exam.id}`} className="w-full inline-flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors">
                        Enter Exam
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
