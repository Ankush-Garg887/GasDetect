import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineStatusOnline, HiOutlineMail, HiOutlineLockClosed, HiOutlineUser } from 'react-icons/hi';

export default function RegisterPage() {
  const { register, isAuthenticated, loading } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'operator' });
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated && !loading) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill in all fields');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');

    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      toast.success('Account created successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 relative overflow-hidden px-4">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-electric-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md animate-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-electric-500 to-cyan-400 mb-4 shadow-lg shadow-electric-500/25">
            <HiOutlineStatusOnline className="text-white text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-400 text-sm">Join GasGuard monitoring system</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label" htmlFor="reg-name">Full Name</label>
              <div className="relative">
                <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input id="reg-name" name="name" type="text" value={form.name} onChange={handleChange}
                  className="input-field pl-10" placeholder="John Doe" />
              </div>
            </div>

            <div>
              <label className="input-label" htmlFor="reg-email">Email Address</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input id="reg-email" name="email" type="email" value={form.email} onChange={handleChange}
                  className="input-field pl-10" placeholder="john@gasguard.com" />
              </div>
            </div>

            <div>
              <label className="input-label" htmlFor="reg-password">Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input id="reg-password" name="password" type="password" value={form.password} onChange={handleChange}
                  className="input-field pl-10" placeholder="••••••••" />
              </div>
            </div>

            <div>
              <label className="input-label" htmlFor="reg-confirm">Confirm Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input id="reg-confirm" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange}
                  className="input-field pl-10" placeholder="••••••••" />
              </div>
            </div>

            <div>
              <label className="input-label" htmlFor="reg-role">Role</label>
              <select id="reg-role" name="role" value={form.role} onChange={handleChange} className="input-field">
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2 mt-2" id="register-submit">
              {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-electric-400 hover:text-electric-300 font-medium transition-colors">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
