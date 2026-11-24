import { useState } from 'react';
import { Mail, Lock, LogIn, ShieldCheck } from 'lucide-react';
import lspuLogo from '../assets/lspu_logo.jpeg'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }

      // Save token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // CRITICAL FIX: Force a full page reload to update App.tsx state
      window.location.href = '/dashboard';
      
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      
      {/* LEFT SIDE - BRANDING (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 to-blue-800 text-white flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-700 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/3 translate-y-1/3"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="bg-white p-4 rounded-2xl shadow-2xl mb-8">
            <img src={lspuLogo} alt="LSPU Logo" className="w-32 h-32 object-contain" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">
            Capstone Monitoring System
          </h1>
          <p className="text-lg text-blue-200 max-w-md">
            Laguna State Polytechnic University <br />
            College of Computer Studies
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          
          {/* Mobile Logo (Shows only on small screens) */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <img src={lspuLogo} alt="LSPU Logo" className="w-24 h-24 object-contain mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 text-center">Capstone System</h2>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-500 text-sm">Please sign in to your account</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center border border-red-100 font-medium">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
                    placeholder="admin@lspu.edu.ph"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Password</label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-gray-900"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Login Button */}
              <button
                type="button" 
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-blue-800 transition-all duration-200 disabled:bg-blue-400 flex items-center justify-center gap-2 shadow-lg shadow-blue-700/30 mt-2"
              >
                {loading ? 'Authenticating...' : (
                  <>
                    <LogIn className="h-5 w-5" />
                    Sign In
                  </>
                )}
              </button>
            </div>

            {/* Security footer */}
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Secure Local Authentication</span>
            </div>
            
          </div>
        </div>
      </div>

    </div>
  );
}