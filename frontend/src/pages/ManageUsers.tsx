import { useEffect, useState, FormEvent } from 'react';
import { UserPlus, DoorOpen, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface User { id: string; email: string; firstName: string; lastName: string; role: string; }
interface Room { id: string; name: string; capacity: number; }

export default function ManageUsers() {
  const [activeTab, setActiveTab] = useState<'users' | 'rooms'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const token = localStorage.getItem('token');

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState(''); const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('STUDENT'); const [department, setDepartment] = useState('');
  const [expertise, setExpertise] = useState(''); const [isSubmitting, setIsSubmitting] = useState(false);

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [roomName, setRoomName] = useState(''); const [roomCapacity, setRoomCapacity] = useState('');

  const fetchData = async () => {
    try {
      const [usersRes, roomsRes] = await Promise.all([
        fetch('http://localhost:5000/api/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/users/rooms', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUsers(await usersRes.json());
      setRooms(await roomsRes.json());
    } catch (err: any) { toast.error('Failed to load data.'); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, password, firstName, lastName, role, department, expertise })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      toast.success('User created successfully!');
      setIsUserModalOpen(false);
      setEmail(''); setPassword(''); setFirstName(''); setLastName(''); setRole('STUDENT');
      fetchData();
    } catch (err: any) { toast.error(err.message); } finally { setIsSubmitting(false); }
  };

  const handleCreateRoom = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/users/rooms', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: roomName, capacity: roomCapacity })
      });
      if (!response.ok) throw new Error('Failed to create room');
      
      toast.success('Room created successfully!');
      setIsRoomModalOpen(false); setRoomName(''); setRoomCapacity('');
      fetchData();
    } catch (err: any) { toast.error(err.message); } finally { setIsSubmitting(false); }
  };

  const filteredUsers = users.filter(u => 
    u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">System Management</h1>
          <p className="text-gray-500 mt-1">Manage user accounts and physical rooms.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" placeholder={`Search ${activeTab}...`} value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button onClick={() => { setActiveTab('users'); setSearchTerm(''); }} className={`py-3 px-6 font-semibold text-sm transition ${activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Manage Users</button>
        <button onClick={() => { setActiveTab('rooms'); setSearchTerm(''); }} className={`py-3 px-6 font-semibold text-sm transition ${activeTab === 'rooms' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Manage Rooms</button>
      </div>

      {activeTab === 'users' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setIsUserModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition">
              <UserPlus size={18} /> Add New User
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm"><th className="p-4 font-semibold">Name</th><th className="p-4 font-semibold">Email</th><th className="p-4 font-semibold">Role</th></tr></thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">{u.firstName} {u.lastName}</td>
                    <td className="p-4 text-gray-600">{u.email}</td>
                    <td className="p-4"><span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{u.role}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'rooms' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setIsRoomModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition">
              <DoorOpen size={18} /> Add New Room
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm"><th className="p-4 font-semibold">Room Name</th><th className="p-4 font-semibold">Capacity</th></tr></thead>
              <tbody>
                {filteredRooms.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">{r.name}</td>
                    <td className="p-4 text-gray-600">{r.capacity} people</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-gray-700 text-sm font-bold mb-2">First Name</label><input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                <div><label className="block text-gray-700 text-sm font-bold mb-2">Last Name</label><input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              </div>
              <div><label className="block text-gray-700 text-sm font-bold mb-2">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div><label className="block text-gray-700 text-sm font-bold mb-2">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" /></div>
              <div><label className="block text-gray-700 text-sm font-bold mb-2">Role</label><select value={role} onChange={(e) => setRole(e.target.value)} required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"><option value="STUDENT">Student</option><option value="ADVISER">Adviser</option><option value="PANELIST">Panelist</option><option value="COORDINATOR">Coordinator</option></select></div>
              {role === 'ADVISER' && <div><label className="block text-gray-700 text-sm font-bold mb-2">Department</label><input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" /></div>}
              {role === 'PANELIST' && <div><label className="block text-gray-700 text-sm font-bold mb-2">Expertise</label><input type="text" value={expertise} onChange={(e) => setExpertise(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" /></div>}
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 shadow-sm disabled:bg-blue-400 transition">{isSubmitting ? 'Creating...' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ROOM MODAL */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Room</h2>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div><label className="block text-gray-700 text-sm font-bold mb-2">Room Name</label><input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., Room 202" /></div>
              <div><label className="block text-gray-700 text-sm font-bold mb-2">Capacity</label><input type="number" value={roomCapacity} onChange={(e) => setRoomCapacity(e.target.value)} required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., 40" /></div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsRoomModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 shadow-sm disabled:bg-blue-400 transition">{isSubmitting ? 'Saving...' : 'Save Room'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}