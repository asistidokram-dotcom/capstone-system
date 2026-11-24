import { Link, useLocation } from 'react-router-dom';
import { Home, Users, LogOut, FileText, Calendar, UserPlus, ShieldAlert } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  
  let user = { role: 'STUDENT' }; 
  try {
    const userString = localStorage.getItem('user');
    if (userString) user = JSON.parse(userString);
  } catch (e) {}

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login'; 
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <Home size={20} />, allowedRoles: ['ADMIN', 'COORDINATOR', 'STUDENT', 'ADVISER', 'PANELIST'] },
    { name: 'Capstone Groups', path: '/groups', icon: <Users size={20} />, allowedRoles: ['ADMIN', 'COORDINATOR', 'ADVISER'] },
    { name: 'Title Proposals', path: '/proposals', icon: <FileText size={20} />, allowedRoles: ['ADMIN', 'COORDINATOR', 'STUDENT', 'ADVISER'] },
    { name: 'Defense Schedules', path: '/schedules', icon: <Calendar size={20} />, allowedRoles: ['ADMIN', 'COORDINATOR', 'PANELIST', 'STUDENT'] },
    { name: 'Manage Users', path: '/users', icon: <UserPlus size={20} />, allowedRoles: ['ADMIN'] },
    { name: 'Audit Logs', path: '/audit-logs', icon: <ShieldAlert size={20} />, allowedRoles: ['ADMIN'] },
  ];

  const visibleNavItems = navItems.filter(item => item.allowedRoles.includes(user.role));

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      {/* UPDATED: Added Logo and Flexbox for alignment */}
      <div className="p-4 border-b border-slate-700 flex items-center gap-3">
        <img 
          src="/lspu_logo.jpeg" 
          alt="LSPU Logo" 
          className="w-11 h-11 object-contain bg-white rounded-full p-1 shadow-sm" 
        />
        <div>
          <h2 className="text-lg font-bold leading-tight">Capstone System</h2>
          <p className="text-xs text-slate-400 mt-0.5">{user.role} PORTAL</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {visibleNavItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname === item.path
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}