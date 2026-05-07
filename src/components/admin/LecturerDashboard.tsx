import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, Clock, Users, ShieldCheck, Search, Activity, RefreshCw } from 'lucide-react';

interface ExamLog {
  id: number;
  student_name: string;
  registration_number: string;
  exam_id: string;
  exam_name: string;
  timestamp: string;
  verification_attempts: number;
  impersonation_flags: number;
  is_verified: boolean;
}

export default function LecturerDashboard() {
  const [logs, setLogs] = useState<ExamLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    try {
      // Fetch from DigitalOcean droplet API
      const res = await fetch('/api/dashboard-logs/');
      if (res.ok) {
         const data = await res.json();
         setLogs(data.logs);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Auto refresh every 10 seconds for real-time monitoring
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => 
    log.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.registration_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStudents = new Set(logs.map(l => l.registration_number)).size;
  const flaggedStudents = logs.filter(l => l.impersonation_flags > 0).length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-[#2c6fb7] text-white p-2 rounded-lg">
                <ShieldCheck className="w-6 h-6" />
             </div>
             <div>
               <h1 className="text-xl font-bold text-slate-800 tracking-tight">Victoria University</h1>
               <p className="text-xs text-slate-500 font-medium tracking-wide">Proctoring Dashboard</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-sm font-semibold text-slate-600">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               Live Monitoring
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">Active Students</p>
              <p className="text-2xl font-bold text-slate-800">{totalStudents}</p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
             </div>
             <div>
                <p className="text-sm font-semibold text-slate-500">Flagged Exceptions</p>
                <p className="text-2xl font-bold text-slate-800">{flaggedStudents}</p>
             </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
             </div>
             <div>
                <p className="text-sm font-semibold text-slate-500">Verified Logs</p>
                <p className="text-2xl font-bold text-slate-800">{logs.filter(l => l.is_verified).length}</p>
             </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
             <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6" />
             </div>
             <div>
                <p className="text-sm font-semibold text-slate-500">Total Telemetry</p>
                <p className="text-2xl font-bold text-slate-800">{logs.length}</p>
             </div>
          </div>
        </div>

        {/* Real-time Logs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
             <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               Exam Session Logs
               {loading && <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />}
             </h2>
             <div className="relative w-full sm:w-auto">
               <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Search by name or reg no..."
                 className="pl-9 pr-4 py-2 w-full sm:w-64 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold border-b border-slate-200">Student Details</th>
                  <th className="px-6 py-4 font-semibold border-b border-slate-200">Exam</th>
                  <th className="px-6 py-4 font-semibold border-b border-slate-200">Latest Status</th>
                  <th className="px-6 py-4 font-semibold border-b border-slate-200">Flags</th>
                  <th className="px-6 py-4 font-semibold border-b border-slate-200 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{log.student_name}</div>
                      <div className="text-xs text-slate-500">{log.registration_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-700">{log.exam_id}</div>
                      <div className="text-xs text-slate-500">{log.exam_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      {log.is_verified ? (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                           <CheckCircle className="w-3.5 h-3.5" /> Verified
                         </span>
                      ) : (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                           <Clock className="w-3.5 h-3.5" /> Pending
                         </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {log.impersonation_flags > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                          <ShieldAlert className="w-3.5 h-3.5" /> {log.impersonation_flags} Flags
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs font-medium">Clear</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-slate-500 whitespace-nowrap">
                       {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
                
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                      No logs found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
