import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { statisticsAPI, patientsAPI, diagnosesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users, Activity, Stethoscope, TrendingUp, Plus, List, BarChart3, Info
} from 'lucide-react';

function StatCard({ label, value, icon: Icon, color, bg, trend }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: '20px 22px',
      border: '1px solid #E2E8F0',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    }}>
      <div>
        <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        {trend && <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>{trend}</div>}
      </div>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={22} color={color} />
      </div>
    </div>
  );
}

function ActivityItem({ icon: Icon, iconBg, iconColor, title, sub }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '11px 0',
      borderBottom: '1px solid #F1F5F9',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={16} color={iconColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#1E293B', lineHeight: 1.3 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{sub}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentPatients, setRecentPatients] = useState([]);
  const [recentDiagnoses, setRecentDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, patientsRes, diagnosesRes] = await Promise.all([
          statisticsAPI.get(),
          patientsAPI.list(),
          diagnosesAPI.list(),
        ]);
        setStats(statsRes.data);
        setRecentPatients((patientsRes.data?.results || patientsRes.data || []).slice(0, 6));
        setRecentDiagnoses((diagnosesRes.data?.results || diagnosesRes.data || []).slice(0, 6));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
      <div className="loader" style={{ width: 40, height: 40 }} />
    </div>
  );

  const s = stats?.summary || {};

  // So'nggi faoliyat — bemorlar + tashxislardan
  const activities = [
    ...recentDiagnoses.map(d => ({
      id: `d-${d.id}`,
      icon: Activity,
      iconBg: 'rgba(245,158,11,0.1)',
      iconColor: '#F59E0B',
      title: `Yangi tashxis qo'shildi: ${d.disease_name} (${d.patient_name || '—'})`,
      sub: d.doctor_name ? `${d.doctor_name}` : 'Noma\'lum',
    })),
    ...recentPatients.map(p => ({
      id: `p-${p.id}`,
      icon: Users,
      iconBg: 'rgba(34,129,154,0.1)',
      iconColor: '#22819A',
      title: `Yangi bemor qo'shildi: ${p.first_name} ${p.last_name}`,
      sub: p.doctor_name || 'Noma\'lum',
    })),
  ].slice(0, 6);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>

      {/* Page title */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>Bosh sahifa</div>
        <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
          {isAdmin ? 'Tizim umumiy ko\'rinishi' : 'Shifokor panel ko\'rinishi'}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 14, marginBottom: 20,
      }}>
        {isAdmin && (
          <StatCard
            label="Jami doktorlar"
            value={s.total_doctors ?? 0}
            icon={Stethoscope}
            color="#22819A"
            bg="rgba(34,129,154,0.1)"
          />
        )}
        <StatCard
          label="Jami bemorlar"
          value={s.total_patients ?? 0}
          icon={Users}
          color="#3B82F6"
          bg="rgba(59,130,246,0.1)"
        />
        <StatCard
          label="Jami tashxislar"
          value={s.total_diagnoses ?? 0}
          icon={Activity}
          color="#F59E0B"
          bg="rgba(245,158,11,0.1)"
        />
        <StatCard
          label="Faol tashxislar"
          value={s.active_diagnoses ?? 0}
          icon={TrendingUp}
          color="#EF4444"
          bg="rgba(239,68,68,0.1)"
        />
      </div>

      {/* So'nggi faoliyat */}
      <div style={{
        background: 'white', borderRadius: 16,
        border: '1px solid #E2E8F0', padding: '20px 24px',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>So'nggi faoliyat</div>
          <Info size={16} color="#94A3B8" />
        </div>
        {activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8', fontSize: 13 }}>
            Faoliyat yo'q
          </div>
        ) : (
          activities.map(a => (
            <ActivityItem key={a.id} {...a} />
          ))
        )}
      </div>

      {/* Bottom action buttons */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {isAdmin && (
          <button
            onClick={() => navigate('/doctors')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px',
              background: '#22819A', color: 'white',
              border: 'none', borderRadius: 10,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(34,129,154,0.25)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1a6478'}
            onMouseLeave={e => e.currentTarget.style.background = '#22819A'}
          >
            <Plus size={15} />
            Yangi doktor qo'shish
          </button>
        )}
        <button
          onClick={() => navigate('/doctors')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px',
            background: 'white', color: '#475569',
            border: '1px solid #E2E8F0', borderRadius: 10,
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}
        >
          <List size={15} />
          Doktorlar ro'yxati
        </button>
        <button
          onClick={() => navigate('/statistics')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px',
            background: 'white', color: '#475569',
            border: '1px solid #E2E8F0', borderRadius: 10,
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}
        >
          <BarChart3 size={15} />
          Statistika
        </button>
      </div>
    </div>
  );
}