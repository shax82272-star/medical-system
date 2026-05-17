import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, User } from 'lucide-react';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || "Noto'g'ri ma'lumotlar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #e8f4f8 0%, #f0f8fb 40%, #fafeff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decorative blobs */}
      <div style={{
        position: 'absolute', top: -120, right: -80,
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,129,154,0.12) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -100, left: -60,
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(144,194,231,0.18) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Main card — full visual like image 1 */}
      <div style={{
        width: '100%', maxWidth: 440,
        background: 'white',
        borderRadius: 28,
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(34,129,154,0.14), 0 8px 32px rgba(34,129,154,0.08)',
        border: '1px solid rgba(144,194,231,0.25)',
        position: 'relative',
      }}>

        {/* Top banner inside card */}
        <div style={{
          background: 'linear-gradient(135deg, #22819A 0%, #1a6478 100%)',
          padding: '36px 40px 32px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 160, height: 160, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: -20, left: -20,
            width: 100, height: 100, borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
          }} />

          {/* Logo icon — blood drop */}
          <div style={{
            width: 72, height: 72,
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255,255,255,0.25)',
            borderRadius: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px',
          }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C12 2 5 9.5 5 14a7 7 0 0 0 14 0c0-4.5-7-12-7-12z" fill="rgba(255,255,255,0.95)" />
              <ellipse cx="9.5" cy="13.5" rx="1.5" ry="2" fill="rgba(34,129,154,0.5)" transform="rotate(-20 9.5 13.5)" />
            </svg>
          </div>

          <div style={{ fontSize: 26, fontWeight: 800, color: 'white', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            Qon <span style={{ color: '#90C2E7' }}>Tahlili</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>
            Qon tahlili boshqaruv tizimi
          </div>
        </div>

        {/* Form area */}
        <div style={{ padding: '32px 40px 28px' }}>
          <div style={{ marginBottom: 26 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 5 }}>
              Tizimga kirish
            </h2>
            <p style={{ fontSize: 13, color: '#64748B' }}>
              Ma'lumotlaringizni kiriting
            </p>
          </div>

          {error && (
            <div style={{
              padding: '11px 16px',
              background: '#FEF2F2',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10,
              fontSize: 13,
              color: '#EF4444',
              marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 7 }}>
                Foydalanuvchi nomi
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{
                  position: 'absolute', left: 14, top: '50%',
                  transform: 'translateY(-50%)',
                  color: focused === 'username' ? '#22819A' : '#94A3B8',
                  transition: 'color 0.2s',
                }} />
                <input
                  type="text"
                  placeholder="admin yoki doktor nomi"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  onFocus={() => setFocused('username')}
                  onBlur={() => setFocused('')}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    border: `1.5px solid ${focused === 'username' ? '#22819A' : '#E2E8F0'}`,
                    borderRadius: 12,
                    fontSize: 14,
                    color: '#1E293B',
                    background: focused === 'username' ? '#FAFEFF' : '#F8FAFC',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxShadow: focused === 'username' ? '0 0 0 3px rgba(34,129,154,0.12)' : 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 7 }}>
                Parol
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: 14, top: '50%',
                  transform: 'translateY(-50%)',
                  color: focused === 'password' ? '#22819A' : '#94A3B8',
                  transition: 'color 0.2s',
                }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 44px 12px 42px',
                    border: `1.5px solid ${focused === 'password' ? '#22819A' : '#E2E8F0'}`,
                    borderRadius: 12,
                    fontSize: 14,
                    color: '#1E293B',
                    background: focused === 'password' ? '#FAFEFF' : '#F8FAFC',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxShadow: focused === 'password' ? '0 0 0 3px rgba(34,129,154,0.12)' : 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: 'absolute', right: 14, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: showPw ? '#22819A' : '#94A3B8',
                    padding: 0, display: 'flex', alignItems: 'center',
                    transition: 'color 0.2s',
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #22819A 0%, #1a6478 100%)',
                color: 'white',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.82 : 1,
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 6px 20px rgba(34,129,154,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <span className="loader" style={{ width: 16, height: 16 }} />
                  Kirilmoqda...
                </>
              ) : 'Tizimga kirish'}
            </button>
          </form>

          {/* Admin note */}
          <div style={{
            marginTop: 22,
            padding: '12px 16px',
            background: '#F8FAFC',
            borderRadius: 10,
            fontSize: 12,
            color: '#64748B',
            borderLeft: '3px solid #22819A',
          }}>
            <strong style={{ color: '#334155' }}>Eslatma:</strong> Faqat doktorlar uchunligi sabab login va parolni admindan oling{' '}
            <code style={{
              background: '#E2E8F0', padding: '2px 6px',
              borderRadius: 4, fontFamily: 'monospace', fontSize: 11,
            }}>t.me//admin
              
            </code>{' '}
                ga murojat qiling
          </div>
        </div>

        {/* Footer inside card */}
        <div style={{
          padding: '14px 40px',
          borderTop: '1px solid #F1F5F9',
          textAlign: 'center',
          fontSize: 12,
          color: '#94A3B8',
        }}>
          Qon tahlili tizimi
        </div>
      </div>
    </div>
  );
}