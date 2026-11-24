import { useEffect, useState, FormEvent } from 'react';
import { Search, Plus, Trash2, Users, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

interface GroupMember {
  studentId: string;
  student: { user: { firstName: string; lastName: string } };
}
interface Group {
  id: string;
  name: string;
  status: string;
  adviser?: { id: string; user: { firstName: string; lastName: string } };
  members: GroupMember[];
}
interface Adviser { id: string; user: { firstName: string; lastName: string }; }
interface Student { id: string; studentNumber: string; user: { firstName: string; lastName: string }; }

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [advisers, setAdvisers] = useState<Adviser[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  // Get User Role for UI Permissions
  let user = { role: 'STUDENT' };
  try {
    const userString = localStorage.getItem('user');
    if (userString) user = JSON.parse(userString);
  } catch (e) {}
  const isAdmin = ['ADMIN', 'COORDINATOR'].includes(user.role);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedAdviserId, setSelectedAdviserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manage Members State
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Assign Adviser Modal State
  const [isAdviserModalOpen, setIsAdviserModalOpen] = useState(false);
  const [selectedGroupForAdviser, setSelectedGroupForAdviser] = useState<Group | null>(null);
  const [newAdviserId, setNewAdviserId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [groupsRes, advisersRes] = await Promise.all([
        fetch('http://localhost:5000/api/groups', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/groups/advisers', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (!groupsRes.ok || !advisersRes.ok) throw new Error('Failed to fetch data');
      
      const groupsData = await groupsRes.json();
      setGroups(groupsData);
      setAdvisers(await advisersRes.json());

      if (selectedGroup) {
        const updated = groupsData.find((g: Group) => g.id === selectedGroup.id);
        if (updated) setSelectedGroup(updated);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- SEARCH LOGIC ---
  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (g.adviser && g.adviser.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateGroup = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newGroupName, adviserId: selectedAdviserId }),
      });
      
      if (!response.ok) throw new Error('Failed to create group');
      
      toast.success('Group created successfully!');
      setNewGroupName(''); setSelectedAdviserId(''); setIsCreateModalOpen(false); 
      fetchData();
    } catch (err: any) { 
      toast.error(err.message); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete ${groupName}. This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await fetch(`http://localhost:5000/api/groups/${groupId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Group deleted!');
        fetchData();
      } catch (err) { 
        toast.error('Failed to delete group.'); 
      }
    }
  };

  const openAdviserModal = (group: Group) => {
    setSelectedGroupForAdviser(group);
    setNewAdviserId(group.adviser?.id || '');
    setIsAdviserModalOpen(true);
  };

  const handleAssignAdviser = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedGroupForAdviser) return;
    setIsProcessing(true);
    try {
      const response = await fetch(`http://localhost:5000/api/groups/${selectedGroupForAdviser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ adviserId: newAdviserId })
      });
      if (!response.ok) throw new Error('Failed to assign adviser');
      
      toast.success('Adviser updated successfully!');
      setIsAdviserModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const openMembersModal = async (group: Group) => {
    setSelectedGroup(group);
    setIsMemberModalOpen(true);
    try {
      const res = await fetch('http://localhost:5000/api/groups/students', { headers: { Authorization: `Bearer ${token}` } });
      setAvailableStudents(await res.json());
    } catch (err) { toast.error('Failed to load students.'); }
  };

  const handleAddMember = async (studentId: string) => {
    if (!selectedGroup) return;
    setIsProcessing(true);
    try {
      const response = await fetch(`http://localhost:5000/api/groups/${selectedGroup.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentId }),
      });
      if(!response.ok) throw new Error('Failed to add member');
      
      setAvailableStudents(prev => prev.filter(s => s.id !== studentId));
      await fetchData();
      toast.success('Student added!');
    } catch (err: any) { 
      toast.error(err.message); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleRemoveMember = async (studentId: string) => {
    if (!selectedGroup) return;
    setIsProcessing(true);
    try {
      const response = await fetch(`http://localhost:5000/api/groups/${selectedGroup.id}/members/${studentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if(!response.ok) throw new Error('Failed to remove member');
      
      const res = await fetch('http://localhost:5000/api/groups/students', { headers: { Authorization: `Bearer ${token}` } });
      setAvailableStudents(await res.json());
      await fetchData();
      toast.success('Student removed.');
    } catch (err: any) { 
      toast.error(err.message); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Capstone Groups</h1>
          <p className="text-gray-500 mt-1">Manage student groups and assign advisers.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search groups..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          {/* Only Admins/Coordinators can create groups */}
          {isAdmin && (
            <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm">
              <Plus size={18} /> Create Group
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
          <div className="h-12 bg-gray-100 border-b"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex p-4 border-b gap-4">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
            <Users size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No groups found</h3>
          <p className="text-gray-500 mt-1">Create a new group or adjust your search.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                <th className="p-4 font-semibold">Group Name</th>
                <th className="p-4 font-semibold">Adviser</th>
                <th className="p-4 font-semibold">Members</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((group) => (
                <tr key={group.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                  <td className="p-4 font-medium text-gray-800">{group.name}</td>
                  <td className="p-4 text-gray-600 flex items-center gap-2">
                    {group.adviser ? (
                      <>
                        {group.adviser.user.firstName} {group.adviser.user.lastName}
                        {/* Only Admins can edit the adviser */}
                        {isAdmin && (
                          <button onClick={() => openAdviserModal(group)} className="text-gray-400 hover:text-blue-600 transition" title="Change Adviser">
                            <Edit2 size={14} />
                          </button>
                        )}
                      </>
                    ) : (
                      isAdmin ? (
                        <button onClick={() => openAdviserModal(group)} className="text-gray-400 italic hover:text-blue-600 transition underline decoration-dashed underline-offset-4">
                          Not Assigned (Click to Assign)
                        </button>
                      ) : (
                        <span className="text-gray-400 italic">Not Assigned</span>
                      )
                    )}
                  </td>
                  <td className="p-4 text-gray-600">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">
                      {group.members.length} / 3
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      group.status === 'ADVISER_ASSIGNED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {group.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 flex gap-3 justify-end">
                    {/* Only Admins can manage members or delete */}
                    {isAdmin && (
                      <>
                        <button onClick={() => openMembersModal(group)} className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors">
                          Manage Members
                        </button>
                        <button onClick={() => handleDeleteGroup(group.id, group.name)} className="text-red-500 hover:text-red-700 font-medium text-sm transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      {isCreateModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Group</h2>
            <form onSubmit={handleCreateGroup} className="space-y-5">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Group Name</label>
                <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., Group Alpha" />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Assign Adviser (Optional)</label>
                <select value={selectedAdviserId} onChange={(e) => setSelectedAdviserId(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">-- No Adviser Yet --</option>
                  {advisers.map((adv) => (
                    <option key={adv.id} value={adv.id}>{adv.user.firstName} {adv.user.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 disabled:bg-blue-400 shadow-sm">
                  {isSubmitting ? 'Saving...' : 'Save Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN ADVISER MODAL */}
      {isAdviserModalOpen && selectedGroupForAdviser && isAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Assign Adviser</h2>
            <p className="text-gray-500 mb-6">{selectedGroupForAdviser.name}</p>
            <form onSubmit={handleAssignAdviser} className="space-y-5">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Select Adviser</label>
                <select value={newAdviserId} onChange={(e) => setNewAdviserId(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">-- Unassign Adviser --</option>
                  {advisers.map((adv) => (
                    <option key={adv.id} value={adv.id}>{adv.user.firstName} {adv.user.lastName}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsAdviserModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition">Cancel</button>
                <button type="submit" disabled={isProcessing} className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 disabled:bg-blue-400 shadow-sm">
                  {isProcessing ? 'Saving...' : 'Save Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE MEMBERS MODAL */}
      {isMemberModalOpen && selectedGroup && isAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-1 text-gray-800">Manage Members</h2>
            <p className="text-gray-500 mb-6">{selectedGroup.name}</p>

            <h3 className="font-semibold text-gray-700 mb-3">Current Members</h3>
            <ul className="bg-gray-50 rounded-xl p-4 mb-6 min-h-[80px] border">
              {selectedGroup.members.length === 0 && <li className="text-gray-400 text-sm italic text-center">No students assigned yet.</li>}
              {selectedGroup.members.map((m) => (
                <li key={m.studentId} className="py-2 border-b last:border-0 flex justify-between items-center">
                  <span className="text-gray-800 font-medium">{m.student.user.firstName} {m.student.user.lastName}</span>
                  <button 
                    onClick={() => handleRemoveMember(m.studentId)}
                    disabled={isProcessing}
                    className="text-xs text-red-500 border border-red-200 px-3 py-1 rounded-full hover:bg-red-50 disabled:opacity-50 transition"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <h3 className="font-semibold text-gray-700 mb-3">Available Students</h3>
            <div className="border rounded-xl max-h-48 overflow-y-auto mb-6">
              {availableStudents.length === 0 && <p className="p-4 text-gray-400 text-sm italic text-center">No available students left.</p>}
              {availableStudents.map((student) => (
                <div key={student.id} className="flex justify-between items-center p-4 border-b last:border-0 hover:bg-gray-50 transition">
                  <span className="text-gray-800">{student.user.firstName} {student.user.lastName} <span className="text-xs text-gray-400">({student.studentNumber})</span></span>
                  <button 
                    onClick={() => handleAddMember(student.id)}
                    disabled={isProcessing}
                    className="text-sm bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full hover:bg-blue-200 disabled:opacity-50 transition"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button onClick={() => setIsMemberModalOpen(false)} className="bg-gray-800 text-white px-6 py-2 rounded-xl hover:bg-gray-900 shadow-sm transition">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}