import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, CheckCircle, Clock, Users, ShieldCheck, Search, 
  Activity, RefreshCw, PlusCircle, Trash2, ListOrdered, CheckSquare, 
  BookOpen, ChevronRight, X, Award, FileSpreadsheet, Eye, LogOut 
} from 'lucide-react';

interface Question {
  id: string;
  type: 'multiple_choice' | 'essay';
  text: string;
  options?: string[];
  points: number;
  correct_answer?: string;
}

interface TimelineEvent {
  timestamp: string;
  event: string;
  details: string;
}

interface ExamLog {
  id: number;
  student_name: string;
  registration_number: string;
  exam_id: string;
  exam_name: string;
  timestamp: string;
  verification_attempts: number;
  impersonation_flags: number;
  is_verified: boolean;
  status: string;
  score: number;
  grade_letter: string;
  feedback: string;
  timeline: TimelineEvent[];
  answers: Record<string, string>;
  questions: Question[];
  exam_type: 'objective' | 'essay';
  max_score: number;
  started_at?: string | null;
  submitted_at?: string;
}

export default function LecturerDashboard() {
  const [logs, setLogs] = useState<ExamLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'monitoring' | 'create_exam'>('monitoring');

  // Real-time cheat alert states
  const [activeAlerts, setActiveAlerts] = useState<{ id: string; message: string; timestamp: Date }[]>([]);

  // Selected student for detailed timeline/answers view
  const [selectedLog, setSelectedLog] = useState<ExamLog | null>(null);

  // Grading states
  const [gradeScore, setGradeScore] = useState<number>(0);
  const [gradeLetter, setGradeLetter] = useState<string>('A');
  const [gradeFeedback, setGradeFeedback] = useState<string>('');
  const [gradeSubmitting, setGradeSubmitting] = useState(false);

  // Exam Creator States
  const [examId, setExamId] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [examDuration, setExamDuration] = useState('120');
  const [examType, setExamType] = useState<'objective' | 'essay'>('objective');
  const [questionsList, setQuestionsList] = useState<Question[]>([]);

  // Temporary question creator states
  const [qText, setQText] = useState('');
  const [qPoints, setQPoints] = useState('1');
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/dashboard-logs/');
      if (res.ok) {
        const data = await res.json();
        const currentLogs: ExamLog[] = data.logs || [];
        setLogs(currentLogs);

        // Check for new cheating flags to pop up real-time alerts
        currentLogs.forEach(log => {
          if (log.impersonation_flags > 0 && log.status === 'started') {
            const hasAlert = activeAlerts.some(a => a.id === `${log.registration_number}-${log.impersonation_flags}`);
            if (!hasAlert) {
              const newAlert = {
                id: `${log.registration_number}-${log.impersonation_flags}`,
                message: `⚠️ Cheating warning: Student ${log.student_name} (${log.registration_number}) triggered a flag count of ${log.impersonation_flags} in exam ${log.exam_id}!`,
                timestamp: new Date()
              };
              setActiveAlerts(prev => [newAlert, ...prev].slice(0, 5)); // Keep last 5 alerts
            }
          }
        });
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [activeAlerts]);

  const handleOpenLog = (log: ExamLog) => {
    setSelectedLog(log);
    setGradeScore(log.score);
    setGradeLetter(log.grade_letter || 'A');
    setGradeFeedback(log.feedback || '');
  };

  const handleCloseLog = () => {
    setSelectedLog(null);
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLog) return;
    
    if (gradeScore > selectedLog.max_score) {
      alert(`The maximum score for this exam is ${selectedLog.max_score}. Please enter a valid score.`);
      return;
    }

    setGradeSubmitting(true);

    try {
      const response = await fetch(`/api/exams/${selectedLog.exam_id}/grade/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_number: selectedLog.registration_number,
          score: gradeScore,
          grade_letter: gradeLetter,
          feedback: gradeFeedback
        })
      });

      if (response.ok) {
        // Refresh logs and close modal
        await fetchLogs();
        setSelectedLog(prev => prev ? { 
          ...prev, 
          score: gradeScore, 
          grade_letter: gradeLetter, 
          feedback: gradeFeedback,
          status: 'graded'
        } : null);
        alert("Grading updated successfully!");
      } else {
        alert("Failed to save grading.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting grade.");
    } finally {
      setGradeSubmitting(false);
    }
  };

  const handleAddQuestion = () => {
    if (!qText.trim()) return;

    const newQ: Question = {
      id: `q${Date.now()}`,
      type: examType,
      text: qText.trim(),
      points: parseInt(qPoints) || 1,
    };

    if (examType === 'objective') {
      newQ.options = qOptions.filter(o => o.trim() !== '');
      newQ.correct_answer = qCorrect;
    }

    setQuestionsList([...questionsList, newQ]);

    // Reset question fields
    setQText('');
    setQPoints('1');
    setQOptions(['', '', '', '']);
    setQCorrect('');
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestionsList(questionsList.filter((_, i) => i !== idx));
  };

  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examId || !examTitle || questionsList.length === 0) {
      alert("Please fill all exam fields and add at least one question.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/exams/create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_id: examId.toUpperCase(),
          title: examTitle,
          duration_minutes: parseInt(examDuration) || 120,
          exam_type: examType,
          questions: questionsList
        })
      });

      if (response.ok) {
        alert("Exam paper created successfully!");
        setExamId('');
        setExamTitle('');
        setExamDuration('120');
        setQuestionsList([]);
        setActiveTab('monitoring');
        fetchLogs();
      } else {
        alert("Failed to create exam paper.");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending exam request.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('role');
    localStorage.removeItem('admin_name');
    window.location.href = '/';
  };

  const filteredLogs = logs.filter(log => 
    log.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.exam_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStudents = new Set(logs.map(l => l.registration_number)).size;
  const flaggedStudents = logs.filter(l => l.impersonation_flags > 0).length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col pb-10">
      
      {/* Real-time Cheating Alerts banner container */}
      {activeAlerts.length > 0 && (
        <div className="bg-red-600 text-white px-4 py-3 shadow-md flex flex-col gap-2.5 z-40 animate-pulse border-b border-red-700">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span className="font-bold text-sm">Real-time Invigilation Alert:</span>
              <span className="text-xs font-semibold bg-red-700 px-2.5 py-0.5 rounded-full">Proctoring Flags Triggered</span>
            </div>
            <button 
              onClick={() => setActiveAlerts([])}
              className="text-white hover:text-slate-200 text-xs font-bold underline"
            >
              Clear Alerts
            </button>
          </div>
          <div className="max-w-7xl mx-auto w-full flex flex-col gap-1 pl-7">
            {activeAlerts.map((alert, i) => (
              <div key={alert.id} className="text-xs font-medium">
                &bull; {alert.message} ({alert.timestamp.toLocaleTimeString()})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-[#2c6fb7] text-white p-2 rounded-lg">
                <ShieldCheck className="w-6 h-6" />
             </div>
             <div>
               <h1 className="text-xl font-bold text-slate-800 tracking-tight">Victoria University</h1>
               <p className="text-xs text-slate-500 font-medium tracking-wide">Proctoring & Exam Administration</p>
             </div>
          </div>

          <div className="flex items-center gap-4">
             {/* Navigation Tabs */}
             <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-sm">
               <button
                 onClick={() => setActiveTab('monitoring')}
                 className={`px-4 py-1.5 rounded-md font-bold transition-all ${
                   activeTab === 'monitoring' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                 }`}
               >
                 Live Monitoring
               </button>
               <button
                 onClick={() => setActiveTab('create_exam')}
                 className={`px-4 py-1.5 rounded-md font-bold transition-all ${
                   activeTab === 'create_exam' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                 }`}
               >
                 Set Exam Paper
               </button>
             </div>

             <div className="h-6 w-px bg-slate-200"></div>

             <button
               onClick={handleSignOut}
               className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-xs font-bold transition-colors"
             >
               <LogOut className="w-4 h-4" /> Sign Out
             </button>
          </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        
        {activeTab === 'monitoring' ? (
          <div>
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">Active Students</p>
                  <p className="text-2xl font-bold text-slate-800">{totalStudents}</p>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                 <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-sm font-semibold text-slate-500">Flagged Exceptions</p>
                    <p className="text-2xl font-bold text-slate-800">{flaggedStudents}</p>
                 </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                 <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-sm font-semibold text-slate-500">Graded/Completed</p>
                    <p className="text-2xl font-bold text-slate-800">{logs.filter(l => l.status === 'graded').length}</p>
                 </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                 <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-sm font-semibold text-slate-500">Total Attempts</p>
                    <p className="text-2xl font-bold text-slate-800">{logs.length}</p>
                 </div>
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                 <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   Live Proctoring Sessions
                   {loading && <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />}
                 </h2>
                 <div className="relative w-full sm:w-auto">
                   <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                     type="text" 
                     placeholder="Search by name, ID, or exam..."
                     className="pl-9 pr-4 py-2 w-full sm:w-64 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                   />
                 </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-bold border-b border-slate-200">Student Details</th>
                      <th className="px-6 py-4 font-bold border-b border-slate-200">Exam Name / ID</th>
                      <th className="px-6 py-4 font-bold border-b border-slate-200">Session Status</th>
                      <th className="px-6 py-4 font-bold border-b border-slate-200">Cheat Flags</th>
                      <th className="px-6 py-4 font-bold border-b border-slate-200">Grading Score</th>
                      <th className="px-6 py-4 font-bold border-b border-slate-200 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{log.student_name}</div>
                          <div className="text-xs text-slate-500 font-mono font-bold">{log.registration_number}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-slate-700">{log.exam_name}</div>
                          <div className="text-xs text-slate-400 font-semibold">{log.exam_id} &bull; {log.exam_type}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            log.status === 'graded' ? 'bg-green-100 text-green-700' :
                            log.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {log.status === 'graded' ? 'Graded' :
                             log.status === 'submitted' ? 'Pending Review' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {log.impersonation_flags > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 animate-pulse">
                              <ShieldAlert className="w-3.5 h-3.5" /> {log.impersonation_flags} Infractions
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs font-medium">Clear</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {log.status === 'graded' ? (
                            <div className="text-sm font-bold text-slate-800">
                              {log.score.toFixed(1)}% ({log.grade_letter})
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">Unfinished/Pending</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenLog(log)}
                            className="inline-flex items-center gap-1 text-[#2c6fb7] hover:text-[#1a5ba0] font-bold text-xs bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> Drilldown / Grade
                          </button>
                        </td>
                      </tr>
                    ))}
                    
                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                          No student activity logs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Set Exam Paper View */
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 max-w-4xl mx-auto overflow-hidden">
            <div className="bg-[#2c6fb7] px-8 py-5 text-white flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">Set Examination Paper</h2>
                <p className="text-blue-100 text-xs mt-0.5">Author assessment structures and publish them directly to student portals.</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-100 opacity-80" />
            </div>

            <form onSubmit={handleExamSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Course Code / ID</label>
                  <input 
                    type="text" 
                    placeholder="e.g., DBMS201"
                    required
                    value={examId}
                    onChange={(e) => setExamId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Exam Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Database Systems I - Final Examination"
                    required
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Duration (Minutes)</label>
                  <input 
                    type="number" 
                    required
                    value={examDuration}
                    onChange={(e) => setExamDuration(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Assessment Style</label>
                  <select
                    value={examType}
                    onChange={(e) => {
                      setExamType(e.target.value as 'objective' | 'essay');
                      setQuestionsList([]);
                    }}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                  >
                    <option value="objective">Objective Type (Auto Graded MCQs)</option>
                    <option value="essay">Essay Type (Instructor Graded Responses)</option>
                  </select>
                </div>
              </div>

              {/* Added Questions List */}
              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-md font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                  <ListOrdered className="w-5 h-5 text-[#2c6fb7]" /> Draft Questions ({questionsList.length})
                </h3>
                {questionsList.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 text-center py-6 text-slate-400 text-sm font-medium rounded-lg">
                    No questions added yet. Construct questions below to build the exam paper.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {questionsList.map((q, idx) => (
                      <div key={q.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="text-xs font-bold text-indigo-600 mb-1">
                            Q{idx + 1} &bull; {q.points} {q.points === 1 ? 'Point' : 'Points'}
                          </div>
                          <p className="text-slate-800 font-semibold text-sm">{q.text}</p>
                          {q.type === 'objective' && q.options && (
                            <div className="grid grid-cols-2 gap-1.5 mt-2.5 pl-2">
                              {q.options.map((opt, i) => (
                                <div key={i} className={`text-xs p-1.5 rounded ${
                                  opt === q.correct_answer ? 'bg-green-100 text-green-800 font-bold border border-green-200' : 'bg-white text-slate-500 border border-slate-150'
                                }`}>
                                  {opt} {opt === q.correct_answer && '✔️'}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(idx)}
                          className="text-red-500 hover:text-red-700 p-1 bg-white hover:bg-red-50 rounded border border-slate-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Question Construction Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">Create Question</h4>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Question Description</label>
                  <textarea
                    placeholder="Enter question text description..."
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 h-20 resize-none bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Marks/Points</label>
                    <input 
                      type="number"
                      value={qPoints}
                      onChange={(e) => setQPoints(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white"
                    />
                  </div>
                </div>

                {examType === 'objective' && (
                  <div className="space-y-3 pt-2">
                    <label className="block text-xs font-bold text-slate-500">Multiple Choice Options (Fill correct answer in options)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {qOptions.map((opt, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-xs font-bold text-slate-400 flex items-center">{String.fromCharCode(65 + i)}.</span>
                          <input
                            type="text"
                            placeholder={`Option ${i+1}`}
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...qOptions];
                              newOpts[i] = e.target.value;
                              setQOptions(newOpts);
                            }}
                            className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-400 bg-white"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Specify Correct Answer Value</label>
                      <input 
                        type="text"
                        placeholder="Must match one of the option inputs exactly..."
                        value={qCorrect}
                        onChange={(e) => setQCorrect(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-xs border border-indigo-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" /> Add Question to Paper
                </button>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#2c6fb7] hover:bg-[#1a5ba0] text-white font-bold rounded-lg shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  {loading ? 'Publishing Paper...' : <>Publish Assessment to Students <CheckSquare className="w-5 h-5" /></>}
                </button>
              </div>
            </form>
          </div>
        )}

      </main>

      {/* Drilldown Slide-Over / Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-white w-full max-w-3xl h-full flex flex-col shadow-2xl overflow-hidden animate-slide-in">
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{selectedLog.student_name}</h3>
                <p className="text-slate-400 text-xs font-mono font-bold mt-0.5">{selectedLog.registration_number}</p>
              </div>
              <button
                onClick={handleCloseLog}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Telemetry / Cheat Flags Alert */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <h4 className="font-bold text-slate-800 text-[15px] flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <ShieldAlert className="w-5 h-5 text-red-600" /> Proctoring & Session Flags
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 font-bold">Impersonation Flags</p>
                    <p className="text-xl font-bold text-red-600 mt-1">{selectedLog.impersonation_flags}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 font-bold">Face Verification</p>
                    <p className={`text-md font-bold mt-1.5 ${selectedLog.is_verified ? 'text-green-600' : 'text-red-500'}`}>
                      {selectedLog.is_verified ? 'Passed' : 'Bypassed/Failed'}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 font-bold">Verification Tries</p>
                    <p className="text-xl font-bold text-slate-800 mt-1">{selectedLog.verification_attempts}</p>
                  </div>
                </div>
              </div>

              {/* Event Timeline */}
              <div>
                <h4 className="font-bold text-slate-800 text-[15px] flex items-center gap-1.5 border-b border-slate-200 pb-2 mb-4">
                  <Activity className="w-5 h-5 text-[#2c6fb7]" /> Proctoring Activity Timeline
                </h4>
                {selectedLog.timeline.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No proctoring events recorded for this session.</p>
                ) : (
                  <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 pl-8">
                    {selectedLog.timeline.map((event, idx) => (
                      <div key={idx} className="relative group">
                        {/* Dot indicator */}
                        <div className={`absolute -left-[27px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${
                          event.event.includes("Cheating") || event.event.includes("Detected") || event.event.includes("Lost")
                            ? 'bg-red-500 animate-pulse ring-4 ring-red-100' : 'bg-blue-500'
                        }`} />
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-xs">{event.event}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{new Date(event.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-slate-500 text-xs mt-0.5 font-medium leading-relaxed">{event.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Student Answers vs Questions */}
              <div>
                <h4 className="font-bold text-slate-800 text-[15px] flex items-center gap-1.5 border-b border-slate-200 pb-2 mb-4">
                  <FileSpreadsheet className="w-5 h-5 text-[#2c6fb7]" /> Student Exam Answers
                </h4>
                {selectedLog.questions.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No exam questions mapped to this log.</p>
                ) : (
                  <div className="space-y-4">
                    {selectedLog.questions.map((q, idx) => {
                      const studentAns = selectedLog.answers[q.id];
                      const isCorrect = q.type === 'objective' ? (studentAns === q.correct_answer) : null;
                      
                      return (
                        <div key={q.id} className="bg-slate-50/50 border border-slate-200 rounded-lg p-4">
                          <div className="text-xs font-bold text-slate-500 mb-1">
                            Question {idx + 1} &bull; {q.points} {q.points === 1 ? 'Point' : 'Points'}
                          </div>
                          <p className="text-slate-800 font-semibold text-sm mb-3">{q.text}</p>
                          
                          <div className="space-y-2 text-xs">
                            {q.type === 'objective' ? (
                              <>
                                <div className="p-2 bg-slate-100 rounded text-slate-700">
                                  <strong>Option Options:</strong> {q.options?.join(', ')}
                                </div>
                                <div className={`p-2 rounded font-semibold ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  <strong>Student Answer:</strong> {studentAns || '[No Answer Submitted]'}
                                </div>
                                <div className="p-2 bg-emerald-50 text-emerald-800 rounded font-semibold border border-emerald-100">
                                  <strong>Correct Answer:</strong> {q.correct_answer}
                                </div>
                              </>
                            ) : (
                              <div className="p-3 bg-white border border-slate-200 rounded-lg text-slate-700 leading-relaxed font-semibold">
                                <span className="block text-slate-500 text-[10px] font-bold uppercase mb-1">Student Essay Response</span>
                                {studentAns || '[Blank response]'}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Grading Form */}
              <div className="border-t border-slate-200 pt-6">
                <h4 className="font-bold text-slate-800 text-[15px] flex items-center gap-1.5 mb-4">
                  <Award className="w-5 h-5 text-[#2c6fb7]" /> Instructor Evaluation & Grading
                </h4>
                
                <form onSubmit={handleGradeSubmit} className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Overall Score (%)</label>
                      <input 
                        type="number"
                        step="0.1"
                        min="0"
                        max={selectedLog.max_score}
                        value={gradeScore}
                        onChange={(e) => setGradeScore(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Letter Grade</label>
                      <select
                        value={gradeLetter}
                        onChange={(e) => setGradeLetter(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                      >
                        <option value="A">A (Excellent)</option>
                        <option value="B">B (Good)</option>
                        <option value="C">C (Satisfactory)</option>
                        <option value="D">D (Passing)</option>
                        <option value="F">F (Failed)</option>
                        <option value="Pending">Pending Grading</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Lecturer Feedback & Comments</label>
                    <textarea 
                      placeholder="Enter student feedback..."
                      value={gradeFeedback}
                      onChange={(e) => setGradeFeedback(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white h-24 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={gradeSubmitting}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    {gradeSubmitting ? 'Saving...' : 'Submit Student Evaluation'}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
