import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, CheckCircle, Save, Loader2, RefreshCw } from 'lucide-react';

export default function SettingsForm() {
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  const webcamRef = useRef<Webcam>(null);

  useEffect(() => {
    // Load current name from localStorage
    const name = localStorage.getItem('student_name');
    if (name) {
      setFullName(name);
    }
  }, []);

  const capture = useCallback(() => {
    const image = webcamRef.current?.getScreenshot();
    if (image) {
      setImageSrc(image);
      setIsWebcamOpen(false);
    }
  }, [webcamRef]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setMessage('');

    const regNumber = localStorage.getItem('student_id');
    if (!regNumber) {
      setStatus('error');
      setMessage('You must be logged in to update your profile.');
      return;
    }

    try {
      const response = await fetch('/api/update-profile/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_number: regNumber,
          full_name: fullName,
          password: password,
          image_base64: imageSrc
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Profile updated successfully!');
        if (data.student_name) {
          localStorage.setItem('student_name', data.student_name);
        }
        // Clear password field
        setPassword('');
        setImageSrc(null);
        
        // Update header dynamically
        const headerName = document.getElementById('header-student-name');
        if (headerName && data.student_name) {
          headerName.textContent = data.student_name;
        }
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to update profile.');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.toString());
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="bg-[#2c6fb7] p-6 text-white">
        <h2 className="text-xl font-bold">Profile Settings</h2>
        <p className="text-blue-100 text-sm mt-1">Update your account details and facial verification baseline</p>
      </div>

      <div className="p-8">
        {status === 'success' && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center text-green-800">
            <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
            <p className="font-medium">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
            <p className="font-medium text-sm">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2c6fb7] focus:border-transparent transition-all"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">New Password (leave blank to keep current)</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2c6fb7] focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Update Baseline Photo (Optional)</label>
            
            {!isWebcamOpen && !imageSrc && (
              <button 
                type="button"
                onClick={() => setIsWebcamOpen(true)}
                className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:text-[#2c6fb7] hover:border-[#2c6fb7] hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-2"
              >
                <Camera className="w-8 h-8" />
                <span className="font-medium">Click to retake baseline photo</span>
              </button>
            )}

            {isWebcamOpen && (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex flex-col">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full h-full object-cover transform scale-x-[-1]"
                  videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
                />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <button
                    type="button"
                    onClick={capture}
                    className="bg-white text-[#2c6fb7] px-6 py-2 rounded-full font-bold shadow-lg hover:bg-slate-50 transition-colors"
                  >
                    Capture Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsWebcamOpen(false)}
                    className="bg-slate-800 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {imageSrc && !isWebcamOpen && (
              <div className="relative rounded-xl overflow-hidden border-2 border-[#2c6fb7] aspect-video">
                <img src={imageSrc} alt="New Baseline" className="w-full h-full object-cover transform scale-x-[-1]" />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setImageSrc(null);
                      setIsWebcamOpen(true);
                    }}
                    className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold shadow-sm flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" /> Retake Photo
                  </button>
                </div>
                <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                  <CheckCircle className="w-3 h-3" /> Ready to save
                </div>
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2">This photo will be used to verify your identity before entering any exam.</p>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full bg-[#2c6fb7] hover:bg-[#235a97] text-white font-bold py-3.5 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Profile Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
