import React, { useState } from 'react';
import WebcamMonitor from './WebcamMonitor';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

interface VerifyFlowProps {
  examId: string;
}

export default function VerificationFlow({ examId }: VerifyFlowProps) {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const handleCapture = async (imageSrc: string) => {
    setStatus('verifying');
    setErrorMessage(null);
    
    try {
      const regNumber = localStorage.getItem('student_id') || 'VU-BIT-2503-1728-DAY';
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
        setStatus('success');
        setTimeout(() => {
          window.location.href = `/exam/${examId}`;
        }, 1500);
      } else {
        setStatus('failed');
        setErrorMessage(data.error || data.message || `Verification failed with status ${response.status}`);
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setStatus('failed');
      setErrorMessage(error.toString());
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-12 text-center">
        
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
          Identity Verification
        </h1>
        <p className="text-slate-500 max-w-lg mx-auto mb-8">
          Before entering exam <span className="font-semibold text-indigo-600">{examId}</span>, we need to verify your identity. The system will compare your face against your registered student ID.
        </p>

        {status === 'failed' && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start text-left text-red-800 max-w-2xl mx-auto">
            <ShieldAlert className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-bold flex-1">Verification Failed</h4>
              <p className="text-sm mt-1">{errorMessage ? `Error: ${errorMessage}. ` : ''}We couldn't match your face with the registered student ID. Please ensure good lighting and try again, or contact the invigilator.</p>
            </div>
          </div>
        )}

        <WebcamMonitor 
          onCapture={handleCapture}
          isVerifying={status === 'verifying'}
          status={status}
        />
        
        <div className="mt-12 flex justify-center">
          <a href="/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Cancel and Return to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
