import { useState, useEffect } from 'react';
import { statisticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { TrendingUp, Users, Activity, BarChart3, RefreshCw } from 'lucide-react';

const BAR_COLORS = ['#22819A','#90C2E7','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#3B82F6','#F97316','#14B8A6'];
const GENDER_COLORS = ['#22819A', '#EC4899', '#10B981'];
const GENDER_LABELS = ['Erkak', 'Ayol', 'Bola'];

function Card({ children, style }) {
  return (
    <div style={{
      background: 'white', borderRadius: 16,
      border: '1px solid #E2E8F0', padding: 24,
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardTitle({ title, sub, icon: Icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20 }}>
      {Icon && (
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'rgba(34,129,154,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={16} color="#22819A" />
        </div>
      )}
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 13, color: p.color || '#22819A' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function StatisticsPage() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setApiError(false);
    statisticsAPI.get()
      .then(res => setStats(res.data))
      .catch(err => { console.error(err); setApiError(true); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
      <div className="loader" style={{ width: 40, height: 40 }} />
    </div>
  );

  if (apiError) return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: 16, border: '1px solid #FECACA' }}>
        <Activity size={48} color="#EF4444" style={{ opacity: 0.5, marginBottom: 16 }} />
        <div style={{ fontSize: 18, fontWeight: 700, color: '#EF4444', marginBottom: 8 }}>Statistika yuklanmadi</div>
        <div style={{ fontSize: 14, color: '#64748B', marginBottom: 20 }}>Backend serveri ishlamayapti yoki statistika API xatolik qaytardi.</div>
        <button
          onClick={() => { setLoading(true); setApiError(false); statisticsAPI.get().then(r => setStats(r.data)).catch(() => setApiError(true)).finally(() => setLoading(false)); }}
          style={{ padding: '10px 24px', background: '#22819A', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Qayta urinish
        </button>
      </div>
    </div>
  );

  const s = stats?.summary || {};
  // 3 tur: erkak, ayol, bola
  const genderPatients = [
    { name: 'Erkak', value: s.male_patients   || 0 },
    { name: 'Ayol',  value: s.female_patients  || 0 },
    { name: 'Bola',  value: s.child_patients   || 0 },
  ];
  const totalGenderP = genderPatients.reduce((a, b) => a + b.value, 0) || 1;

  // Barcha 7 kunni to'ldiramiz — backend ba'zan 0 kunlarni o'tkazib yuboradi
  const ALL_WEEKDAYS = ['Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba','Yakshanba'];
  const weekdayData = ALL_WEEKDAYS.map(day => {
    const found = (stats?.weekday_stats || []).find(d => d.day === day);
    return found || { day, count: 0 };
  });

  const diseaseData = stats?.disease_stats || [];
  const maxDisease = diseaseData[0]?.count || 1;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>

      {/* Header */}
      <div style={{ marginBottom: 24, display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>Statistika va tahlil</div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
            {isAdmin ? "Barcha doktorlar ma'lumotlari asosida umumiy ko'rsatkichlar" : "Sizning ma'lumotlaringiz asosida ko'rsatkichlar"}
          </div>
        </div>
        <button
          onClick={() => { setLoading(true); statisticsAPI.get().then(r => setStats(r.data)).catch(()=>setApiError(true)).finally(()=>setLoading(false)); }}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'white', border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:13, fontWeight:500, color:'#475569', cursor:'pointer' }}
        >
          <RefreshCw size={14}/> Yangilash
        </button>
      </div>

      {/* ── 1. Eng ko'p uchraydigan kasalliklar — gorizontal bar ── */}
      <Card style={{ marginBottom: 20 }} className="chart-card">
        <CardTitle title="Eng ko'p uchraydigan kasalliklar" sub="Tashxislar chastotasi bo'yicha reyting" icon={TrendingUp} />
        {diseaseData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8', fontSize: 13 }}>Ma'lumot yo'q</div>
        ) : (
          <ResponsiveContainer width="100%" height={diseaseData.length * 40 + 40}>
            <BarChart
              data={diseaseData.slice(0, 10)}
              layout="vertical"
              margin={{ top: 0, right: 40, bottom: 0, left: 100 }}
              barSize={18}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis
                type="category" dataKey="disease_name"
                tick={{ fontSize: 12, fill: '#334155' }}
                axisLine={false} tickLine={false} width={95}
              />
              <Tooltip content={<Tip />} cursor={{ fill: 'rgba(34,129,154,0.04)' }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Soni">
                {diseaseData.slice(0, 10).map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* ── 2. Haftalik + Yillik ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <Card>
          <CardTitle title="Haftalik tashxislar" sub="Haftaning qaysi kunida ko'proq" icon={BarChart3} />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekdayData} barSize={26} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: '#94A3B8' }}
                axisLine={false} tickLine={false}
                tickFormatter={d => d.slice(0, 3)}
              />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<Tip />} cursor={{ fill: 'rgba(34,129,154,0.05)' }} />
              <Bar dataKey="count" name="Tashxislar" radius={[6, 6, 0, 0]}>
                {weekdayData.map((entry, i) => {
                  const maxCount = Math.max(...weekdayData.map(d => d.count));
                  return <Cell key={i} fill={entry.count > 0 && entry.count === maxCount ? '#22819A' : entry.count > 0 ? '#90C2E7' : '#E2E8F0'} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardTitle title="Yillik tashxislar" sub={`${new Date().getFullYear()} yil oylar kesimida`} icon={TrendingUp} />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats?.monthly_stats || []} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="count" stroke="#22819A" strokeWidth={2.5}
                dot={{ fill: '#22819A', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6 }} name="Tashxislar" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── 3. Erkak/Ayol/Bola yillik bar ── */}
      <Card style={{ marginBottom: 20 }}>
        <CardTitle
          title="Jins bo'yicha bemorlar (yillik)"
          sub={`${new Date().getFullYear()} yil — oylar kesimida erkak, ayol va bola`}
          icon={Users}
        />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={stats?.monthly_gender_stats || stats?.monthly_stats?.map(m => ({ ...m, male: 0, female: 0, child: 0 })) || []}
            barSize={14}
            margin={{ top: 5, right: 10, bottom: 5, left: -20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<Tip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Bar dataKey="male"   name="Erkak" fill="#22819A" radius={[4, 4, 0, 0]} />
            <Bar dataKey="female" name="Ayol"  fill="#EC4899" radius={[4, 4, 0, 0]} />
            <Bar dataKey="child"  name="Bola"  fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
          {[
            ['Erkak', '#22819A', s.male_patients],
            ['Ayol',  '#EC4899', s.female_patients],
            ['Bola',  '#10B981', s.child_patients],
          ].map(([label, color, val]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
              {label}: <strong style={{ color }}>{val ?? 0}</strong>
            </div>
          ))}
        </div>
      </Card>

      {/* ── 4. Jins nisbati donut ── */}
      <Card style={{ marginBottom: 20 }}>
        <CardTitle title="Jins nisbati (umumiy)" sub="Barcha bemorlar: erkak, ayol va bola foizi" icon={Users} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
          <PieChart width={220} height={190}>
            <Pie
              data={genderPatients.filter(g => g.value > 0)}
              cx="50%" cy="50%"
              innerRadius={55} outerRadius={88}
              paddingAngle={3}
              dataKey="value"
            >
              {genderPatients.filter(g => g.value > 0).map((g, i) => (
                <Cell key={i} fill={GENDER_COLORS[GENDER_LABELS.indexOf(g.name)] || GENDER_COLORS[i]} />
              ))}
            </Pie>
            <Tooltip formatter={(v, name) => [`${v} ta`, name]} />
          </PieChart>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {genderPatients.map((g, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: g.value === 0 ? 0.4 : 1 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: GENDER_COLORS[i], flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{g.name}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>
                    {g.value} bemor — {Math.round(g.value / totalGenderP * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

    </div>
  );
}