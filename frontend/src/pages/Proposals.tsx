import { useEffect, useState, FormEvent } from 'react';
import { Search, Plus, FileText, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

interface Remark {
  id: string;
  remarkText: string;
  createdAt: string;
}

interface Proposal {
  id: string;
  title: string;
  abstract: string;
  status: string;
  filePath: string;
  group: { 
    name: string; 
    adviser?: { user: { firstName: string; lastName: string } } 
  };
  remarks: Remark[];
}
interface Group { id: string; name: string; }

export default function Proposals() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  let user = { role: 'STUDENT' };
  try {
    const userString = localStorage.getItem('user');
    if (userString) user = JSON.parse(userString);
  } catch (e) {}
  const isReviewer = ['ADMIN', 'COORDINATOR', 'ADVISER'].includes(user.role);

  const [searchTerm, setSearchTerm] = useState('');

  // Submit Proposal Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review Remark Modal State
  const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);
  const [remarkText, setRemarkText] = useState('');
  const [currentProposalId, setCurrentProposalId] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [propRes, groupRes] = await Promise.all([
        fetch('http://localhost:5000/api/proposals', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/groups', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setProposals(await propRes.json());
      setGroups(await groupRes.json());
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmitProposal = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Please select a PDF file.");

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('groupId', selectedGroupId);
      formData.append('title', title);
      formData.append('abstract', abstract);
      formData.append('document', file);

      const response = await fetch('http://localhost:5000/api/proposals', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      toast.success('Proposal submitted!');
      setIsModalOpen(false);
      setSelectedGroupId(''); setTitle(''); setAbstract(''); setFile(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: string, remark?: string) => {
    try {
      await fetch(`http://localhost:5000/api/proposals/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, remarkText: remark })
      });
      toast.success(`Proposal marked as ${status.replace('_', ' ')}`);
      setIsRemarkModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleOpenRemarkModal = (id: string, status: string) => {
    setCurrentProposalId(id);
    setCurrentStatus(status);
    setRemarkText('');
    setIsRemarkModalOpen(true);
  };

  const filteredProposals = proposals.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Title Proposals</h1>
          <p className="text-gray-500 mt-1">Review and approve capstone project titles.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" placeholder="Search proposals..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          {['STUDENT', 'ADMIN', 'COORDINATOR'].includes(user.role) && (
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition">
              <Plus size={18} /> Submit
            </button>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map(i => <div key={i} className="h-48 bg-white border rounded-xl shadow-sm"></div>)}
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border text-center">
          <FileText className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900">No proposals found</h3>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredProposals.map((p) => (
            <div key={p.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-blue-800">{p.title}</h2>
                  
                  {/* UPDATED: Adviser shown here */}
                  <p className="text-sm text-gray-500 mt-1 flex items-center flex-wrap gap-2">
                    <span>Submitted by: <span className="font-medium text-gray-700">{p.group.name}</span></span>
                    {p.group.adviser && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span>Adviser: <span className="font-medium text-gray-700">{p.group.adviser.user.firstName} {p.group.adviser.user.lastName}</span></span>
                      </>
                    )}
                  </p>

                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  p.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                  p.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                  p.status === 'NEEDS_REVISION' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {p.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-gray-700 mb-4 bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm leading-relaxed">
                {p.abstract}
              </p>

              {p.remarks && p.remarks.length > 0 && (
                <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                  <div className="flex items-center gap-2 mb-2 text-yellow-800 font-bold">
                    <MessageSquare size={16} /> Reviewer Remarks:
                  </div>
                  {p.remarks.map((r) => (
                    <p key={r.id} className="text-sm text-yellow-900 mb-1">
                      • {r.remarkText}
                    </p>
                  ))}
                </div>
              )}
              
              {p.filePath && p.filePath !== 'dummy.pdf' && p.filePath !== 'dummy-file.pdf' && (
                <div className="mb-4">
                  <a href={`http://localhost:5000/uploads/${p.filePath}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline transition">
                    <FileText size={16} /> View Uploaded Document
                  </a>
                </div>
              )}

              {isReviewer && p.status === 'PENDING' && (
                <div className="flex gap-3 justify-end mt-4 border-t pt-4">
                  <button onClick={() => updateStatus(p.id, 'APPROVED')} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm text-sm font-medium transition">Approve</button>
                  <button onClick={() => handleOpenRemarkModal(p.id, 'NEEDS_REVISION')} className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 shadow-sm text-sm font-medium transition">Needs Revision</button>
                  <button onClick={() => handleOpenRemarkModal(p.id, 'REJECTED')} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 shadow-sm text-sm font-medium transition">Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Submit Proposal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Submit Title Proposal</h2>
            <form onSubmit={handleSubmitProposal} className="space-y-5">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Select Group</label>
                <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)} required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">-- Choose a Group --</option>
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Project Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g., Smart Attendance System" />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Abstract</label>
                <textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} required rows={3} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Write the abstract here..." />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Upload PDF Document</label>
                <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} required className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition font-medium">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 shadow-sm disabled:bg-blue-400 font-medium transition">
                  {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Remark Modal */}
      {isRemarkModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-2 text-gray-800">
              {currentStatus === 'NEEDS_REVISION' ? 'Request Revision' : 'Reject Proposal'}
            </h2>
            <p className="text-gray-500 mb-6 text-sm">Please provide a reason. This will be visible to the students.</p>
            
            <form onSubmit={(e) => { e.preventDefault(); updateStatus(currentProposalId, currentStatus, remarkText); }}>
              <div className="mb-6">
                <textarea 
                  value={remarkText} 
                  onChange={(e) => setRemarkText(e.target.value)} 
                  required 
                  rows={4} 
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                  placeholder="e.g., The title is too broad. Please specify the target users..." 
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsRemarkModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition font-medium text-sm">Cancel</button>
                <button type="submit" className={`text-white px-6 py-2 rounded-xl shadow-sm font-medium transition text-sm ${currentStatus === 'NEEDS_REVISION' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-red-600 hover:bg-red-700'}`}>
                  Submit Remark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}