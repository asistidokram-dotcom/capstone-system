import { useEffect, useState } from 'react';
import { Users, FileText, Calendar, AlertCircle, Briefcase, Award, Download, FileSpreadsheet, GraduationCap, User } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';

interface Stats {
  totalGroups: number;
  pendingProposals: number;
  totalSchedules: number;
  pendingRevisions: number;
  totalPanelists: number;
}

interface Workload {
  name: string;
  count: number;
}

interface WorkloadData {
  adviserWorkload: Workload[];
  panelistWorkload: Workload[];
}

// Interface for Student Group Profile
interface StudentGroup {
  id: string;
  name: string;
  status: string;
  adviser?: { user: { firstName: string; lastName: string } };
  members: { student: { user: { firstName: string; lastName: string } } }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [workloads, setWorkloads] = useState<WorkloadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Student Group State
  const [studentGroup, setStudentGroup] = useState<StudentGroup | null>(null);
  const [groupLoading, setGroupLoading] = useState(false);

  let user = { firstName: 'User', role: 'STUDENT' };
  try {
    const userString = localStorage.getItem('user');
    if (userString) user = JSON.parse(userString);
  } catch (e) {}

  const isAdmin = user.role === 'ADMIN' || user.role === 'COORDINATOR';

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!isAdmin) {
      // If student, fetch their group info
      if (user.role === 'STUDENT') {
        setGroupLoading(true);
        fetch('http://localhost:5000/api/dashboard/student-group', { headers: { Authorization: `Bearer ${token}` } })
          .then(res => res.ok ? res.json() : null)
          .then(data => setStudentGroup(data))
          .catch(console.error)
          .finally(() => setGroupLoading(false));
      }
      setLoading(false);
      return; 
    }

    const fetchData = async () => {
      try {
        const [statsRes, workRes] = await Promise.all([
          fetch('http://localhost:5000/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('http://localhost:5000/api/dashboard/workloads', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (!statsRes.ok || !workRes.ok) throw new Error('Failed to load dashboard data');
        
        setStats(await statsRes.json());
        setWorkloads(await workRes.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, user.role]);

  const exportToExcel = () => {
    if (!stats || !workloads) return;
    const statsData = [
      { Metric: 'Total Groups', Value: stats.totalGroups },
      { Metric: 'Pending Proposals', Value: stats.pendingProposals },
      { Metric: 'Scheduled Defenses', Value: stats.totalSchedules },
      { Metric: 'Pending Revisions', Value: stats.pendingRevisions },
      { Metric: 'Total Panelists', Value: stats.totalPanelists },
    ];
    const workloadData = [
      ...workloads.adviserWorkload.map(w => ({ Role: 'Adviser', Name: w.name, Workload: w.count })),
      ...workloads.panelistWorkload.map(w => ({ Role: 'Panelist', Name: w.name, Workload: w.count }))
    ];
    const wb = XLSX.utils.book_new();
    const wsStats = XLSX.utils.json_to_sheet(statsData);
    const wsWorkload = XLSX.utils.json_to_sheet(workloadData);
    XLSX.utils.book_append_sheet(wb, wsStats, 'System Stats');
    XLSX.utils.book_append_sheet(wb, wsWorkload, 'Workloads');
    XLSX.writeFile(wb, 'Capstone_System_Report.xlsx');
  };

  const exportToPDF = () => {
    if (!stats || !workloads) return;
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Capstone System Monitoring Report', 14, 22);
      doc.setFontSize(14);
      doc.text('System Statistics', 14, 35);
      const statsBody = [
        ['Total Groups', stats.totalGroups.toString()],
        ['Pending Proposals', stats.pendingProposals.toString()],
        ['Scheduled Defenses', stats.totalSchedules.toString()],
        ['Pending Revisions', stats.pendingRevisions.toString()],
        ['Total Panelists', stats.totalPanelists.toString()],
      ];
      autoTable(doc, { startY: 40, head: [['Metric', 'Value']], body: statsBody, theme: 'grid', headStyles: { fillColor: [41, 128, 185] } });
      doc.setFontSize(14);
      const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : 100; 
      doc.text('Faculty Workloads', 14, finalY + 15);
      const workloadBody = [
        ...workloads.adviserWorkload.map(w => ['Adviser', w.name, w.count.toString()]),
        ...workloads.panelistWorkload.map(w => ['Panelist', w.name, w.count.toString()])
      ];
      autoTable(doc, { startY: finalY + 20, head: [['Role', 'Name', 'Total Assigned']], body: workloadBody, theme: 'grid', headStyles: { fillColor: [142, 68, 173] } });
      doc.save('Capstone_System_Report.pdf');
    } catch (error: any) {
      alert("PDF Download Error: " + error.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user.firstName}! Here is the latest status.</p>
        </div>
        
        {isAdmin && (
          <div className="flex gap-3">
            <button onClick={exportToExcel} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium shadow-sm">
              <FileSpreadsheet size={18} /> Export Excel
            </button>
            <button onClick={exportToPDF} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium shadow-sm">
              <Download size={18} /> Export PDF
            </button>
          </div>
        )}
      </div>
      
      {loading && <p className="text-gray-500">Loading dashboard data...</p>}
      {error && <p className="text-red-500 bg-red-50 p-4 rounded-lg">{error}</p>}

      {/* ADMIN / COORDINATOR DASHBOARD */}
      {isAdmin && stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><Users size={28} /></div>
              <div><p className="text-sm text-gray-500 font-semibold">Total Groups</p><p className="text-3xl font-bold text-gray-800">{stats.totalGroups}</p></div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
              <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full"><FileText size={28} /></div>
              <div><p className="text-sm text-gray-500 font-semibold">Pending Proposals</p><p className="text-3xl font-bold text-gray-800">{stats.pendingProposals}</p></div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-full"><Calendar size={28} /></div>
              <div><p className="text-sm text-gray-500 font-semibold">Scheduled Defenses</p><p className="text-3xl font-bold text-gray-800">{stats.totalSchedules}</p></div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-full"><AlertCircle size={28} /></div>
              <div><p className="text-sm text-gray-500 font-semibold">Pending Revisions</p><p className="text-3xl font-bold text-gray-800">{stats.pendingRevisions}</p></div>
            </div>
          </div>

          {workloads && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <Briefcase className="text-blue-600" size={20} /> Adviser Workload
                </h2>
                <ul className="space-y-3">
                  {workloads.adviserWorkload.length === 0 && <p className="text-sm text-gray-500 italic">No advisers found.</p>}
                  {workloads.adviserWorkload.map((adv, index) => (
                    <li key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <span className="text-gray-700 font-medium">{adv.name}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${adv.count > 3 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{adv.count} Groups</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <Award className="text-purple-600" size={20} /> Panelist Workload
                </h2>
                <ul className="space-y-3">
                  {workloads.panelistWorkload.length === 0 && <p className="text-sm text-gray-500 italic">No panelists found.</p>}
                  {workloads.panelistWorkload.map((pan, index) => (
                    <li key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <span className="text-gray-700 font-medium">{pan.name}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${pan.count > 5 ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>{pan.count} Defenses</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}

      {/* STUDENT / ADVISER / PANELIST DASHBOARD */}
      {!isAdmin && (
        <div className="space-y-6">
          {/* Welcome Card */}
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-100 text-blue-600 rounded-full">
                <GraduationCap size={48} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {user.firstName}!</h2>
            <p className="text-gray-500">
              You are logged in as a <strong>{user.role}</strong>. Please use the sidebar on the left to navigate to your tasks.
            </p>
          </div>

          {/* MY GROUP PROFILE CARD (For Students) */}
          {user.role === 'STUDENT' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Users className="text-blue-600" size={20} /> My Group Profile
                </h2>
                {studentGroup && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700`}>
                    {studentGroup.status.replace('_', ' ')}
                  </span>
                )}
              </div>
              
              <div className="p-6">
                {groupLoading ? (
                  <p className="text-gray-500 animate-pulse">Loading group details...</p>
                ) : !studentGroup ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500 italic">You are not yet assigned to a Capstone Group.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Side: Group Info */}
                    <div>
                      <div className="mb-6">
                        <p className="text-sm text-gray-500 font-semibold mb-1">Group Name</p>
                        <p className="text-xl font-bold text-gray-800">{studentGroup.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 font-semibold mb-1">Assigned Adviser</p>
                        {studentGroup.adviser ? (
                          <div className="flex items-center gap-2 text-gray-800 font-medium">
                            <User size={16} className="text-gray-400" />
                            {studentGroup.adviser.user.firstName} {studentGroup.adviser.user.lastName}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-sm">Not Assigned Yet</span>
                        )}
                      </div>
                    </div>

                    {/* Right Side: Members List */}
                    <div>
                      <p className="text-sm text-gray-500 font-semibold mb-3">Group Members ({studentGroup.members.length})</p>
                      <ul className="space-y-2">
                        {studentGroup.members.map((m, idx) => (
                          <li key={idx} className="flex items-center gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                              {m.student.user.firstName.charAt(0)}{m.student.user.lastName.charAt(0)}
                            </div>
                            <span className="text-gray-700 text-sm font-medium">
                              {m.student.user.firstName} {m.student.user.lastName}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}