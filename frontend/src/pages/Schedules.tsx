import { useEffect, useState, FormEvent } from 'react';
import { Search, Plus, Trash2, Calendar, Users, X, CheckCircle2, AlertCircle, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

interface Group { id: string; name: string; }
interface Room { id: string; name: string; }
interface Panelist { id: string; user: { firstName: string; lastName: string }; }
interface SchedulePanelist { panelistId: string; panelist: { user: { firstName: string; lastName: string } }; }
interface Criteria { id: string; name: string; weight: number; }

interface Schedule {
  id: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  group: { name: string };
  room: { name: string };
  panelMembers: SchedulePanelist[];
}

interface PanelistResult { panelistId: string; name: string; score: number; comments: string | null; }
interface ConsolidatedResult { panelists: PanelistResult[]; finalAverage: number; status: string; }
interface Revision { id: string; description: string; status: string; }

export default function Schedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [panelists, setPanelists] = useState<Panelist[]>([]); 
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  let user = { role: 'STUDENT' };
  try {
    const userString = localStorage.getItem('user');
    if (userString) user = JSON.parse(userString);
  } catch (e) {}
  
  const isAdmin = ['ADMIN', 'COORDINATOR'].includes(user.role);
  const canEvaluate = ['ADMIN', 'COORDINATOR', 'PANELIST'].includes(user.role);
  const canManagePanelists = ['ADMIN', 'COORDINATOR'].includes(user.role);

  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [defenseType, setDefenseType] = useState('TITLE_DEFENSE');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isPanelModalOpen, setIsPanelModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [evalSchedule, setEvalSchedule] = useState<Schedule | null>(null);
  const [evalScores, setEvalScores] = useState<Record<string, number>>({});
  const [evalComments, setEvalComments] = useState('');

  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [results, setResults] = useState<ConsolidatedResult | null>(null);
  const [resultSchedule, setResultSchedule] = useState<Schedule | null>(null);

  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionSchedule, setRevisionSchedule] = useState<Schedule | null>(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [newRevisionDesc, setNewRevisionDesc] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schRes, grpRes, roomRes, panRes, critRes] = await Promise.all([
        fetch('http://localhost:5000/api/schedules', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/groups', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/schedules/rooms', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/schedules/panelists', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/evaluations/criteria', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const schData = await schRes.json();
      setSchedules(schData);
      setGroups(await grpRes.json());
      setRooms(await roomRes.json());
      setPanelists(await panRes.json());
      setCriteria(await critRes.json());

      if (selectedSchedule) {
        const updated = schData.find((s: Schedule) => s.id === selectedSchedule.id);
        if (updated) setSelectedSchedule(updated);
      }
    } catch (err: any) {
      toast.error('Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateSchedule = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ groupId: selectedGroupId, type: defenseType, date, startTime, endTime, roomId: selectedRoomId })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create schedule');

      toast.success('Defense scheduled successfully!');
      setIsModalOpen(false);
      setSelectedGroupId(''); setDate(''); setStartTime(''); setEndTime(''); setSelectedRoomId('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (id: string, groupName: string) => {
    const result = await Swal.fire({
      title: 'Delete Schedule?',
      text: `Are you sure you want to remove the defense for ${groupName}?`,
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280', confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`http://localhost:5000/api/schedules/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error('Failed to delete schedule');
        toast.success('Schedule deleted!');
        fetchData();
      } catch (err: any) { toast.error(err.message); }
    }
  };

  const openPanelModal = (schedule: Schedule) => { setSelectedSchedule(schedule); setIsPanelModalOpen(true); };

  const handleAddPanelist = async (panelistId: string) => {
    if (!selectedSchedule) return;
    setIsProcessing(true);
    try {
      const response = await fetch(`http://localhost:5000/api/schedules/${selectedSchedule.id}/panelists`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ panelistId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to add panelist');
      toast.success('Panelist assigned!');
      await fetchData();
    } catch (err: any) { toast.error(err.message); } finally { setIsProcessing(false); }
  };

  const handleRemovePanelist = async (panelistId: string) => {
    if (!selectedSchedule) return;
    setIsProcessing(true);
    try {
      const response = await fetch(`http://localhost:5000/api/schedules/${selectedSchedule.id}/panelists/${panelistId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to remove panelist');
      toast.success('Panelist removed.');
      await fetchData();
    } catch (err: any) { toast.error(err.message); } finally { setIsProcessing(false); }
  };

  const openEvalModal = (schedule: Schedule) => {
    setEvalSchedule(schedule); setEvalScores({}); setEvalComments(''); setIsEvalModalOpen(true);
  };

  const handleScoreChange = (criteriaId: string, value: string) => {
    setEvalScores({ ...evalScores, [criteriaId]: Number(value) });
  };

  const handleSubmitEvaluation = async (e: FormEvent) => {
    e.preventDefault();
    if (!evalSchedule) return;

    const formattedScores = Object.keys(evalScores).map(critId => ({
      criteriaId: critId,
      score: evalScores[critId]
    }));

    try {
      const response = await fetch(`http://localhost:5000/api/evaluations/${evalSchedule.id}`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ scores: formattedScores, comments: evalComments }) 
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to submit evaluation');

      toast.success('Evaluation submitted successfully!');
      setIsEvalModalOpen(false);
    } catch (err: any) { toast.error(err.message); }
  };

  const openResultModal = async (schedule: Schedule) => {
    setResultSchedule(schedule); setResults(null); setIsResultModalOpen(true);
    try {
      const response = await fetch(`http://localhost:5000/api/evaluations/${schedule.id}/results`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch results');
      setResults(data);
    } catch (err: any) { toast.error(err.message); }
  };

  const openRevisionModal = async (schedule: Schedule) => {
    setRevisionSchedule(schedule); setIsRevisionModalOpen(true); fetchRevisions(schedule.id);
  };

  const fetchRevisions = async (scheduleId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/revisions/${scheduleId}`, { headers: { Authorization: `Bearer ${token}` } });
      setRevisions(await response.json());
    } catch (err) { toast.error('Failed to load revisions.'); }
  };

  const handleAddRevision = async (e: FormEvent) => {
    e.preventDefault();
    if (!revisionSchedule || !newRevisionDesc) return;
    try {
      await fetch('http://localhost:5000/api/revisions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ scheduleId: revisionSchedule.id, description: newRevisionDesc })
      });
      setNewRevisionDesc(''); fetchRevisions(revisionSchedule.id);
      toast.success('Revision added.');
    } catch (err) { toast.error('Failed to add revision.'); }
  };

  const handleUpdateRevisionStatus = async (id: string, status: string) => {
    if (!revisionSchedule) return;
    try {
      await fetch(`http://localhost:5000/api/revisions/${id}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      fetchRevisions(revisionSchedule.id);
      toast.success('Revision approved!');
    } catch (err) { toast.error('Failed to update revision.'); }
  };

  const availablePanelists = panelists.filter(p => !selectedSchedule?.panelMembers.some(pm => pm.panelistId === p.id));

  const filteredSchedules = schedules.filter(s => 
    s.group.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (first: string, last: string) => `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

  return (
    <div className="max-w-6xl mx-auto relative">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Defense Schedules</h1>
          <p className="text-gray-500 mt-1">Manage timelines, rooms, and panel assignments.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" placeholder="Search schedules..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            />
          </div>
          {isAdmin && (
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 shadow-sm transition-all active:scale-95 font-medium">
              <Plus size={18} /> Schedule
            </button>
          )}
        </div>
      </div>
      
      {/* TABLE SECTION */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden animate-pulse">
          <div className="h-14 bg-gray-100 border-b"></div>
          {[1, 2, 3].map(i => <div key={i} className="h-16 border-b bg-white"></div>)}
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl shadow-sm border text-center">
          <Calendar className="mx-auto text-gray-300 mb-4" size={56} />
          <h3 className="text-xl font-medium text-gray-900">No defenses found</h3>
          <p className="text-gray-500 mt-2">Create a new schedule or adjust your search.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                <th className="p-5 font-semibold">Group</th>
                <th className="p-5 font-semibold">Type</th>
                <th className="p-5 font-semibold">Date & Time</th>
                <th className="p-5 font-semibold">Room</th>
                <th className="p-5 font-semibold">Panelists</th>
                <th className="p-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-5 font-bold text-gray-800">{s.group.name}</td>
                  <td className="p-5">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 whitespace-nowrap">
                      {s.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-5 text-gray-600 text-sm">
                    <div className="font-semibold text-gray-800">{new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{new Date(s.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(s.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  </td>
                  <td className="p-5 text-gray-600 font-medium">{s.room.name}</td>
                  
                  {/* UPDATED: SHOW ACTUAL PANELIST NAMES */}
                  <td className="p-5 text-gray-600">
                    {s.panelMembers.length === 0 ? (
                      <span className="text-gray-400 italic text-sm">Unassigned</span>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {s.panelMembers.map((pm) => (
                          <div key={pm.panelistId} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            {pm.panelist.user.firstName} {pm.panelist.user.lastName}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  <td className="p-5 flex flex-wrap gap-x-4 gap-y-2 justify-end">
                    {canManagePanelists && (
                      <button onClick={() => openPanelModal(s)} className="text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors">Panelists</button>
                    )}
                    {canEvaluate && (
                      <button onClick={() => openEvalModal(s)} className="text-green-600 hover:text-green-800 font-semibold text-sm transition-colors">Evaluate</button>
                    )}
                    <button onClick={() => openResultModal(s)} className="text-purple-600 hover:text-purple-800 font-semibold text-sm transition-colors">Results</button>
                    {['ADMIN', 'COORDINATOR', 'ADVISER', 'PANELIST'].includes(user.role) && (
                      <button onClick={() => openRevisionModal(s)} className="text-orange-500 hover:text-orange-700 font-semibold text-sm transition-colors">Revisions</button>
                    )}
                    {isAdmin && (
                      <button onClick={() => handleDeleteSchedule(s.id, s.group.name)} className="text-red-500 hover:text-red-700 transition-colors p-1"><Trash2 size={16} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================= */}
      {/* 1. CREATE SCHEDULE MODAL                  */}
      {/* ========================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b bg-gray-50/50">
              <h2 className="text-2xl font-bold text-gray-800">Schedule Defense</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateSchedule} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Select Group</label>
                <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">-- Choose a Group --</option>
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Defense Type</label>
                <select value={defenseType} onChange={(e) => setDefenseType(e.target.value)} required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="TITLE_DEFENSE">Title Defense</option>
                  <option value="PROPOSAL_DEFENSE">Proposal Defense</option>
                  <option value="FINAL_DEFENSE">Final Defense</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Start Time</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">End Time</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Select Room</label>
                <select value={selectedRoomId} onChange={(e) => setSelectedRoomId(e.target.value)} required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">-- Choose a Room --</option>
                  {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition font-medium">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 shadow-sm disabled:bg-blue-400 font-medium transition">{isSubmitting ? 'Scheduling...' : 'Schedule'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 2. MANAGE PANELISTS MODAL                 */}
      {/* ========================================= */}
      {isPanelModalOpen && selectedSchedule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b bg-gray-50/50">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Assign Panelists</h2>
                <p className="text-gray-500 text-sm mt-1">{selectedSchedule.group.name} - {selectedSchedule.type.replace('_', ' ')}</p>
              </div>
              <button onClick={() => setIsPanelModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition"><X size={24} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Current Panel</h3>
                <div className="bg-gray-50 rounded-2xl p-2 border border-gray-200 min-h-[80px]">
                  {selectedSchedule.panelMembers.length === 0 && <p className="text-gray-400 text-sm italic text-center py-6">No panelists assigned yet.</p>}
                  {selectedSchedule.panelMembers.map((pm) => (
                    <div key={pm.panelistId} className="flex justify-between items-center bg-white p-3 rounded-xl border shadow-sm mb-2 last:mb-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                          {getInitials(pm.panelist.user.firstName, pm.panelist.user.lastName)}
                        </div>
                        <span className="text-gray-800 font-semibold">{pm.panelist.user.firstName} {pm.panelist.user.lastName}</span>
                      </div>
                      <button onClick={() => handleRemovePanelist(pm.panelistId)} disabled={isProcessing} className="text-xs font-semibold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100">Remove</button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Available Panelists</h3>
                <div className="border border-gray-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                  {availablePanelists.length === 0 && <p className="p-6 text-gray-400 text-sm italic text-center">No more panelists available.</p>}
                  {availablePanelists.map((p) => (
                    <div key={p.id} className="flex justify-between items-center p-3 border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-xs">
                          {getInitials(p.user.firstName, p.user.lastName)}
                        </div>
                        <span className="text-gray-700 font-medium text-sm">{p.user.firstName} {p.user.lastName}</span>
                      </div>
                      <button onClick={() => handleAddPanelist(p.id)} disabled={isProcessing} className="text-sm font-semibold bg-blue-50 text-blue-600 border border-blue-100 px-4 py-1.5 rounded-lg hover:bg-blue-100 transition">Add</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 3. EVALUATE MODAL                         */}
      {/* ========================================= */}
      {isEvalModalOpen && evalSchedule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b bg-gray-50/50">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Submit Evaluation</h2>
                <p className="text-gray-500 text-sm mt-1">{evalSchedule.group.name} - {evalSchedule.type.replace('_', ' ')}</p>
              </div>
              <button onClick={() => setIsEvalModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmitEvaluation} className="flex flex-col flex-1">
              <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
                {criteria.map((c) => (
                  <div key={c.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <label className="block text-gray-800 font-bold">
                      {c.name} 
                      <span className="block text-xs text-gray-500 font-normal mt-0.5">Weight: {c.weight * 100}%</span>
                    </label>
                    <div className="relative flex items-center">
                      <input 
                        type="number" min="0" max="100" required 
                        value={evalScores[c.id] || ''} 
                        onChange={(e) => handleScoreChange(c.id, e.target.value)} 
                        className="w-32 pl-2 pr-10 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 text-2xl font-bold text-gray-800 text-center outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                        placeholder="0" 
                      />
                      <span className="absolute right-4 text-gray-400 font-medium text-sm pointer-events-none">/100</span>
                    </div>
                  </div>
                ))}
                
                <div className="pt-2">
                  <label className="block text-gray-700 font-bold mb-2">Overall Comments</label>
                  <textarea 
                    value={evalComments} onChange={(e) => setEvalComments(e.target.value)} rows={3} 
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 outline-none transition-colors" 
                    placeholder="Provide constructive feedback..." 
                  />
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEvalModalOpen(false)} className="px-6 py-2.5 text-gray-600 font-semibold hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="bg-green-600 text-white px-8 py-2.5 rounded-xl hover:bg-green-700 shadow-sm font-bold transition-all active:scale-95">Submit Grades</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 4. RESULTS MODAL                          */}
      {/* ========================================= */}
      {isResultModalOpen && resultSchedule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b bg-gray-50/50">
              <h2 className="text-2xl font-bold text-gray-800">Official Results</h2>
              <button onClick={() => setIsResultModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition"><X size={24} /></button>
            </div>

            <div className="p-6">
              <p className="text-center text-gray-500 font-medium mb-6">{resultSchedule.group.name} <br/><span className="text-sm">{resultSchedule.type.replace('_', ' ')}</span></p>

              {!results ? (
                <div className="text-center py-8"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div><p className="text-gray-500 mt-4 font-medium">Calculating...</p></div>
              ) : (
                <div className="space-y-8">
                  <div className={`p-8 rounded-2xl text-center border-4 shadow-sm ${results.status === 'PASSED' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <Award size={48} className={`mx-auto mb-2 ${results.status === 'PASSED' ? 'text-green-500' : 'text-red-500'}`} />
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Final Average</h3>
                    <p className="text-6xl font-black text-gray-800 mb-3 tracking-tighter">{results.finalAverage}</p>
                    <span className={`px-5 py-1.5 rounded-full text-sm font-black tracking-wide ${results.status === 'PASSED' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                      {results.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Panel Breakdown</h3>
                    <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                      {results.panelists.map((p) => (
                        <div key={p.panelistId} className="flex justify-between items-center p-4 border-b last:border-0 bg-white">
                          <span className="text-gray-800 font-semibold">{p.name}</span>
                          <span className="font-black text-blue-600 text-lg">{p.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 5. REVISIONS MODAL                        */}
      {/* ========================================= */}
      {isRevisionModalOpen && revisionSchedule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b bg-gray-50/50">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Revision Checklist</h2>
                <p className="text-gray-500 text-sm mt-1">{revisionSchedule.group.name} - {revisionSchedule.type.replace('_', ' ')}</p>
              </div>
              <button onClick={() => setIsRevisionModalOpen(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition"><X size={24} /></button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {['ADMIN', 'COORDINATOR', 'PANELIST'].includes(user.role) && (
                <form onSubmit={handleAddRevision} className="flex gap-2 mb-6">
                  <input 
                    type="text" value={newRevisionDesc} onChange={(e) => setNewRevisionDesc(e.target.value)} required 
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 text-sm font-medium outline-none transition-colors" 
                    placeholder="Add a new requirement..." 
                  />
                  <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 font-semibold shadow-sm transition">Add</button>
                </form>
              )}

              <div className="space-y-3">
                {revisions.length === 0 && <p className="text-gray-400 text-sm italic text-center py-8 bg-gray-50 rounded-2xl border border-dashed">No revisions requested yet.</p>}
                
                {revisions.map((rev) => (
                  <div key={rev.id} className={`flex justify-between items-center p-4 border rounded-2xl transition-all ${rev.status === 'APPROVED' ? 'bg-green-50 border-green-100' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">
                        {rev.status === 'APPROVED' ? <CheckCircle2 className="text-green-500" size={20} /> : <AlertCircle className="text-orange-400" size={20} />}
                      </div>
                      <span className={`text-sm ${rev.status === 'APPROVED' ? 'text-gray-500 line-through' : 'text-gray-800 font-semibold'}`}>{rev.description}</span>
                    </div>
                    
                    {rev.status === 'PENDING' && ['ADMIN', 'COORDINATOR', 'ADVISER'].includes(user.role) && (
                      <button onClick={() => handleUpdateRevisionStatus(rev.id, 'APPROVED')} className="ml-4 shrink-0 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 font-bold shadow-sm transition">Approve</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}