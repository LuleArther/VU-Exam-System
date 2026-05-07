import React, { useState } from 'react';
import { EyeOff, Eye } from 'lucide-react';

export default function LoginForm() {
  const [regNo, setRegNo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://167.99.7.208:8000/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_number: regNo, password: password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to login. Please check your credentials.');
      }

      // Save token and info
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('student_name', data.student_name);
      localStorage.setItem('student_id', regNo);

      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="mb-6">
        <h3 className="text-slate-800 font-bold text-[15px]">Enter your details to login</h3>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4 border border-red-200">
          {error}
        </div>
      )}

      {/* Reg No Input */}
      <div>
        <input 
          type="text" 
          placeholder="Reg No e.g VU-AAA-0000-0000" 
          required
          value={regNo}
          onChange={(e) => setRegNo(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors"
        />
      </div>

      {/* Password Input */}
      <div className="relative">
        <input 
          type={showPassword ? "text" : "password"}
          placeholder="Your password" 
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-slate-200 rounded text-[14px] text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-colors pr-12"
        />
        <button 
          type="button" 
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-500 transition-colors"
        >
          {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>
      </div>

      {/* Remember me */}
      <div className="flex items-center pt-2">
        <input 
          id="remember_me" 
          type="checkbox" 
          className="h-5 w-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500/50 cursor-pointer accent-white"
          style={{ accentColor: 'white', border: '2px solid #cbd5e1' }}
        />
        <label htmlFor="remember_me" className="ml-3 block text-[14px] text-slate-600 cursor-pointer">
          Remember me
        </label>
      </div>

      {/* Sign In Button */}
      <div className="pt-4 flex flex-col gap-3">
        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-[14px] px-4 border border-transparent rounded text-[15px] font-medium text-white bg-[#6b9bc2] hover:bg-[#5a8ab1] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6b9bc2] transition-colors disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
        <a 
          href="/register" 
          className="w-full py-[14px] px-4 border border-slate-300 rounded text-[15px] font-medium text-slate-700 bg-white hover:bg-slate-50 text-center transition-colors block"
        >
          Register for VClass
        </a>
      </div>

      {/* Forgot password */}
      <div className="flex justify-end pt-1">
        <a href="#" className="text-[13px] text-slate-500 hover:text-slate-800 transition-colors">
          Forgot password ?
        </a>
      </div>
    </form>
  );
}
