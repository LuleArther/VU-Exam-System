import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChevronLeft, ChevronRight, CheckCircle2, List, Flag, ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import WebcamMonitor from './WebcamMonitor';

interface Question {
  id: string;
  type: 'multiple_choice' | 'essay';
  text: string;
  options?: string[];
  points: number;
}

export default function ExamInterface({ examId }: { examId: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examTitle, setExamTitle] = useState('');
  const [examType, setExamType] = useState('objective');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(7200); // default 2 hours
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Proctoring/Cheating Alert States
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const [alertType, setAlertType] = useState<'multiple_faces' | 'no_face' | 'tab_switched' | 'mismatch' | 'camera_covered'>('multiple_faces');

  // Cooldown per alert type (ms) — 0 means no cooldown (alert every time)
  const alertCooldowns = useRef<Record<string, number>>({});
  const COOLDOWN_BY_TYPE: Record<string, number> = {
    tab_switched:   0,               // no cooldown
    camera_covered: 0,               // no cooldown
    no_face:        2 * 60 * 1000,   // 2 minutes
    multiple_faces: 10 * 60 * 1000,  // 10 minutes
    mismatch:       1 * 60 * 1000,   // 1 minute
  };

  const showAlertIfCooldownPassed = (type: string, msg: string) => {
    const now = Date.now();
    const lastShown = alertCooldowns.current[type] || 0;
    const cooldown = type in COOLDOWN_BY_TYPE ? COOLDOWN_BY_TYPE[type] : 3 * 60 * 1000;
    if (cooldown > 0 && now - lastShown < cooldown) return;
    alertCooldowns.current[type] = now;
    setAlertType(type as any);
    setAlertMsg(msg);
    setShowAlert(true);
  };

  const regNumber = localStorage.getItem('student_id') || 'VU-BIT-STUDENT';

  // 1. Fetch Exam Details — and guard against re-entry if already submitted
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await fetch(`/api/exams/${examId}/`);
        if (res.ok) {
          const data = await res.json();
          setQuestions(data.questions || []);
          setExamTitle(data.title || `${examId} Examination`);
          setExamType(data.type || 'objective');
          setTimeLeft((data.duration_minutes || 120) * 60);
        } else {
          // Fallback if exam not found
          setExamTitle("Advanced Database Systems");
          setQuestions([
            { id: 'q1', type: 'multiple_choice', text: 'Which of the following is not a property of a transaction (ACID)?', options: ['Atomicity', 'Consistency', 'Isolation', 'Distribution'], points: 1 },
            { id: 'q2', type: 'multiple_choice', text: 'In relational algebra, which operator is used to combine tuples from two relations?', options: ['Projection', 'Selection', 'Join', 'Union'], points: 2 },
            { id: 'q3', type: 'essay', text: 'Explain the difference between First Normal Form (1NF) and Second Normal Form (2NF) with an example. Outline how update anomalies are prevented.', points: 10 }
          ]);
        }

        // Guard: if student already submitted this exam, send them to results immediately
        const sid = localStorage.getItem('student_id');
        if (sid) {
          const statusRes = await fetch(`/api/exams/?student_id=${sid}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            const thisExam = (statusData.exams || []).find((e: any) => e.id === examId);
            if (thisExam && (thisExam.status === 'completed' || thisExam.status === 'graded')) {
              // Already submitted — go straight to results
              window.location.href = '/results';
              return;
            }
          }
        }
      } catch (err) {
        console.error("Failed to load exam:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [examId]);

  // 2. Timer Loop
  useEffect(() => {
    if (loading || submitted) return;
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
  }, [loading, submitted]);

  // 3. Tab Switched Detection
  useEffect(() => {
    if (loading || submitted) return;

    const logEvent = async (event: string, details: string) => {
      try {
        await fetch(`/api/exams/${examId}/log-event/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registration_number: regNumber,
            event: event,
            details: details
          })
        });
      } catch (e) {
        console.error("Failed to log event:", e);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logEvent("Tab Focus Lost", "Student switched away from the browser tab.");
        showAlertIfCooldownPassed('tab_switched', "Warning: Tab switch detected! Navigation away from the exam interface is strictly monitored and will result in penalty marks.");
      } else {
        logEvent("Tab Focus Gained", "Student returned to the browser tab.");
      }
    };

    const handleBlur = () => {
      logEvent("Window Blurred", "Student clicked outside the browser window.");
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [loading, submitted, examId, regNumber]);

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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/exams/${examId}/submit/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_number: regNumber,
          answers: answers
        })
      });
      if (response.ok) {
        setSubmitted(true);
        // Redirect to results page after 2.5 seconds
        setTimeout(() => {
          window.location.href = '/results';
        }, 2500);
      }
    } catch (err) {
      console.error("Error submitting exam:", err);
      setSubmitted(true);
      setTimeout(() => {
        window.location.href = '/results';
      }, 2500);
    } finally {
      setLoading(false);
    }
  };

  if (loading && questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-semibold text-sm">Preparing secure exam interface...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-2xl mx-auto px-4">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm animate-bounce">
          <CheckCircle2 className="w-10 h-10" strokeWidth={2.5}/>
        </div>
        <h2 className="text-3xl font-bold text-[#1a365d] mb-3 tracking-tight">Paper Submitted!</h2>
        <p className="text-slate-600 text-lg mb-4 leading-relaxed font-medium">
          Your answers for <strong>{examTitle}</strong> have been recorded.
        </p>
        <p className="text-slate-500 text-sm mb-8">
          {examType === 'objective'
            ? 'Your paper has been auto-graded. You can view your score in the Results page.'
            : 'Your essay has been submitted and is awaiting lecturer review. Grade will be released soon.'}
        </p>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          Redirecting you to your results...
        </div>
      </div>
    );
  }

  const q = questions[currentQIndex] || { id: '', type: 'multiple_choice', text: 'No questions in this paper.', points: 0 };
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const isUrgent = timeLeft < 300;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[calc(100vh-8rem)] relative">
      
      {/* Real-time Incident Alert Overlay */}
      {showAlert && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-red-200 max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-red-800 mb-2">Proctoring Flag Triggered</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6 font-semibold">
              {alertMsg}
            </p>
            <button
              onClick={() => setShowAlert(false)}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all text-sm"
            >
              I Understand (Acknowledge)
            </button>
          </div>
        </div>
      )}

      {/* Left Column: Navigator & Status */}
      <div className="xl:col-span-1 flex flex-col gap-6">
        
        {/* Timer Card */}
        <div className={`bg-white rounded-xl shadow-sm border ${isUrgent ? 'border-red-200 ring-1 ring-red-500/30' : 'border-slate-200'} p-6 text-center transition-all`}>
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex-1 flex flex-col min-h-0">
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
            {questions.map((qItem, idx) => {
              const answered = !!answers[qItem.id];
              const isCurrent = idx === currentQIndex;
              const isFlagged = flagged[qItem.id];
              
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
                  key={qItem.id} 
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
                <span>Unanswered: <strong className="text-slate-800">{questions.length - answeredCount}</strong></span>
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex-1 flex flex-col">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-xl font-bold text-[#1a365d] tracking-tight">Question {currentQIndex + 1} <span className="text-slate-400 text-sm font-medium">of {questions.length}</span></h2>
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
          <div className="flex-1 overflow-y-auto pr-4 font-semibold text-[15.5px] leading-relaxed text-[#1a365d]">
            <p className="mb-6">{q.text}</p>

            {q.type === 'objective' && (
              <div className="flex flex-col gap-3 mt-8">
                {q.options?.map((opt, i) => {
                  const isSelected = answers[q.id] === opt;
                  return (
                    <label 
                      key={i} 
                      onClick={() => handleAnswer(q.id, opt)}
                      className={`flex items-center p-4 border border-slate-200 rounded-xl cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-[#2c6fb7] bg-[#eef5fd] ring-1 ring-[#2c6fb7]/30' 
                          : 'hover:border-[#2c6fb7]/50 hover:bg-slate-50'
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
                  className="flex-1 w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2c6fb7] focus:ring-4 focus:ring-[#2c6fb7]/10 resize-none transition-all text-slate-700 bg-slate-50 focus:bg-white"
                  placeholder="Type your essay answer here..."
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
             
             {currentQIndex === questions.length - 1 ? (
               <button 
                 onClick={handleSubmit}
                 className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-sm transition-colors"
               >
                 Submit Exam <CheckCircle2 className="w-5 h-5" />
               </button>
             ) : (
               <button 
                 onClick={() => setCurrentQIndex(i => Math.min(questions.length - 1, i + 1))}
                 className="flex items-center gap-2 px-6 py-2.5 bg-[#2c6fb7] hover:bg-[#1a5ba0] text-white rounded-lg font-semibold shadow-sm transition-colors"
               >
                 Next <ChevronRight className="w-5 h-5" />
               </button>
             )}
          </div>

        </div>
      </div>

      {/* Right Column: Proctoring Feed */}
      <div className="xl:col-span-1 flex flex-col gap-6">
        
        {/* Live Monitoring Box */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
           <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                <h2 className="text-[#1a365d] font-bold text-[15px]">Proctoring Feed</h2>
              </div>
           </div>
           
           <div className="relative rounded-lg overflow-hidden bg-slate-900 aspect-[4/3] border-4 border-slate-100 shadow-inner">
              <WebcamMonitor 
                onCapture={async (img) => {
                  if (document.hidden) return;
                  
                  try {
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
                    
                    // Trigger warnings based on server continuous proctoring verification
                    // Each alert type is rate-limited to once every 10 minutes on the student's screen.
                    // The backend still logs every single incident for the lecturer.
                    if (data.camera_covered) {
                      showAlertIfCooldownPassed('camera_covered', "Warning: Your camera appears to be covered or obstructed. Please uncover your camera immediately to continue the exam. This incident has been logged.");
                    } else if (data.multiple_faces) {
                      showAlertIfCooldownPassed('multiple_faces', "Incident: Multiple faces confirmed in camera feed! This cheating attempt is recorded and has been forwarded directly to the invigilator's live board. Continued violation will result in exam voiding.");
                    } else if (data.no_face) {
                      showAlertIfCooldownPassed('no_face', "Warning: No face detected in camera frame. Please position yourself in front of the camera and look at the screen.");
                    } else if (!data.verified) {
                      showAlertIfCooldownPassed('mismatch', "Incident: Identity mismatch detected! The face in the camera does not match the registered student profile.");
                    }
                  } catch (err) {
                    console.error('Continuous verification error:', err);
                  }
                }}
                isVerifying={false}
                status="idle"
                continuousMode={true}
                continuousInterval={5000}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-[10px] font-mono flex justify-between">
                 <span>{regNumber}</span>
                 <span className="text-red-400 flex items-center gap-1 font-bold tracking-widest">
                   <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
                   REC
                 </span>
              </div>
           </div>
           
           <div className="mt-4 text-[11px] text-slate-500 font-semibold leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
             Your webcam feed and screen activity are being securely monitored. Switched tabs, external face appearances, or lack of face are instantly flagged.
           </div>
        </div>

      </div>

    </div>
  );
}
