import React, { useState } from 'react';
import WebcamMonitor from './WebcamMonitor';
import { ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface VerifyFlowProps {
  examId: string;
}

export default function VerificationFlow({ examId }: VerifyFlowProps) {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [matchPercentage, setMatchPercentage] = useState<number | null>(null);
  const [showProceedWarning, setShowProceedWarning] = useState(false);
  
  const handleCapture = async (imageSrc: string) => {
    setStatus('verifying');
    setErrorMessage(null);
    setMatchPercentage(null);
    
    try {
      const regNumber = localStorage.getItem('student_id') || 'VU-BIT-2503-1728-DAY';
      const response = await fetch('http://localhost:8000/api/verify-face/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_number: regNumber,
          exam_id: examId,
          image_base64: imageSrc
        })
      });
      
      const data = await response.json();
      const percentage = data.match_percentage || 0;
      setMatchPercentage(percentage);
      
      if (response.ok && data.verified) {
        setStatus('success');
        setShowProceedWarning(false);
        setTimeout(() => {
          window.location.href = `/exam/${examId}`;
        }, 1500);
      } else {
        setStatus('failed');
        const errorMsg = data.error || data.message || `Verification failed`;
        setErrorMessage(`${errorMsg} (Match: ${percentage.toFixed(1)}%)`);
        setShowProceedWarning(true);
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setStatus('failed');
      setErrorMessage(error.toString());
      setMatchPercentage(0);
      setShowProceedWarning(true);
    }
  };

  const proceedToExamWithWarning = () => {
    localStorage.setItem('verification_warning', 'true');
    localStorage.setItem('verification_warning_message', 'Face mismatch or unclear camera detected at entry. Manual review may affect marks.');
    window.location.href = `/exam/${examId}`;
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
              <p className="text-sm mt-1">{errorMessage ? `${errorMessage}. ` : ''}Your face does not fully match the registered version. A verification snapshot has been captured. You can retry verification, or continue with a warning for manual review. Repeated mismatch may lead to loss of marks.</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-start text-left text-green-800 max-w-2xl mx-auto">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-bold flex-1">Verification Successful</h4>
              <p className="text-sm mt-1">Face matched with {matchPercentage?.toFixed(1)}% confidence. Redirecting to exam...</p>
            </div>
          </div>
        )}

        <WebcamMonitor 
          onCapture={handleCapture}
          isVerifying={status === 'verifying'}
          status={status}
        />

        {showProceedWarning && (
          <div className="mt-6 max-w-2xl mx-auto w-full rounded-lg border border-amber-200 bg-amber-50 p-4 text-left">
            <h4 className="font-semibold text-amber-800">Proceed With Warning?</h4>
            <p className="text-sm text-amber-700 mt-1">Your face was not confidently matched. If you continue, your attempt will be flagged and may be reviewed for penalties. Do you want to proceed to the paper?</p>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={proceedToExamWithWarning}
                className="px-4 py-2 rounded-md bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors"
              >
                Continue to Paper
              </button>
              <button
                onClick={() => {
                  setShowProceedWarning(false);
                  setStatus('idle');
                  setErrorMessage(null);
                }}
                className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Continue and Verify Again
              </button>
            </div>
          </div>
        )}
        
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
