import React, { useState } from 'react';
import WebcamMonitor from './WebcamMonitor';
import { ArrowLeft, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

interface VerifyFlowProps {
  examId: string;
}

export default function VerificationFlow({ examId }: VerifyFlowProps) {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const regNumber = localStorage.getItem('student_id') || 'VU-BIT-2503-1728-DAY';

  // Helper to log event and redirect
  const startExamAndRedirect = async (skipReason?: string) => {
    setStatus('success');
    try {
      // 1. Initialize exam session
      await fetch(`/api/exams/${examId}/start/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_number: regNumber })
      });

      // 2. If skipped, log it
      if (skipReason) {
        await fetch(`/api/exams/${examId}/log-event/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registration_number: regNumber,
            event: "Verification Bypassed",
            details: `Student bypassed verification. Reason: ${skipReason}`
          })
        });
      }
    } catch (err) {
      console.error("Error setting up exam log:", err);
    }
    
    setTimeout(() => {
      window.location.href = `/exam/${examId}`;
    }, 1500);
  };
  
  const handleCapture = async (imageSrc: string) => {
    setStatus('verifying');
    setErrorMessage(null);
    
    try {
      const response = await fetch('/api/verify-face/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_number: regNumber,
          exam_id: examId,
          image_base64: imageSrc
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.verified) {
        await startExamAndRedirect();
      } else {
        setStatus('failed');
        setErrorMessage(data.error || data.message || `Verification failed.`);
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setStatus('failed');
      setErrorMessage(error.toString());
    }
  };

  const handleSkip = () => {
    startExamAndRedirect("Bypassed via skip button");
  };

  const handleNoCamera = () => {
    startExamAndRedirect("No working camera detected");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-12 text-center">
        
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
          Identity Verification
        </h1>
        <p className="text-slate-500 max-w-lg mx-auto mb-6">
          Before entering exam <span className="font-semibold text-indigo-600">{examId}</span>, we need to verify your identity. The system will compare your face against your registered student ID.
        </p>

        {status === 'failed' && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start text-left text-red-800 max-w-2xl mx-auto shadow-sm">
            <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-bold">Verification Failed</h4>
              <p className="text-sm mt-1">{errorMessage ? `Error: ${errorMessage}. ` : ''}We couldn't match your face with the registered student ID. Please ensure good lighting and try again.</p>
            </div>
          </div>
        )}

        <WebcamMonitor 
          onCapture={handleCapture}
          isVerifying={status === 'verifying'}
          status={status}
          onNoCameraBypass={handleNoCamera}
        />

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-2xl mx-auto">
          <a href="/exams" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Cancel and Return
          </a>
          <button 
            onClick={handleSkip}
            className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors underline"
          >
            Skip Face Verification
          </button>
        </div>
      </div>
    </div>
  );
}
