import React, { useState, useEffect } from 'react';
import { Clock, ChevronLeft, ChevronRight, CheckCircle2, List, Flag, ShieldCheck, AlertTriangle } from 'lucide-react';
import WebcamMonitor from './WebcamMonitor';

interface Question {
  id: string;
  type: 'multiple_choice' | 'essay';
  text: string;
  options?: string[];
  points: number;
}

const mockQuestions: Question[] = [
  { id: 'q1', type: 'multiple_choice', text: 'Which of the following is not a property of a transaction (ACID)?', options: ['Atomicity', 'Consistency', 'Isolation', 'Distribution'], points: 1 },
  { id: 'q2', type: 'multiple_choice', text: 'In relational algebra, which operator is used to combine tuples from two relations?', options: ['Projection', 'Selection', 'Join', 'Union'], points: 2 },
  { id: 'q3', type: 'essay', text: 'Explain the difference between First Normal Form (1NF) and Second Normal Form (2NF) with an example. Outline how update anomalies are prevented.', points: 10 },
  { id: 'q4', type: 'multiple_choice', text: 'Which SQL statement is used to extract data from a database?', options: ['SELECT', 'GET', 'OPEN', 'EXTRACT'], points: 1 },
  { id: 'q5', type: 'multiple_choice', text: 'What constraint ensures that a column cannot have a NULL value?', options: ['UNIQUE', 'NOT NULL', 'PRIMARY KEY', 'Both NOT NULL and PRIMARY KEY'], points: 1 },
  { id: 'q6', type: 'essay', text: 'Describe the B-Tree index structure. Why is it commonly used in database systems for physical storage optimization?', points: 5 },
  { id: 'q7', type: 'multiple_choice', text: 'Which of these concurrency control protocols uses timestamps to sequence transactions?', options: ['Two-Phase Locking', 'Timestamp Ordering', 'Graph-Based Protocol', 'Validation-Based Protocol'], points: 2 },
  { id: 'q8', type: 'multiple_choice', text: 'Data independence in a DBMS refers to:', options: ['Data is independent of applications', 'Data is independent of hardware', 'Programs are not dependent on the physical or logical structure of data', 'All of the above'], points: 1 },
  { id: 'q9', type: 'essay', text: 'Write an SQL query to find the second highest salary from an Employee table without using the LIMIT or TOP keywords.', points: 5 },
  { id: 'q10', type: 'multiple_choice', text: 'A transaction that has not been completely executed but will not be executed further is said to be:', options: ['Active', 'Partially Committed', 'Failed', 'Aborted'], points: 1 },
];

export default function ExamInterface({ examId }: { examId: string }) {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(7200); // 2 hours
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (qid: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qid]: value }));
  };

  const toggleFlag = (qid: string) => {
    setFlagged(prev => ({ ...prev, [qid]: !prev[qid] }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <CheckCircle2 className="w-10 h-10" strokeWidth={2.5}/>
        </div>
        <h2 className="text-3xl font-bold text-[#1a365d] mb-4 tracking-tight">Exam Submitted Successfully</h2>
        <p className="text-slate-600 text-lg mb-10 leading-relaxed">
          Your secure exam record for <strong>{examId}</strong> has been securely recorded and uploaded. You may now close this window or return to the dashboard.
        </p>
        <a href="/dashboard" className="px-8 py-3.5 bg-[#2c6fb7] hover:bg-[#1a5ba0] text-white font-bold rounded-lg shadow-md transition-colors">
          Return to Dashboard
        </a>
      </div>
    );
  }

  const q = mockQuestions[currentQIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / mockQuestions.length) * 100;
  const isUrgent = timeLeft < 300;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
      
      {/* Left Column: Navigator & Status */}
      <div className="xl:col-span-1 flex flex-col gap-6">
        
        {/* Timer Card */}
        <div className={`bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border ${isUrgent ? 'border-red-200' : 'border-slate-200'} p-6 text-center transition-all`}>
          <h2 className={`text-sm font-bold uppercase tracking-widest mb-2 flex items-center justify-center gap-2 ${isUrgent ? 'text-red-500' : 'text-slate-500'}`}>
            {isUrgent ? <AlertTriangle className="w-4 h-4 animate-bounce" /> : <Clock className="w-4 h-4" />} 
            Time Remaining
          </h2>
          <div className={`text-5xl font-black font-mono tracking-tight ${isUrgent ? 'text-red-600' : 'text-[#1a365d]'}`}>
            {formatTime(timeLeft)}
          </div>
          {isUrgent && <p className="text-red-500 text-xs font-bold mt-2">Less than 5 minutes remaining!</p>}
        </div>

        {/* Question Grid navigator */}
        <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200 p-6 flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[#1a365d] font-bold flex items-center gap-2 text-[15px]">
              <List className="w-5 h-5 text-[#2c6fb7]" /> Exam Navigator
            </h2>
            <span className="text-[#2c6fb7] text-xs font-bold">{Math.round(progress)}% done</span>
          </div>

          <div className="w-full bg-slate-100 h-1.5 rounded-full mb-6 overflow-hidden">
             <div className="h-full bg-[#2c6fb7] rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
          
          <div className="grid grid-cols-5 gap-2 overflow-y-auto pr-2 pb-2">
            {mockQuestions.map((q, idx) => {
              const answered = !!answers[q.id];
              const isCurrent = idx === currentQIndex;
              const isFlagged = flagged[q.id];
              
              let baseClasses = "w-full aspect-square flex items-center justify-center rounded-lg font-bold text-sm transition-all border-2 relative select-none hover:shadow-sm";
              
              if (isCurrent) {
                baseClasses += " border-[#2c6fb7] bg-[#eef5fd] text-[#2c6fb7]";
              } else if (answered) {
                baseClasses += " border-slate-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-200";
              } else {
                baseClasses += " border-slate-100 bg-white text-slate-500 hover:bg-slate-50 hover:border-slate-300";
              }

              return (
                <button 
                  key={q.id} 
                  onClick={() => setCurrentQIndex(idx)}
                  className={baseClasses}
                >
                  {idx + 1}
                  {isFlagged && (
                    <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-orange-500 rounded-full border-2 border-white z-10"></div>
                  )}
                  {answered && !isCurrent && (
                    <div className="absolute -bottom-1 -right-1 opacity-0 hover:opacity-100 transition-opacity">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col gap-2">
             <div className="flex justify-between text-xs text-slate-500 font-medium px-1">
                <span>Answered: <strong className="text-slate-800">{answeredCount}</strong></span>
                <span>Unanswered: <strong className="text-slate-800">{mockQuestions.length - answeredCount}</strong></span>
             </div>
             <button 
               onClick={handleSubmit} 
               className="w-full mt-3 py-3 bg-[#2c6fb7] hover:bg-[#1a5ba0] text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 group"
             >
               Submit Exam <CheckCircle2 className="w-4 h-4 opacity-70 group-hover:opacity-100" />
             </button>
          </div>
        </div>
      </div>

      {/* Center Column: Question Content */}
      <div className="xl:col-span-2 flex flex-col">
        <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200 p-8 flex-1 flex flex-col">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-xl font-bold text-[#1a365d] tracking-tight">Question {currentQIndex + 1} <span className="text-slate-400 text-sm font-medium">of {mockQuestions.length}</span></h2>
            <div className="flex items-center gap-4">
              <span className="bg-blue-50 text-[#2c6fb7] px-3 py-1 rounded-full text-xs font-bold tracking-wide border border-[#2c6fb7]/20">
                {q.points} {q.points === 1 ? 'Point' : 'Points'}
              </span>
              <button 
                onClick={() => toggleFlag(q.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors border shadow-sm ${
                  flagged[q.id] ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <Flag className={`w-4 h-4 ${flagged[q.id] ? 'fill-orange-500 text-orange-500' : ''}`} /> {flagged[q.id] ? 'Flagged' : 'Flag Question'}
              </button>
            </div>
          </div>

          {/* Question Body */}
          <div className="flex-1 overflow-y-auto pr-4 font-medium text-[16px] leading-relaxed text-[#1a365d]">
            <p className="mb-6">{q.text}</p>

            {q.type === 'multiple_choice' && (
              <div className="flex flex-col gap-3 mt-8">
                {q.options?.map((opt, i) => {
                  const isSelected = answers[q.id] === opt;
                  return (
                    <label 
                      key={i} 
                      className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-[#2c6fb7] bg-[#eef5fd]' 
                          : 'border-slate-200 hover:border-[#2c6fb7]/50 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 flex-shrink-0 bg-white ${
                        isSelected ? 'border-[#2c6fb7]' : 'border-slate-300'
                      }`}>
                         {isSelected && <div className="w-2.5 h-2.5 bg-[#2c6fb7] rounded-full"></div>}
                      </div>
                      <span className={`${isSelected ? 'text-[#1a365d] font-bold' : 'text-slate-600'}`}>{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {q.type === 'essay' && (
              <div className="mt-6 flex flex-col h-64">
                <textarea 
                  className="flex-1 w-full p-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-[#2c6fb7] focus:ring-4 focus:ring-[#2c6fb7]/10 resize-none transition-all text-slate-700 bg-slate-50 focus:bg-white"
                  placeholder="Type your answer here..."
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="pt-6 mt-6 border-t border-slate-100 flex justify-between items-center">
             <button 
               onClick={() => setCurrentQIndex(i => Math.max(0, i - 1))}
               disabled={currentQIndex === 0}
               className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 shadow-sm text-slate-700 hover:bg-slate-50 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
             >
               <ChevronLeft className="w-5 h-5" /> Previous
             </button>
             
             {currentQIndex === mockQuestions.length - 1 ? (
               <button 
                 onClick={handleSubmit}
                 className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-sm transition-colors"
               >
                 Submit Exam <CheckCircle2 className="w-5 h-5" />
               </button>
             ) : (
               <button 
                 onClick={() => setCurrentQIndex(i => Math.min(mockQuestions.length - 1, i + 1))}
                 className="flex items-center gap-2 px-6 py-2.5 bg-[#2c6fb7] hover:bg-[#1a5ba0] text-white rounded-lg font-semibold shadow-sm transition-colors"
               >
                 Next <ChevronRight className="w-5 h-5" />
               </button>
             )}
          </div>

        </div>
      </div>

      {/* Right Column: Proctoring & Logs */}
      <div className="xl:col-span-1 flex flex-col gap-6">
        
        {/* Live Monitoring Box */}
        <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200 p-5">
           <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                <h2 className="text-[#1a365d] font-bold text-[15px]">Proctoring Feed</h2>
              </div>
           </div>
           
           <div className="relative rounded-lg overflow-hidden bg-slate-900 aspect-[4/3] border-4 border-slate-100 shadow-inner">
              <WebcamMonitor 
                onCapture={async (img) => {
                  try {
                    const regNumber = localStorage.getItem('student_id');
                    if (!regNumber) return;

                    const res = await fetch('/api/verify-continuous/', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        registration_number: regNumber,
                        exam_id: examId,
                        image_base64: img
                      })
                    });
                    const data = await res.json();
                    console.log('Continuous verification result:', data);
                  } catch (err) {
                    console.error('Continuous verification error:', err);
                  }
                }}
                isVerifying={false}
                status="idle"
                continuousMode={true}
                continuousInterval={15000}
              />
              {/* Overlay for recording status */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-[10px] font-mono flex justify-between">
                 <span>{localStorage.getItem('student_id') || 'Unknown User'}</span>
                 <span className="text-red-400 flex items-center gap-1 font-bold tracking-widest">
                   <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
                   REC
                 </span>
              </div>
           </div>
           
           <div className="mt-4 text-[11px] text-slate-500 font-medium leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
             Your webcam feed and screen activity are being securely recorded and analyzed by the DeepFace verification engine. Focus on the screen.
           </div>
        </div>

      </div>

    </div>
  );
}

