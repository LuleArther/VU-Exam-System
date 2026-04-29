import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, CheckCircle2, Upload, RefreshCw } from 'lucide-react';

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: 'user'
};

export default function UpdateReferenceImageForm() {
  const webcamRef = useRef<Webcam>(null);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [password, setPassword] = useState('');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const storedReg = localStorage.getItem('student_id') || '';
    setRegistrationNumber(storedReg);
  }, []);

  const capture = () => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (screenshot) {
      setImageSrc(screenshot);
      setError('');
      setSuccess('');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(String(reader.result || ''));
      setError('');
      setSuccess('');
    };
    reader.readAsDataURL(file);
  };

  const submitUpdate = async () => {
    if (!registrationNumber) {
      setError('No registration number found. Please sign in again.');
      return;
    }

    if (!imageSrc) {
      setError('Please capture or upload a new reference image.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:8000/api/update-reference-image/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_number: registrationNumber,
          auth_token: localStorage.getItem('auth_token') || '',
          password,
          base64_image: imageSrc
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not update your image.');
      }

      setSuccess(data.message || 'Reference image updated successfully.');
      localStorage.setItem('reference_image_updated_at', new Date().toISOString());
      setImageSrc(null);
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Update Reference Image</h2>
          <p className="text-slate-500 mt-2 leading-relaxed">
            Use this page to replace the photo used for identity verification. If your previous photo was taken in poor light, upload or capture a clearer image here.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Registration Number</label>
              <input
                type="text"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2c6fb7]/20 focus:border-[#2c6fb7]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Confirm your password to update the image"
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2c6fb7]/20 focus:border-[#2c6fb7]"
              />
            </div>

            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Camera className="w-4 h-4 text-[#2c6fb7]" />
                Capture from Camera
              </div>
              <div className="overflow-hidden rounded-xl bg-black aspect-[4/3]">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full h-full object-cover"
                  mirrored={true}
                />
              </div>
              <button
                type="button"
                onClick={capture}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#2c6fb7] px-4 py-2.5 text-white font-semibold hover:bg-[#1a5ba0] transition-colors"
              >
                <Camera className="w-4 h-4" />
                Capture Photo
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 p-4 bg-white">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Upload className="w-4 h-4 text-[#2c6fb7]" />
                Upload a File Instead
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-[#2c6fb7] file:px-4 file:py-2 file:text-white file:font-semibold hover:file:bg-[#1a5ba0]"
              />
              <p className="mt-2 text-xs text-slate-500">
                This is useful if your camera is dim or low quality. A clearer photo helps the system recognize you better.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <div className="text-sm font-semibold text-slate-700 mb-3">Preview</div>
              <div className="aspect-[4/3] rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center">
                {imageSrc ? (
                  <img src={imageSrc} alt="Updated reference preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-slate-400 px-6">
                    <RefreshCw className="w-8 h-8 mx-auto mb-2" />
                    No image selected yet
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={submitUpdate}
              className="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating Image...' : 'Update Reference Image'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
