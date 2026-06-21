import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, CheckCircle, Clock, Users, ShieldCheck, Search, 
  Activity, RefreshCw, PlusCircle, Trash2, ListOrdered, CheckSquare, 
  BookOpen, X, Award, FileSpreadsheet, Eye, LogOut, ClipboardCheck,
  ChevronLeft, ChevronRight, Pencil, Radio, AlignLeft, AlertCircle,
  Layers, UserCheck, Edit3, List, ZoomIn
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
  faculty?: string;
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

interface ExamItem {
  exam_id: string;
  title: string;
  exam_type: string;
  duration_minutes: number;
  question_count: number;
  assigned_to: string;
  is_active: boolean;
}

interface StudentItem {
  registration_number: string;
  full_name: string;
  faculty: string;
}

const FACULTIES = [
  { code: 'ALL', label: 'All Students' },
  { code: 'FST', label: 'FST – Science & Technology' },
  { code: 'FBA', label: 'FBA – Business Administration' },
  { code: 'FLAW', label: 'FLAW – Faculty of Law' },
  { code: 'FED', label: 'FED – Education' },
  { code: 'FICT', label: 'FICT – Information & Communication Technology' },
  { code: 'FHSS', label: 'FHSS – Humanities & Social Sciences' },
  { code: 'FMED', label: 'FMED – Faculty of Medicine' },
];

export default function LecturerDashboard() {
  const [logs, setLogs] = useState<ExamLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'monitoring' | 'create_exam' | 'manage_exams'>('monitoring');

  // Real-time cheat alert states
  const [activeAlerts, setActiveAlerts] = useState<{ id: string; message: string; timestamp: Date }[]>([]);

  // Selected student for grading
  const [selectedLog, setSelectedLog] = useState<ExamLog | null>(null);
  const [gradingView, setGradingView] = useState(false);
  const [gradingQIndex, setGradingQIndex] = useState(0);
  const [questionScores, setQuestionScores] = useState<Record<string, number>>({});
  const [gradeLetter, setGradeLetter] = useState<string>('A');
  const [gradeFeedback, setGradeFeedback] = useState<string>('');
  const [gradeSubmitting, setGradeSubmitting] = useState(false);

  // Exam Creator States
  const [examId, setExamId] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [examDuration, setExamDuration] = useState('120');
  const [examType, setExamType] = useState<'objective' | 'essay'>('objective');
  const [questionsList, setQuestionsList] = useState<Question[]>([]);
  const [assignedTo, setAssignedTo] = useState('ALL');
  const [specificStudents, setSpecificStudents] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewQIndex, setPreviewQIndex] = useState(0);

  const [timelineLog, setTimelineLog] = useState<ExamLog | null>(null);
  const handleOpenTimeline = (log: ExamLog) => setTimelineLog(log);
  const handleCloseTimeline = () => setTimelineLog(null);

  // Edit exam states
  const [editMode, setEditMode] = useState(false);
  const [allExams, setAllExams] = useState<ExamItem[]>([]);
  const [allStudents, setAllStudents] = useState<StudentItem[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);

  // Temporary question creator states
  const [qText, setQText] = useState('');
  const [qPoints, setQPoints] = useState('1');
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState('');
  const [qCorrectIndex, setQCorrectIndex] = useState<number>(-1);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard-logs/');
      if (res.ok) {
        const data = await res.json();
        const currentLogs: ExamLog[] = data.logs || [];
        setLogs(currentLogs);

        currentLogs.forEach(log => {
          if (log.impersonation_flags > 0 && log.status === 'started') {
            const alertId = `${log.registration_number}-${log.impersonation_flags}`;
            setActiveAlerts(prev => {
              const hasAlert = prev.some(a => a.id === alertId);
              if (!hasAlert) {
                const newAlert = {
                  id: alertId,
                  message: `⚠️ ${log.student_name} (${log.registration_number}) triggered ${log.impersonation_flags} flag(s) in ${log.exam_id}`,
                  timestamp: new Date()
                };
                return [newAlert, ...prev].slice(0, 5);
              }
              return prev;
            });
          }
        });
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const fetchExams = useCallback(async () => {
    setLoadingExams(true);
    try {
      const res = await fetch('/api/exams/all/');
      if (res.ok) {
        const data = await res.json();
        setAllExams(data.exams || []);
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
    } finally {
      setLoadingExams(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'manage_exams') {
      fetchExams();
    }
  }, [activeTab, fetchExams]);

  const handleClearAlerts = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveAlerts([]);
  }, []);

  const handleOpenGrading = (log: ExamLog) => {
    setSelectedLog(log);
    setGradingQIndex(0);
    setGradeLetter(log.grade_letter || 'A');
    setGradeFeedback(log.feedback || '');
    // Initialize question scores
    const initScores: Record<string, number> = {};
    log.questions.forEach(q => {
      initScores[q.id] = 0;
    });
    setQuestionScores(initScores);
    setGradingView(true);
  };

  const handleCloseGrading = () => {
    setGradingView(false);
    setSelectedLog(null);
  };

  const totalGradingScore = Object.values(questionScores).reduce((a, b) => a + b, 0);

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLog) return;
    
    const totalScore = selectedLog.max_score > 0 
      ? (totalGradingScore / selectedLog.max_score) * 100
      : totalGradingScore;

    setGradeSubmitting(true);
    try {
      const response = await fetch(`/api/exams/${selectedLog.exam_id}/grade/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_number: selectedLog.registration_number,
          score: totalScore,
          grade_letter: gradeLetter,
          feedback: gradeFeedback
        })
      });

      if (response.ok) {
        await fetchLogs();
        alert('Grading submitted successfully!');
        handleCloseGrading();
      } else {
        alert('Failed to save grading.');
      }
    } catch (err) {
      alert('Error submitting grade.');
    } finally {
      setGradeSubmitting(false);
    }
  };

  // ─── Edit Exam Logic ──────────────────────────────────────────────────────
  const handleEditExam = async (id: string) => {
    try {
      const res = await fetch(`/api/exams/${id}/full/`);
      if (res.ok) {
        const data = await res.json();
        const exam = data;
        setExamId(exam.exam_id);
        setExamTitle(exam.title);
        setExamDuration(exam.duration_minutes.toString());
        setExamType(exam.exam_type as 'objective' | 'essay');
        setAssignedTo(exam.assigned_to || 'ALL');
        setSpecificStudents(exam.specific_students || '');
        setQuestionsList(exam.questions || []);
        setEditMode(true);
        setActiveTab('create_exam');
      } else {
        alert('Failed to load exam details.');
      }
    } catch (err) {
      alert('Error fetching exam details.');
      console.error(err);
    }
  };

  // ─── Question builder ─────────────────────────────────────────────────────
  const handleAddQuestion = () => {
    if (!qText.trim()) return;

    if (examType === 'objective') {
      const filledOptions = qOptions.filter(o => o.trim() !== '');
      if (filledOptions.length < 2) {
        alert('Please add at least 2 answer options.');
        return;
      }
      if (qCorrectIndex < 0 || !qOptions[qCorrectIndex]?.trim()) {
        alert('Please select the correct answer by clicking ★ next to an option.');
        return;
      }
    }

    const newQ: Question = {
      id: `q${Date.now()}`,
      type: examType === 'objective' ? 'multiple_choice' : 'essay',
      text: qText.trim(),
      points: parseInt(qPoints) || 1,
    };

    if (examType === 'objective') {
      newQ.options = qOptions.filter(o => o.trim() !== '');
      newQ.correct_answer = qOptions[qCorrectIndex].trim();
    }

    setQuestionsList([...questionsList, newQ]);
    setQText('');
    setQPoints('1');
    setQOptions(['', '', '', '']);
    setQCorrect('');
    setQCorrectIndex(-1);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestionsList(questionsList.filter((_, i) => i !== idx));
  };

  // ─── Exam submission ──────────────────────────────────────────────────────
  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examId || !examTitle || questionsList.length === 0) {
      alert('Please fill all exam fields and add at least one question.');
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
          questions: questionsList,
          assigned_to: assignedTo,
          specific_students: specificStudents
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert('Paper has been successfully published');
        resetExamForm();
        setShowPreview(false);
        setActiveTab('monitoring');
        fetchLogs();
      } else {
        alert('Failed to create exam paper.');
      }
    } catch (err) {
      alert('Error sending exam request.');
    } finally {
      setLoading(false);
    }
  };

  const resetExamForm = () => {
    setExamId('');
    setExamTitle('');
    setExamDuration('120');
    setQuestionsList([]);
    setAssignedTo('ALL');
    setSpecificStudents('');
    setEditMode(false);
  };

  // ─── Load existing exam for editing ──────────────────────────────────────
  const fetchAllExams = async () => {
    setLoadingExams(true);
    try {
      const res = await fetch('/api/exams/all/');
      if (res.ok) {
        const data = await res.json();
        setAllExams(data.exams || []);
      }
    } finally {
      setLoadingExams(false);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const res = await fetch('/api/students/');
      if (res.ok) {
        const data = await res.json();
        setAllStudents(data.students || []);
      }
    } catch {}
  };

  const handleLoadExam = async (eid: string) => {
    try {
      const res = await fetch(`/api/exams/${eid}/full/`);
      if (res.ok) {
        const data = await res.json();
        setExamId(data.exam_id);
        setExamTitle(data.title);
        setExamDuration(String(data.duration_minutes || 120));
        setExamType(data.exam_type === 'objective' ? 'objective' : 'essay');
        setQuestionsList(data.questions || []);
        setAssignedTo(data.assigned_to || 'ALL');
        setSpecificStudents(data.specific_students || '');
        setEditMode(true);
        setAllExams([]); // close picker
      }
    } catch {
      alert('Failed to load exam.');
    }
  };

  useEffect(() => {
    if (activeTab === 'create_exam') {
      fetchAllStudents();
    }
  }, [activeTab]);

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

  const activeStudents = logs.filter(l => l.status === 'started');
  const totalStudents = new Set(logs.map(l => l.registration_number)).size;
  const flaggedStudents = logs.filter(l => l.impersonation_flags > 0).length;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen font-sans flex flex-col pb-10" style={{ backgroundColor: 'var(--color-page-bg, #f1f5f9)' }}>

      {/* ── Real-time Alert Banner ─────────────────────────────────────────── */}
      {activeAlerts.length > 0 && (
        <div className="bg-red-600 text-white px-4 py-3 shadow-md flex flex-col gap-2 z-40 border-b border-red-700">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 animate-bounce" />
              <span className="font-bold text-sm">Real-time Invigilation Alert</span>
              <span className="text-xs font-semibold bg-red-700 px-2.5 py-0.5 rounded-full">
                {activeAlerts.length} Active {activeAlerts.length === 1 ? 'Flag' : 'Flags'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearAlerts}
              className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-4 py-1.5 rounded-lg border border-white/30 transition-colors active:scale-95"
            >
              Clear Alerts
            </button>
          </div>
          <div className="max-w-7xl mx-auto w-full flex flex-col gap-1 pl-7">
            {activeAlerts.map(alert => (
              <div key={alert.id} className="text-xs font-medium opacity-90">
                &bull; {alert.message} <span className="opacity-60">({alert.timestamp.toLocaleTimeString()})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#2c6fb7] text-white p-2 rounded-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Victoria University</h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide">Proctoring & Exam Administration &bull; <span className="text-[#2c6fb7] font-bold">v1.0.0</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
                {editMode ? 'Edit Exam' : 'Set Exam Paper'}
              </button>
              <button
                onClick={() => setActiveTab('manage_exams')}
                className={`px-4 py-1.5 rounded-md font-bold transition-all ${
                  activeTab === 'manage_exams' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Manage Exams
              </button>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-xs font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">

        {/* ══════════════ MONITORING TAB ══════════════ */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6">

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Total Students</p>
                  <p className="text-2xl font-bold text-slate-800">{totalStudents}</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Active Now</p>
                  <p className="text-2xl font-bold text-emerald-600">{activeStudents.length}</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Flagged</p>
                  <p className="text-2xl font-bold text-red-600">{flaggedStudents}</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Graded</p>
                  <p className="text-2xl font-bold text-slate-800">{logs.filter(l => l.status === 'graded').length}</p>
                </div>
              </div>
            </div>

            {/* ── Active Students Live Panel ────────────────────────────── */}
            {activeStudents.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-emerald-100 bg-emerald-50 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <h2 className="font-bold text-emerald-800 text-sm">Students Currently Taking Exam ({activeStudents.length})</h2>
                  <span className="ml-auto text-[10px] text-emerald-600 font-medium">Live — refreshes every 10s</span>
                </div>
                <div className="p-4 flex flex-wrap gap-3">
                  {activeStudents.map(log => (
                    <button
                      key={log.id}
                      onClick={() => handleOpenGrading(log)}
                      className="flex items-center gap-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-400 rounded-xl px-4 py-2.5 transition-all group"
                    >
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-[#2c6fb7] text-white flex items-center justify-center font-bold text-sm">
                          {log.student_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-slate-800 group-hover:text-[#2c6fb7] transition-colors">{log.student_name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{log.registration_number} &bull; {log.exam_id}</p>
                      </div>
                      {log.impersonation_flags > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenTimeline(log); }}
                          className="ml-1 text-[10px] bg-red-100 text-red-600 hover:bg-red-200 font-bold px-1.5 py-0.5 rounded-full transition-colors"
                        >
                          {log.impersonation_flags}⚠
                        </button>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Logs Table ───────────────────────────────────────────── */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  All Exam Sessions
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
                      <th className="px-6 py-4 font-bold border-b border-slate-200">Student</th>
                      <th className="px-6 py-4 font-bold border-b border-slate-200">Exam</th>
                      <th className="px-6 py-4 font-bold border-b border-slate-200">Status</th>
                      <th className="px-6 py-4 font-bold border-b border-slate-200">Flags</th>
                      <th className="px-6 py-4 font-bold border-b border-slate-200">Score</th>
                      <th className="px-6 py-4 font-bold border-b border-slate-200 text-right">Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{log.student_name}</div>
                          <div className="text-xs text-slate-500 font-mono">{log.registration_number}</div>
                          {log.faculty && <div className="text-[10px] text-[#2c6fb7] font-bold mt-0.5">{log.faculty}</div>}
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
                            {log.status === 'started' && <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />}
                            {log.status === 'graded' ? 'Graded' : log.status === 'submitted' ? 'Pending Review' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {log.impersonation_flags > 0 ? (
                            <button 
                              onClick={() => handleOpenTimeline(log)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" /> {log.impersonation_flags}
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs font-medium">Clean</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {log.status === 'graded' ? (
                            <div className="text-sm font-bold text-slate-800">{log.score.toFixed(1)}% ({log.grade_letter})</div>
                          ) : (
                            <span className="text-slate-400 text-xs">Pending</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenGrading(log)}
                            title="Review & Grade"
                            className="inline-flex items-center gap-1.5 text-[#2c6fb7] hover:text-white hover:bg-[#2c6fb7] font-bold text-xs bg-blue-50 hover:shadow-md px-3 py-1.5 rounded-lg border border-blue-100 transition-all"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                            <span className="hidden sm:inline">Review</span>
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
        )}

        {/* ══════════════ MANAGE EXAMS TAB ══════════════ */}
        {activeTab === 'manage_exams' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#2c6fb7]" /> Published Examination Papers
                </h3>
                <button
                  type="button"
                  onClick={() => { fetchExams(); }}
                  className="flex items-center gap-1.5 text-[#2c6fb7] text-sm font-bold hover:underline"
                >
                  <RefreshCw className="w-4 h-4" /> Refresh List
                </button>
              </div>

              {loadingExams && (
                <div className="p-6 text-center text-slate-400 text-sm">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading exams...
                </div>
              )}

              {!loadingExams && allExams.length === 0 && (
                <div className="p-10 text-center flex flex-col items-center">
                  <BookOpen className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-slate-500 font-medium">No published exams found.</p>
                  <button onClick={() => setActiveTab('create_exam')} className="mt-4 text-[#2c6fb7] font-bold text-sm hover:underline">
                    Create your first exam
                  </button>
                </div>
              )}

              {allExams.length > 0 && (
                <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                  {allExams.map(exam => (
                    <button
                      key={exam.exam_id}
                      type="button"
                      onClick={() => handleEditExam(exam.exam_id)}
                      className="w-full text-left flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition-all group"
                    >
                      <div>
                        <p className="font-bold text-slate-800 text-base group-hover:text-[#2c6fb7] mb-1">{exam.title}</p>
                        <p className="text-xs font-medium text-slate-500 flex gap-3">
                          <span><span className="font-bold text-slate-400">ID:</span> {exam.exam_id}</span>
                          <span>&bull;</span>
                          <span><span className="font-bold text-slate-400">Type:</span> {exam.exam_type}</span>
                          <span>&bull;</span>
                          <span><span className="font-bold text-slate-400">Questions:</span> {exam.question_count}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-400 group-hover:text-[#2c6fb7] bg-white px-3 py-1.5 border border-slate-200 rounded-md shadow-sm">
                        <Edit3 className="w-4 h-4" /> Edit Paper
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ CREATE/EDIT EXAM TAB ══════════════ */}
        {activeTab === 'create_exam' && (
          <div className="max-w-4xl mx-auto space-y-6">

            {/* ── Exam Form ───────────────────────────────────────────── */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className={`px-8 py-5 text-white flex justify-between items-center ${editMode ? 'bg-indigo-700' : 'bg-[#2c6fb7]'}`}>
                <div>
                  <h2 className="text-lg font-bold">{editMode ? '✏️ Editing Exam Paper' : 'Set Examination Paper'}</h2>
                  <p className="text-blue-100 text-xs mt-0.5">
                    {editMode ? `Modifying: ${examId}` : 'Author assessment structures and publish them to student portals.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {editMode && (
                    <button
                      type="button"
                      onClick={resetExamForm}
                      className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-bold"
                    >
                      New Exam
                    </button>
                  )}
                  <BookOpen className="w-8 h-8 text-blue-100 opacity-80" />
                </div>
              </div>

              <form onSubmit={handleExamSubmit} className="p-8 space-y-6">
                {/* Exam Meta */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Course Code / Exam ID</label>
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
                      placeholder="e.g., Database Systems I – Final Examination"
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
                      <option value="objective">Objective (Auto-Graded MCQs)</option>
                      <option value="essay">Essay (Instructor-Graded)</option>
                    </select>
                  </div>
                </div>

                {/* ── Assignment Section ──────────────────────────────── */}
                <div className="border border-slate-200 rounded-xl p-5 space-y-4 bg-slate-50">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#2c6fb7]" /> Assign Paper To
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {['ALL', 'FACULTY', 'SPECIFIC'].map(mode => (
                      <label key={mode} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${assignedTo === mode || (mode === 'FACULTY' && !['ALL','SPECIFIC'].includes(assignedTo)) ? 'border-[#2c6fb7] bg-blue-50 text-[#2c6fb7]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                        <input
                          type="radio"
                          name="assignMode"
                          value={mode}
                          checked={mode === 'FACULTY' ? !['ALL','SPECIFIC'].includes(assignedTo) : assignedTo === mode}
                          onChange={() => {
                            if (mode === 'FACULTY') setAssignedTo('FST');
                            else setAssignedTo(mode);
                          }}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${(mode === 'FACULTY' ? !['ALL','SPECIFIC'].includes(assignedTo) : assignedTo === mode) ? 'border-[#2c6fb7]' : 'border-slate-300'}`}>
                          {(mode === 'FACULTY' ? !['ALL','SPECIFIC'].includes(assignedTo) : assignedTo === mode) && <div className="w-2 h-2 bg-[#2c6fb7] rounded-full" />}
                        </div>
                        <span className="text-xs font-bold">
                          {mode === 'ALL' ? 'All Students' : mode === 'FACULTY' ? 'By Faculty' : 'Specific Students'}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Faculty picker */}
                  {!['ALL', 'SPECIFIC'].includes(assignedTo) && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Select Faculty</label>
                      <select
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white"
                      >
                        {FACULTIES.filter(f => f.code !== 'ALL').map(f => (
                          <option key={f.code} value={f.code}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Specific students */}
                  {assignedTo === 'SPECIFIC' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">
                        Select Specific Students ({allStudents.length} registered)
                      </label>
                      <div className="bg-white border border-slate-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                        {allStudents.map(s => {
                          const selected = specificStudents.split(',').map(x => x.trim()).includes(s.registration_number);
                          return (
                            <label key={s.registration_number} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 ${selected ? 'bg-blue-50' : ''}`}>
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(e) => {
                                  const current = specificStudents.split(',').map(x => x.trim()).filter(Boolean);
                                  if (e.target.checked) {
                                    setSpecificStudents([...current, s.registration_number].join(','));
                                  } else {
                                    setSpecificStudents(current.filter(r => r !== s.registration_number).join(','));
                                  }
                                }}
                                className="rounded border-slate-300"
                              />
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{s.full_name}</p>
                                <p className="text-[10px] text-slate-500">{s.registration_number} &bull; {s.faculty}</p>
                              </div>
                            </label>
                          );
                        })}
                        {allStudents.length === 0 && (
                          <p className="px-4 py-4 text-sm text-slate-400 text-center">No registered students found.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Question List ───────────────────────────────────── */}
                <div className="border-t border-slate-100 pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-md font-bold text-slate-800 flex items-center gap-1.5">
                      <ListOrdered className="w-5 h-5 text-[#2c6fb7]" /> Questions ({questionsList.length})
                    </h3>
                    {questionsList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => { setShowPreview(true); setPreviewQIndex(0); }}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors"
                      >
                        <ZoomIn className="w-4 h-4" /> Preview Paper
                      </button>
                    )}
                  </div>
                  {questionsList.length === 0 ? (
                    <div className="bg-slate-50 border border-dashed border-slate-200 text-center py-8 text-slate-400 text-sm font-medium rounded-lg">
                      No questions added yet. Build the exam below.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {questionsList.map((q, idx) => (
                        <div key={q.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="text-xs font-bold text-indigo-600 mb-1">
                              Q{idx + 1} &bull; {q.points} {q.points === 1 ? 'pt' : 'pts'} &bull; {q.type === 'multiple_choice' ? 'MCQ' : 'Essay'}
                            </div>
                            <p className="text-slate-800 font-semibold text-sm">{q.text}</p>
                            {q.type === 'multiple_choice' && q.options && (
                              <div className="grid grid-cols-2 gap-1.5 mt-2 pl-2">
                                {q.options.map((opt, i) => (
                                  <div key={i} className={`text-xs p-1.5 rounded ${opt === q.correct_answer ? 'bg-green-100 text-green-800 font-bold border border-green-200' : 'bg-white text-slate-500 border border-slate-200'}`}>
                                    {String.fromCharCode(65 + i)}. {opt} {opt === q.correct_answer && '✓'}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(idx)}
                            className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Question Builder ────────────────────────────────── */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4 text-indigo-600" /> Add Question
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Question Text</label>
                    <textarea
                      placeholder="Type your question here..."
                      value={qText}
                      onChange={(e) => setQText(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 h-24 resize-none bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Marks / Points</label>
                      <input
                        type="number"
                        min="1"
                        value={qPoints}
                        onChange={(e) => setQPoints(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white"
                      />
                    </div>
                  </div>

                  {examType === 'objective' && (
                    <div className="space-y-3 pt-2">
                      <label className="block text-xs font-bold text-slate-600">
                        Answer Options — click ★ to mark the correct answer
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {qOptions.map((opt, i) => (
                          <div key={i} className={`flex gap-2 items-center p-2 rounded-lg border transition-all ${qCorrectIndex === i ? 'border-green-400 bg-green-50' : 'border-slate-200 bg-white'}`}>
                            <span className="text-xs font-bold text-slate-400 w-5 text-center">{String.fromCharCode(65 + i)}.</span>
                            <input
                              type="text"
                              placeholder={`Option ${String.fromCharCode(65 + i)}`}
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...qOptions];
                                newOpts[i] = e.target.value;
                                setQOptions(newOpts);
                              }}
                              className="flex-1 text-sm border-0 outline-none bg-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => setQCorrectIndex(i)}
                              title="Mark as correct answer"
                              className={`text-base transition-all ${qCorrectIndex === i ? 'text-green-600' : 'text-slate-300 hover:text-amber-400'}`}
                            >
                              {qCorrectIndex === i ? '✓' : '★'}
                            </button>
                          </div>
                        ))}
                      </div>
                      {qCorrectIndex >= 0 && qOptions[qCorrectIndex] && (
                        <p className="text-xs text-green-700 font-semibold">
                          ✓ Correct answer: "{qOptions[qCorrectIndex]}"
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-sm border border-indigo-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" /> Add Question to Paper
                  </button>
                </div>

                {/* Submit row */}
                <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowPreview(true); setPreviewQIndex(0); }}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-5 h-5" /> Preview Exam
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-[#2c6fb7] hover:bg-[#1a5ba0] text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                    {editMode ? 'Publish Changes' : 'Publish Exam'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ══════════════ PREVIEW MODAL ══════════════ */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-[#1a365d] px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-white text-lg">{examTitle || 'Exam Preview'}</h2>
                <p className="text-blue-200 text-xs">{examId} &bull; Preview Mode (read-only)</p>
              </div>
              <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {questionsList.length === 0 ? (
                <p className="text-slate-400 text-center py-10">No questions added yet.</p>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-slate-600">Question {previewQIndex + 1} of {questionsList.length}</span>
                    <span className="text-xs bg-blue-50 text-[#2c6fb7] px-3 py-1 rounded-full font-bold border border-blue-100">
                      {questionsList[previewQIndex].points} {questionsList[previewQIndex].points === 1 ? 'Point' : 'Points'}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-1.5 rounded-full mb-6">
                    <div className="h-full bg-[#2c6fb7] rounded-full transition-all" style={{ width: `${((previewQIndex + 1) / questionsList.length) * 100}%` }} />
                  </div>

                  <p className="text-slate-800 font-semibold text-base leading-relaxed mb-6">
                    {questionsList[previewQIndex].text}
                  </p>

                  {questionsList[previewQIndex].type === 'multiple_choice' && (
                    <div className="space-y-3">
                      {questionsList[previewQIndex].options?.map((opt, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50">
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                          <span className="text-slate-700 font-medium">{String.fromCharCode(65 + i)}. {opt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {questionsList[previewQIndex].type === 'essay' && (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 min-h-32 flex items-start">
                      <p className="text-slate-400 text-sm italic">Student will type essay response here...</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-4 flex items-center justify-between bg-slate-50">
              <button
                onClick={() => setPreviewQIndex(i => Math.max(0, i - 1))}
                disabled={previewQIndex === 0}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500 font-medium">
                  {previewQIndex + 1} / {questionsList.length}
                </span>
                <button
                  onClick={handleExamSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-[#2c6fb7] hover:bg-[#1a5ba0] text-white font-bold rounded-lg shadow-md transition-colors flex items-center gap-2"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                  Publish Exam
                </button>
              </div>
              <button
                onClick={() => setPreviewQIndex(i => Math.min(questionsList.length - 1, i + 1))}
                disabled={previewQIndex === questionsList.length - 1}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold disabled:opacity-40"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ QUESTION-BY-QUESTION GRADING FULL PAGE ══════════════ */}
      {gradingView && selectedLog && (
        <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col overflow-hidden">
          {/* Grading Header */}
          <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2c6fb7] flex items-center justify-center text-white font-bold text-lg">
                {selectedLog.student_name.charAt(0)}
              </div>
              <div>
                <h2 className="font-bold text-white text-lg">{selectedLog.student_name}</h2>
                <p className="text-slate-400 text-xs font-mono">{selectedLog.registration_number} &bull; {selectedLog.exam_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedLog.exam_type === 'objective' && (
                <div className="bg-slate-700 px-4 py-2 rounded-lg text-center">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Running Score</p>
                  <p className="text-white font-black text-xl">{totalGradingScore} <span className="text-slate-400 text-sm font-medium">/ {selectedLog.max_score}</span></p>
                </div>
              )}
              <button onClick={handleCloseGrading} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Left: Question Navigator */}
            <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col flex-shrink-0">
              <div className="p-4 border-b border-slate-700">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Questions</p>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {selectedLog.questions.map((q, idx) => {
                  const answered = !!selectedLog.answers[q.id];
                  const isCurrent = idx === gradingQIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setGradingQIndex(idx)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${isCurrent ? 'bg-[#2c6fb7] text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                    >
                      <p className="text-xs font-bold">Q{idx + 1} &bull; {q.points} pts</p>
                      <p className="text-[11px] opacity-70 truncate mt-0.5">{q.text.slice(0, 35)}...</p>
                      {answered ? (
                        <span className="text-[10px] text-emerald-400 font-bold">✓ Answered</span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold">— No answer</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Center: Question + Answer */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-900">
              {selectedLog.questions.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-500">No questions in this exam.</div>
              ) : (() => {
                const q = selectedLog.questions[gradingQIndex];
                const studentAns = selectedLog.answers[q.id];
                const isCorrect = q.type === 'multiple_choice' ? studentAns === q.correct_answer : null;

                return (
                  <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-2xl mx-auto space-y-6">
                      {/* Question */}
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <span className="bg-[#2c6fb7]/20 text-[#2c6fb7] text-xs font-black px-3 py-1 rounded-full border border-[#2c6fb7]/30">
                            Question {gradingQIndex + 1} of {selectedLog.questions.length}
                          </span>
                          <span className="text-slate-400 text-xs">{q.points} {q.points === 1 ? 'point' : 'points'}</span>
                        </div>
                        <p className="text-white text-lg font-semibold leading-relaxed">{q.text}</p>
                      </div>

                      {/* MCQ Options */}
                      {q.type === 'multiple_choice' && q.options && (
                        <div className="space-y-2.5">
                          {q.options.map((opt, i) => {
                            const isStudentChoice = studentAns === opt;
                            const isCorrectOpt = opt === q.correct_answer;
                            return (
                              <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                                isCorrectOpt ? 'border-emerald-500 bg-emerald-500/10' :
                                isStudentChoice ? 'border-red-500 bg-red-500/10' :
                                'border-slate-700 bg-slate-800'
                              }`}>
                                <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${isCorrectOpt ? 'bg-emerald-500 text-white' : isStudentChoice ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                                  {String.fromCharCode(65 + i)}
                                </span>
                                <span className={`text-sm font-medium ${isCorrectOpt ? 'text-emerald-300' : isStudentChoice ? 'text-red-300' : 'text-slate-300'}`}>{opt}</span>
                                <div className="ml-auto flex gap-2">
                                  {isCorrectOpt && <span className="text-emerald-400 text-xs font-bold">✓ Correct</span>}
                                  {isStudentChoice && !isCorrectOpt && <span className="text-red-400 text-xs font-bold">✗ Student's answer</span>}
                                  {isStudentChoice && isCorrectOpt && <span className="text-emerald-400 text-xs font-bold">✓ Student answered correctly</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Essay Answer */}
                      {q.type === 'essay' && (
                        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">Student's Response</p>
                          <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                            {studentAns || <em className="text-slate-500">No answer submitted.</em>}
                          </p>
                        </div>
                      )}

                      {/* Score input for this question */}
                      <div className="bg-slate-800 rounded-xl border border-slate-600 p-5">
                        <label className="block text-slate-300 text-sm font-bold mb-3">
                          Score for this question (max {q.points} pts)
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="0"
                            max={q.points}
                            step="0.5"
                            value={questionScores[q.id] ?? 0}
                            onChange={(e) => setQuestionScores(prev => ({
                              ...prev,
                              [q.id]: Math.min(q.points, Math.max(0, parseFloat(e.target.value) || 0))
                            }))}
                            className="w-28 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-bold text-lg text-center focus:outline-none focus:border-[#2c6fb7]"
                          />
                          <span className="text-slate-400 font-medium">/ {q.points} points</span>
                          {q.type === 'multiple_choice' && (
                            <button
                              type="button"
                              onClick={() => setQuestionScores(prev => ({ ...prev, [q.id]: isCorrect ? q.points : 0 }))}
                              className="ml-auto text-xs bg-slate-700 hover:bg-[#2c6fb7] text-slate-300 hover:text-white px-3 py-1.5 rounded-lg font-bold transition-colors"
                            >
                              Auto-fill
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Navigation controls */}
              <div className="border-t border-slate-700 p-4 flex items-center justify-between bg-slate-800 flex-shrink-0">
                <button
                  onClick={() => setGradingQIndex(i => Math.max(0, i - 1))}
                  disabled={gradingQIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <div className="flex gap-1.5">
                  {selectedLog.questions.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setGradingQIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${idx === gradingQIndex ? 'bg-[#2c6fb7] scale-125' : 'bg-slate-600 hover:bg-slate-400'}`}
                    />
                  ))}
                </div>

                {gradingQIndex < selectedLog.questions.length - 1 ? (
                  <button
                    onClick={() => setGradingQIndex(i => i + 1)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#2c6fb7] hover:bg-[#1a5ba0] text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => document.getElementById('final-grading-panel')?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    Final Grade <Award className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Right: Final Grading Panel */}
            <div className="w-72 bg-slate-800 border-l border-slate-700 flex flex-col flex-shrink-0" id="final-grading-panel">
              <div className="p-4 border-b border-slate-700">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Final Evaluation</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">

                {/* Question score summary */}
                <div className="space-y-2">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Score Summary</p>
                  {selectedLog.questions.map((q, idx) => (
                    <div key={q.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Q{idx + 1}</span>
                      <span className="text-white font-bold">{questionScores[q.id] ?? 0} / {q.points}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-600 pt-2 flex items-center justify-between">
                    <span className="text-slate-300 font-bold text-sm">Total</span>
                    <span className="text-white font-black text-base">
                      {totalGradingScore} / {selectedLog.max_score} pts
                      &nbsp;({selectedLog.max_score > 0 ? ((totalGradingScore / selectedLog.max_score) * 100).toFixed(1) : '0'}%)
                    </span>
                  </div>
                </div>

                <form onSubmit={handleGradeSubmit} className="space-y-4 border-t border-slate-700 pt-4">
                  <div>
                    <label className="block text-slate-300 text-xs font-bold mb-1.5">Letter Grade</label>
                    <select
                      value={gradeLetter}
                      onChange={(e) => setGradeLetter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-[#2c6fb7]"
                    >
                      <option value="A">A – Excellent (90%+)</option>
                      <option value="B">B – Good (80–89%)</option>
                      <option value="C">C – Satisfactory (70–79%)</option>
                      <option value="D">D – Passing (60–69%)</option>
                      <option value="F">F – Failed (&lt;60%)</option>
                      <option value="Pending">Pending Review</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-bold mb-1.5">Feedback & Comments</label>
                    <textarea
                      placeholder="Enter feedback for the student..."
                      value={gradeFeedback}
                      onChange={(e) => setGradeFeedback(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm h-28 resize-none focus:outline-none focus:border-[#2c6fb7]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={gradeSubmitting}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                  >
                    {gradeSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                    {gradeSubmitting ? 'Saving...' : 'Submit Grades'}
                  </button>
                </form>

                {/* Proctoring flags */}
                {selectedLog.impersonation_flags > 0 && (
                  <div className="border border-red-700 bg-red-900/30 rounded-xl p-3">
                    <p className="text-red-400 text-xs font-bold flex items-center gap-1.5 mb-2">
                      <ShieldAlert className="w-4 h-4" /> Proctoring Flags: {selectedLog.impersonation_flags}
                    </p>
                    <p className="text-red-300 text-[11px]">Review timeline for cheating incidents before finalising grade.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ══════════════ TIMELINE SIDEBAR ══════════════ */}
      {timelineLog && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end overflow-hidden">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slide-in-right">
            <div className="bg-red-600 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-6 h-6" />
                <div>
                  <h3 className="font-bold text-lg leading-tight">Proctoring Flags</h3>
                  <p className="text-red-100 text-xs">{timelineLog.student_name} &bull; {timelineLog.exam_id}</p>
                </div>
              </div>
              <button onClick={handleCloseTimeline} className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-600">Total Flags</span>
                <span className="text-lg font-black text-red-600">{timelineLog.impersonation_flags}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                The timeline below displays all recorded incidents for this student during the examination session.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {timelineLog.timeline && timelineLog.timeline.length > 0 ? (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200">
                  {timelineLog.timeline.map((event, idx) => {
                    const isFlag = event.event.includes("Mismatch") || event.event.includes("Multiple") || event.event.includes("No Face") || event.event.includes("Covered") || event.event.includes("Bypassed") || event.event.includes("Multiple Faces Detected") || event.event.includes("Camera Covered");
                    return (
                      <div key={idx} className="relative flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-4 border-white shadow-sm z-10 ${isFlag ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                          {isFlag ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div className={`flex-1 rounded-xl p-4 shadow-sm border ${isFlag ? 'bg-red-50 border-red-100' : 'bg-white border-slate-200'}`}>
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm font-bold ${isFlag ? 'text-red-700' : 'text-slate-700'}`}>{event.event}</h4>
                            <span className="text-[10px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100 shadow-sm">
                              {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                          <p className={`text-xs mt-1 leading-relaxed ${isFlag ? 'text-red-600' : 'text-slate-600'}`}>{event.details}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 flex flex-col items-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h4 className="text-slate-800 font-bold mb-1">No Timeline Events</h4>
                  <p className="text-slate-500 text-sm">This student has a clean record.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
