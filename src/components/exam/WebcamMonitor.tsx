import React, { useRef, useCallback, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface WebcamMonitorProps {
  onCapture: (imageSrc: string) => void;
  isVerifying: boolean;
  status: 'idle' | 'verifying' | 'success' | 'failed';
  continuousMode?: boolean;
  continuousInterval?: number;
}

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user"
};

export default function WebcamMonitor({ onCapture, isVerifying, status, continuousMode = false, continuousInterval = 30000 }: WebcamMonitorProps) {
  const webcamRef = useRef<Webcam>(null);
  const [error, setError] = useState<string | null>(null);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        onCapture(imageSrc);
      }
    }
  }, [webcamRef, onCapture]);

  useEffect(() => {
    if (continuousMode && !error) {
      const interval = setInterval(() => {
        capture();
      }, continuousInterval);
      return () => clearInterval(interval);
    }
  }, [continuousMode, continuousInterval, error, capture]);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
    setError("Camera access denied or unavailable. Please check permissions.");
    console.error("Webcam error:", error);
  }, []);

  return (
    <div className="flex flex-col items-center max-w-2xl w-full mx-auto p-4">
      <div className="relative w-full overflow-hidden bg-slate-100 rounded-2xl shadow-inner border-2 border-slate-200 aspect-video flex items-center justify-center">
        {error ? (
          <div className="flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-red-50 w-full h-full">
            <Camera className="w-12 h-12 text-red-400 mb-3" />
            <p className="font-medium text-red-600 mb-1">{error}</p>
            <p className="text-sm text-red-500">Please grant camera permissions and reload.</p>
          </div>
        ) : (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            onUserMediaError={handleUserMediaError}
            className="w-full h-full object-cover transform scale-x-[-1]"
            forceScreenshotSourceSize={true}
          />
        )}

        {/* Status Overlay */}
        {!error && !continuousMode && (
          <div className="absolute top-4 right-4">
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5 backdrop-blur-md ${
              status === 'verifying' ? 'bg-amber-500/90 text-white' :
              status === 'success' ? 'bg-green-500/90 text-white' :
              status === 'failed' ? 'bg-red-500/90 text-white' :
              'bg-black/50 text-white'
            }`}>
              {status === 'verifying' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {status === 'success' && <CheckCircle className="w-3.5 h-3.5" />}
              {status === 'failed' && <AlertCircle className="w-3.5 h-3.5" />}
              {status === 'idle' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
              
              <span>
                {status === 'verifying' ? 'Scanning...' :
                 status === 'success' ? 'Verified' :
                 status === 'failed' ? 'Mismatch detected' :
                 'Live Feed'}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {!error && !continuousMode && (
        <div className="mt-6 flex flex-col items-center w-full max-w-sm">
          <p className="text-sm text-slate-500 mb-4 text-center">
            Position your face clearly within the frame. Ensure good lighting and remove glasses or hats.
          </p>
          <button
            onClick={capture}
            disabled={isVerifying}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Verifying Identity...
              </>
            ) : (
              <>
                <Camera className="w-5 h-5 mr-2" />
                Capture & Verify
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
