import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Stethoscope, BarChart3,
  LogOut, Activity, FlaskConical,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = isAdmin
    ? [
        { path: '/dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
        { path: '/doctors',   label: 'Doktorlar',   icon: Stethoscope },
        { path: '/patients',  label: 'Bemorlar',    icon: Users },
        { path: '/diagnoses', label: 'Tashxislar',  icon: Activity },
        { path: '/statistics',label: 'Statistika',  icon: BarChart3 },
        { path: '/analyze',   label: 'Tahlil',      icon: FlaskConical },
      ]
    : [
        { path: '/dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
        { path: '/patients',  label: 'Bemorlar',    icon: Users },
        { path: '/diagnoses', label: 'Tashxislar',  icon: Activity },
        { path: '/statistics',label: 'Statistika',  icon: BarChart3 },
        { path: '/analyze',   label: 'Tahlil',      icon: FlaskConical },
      ];

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.username?.[0]?.toUpperCase()
    : 'U';

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, padding: '10px 20px', background: 'transparent' }}>
      <nav style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 20px',
        display: 'flex', alignItems: 'center', height: 54, gap: 4,
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 999, border: '1px solid rgba(255, 255, 255, 0.25)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>

        {/* Logo */}
        <NavLink to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 9, marginRight: 16, textDecoration: 'none' }}>
          <div style={{
            width: 34, height: 34, background: 'linear-gradient(135deg, #90C2E7, #22819A)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C12 2 5 9.5 5 14a7 7 0 0 0 14 0c0-4.5-7-12-7-12z" fill="rgba(255,255,255,0.95)" />
              <ellipse cx="9.5" cy="13.5" rx="1.4" ry="1.9" fill="rgba(34,129,154,0.45)" transform="rotate(-20 9.5 13.5)" />
            </svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
            Qon <span style={{ color: '#22819A' }}>Tahlili</span>
          </div>
        </NavLink>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 2, flex: 1, flexWrap: 'nowrap' }}>
          {navItems.map(({ path, label, icon: Icon }) => (
            <NavLink key={path} to={path}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 999,
                fontSize: 13, fontWeight: 500,
                color: isActive ? 'white' : '#334155',
                background: isActive ? '#22819A' : 'transparent',
                transition: 'all 0.15s', textDecoration: 'none', whiteSpace: 'nowrap',
              })}
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </div>

        {/* User info + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', lineHeight: 1.2 }}>
              {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
            </div>
            <div style={{ fontSize: 11, color: '#64748B' }}>{isAdmin ? 'Administrator' : 'Doktor'}</div>
          </div>
          <div style={{
            width: 34, height: 34, background: 'linear-gradient(135deg, #90C2E7, #22819A)',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 12, flexShrink: 0,
          }}>
            {initials}
          </div>
          <button onClick={handleLogout} title="Chiqish"
            style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8, background: 'transparent', border: '1px solid rgba(0,0,0,0.1)',
              color: '#94A3B8', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#EF4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94A3B8'; }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </nav>
    </header>
  );
}