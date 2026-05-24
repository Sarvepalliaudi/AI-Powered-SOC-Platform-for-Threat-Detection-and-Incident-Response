import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('bhanu@soc.local');
  const [password, setPassword] = useState('soc123');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-soc-bg grid-bg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-soc-accent/5 via-transparent to-soc-accent2/5" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-soc-accent/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-soc-accent2/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

      <div className="relative w-full max-w-md mx-4">
        <div className="glass-card neon-border p-8">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 rounded-2xl bg-soc-accent/10 border border-soc-accent/30 mb-4">
              <Shield className="text-soc-accent" size={40} />
            </div>
            <h1 className="font-display text-2xl font-bold neon-text">AI-Powered SOC</h1>
            <p className="text-soc-muted text-sm mt-1">Threat Detection & Incident Response</p>
            <p className="text-xs text-soc-muted mt-2 font-mono">NA-042026 – Group A</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-soc-danger/10 border border-soc-danger/30 text-soc-danger text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-soc-muted mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm text-soc-muted mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-soc-muted">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full btn-primary py-3 font-display tracking-wide disabled:opacity-50">
              {loading ? 'Authenticating...' : 'ACCESS SOC PLATFORM'}
            </button>
          </form>

          <div className="mt-6 p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-soc-muted text-center mb-2">Demo Credentials</p>
            <div className="space-y-1 text-xs font-mono text-center text-gray-400">
              <p>bhanu@soc.local / soc123</p>
              <p>admin@soc.local / admin123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
