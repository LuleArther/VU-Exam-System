import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, CheckCircle2, ChevronRight, XCircle } from 'lucide-react';

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user"
};

export default function RegistrationForm() {
  const [step, setStep] = useState(1);
  const [regNo, setRegNo] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const capture = useCallback(() => {
    const image = webcamRef.current?.getScreenshot();
    if (image) {
      setImageSrc(image);
    }
  }, [webcamRef]);

  const retake = () => {
    setImageSrc(null);
  };

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (regNo && fullName && password) {
      setStep(2);
    }
  };

  const handleRegister = async () => {
    if (!imageSrc) {
      setError("Please capture a baseline photo.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://167.99.7.208:8000/api/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_number: regNo,
          full_name: fullName,
          password: password,
          base64_image: imageSrc
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register.');
      }

      // Save token and jump to dashboard
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('student_name', data.student_name);
      localStorage.setItem('student_id', regNo);

      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between text-sm font-semibold">
        <span className={step === 1 ? "text-[#2c6fb7]" : "text-slate-400"}>1. Account Details</span>
        <ChevronRight className="w-4 h-4 text-slate-300" />
        <span className={step === 2 ? "text-[#2c6fb7]" : "text-slate-400"}>2. Baseline Verification</span>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4 border border-red-200">
          {error}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={nextStep} className="space-y-4">
          <div>
            <label className="block text-[13px] text-slate-600 font-semibold mb-1">Registration Number</label>
            <input 
              type="text" 
              placeholder="e.g VU-AAA-0000-0000" 
              required
              value={regNo}
              onChange={(e) => setRegNo(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded text-[14px] text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-[13px] text-slate-600 font-semibold mb-1">Full Name</label>
            <input 
              type="text" 
              placeholder="e.g John Doe" 
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded text-[14px] text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-[13px] text-slate-600 font-semibold mb-1">Password</label>
            <input 
              type="password" 
              placeholder="Create a password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded text-[14px] text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
          </div>
          <div className="pt-4">
            <button 
              type="submit" 
              className="w-full py-[14px] px-4 rounded text-[15px] font-medium text-white bg-[#6b9bc2] hover:bg-[#5a8ab1] transition-colors"
            >
              Continue to Face Verification
            </button>
          </div>
          <div className="pt-2 text-center">
            <a href="/" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
              Already have an account? Sign In
            </a>
          </div>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 mb-4">
            Please capture a clear photo of your face. This image will be used as the baseline to verify your identity during online examinations. Ensure good lighting and look straight at the camera.
          </p>

          <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3] flex items-center justify-center">
            {!imageSrc ? (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full h-full object-cover"
                mirrored={true}
              />
            ) : (
              <img src={imageSrc} alt="Baseline capture" className="w-full h-full object-cover mirrored" style={{ transform: 'scaleX(-1)' }} />
            )}
            
            {/* Guide overlay */}
            {!imageSrc && (
               <div className="absolute inset-0 pointer-events-none">
                 <div className="w-full h-full border-[3px] border-dashed border-white/30 rounded-[100px] scale-75"></div>
               </div>
            )}
          </div>

          <div className="flex justify-center gap-4 mt-6">
            {!imageSrc ? (
              <button 
                onClick={capture}
                className="flex items-center gap-2 px-6 py-3 bg-[#2c6fb7] hover:bg-[#1a5ba0] text-white rounded-lg font-bold shadow-sm transition-colors"
              >
                <Camera className="w-5 h-5" /> Capture Baseline Photo
              </button>
            ) : (
              <button 
                onClick={retake}
                className="flex items-center gap-2 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-colors"
              >
                <XCircle className="w-5 h-5" /> Retake
              </button>
            )}
          </div>

          {imageSrc && (
            <div className="pt-6">
              <button 
                onClick={handleRegister}
                disabled={loading}
                className="w-full py-[14px] px-4 rounded text-[15px] font-medium text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Creating Account...' : <><CheckCircle2 className="w-5 h-5"/> Complete Registration</>}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
