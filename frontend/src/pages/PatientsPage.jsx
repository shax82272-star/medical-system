import { useState, useEffect } from 'react';
import { patientsAPI, diagnosesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users, Plus, Search, Trash2, Edit2, X,
  Phone, MapPin, Calendar, ArrowLeft, Activity, Eye
} from 'lucide-react';

const emptyForm = {
  first_name: '', last_name: '', gender: 'erkak',
  date_of_birth: '', phone: '', address: '',
  blood_type: '', allergies: '', notes: '',
};

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const BLOOD_COLORS = {
  'A+': '#EF4444', 'A-': '#F97316', 'B+': '#8B5CF6', 'B-': '#6366F1',
  'AB+': '#EC4899', 'AB-': '#F43F5E', 'O+': '#10B981', 'O-': '#14B8A6',
};

const STATUS_MAP = {
  yangi:        { label: 'Yangi',        bg: 'rgba(34,129,154,0.1)',   color: '#22819A' },
  davolanyapti: { label: 'Davolanyapti', bg: 'rgba(245,158,11,0.1)',   color: '#F59E0B' },
  yaxshilandi:  { label: 'Yaxshilandi',  bg: 'rgba(59,130,246,0.1)',   color: '#3B82F6' },
  tuzaldi:      { label: 'Tuzaldi',      bg: 'rgba(16,185,129,0.1)',   color: '#10B981' },
  surunkali:    { label: 'Surunkali',    bg: 'rgba(239,68,68,0.1)',    color: '#EF4444' },
  kuzatuvda:    { label: 'Kuzatuvda',   bg: 'rgba(107,114,128,0.1)',  color: '#6B7280' },
  faol:         { label: 'Faol',         bg: 'rgba(16,185,129,0.1)',   color: '#10B981' },
};

const SEVERITY_MAP = {
  yengil:   { label: "Yengil",   bg: 'rgba(16,185,129,0.1)',  color: '#10B981' },
  ortacha:  { label: "O'rtacha", bg: 'rgba(245,158,11,0.1)',  color: '#F59E0B' },
  ogir:     { label: "Og'ir",    bg: 'rgba(239,68,68,0.1)',   color: '#EF4444' },
};

function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, bg: '#F1F5F9', color: '#64748B' };
  return (
    <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const s = SEVERITY_MAP[severity] || { label: severity, bg: '#F1F5F9', color: '#64748B' };
  return (
    <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// ── Bemor profili ─────────────────────────────────────────────
function PatientProfile({ patient, onBack, onDelete, isAdmin, onAddDiagnosis }) {
  const [diagnoses, setDiagnoses] = useState([]);
  const [loadingDx, setLoadingDx] = useState(true);
  const isChild = patient.age !== undefined && patient.age < 6;
  const gColor = isChild ? '#10B981' : (patient.gender === 'erkak' ? '#3B82F6' : '#EC4899');
  const initials = `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`.toUpperCase();

  useEffect(() => {
    diagnosesAPI.list({ patient: patient.id })
      .then(res => setDiagnoses(res.data?.results || res.data || []))
      .catch(() => {})
      .finally(() => setLoadingDx(false));
  }, [patient.id]);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 20px' }}>
      {/* Back + title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4, display: 'flex' }}>
            <ArrowLeft size={20} />
          </button>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#0F172A' }}>Bemor profili</div>
        </div>
        {!isAdmin && (
          <button
            onClick={onAddDiagnosis}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 10,
              background: '#22819A', color: 'white',
              border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(34,129,154,0.25)',
            }}
          >
            <Plus size={15} /> Tashxis qo'shish
          </button>
        )}
      </div>

      {/* Info card */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', padding: '24px 28px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 20 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: `${gColor}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 700, color: gColor, flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>
              {patient.first_name} {patient.last_name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              {patient.blood_type && (
                <span style={{
                  padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                  background: `${BLOOD_COLORS[patient.blood_type] || '#EF4444'}18`,
                  color: BLOOD_COLORS[patient.blood_type] || '#EF4444',
                }}>
                  {patient.blood_type}
                </span>
              )}
              <span style={{ fontSize: 13, color: '#64748B' }}>
                {isChild ? 'Bola' : (patient.gender === 'erkak' ? 'Erkak' : 'Ayol')}, {patient.age} yosh
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
          {patient.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#475569' }}>
              <Phone size={15} color="#94A3B8" /> {patient.phone}
            </div>
          )}
          {patient.doctor_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#475569' }}>
              <Activity size={15} color="#94A3B8" /> {patient.doctor_name}
            </div>
          )}
          {patient.address && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#475569' }}>
              <MapPin size={15} color="#94A3B8" /> {patient.address}
            </div>
          )}
          {patient.date_of_birth && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#475569' }}>
              <Calendar size={15} color="#94A3B8" /> {patient.date_of_birth}
            </div>
          )}
        </div>
      </div>

      {/* Diagnoses */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', padding: '20px 28px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: '#0F172A' }}>
            <Activity size={16} color="#22819A" />
            Tashxislar ({diagnoses.length})
          </div>
          {!isAdmin && (
            <button onClick={onAddDiagnosis} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 14px', borderRadius: 8,
              background: 'rgba(34,129,154,0.08)', color: '#22819A',
              border: '1px solid rgba(34,129,154,0.2)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>
              <Plus size={13} /> Yangi tashxis
            </button>
          )}
        </div>

        {loadingDx ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <div className="loader" style={{ width: 24, height: 24 }} />
          </div>
        ) : diagnoses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#94A3B8', fontSize: 13 }}>
            Tashxis yo'q
          </div>
        ) : (
          diagnoses.map((d, i) => (
            <div key={d.id} style={{
              padding: '14px 0',
              borderBottom: i < diagnoses.length - 1 ? '1px solid #F1F5F9' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', marginBottom: 4 }}>
                    {d.disease_name}
                  </div>
                  {d.description && (
                    <div style={{ fontSize: 13, color: '#64748B', marginBottom: 6, lineHeight: 1.5 }}>
                      {d.description}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>
                    {d.doctor_name} • {d.date?.slice(0, 10) || d.created_at?.slice(0, 10)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {d.severity && <SeverityBadge severity={d.severity} />}
                  <StatusBadge status={d.status} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete */}
      {!isAdmin && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => onDelete(patient.id)}
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
            <Trash2 size={14} /> Bemorni o'chirish
          </button>
        </div>
      )}
    </div>
  );
}

// ── Asosiy sahifa ─────────────────────────────────────────────
export default function PatientsPage() {
  const { isAdmin } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editPatient, setEditPatient] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const load = async () => {
    try {
      const res = await patientsAPI.list();
      setPatients(res.data?.results || res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = patients.filter(p =>
    `${p.first_name} ${p.last_name} ${p.phone}`.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditPatient(null); setForm(emptyForm); setError(''); setModal(true); };
  const openEdit = (p) => {
    setEditPatient(p);
    setForm({
      first_name: p.first_name, last_name: p.last_name, gender: p.gender,
      date_of_birth: p.date_of_birth, phone: p.phone || '', address: p.address || '',
      blood_type: p.blood_type || '', allergies: p.allergies || '', notes: p.notes || '',
    });
    setError(''); setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editPatient) await patientsAPI.update(editPatient.id, form);
      else await patientsAPI.create(form);
      setModal(false); load();
    } catch (err) {
      const data = err.response?.data;
      setError(data ? Object.values(data).flat().join(' ') : 'Xatolik yuz berdi');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Bu bemorni o'chirmoqchimisiz?")) return;
    await patientsAPI.delete(id);
    setSelectedPatient(null); load();
  };

  const handleView = async (p) => {
    try {
      const res = await patientsAPI.get(p.id);
      setSelectedPatient(res.data);
    } catch {
      setSelectedPatient(p);
    }
  };

  // Profil ko'rinishi
  if (selectedPatient) {
    return (
      <PatientProfile
        patient={selectedPatient}
        onBack={() => setSelectedPatient(null)}
        onDelete={handleDelete}
        isAdmin={isAdmin}
        onAddDiagnosis={() => {
          setSelectedPatient(null);
        }}
      />
    );
  }

  const gColor = { erkak: '#3B82F6', ayol: '#EC4899' };
  const getPatientLabel = (p) => (p.age !== undefined && p.age < 6) ? 'Bola' : (p.gender === 'erkak' ? 'Erkak' : 'Ayol');
  const getPatientColor = (p) => (p.age !== undefined && p.age < 6) ? '#10B981' : (gColor[p.gender] || '#64748B');

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#0F172A' }}>Bemorlar</div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{filtered.length} ta bemor ro'yxatda</div>
        </div>
        {!isAdmin && (
          <button onClick={openAdd} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 20px', borderRadius: 10,
            background: '#22819A', color: 'white', border: 'none',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(34,129,154,0.25)', transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#1a6478'}
            onMouseLeave={e => e.currentTarget.style.background = '#22819A'}
          >
            <Plus size={16} /> Bemor qo'shish
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'white', border: '1.5px solid #E2E8F0',
        borderRadius: 10, padding: '9px 14px', marginBottom: 20,
      }}>
        <Search size={15} color="#94A3B8" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Ism bo'yicha qidirish..."
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
          <Users size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: 14 }}>Bemorlar topilmadi</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          {filtered.map((p, i) => {
            const gc = getPatientColor(p);
            const initials = `${p.first_name?.[0] || ''}${p.last_name?.[0] || ''}`.toUpperCase();
            const bc = BLOOD_COLORS[p.blood_type];
            return (
              <div key={p.id} style={{
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
                  background: `${gc}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: gc, flexShrink: 0,
                }}>
                  {initials}
                </div>

                {/* Name + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>
                    {p.first_name} {p.last_name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3, fontSize: 12, color: '#94A3B8', flexWrap: 'wrap' }}>
                    {p.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} />{p.phone}</span>}
                    {p.doctor_name && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Activity size={11} />{p.doctor_name}</span>}
                    <span>{getPatientLabel(p)}</span>
                  </div>
                </div>

                {/* Right side */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  {/* Blood type */}
                  {p.blood_type && (
                    <span style={{
                      padding: '3px 10px', borderRadius: 999,
                      fontSize: 12, fontWeight: 700,
                      background: bc ? `${bc}18` : '#FEF2F2',
                      color: bc || '#EF4444',
                    }}>
                      {p.blood_type}
                    </span>
                  )}

                  {/* Diagnoses count */}
                  <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500, minWidth: 60, textAlign: 'right' }}>
                    {p.diagnoses_count} tashxis
                  </span>

                  {/* Actions */}
                  <button
                    onClick={() => handleView(p)}
                    title="Ko'rish"
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

                  {!isAdmin && (
                    <>
                      <button
                        onClick={() => openEdit(p)}
                        title="Tahrirlash"
                        style={{
                          width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: 8, background: 'transparent', border: '1px solid #E2E8F0',
                          color: '#64748B', cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        title="O'chirish"
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
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
          onClick={() => setModal(false)}>
          <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '22px 28px 18px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>{editPatient ? 'Bemorni tahrirlash' : "Yangi bemor qo'shish"}</div>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ padding: '22px 28px' }}>
                {error && <div style={{ padding: '10px 14px', background: '#FEF2F2', borderRadius: 8, fontSize: 13, color: '#EF4444', marginBottom: 16 }}>{error}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  {[['first_name','Ism *','Ism','text'],['last_name','Familiya *','Familiya','text']].map(([key,label,ph,type]) => (
                    <div key={key} style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>{label}</label>
                      <input required type={type} placeholder={ph} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                        style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Jinsi *</label>
                    <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}
                      style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', background: 'white' }}>
                      <option value="erkak">Erkak</option>
                      <option value="ayol">Ayol</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Tug'ilgan sana *</label>
                    <input required type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })}
                      style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Telefon</label>
                    <input type="text" placeholder="+998 90 000 00 00" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                      style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Qon guruhi</label>
                    <select value={form.blood_type} onChange={e => setForm({ ...form, blood_type: e.target.value })}
                      style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', background: 'white' }}>
                      <option value="">Tanlanmagan</option>
                      {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Manzil</label>
                  <input type="text" placeholder="Shahar, ko'cha, uy" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                    style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Allergiyalar</label>
                  <textarea rows={2} placeholder="Allergiya haqida..." value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })}
                    style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#475569', display: 'block', marginBottom: 6 }}>Qo'shimcha ma'lumot</label>
                  <textarea rows={2} placeholder="Eslatmalar..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    style={{ width: '100%', padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
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