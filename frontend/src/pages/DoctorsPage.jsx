import { useState, useEffect } from 'react';
import { doctorsAPI } from '../services/api';
import {
  Stethoscope, Plus, Search, Trash2, X,
  Phone, Mail, Users, Calendar, ArrowLeft, Eye, Briefcase
} from 'lucide-react';

const SPECIALTIES = [
  ['terapevt', 'Terapevt'], ['kardiolog', 'Kardiolog'], ['nevrolog', 'Nevrolog'],
  ['xirurg', 'Xirurg'], ['oftalmolog', 'Oftalmolog'], ['dermatolog', 'Dermatolog'],
  ['pediatr', 'Pediatr'], ['ginekolog', 'Ginekolog'], ['ortoped', 'Ortoped'],
  ['endokrinolog', 'Endokrinolog'], ['pulmonolog', 'Pulmonolog'],
  ['gastroenterolog', 'Gastroenterolog'], ['psixiatr', 'Psixiatr'],
  ['urolog', 'Urolog'], ['onkolog', 'Onkolog'],
];

const emptyForm = {
  username: '', password: '', first_name: '', last_name: '',
  email: '', specialty: 'terapevt', phone: '', bio: '', experience_years: 0,
};

const SPECIALTY_COLORS = {
  kardiolog: '#EF4444', nevrolog: '#8B5CF6', xirurg: '#F59E0B',
  terapevt: '#22819A', pediatr: '#10B981', ginekolog: '#EC4899',
  oftalmolog: '#3B82F6', dermatolog: '#F97316', ortoped: '#6366F1',
  endokrinolog: '#14B8A6', pulmonolog: '#84CC16', gastroenterolog: '#A855F7',
  psixiatr: '#F43F5E', urolog: '#0EA5E9', onkolog: '#DC2626',
};

function getColor(specialty) {
  return SPECIALTY_COLORS[specialty] || '#22819A';
}

function getInitials(name) {
  return (name || '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

// ── Profil sahifasi ──────────────────────────────────────────
function DoctorProfile({ doctor, onBack, onDelete }) {
  const color = getColor(doctor.specialty);
  const patients = doctor.patients || [];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px' }}>
      {/* Back */}
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 14, color: '#475569', marginBottom: 20, padding: 0,
        }}
      >
        <ArrowLeft size={16} /> Doktorlar ro'yxati
      </button>

      <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 20 }}>
        Doktor profili
      </div>

      {/* Info card */}
      <div style={{
        background: 'white', borderRadius: 16,
        border: '1px solid #E2E8F0', padding: '24px 28px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 20 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, color, flexShrink: 0,
          }}>
            {getInitials(doctor.full_name)}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>{doctor.full_name}</div>
            <span style={{
              display: 'inline-block', marginTop: 6,
              padding: '3px 12px', borderRadius: 999,
              background: `${color}18`, color,
              fontSize: 12, fontWeight: 600,
            }}>
              {doctor.specialty_display}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
          {doctor.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#475569' }}>
              <Phone size={15} color="#94A3B8" /> {doctor.phone}
            </div>
          )}
          {doctor.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#475569' }}>
              <Mail size={15} color="#94A3B8" /> {doctor.email}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#475569' }}>
            <Users size={15} color="#94A3B8" /> {doctor.patients_count ?? 0} ta bemor
          </div>
          {doctor.created_at && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#475569' }}>
              <Calendar size={15} color="#94A3B8" /> {doctor.created_at?.slice(0, 10)}
            </div>
          )}
        </div>
      </div>

      {/* Patients list */}
      {patients.length > 0 && (
        <div style={{
          background: 'white', borderRadius: 16,
          border: '1px solid #E2E8F0', padding: '20px 28px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 15, fontWeight: 600, color: '#0F172A' }}>
            <Users size={16} color="#22819A" /> Bemorlar ({patients.length})
          </div>
          {patients.map((p, i) => (
            <div key={p.id || i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: i < patients.length - 1 ? '1px solid #F1F5F9' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: p.gender === 'erkak' ? 'rgba(59,130,246,0.1)' : 'rgba(236,72,153,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                  color: p.gender === 'erkak' ? '#3B82F6' : '#EC4899',
                }}>
                  {getInitials(`${p.first_name} ${p.last_name}`)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>
                    {p.first_name} {p.last_name}
                  </div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>
                    {p.blood_type && `${p.blood_type} — `}{p.gender === 'erkak' ? 'Erkak' : 'Ayol'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>
                {p.diagnoses_count ?? 0} tashxis
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete button */}
      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => onDelete(doctor.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 18px', borderRadius: 10,
            background: '#FEF2F2', color: '#EF4444',
            border: '1px solid #FECACA', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#EF4444'; }}
        >
          <Trash2 size={14} /> O'chirish
        </button>
      </div>
    </div>
  );
}

// ── Asosiy sahifa ────────────────────────────────────────────
export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const load = async () => {
    try {
      const res = await doctorsAPI.list();
      setDoctors(res.data?.results || res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = doctors.filter(d =>
    `${d.full_name} ${d.specialty_display}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleView = async (doctor) => {
    try {
      const res = await doctorsAPI.get(doctor.id);
      setSelectedDoctor(res.data);
    } catch {
      setSelectedDoctor(doctor);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await doctorsAPI.create(form);
      setModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      const data = err.response?.data;
      setError(data ? Object.values(data).flat().join(' ') : 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Bu doktorni o'chirmoqchimisiz?")) return;
    await doctorsAPI.delete(id);
    setSelectedDoctor(null);
    load();
  };

  // Profil sahifasini ko'rsatish
  if (selectedDoctor) {
    return (
      <DoctorProfile
        doctor={selectedDoctor}
        onBack={() => setSelectedDoctor(null)}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>Doktorlar</div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
            {filtered.length} ta doktor ro'yxatda
          </div>
        </div>
        <button
          onClick={() => { setModal(true); setError(''); setForm(emptyForm); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 20px', borderRadius: 10,
            background: '#22819A', color: 'white',
            border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(34,129,154,0.25)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#1a6478'}
          onMouseLeave={e => e.currentTarget.style.background = '#22819A'}
        >
          <Plus size={16} /> Yangi doktor
        </button>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'white', border: '1.5px solid #E2E8F0',
        borderRadius: 10, padding: '9px 14px', marginBottom: 20,
      }}>
        <Search size={15} color="#94A3B8" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Ism yoki mutaxassislik bo'yicha qidirish..."
          style={{ border: 'none', outline: 'none', fontSize: 14, background: 'transparent', flex: 1, color: '#1E293B' }}
        />
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="loader" style={{ width: 32, height: 32 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
          <Stethoscope size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: 14 }}>Doktorlar topilmadi</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          {filtered.map((d, i) => {
            const color = getColor(d.specialty);
            return (
              <div key={d.id} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '14px 20px',
                borderBottom: i < filtered.length - 1 ? '1px solid #F1F5F9' : 'none',
                transition: 'background 0.12s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Avatar */}
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: `${color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color, flexShrink: 0,
                }}>
                  {getInitials(d.full_name)}
                </div>

                {/* Name + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{d.full_name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3, fontSize: 12, color: '#94A3B8', flexWrap: 'wrap' }}>
                    {d.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} />{d.phone}</span>}
                    {d.email && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={11} />{d.email}</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={11} />{d.patients_count ?? 0} ta bemor</span>
                  </div>
                </div>

                {/* Specialty badge */}
                <span style={{
                  padding: '3px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                  background: `${color}18`, color, flexShrink: 0,
                }}>
                  {d.specialty_display}
                </span>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => handleView(d)} title="Ko'rish"
                    style={{
                      width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 8, background: 'transparent', border: '1px solid #E2E8F0',
                      color: '#64748B', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#22819A'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#22819A'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                  >
                    <Eye size={14} />
                  </button>
                  <button onClick={() => handleDelete(d.id)} title="O'chirish"
                    style={{
                      width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA',
                      color: '#EF4444', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#EF4444'; }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20,
          }}
          onClick={() => setModal(false)}
        >
          <div
            style={{
              background: 'white', borderRadius: 20,
              width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 24px 80px rgba(0,0,0,0.15)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '22px 28px 18px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>Yangi doktor qo'shish</div>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ padding: '22px 28px' }}>
                {error && (
                  <div style={{ padding: '10px 14px', background: '#FEF2F2', borderRadius: 8, fontSize: 13, color: '#EF4444', marginBottom: 16 }}>
                    {error}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  {[['first_name', 'Ism *', 'Ism', 'text'], ['last_name', 'Familiya *', 'Familiya', 'text'],
                    ['username', 'Username *', 'username', 'text'], ['password', 'Parol *', '••••••', 'password']].map(([key, label, ph, type]) => (
                    <div key={key} style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>{label}</label>
                      <input
                        required={label.includes('*')}
                        type={type}
                        placeholder={ph}
                        value={form[key]}
                        onChange={e => setForm({ ...form, [key]: e.target.value })}
                        style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Mutaxassislik *</label>
                  <select
                    value={form.specialty}
                    onChange={e => setForm({ ...form, specialty: e.target.value })}
                    style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', background: 'white' }}
                  >
                    {SPECIALTIES.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Telefon</label>
                    <input
                      type="text" placeholder="+998 90 000 00 00" value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Tajriba (yil)</label>
                    <input
                      type="number" min="0" value={form.experience_years}
                      onChange={e => setForm({ ...form, experience_years: Number(e.target.value) })}
                      style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Email</label>
                  <input
                    type="email" placeholder="email@example.com" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Haqida</label>
                  <textarea
                    rows={3} placeholder="Doktor haqida..." value={form.bio}
                    onChange={e => setForm({ ...form, bio: e.target.value })}
                    style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ padding: '16px 28px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setModal(false)}
                  style={{ padding: '9px 20px', borderRadius: 10, background: '#F1F5F9', color: '#475569', border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  Bekor qilish
                </button>
                <button type="submit" disabled={saving}
                  style={{ padding: '9px 20px', borderRadius: 10, background: '#22819A', color: 'white', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {saving ? <><span className="loader" style={{ width: 14, height: 14 }} /> Saqlanmoqda...</> : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}