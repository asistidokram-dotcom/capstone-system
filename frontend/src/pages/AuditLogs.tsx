import { useEffect, useState } from 'react';
import { ShieldAlert, Search, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

interface AuditLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  user: { firstName: string; lastName: string; role: string };
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/audit-logs', { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error('Failed to load logs');
        setLogs(await response.json());
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [token]);

  const filteredLogs = logs.filter(log => 
    log.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">System Audit Logs</h1>
            <p className="text-gray-500 mt-1">Track all actions performed by users in the system.</p>
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search logs..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>
      
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden animate-pulse">
          <div className="h-12 bg-gray-100 border-b"></div>
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 border-b bg-white"></div>)}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border text-center">
          <Activity className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900">No logs found</h3>
          <p className="text-gray-500 mt-1">There are no system actions matching your search.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                <th className="p-4 font-semibold">Date & Time</th>
                <th className="p-4 font-semibold">User</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Action</th>
                <th className="p-4 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-gray-600 text-sm whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="p-4 font-medium text-gray-800">
                    {log.user.firstName} {log.user.lastName}
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      {log.user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      log.action.includes('APPROVED') ? 'bg-green-100 text-green-700' : 
                      log.action.includes('REJECTED') ? 'bg-red-100 text-red-700' : 
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600 text-sm max-w-xs truncate" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}