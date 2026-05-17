import { useState, useEffect, useRef } from 'react';
import { diagnosesAPI, patientsAPI } from '../services/api';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Activity, Search, Trash2, Edit2, X,
  Upload, FlaskConical, Loader, AlertTriangle,
  CheckCircle, Printer, Microscope,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

// CV ranglari (Python kodidagi rang sxemasi)
const CV_COLORS = {
  Trombotsit: '#F59E0B',
  Leykotsit:  '#3B82F6',
  Healthy:    '#10B981',
  Noodatiy:   '#EF4444',
};
const CV_ICONS = {
  Trombotsit: '🟡',
  Leykotsit:  '🔵',
  Healthy:    '🟢',
  Noodatiy:   '🔴',
};

// ─── Konstantalar ─────────────────────────────────────────────
const STATUS_CHOICES = [
  ['yangi','Yangi'],['davolanyapti','Davolanyapti'],
  ['yaxshilandi','Yaxshilandi'],['tuzaldi','Tuzaldi'],['surunkali','Surunkali'],
];
const SEVERITY_CHOICES = [
  ['engil','Engil'],['orta',"O'rta"],['ogir',"Og'ir"],['juda_ogir',"Juda og'ir"],
];
const emptyForm = {
  patient:'', disease_name:'', icd_code:'', description:'',
  symptoms:'', treatment:'', medications:'',
  status:'yangi', severity:'orta',
  diagnosis_date: new Date().toISOString().split('T')[0],
  follow_up_date:'',
};

const NORMAL_RANGES = {
  'Eritrosit':           { erkak:'4.5 – 5.9 × 10¹²/L', ayol:'4.0 – 5.2 × 10¹²/L', bola:'4.0 – 5.0 × 10¹²/L' },
  'Leykotsit':           { erkak:'4.0 – 9.0 × 10⁹/L',  ayol:'4.0 – 9.0 × 10⁹/L',  bola:'5.0 – 14.0 × 10⁹/L' },
  'Trombosit':           { erkak:'150 – 400 × 10⁹/L',   ayol:'150 – 400 × 10⁹/L',   bola:'150 – 450 × 10⁹/L' },
  'Healthy blood cell':  { erkak:'Mavjud (normal)',       ayol:'Mavjud (normal)',       bola:'Mavjud (normal)' },
  'Noodatiy hujayralar': { erkak:"Yo'q bo'lishi kerak",  ayol:"Yo'q bo'lishi kerak",  bola:"Yo'q bo'lishi kerak" },
};

const CLASS_COLORS = {
  'Eritrosit':           '#EF4444',
  'Healthy blood cell':  '#10B981',
  'Leykotsit':           '#3B82F6',
  'Trombosit':           '#F59E0B',
  'Noodatiy hujayralar': '#8B5CF6',
};

function getGenderKey(patient) {
  if (!patient) return 'erkak';
  if (patient.gender === 'bola' || (patient.age || 18) < 18) return 'bola';
  return patient.gender === 'ayol' ? 'ayol' : 'erkak';
}
function getGenderLabel(patient) {
  if (!patient) return '';
  if (patient.gender === 'bola' || (patient.age || 18) < 18) return 'Bola';
  return patient.gender === 'ayol' ? 'Ayol' : 'Erkak';
}

// ─── PDF chop etish ────────────────────────────────────────────
function printReport({ patient, result, doctor, imageUrl }) {
  const gKey   = getGenderKey(patient);
  const gLabel = getGenderLabel(patient);
  const date   = new Date().toLocaleDateString('uz-UZ');
  const isWarning = result.warning;

  const rows = result.results
    .sort((a, b) => b.percent - a.percent)
    .map(item => {
      const normal = NORMAL_RANGES[item.name]?.[gKey] || '—';
      const color  = CLASS_COLORS[item.name] || '#22819A';
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-weight:600;color:#1E293B">${item.name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0">
            <div style="display:flex;align-items:center;gap:10px">
              <div style="flex:1;height:8px;background:#F1F5F9;border-radius:4px;overflow:hidden">
                <div style="width:${Math.round(item.percent)}%;height:100%;background:${color};border-radius:4px"></div>
              </div>
              <span style="font-weight:700;color:${color};min-width:44px">${item.percent}%</span>
            </div>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;color:#64748B;font-size:13px">${normal}</td>
        </tr>`;
    }).join('');

  const imgTag = imageUrl
    ? `<img src="${imageUrl}" style="width:180px;height:180px;object-fit:cover;border-radius:12px;border:2px solid #E2E8F0"/>`
    : '';

  const warningBanner = isWarning ? `
  <div style="background:linear-gradient(135deg,#7C3AED,#5B21B6);border-radius:10px;padding:14px 18px;margin-bottom:20px;color:white;display:flex;align-items:center;gap:12px">
    <span style="font-size:20px">⚠️</span>
    <div><strong style="font-size:14px">Diqqat — noodatiy hujayralar aniqlandi!</strong><br/>
    <span style="font-size:12px;opacity:0.85">Qo'shimcha klinik tekshiruv o'tkazish tavsiya etiladi.</span></div>
  </div>` : '';

  const html = `<!DOCTYPE html>
<html lang="uz"><head><meta charset="UTF-8"/><title>Qon tahlili natijasi</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;color:#1E293B;background:white;padding:32px}
@media print{body{padding:16px}.no-print{display:none!important}@page{size:A4;margin:1.5cm}}</style></head>
<body>
  <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:18px;border-bottom:3px solid #22819A;margin-bottom:22px">
    <div style="display:flex;align-items:center;gap:12px">
      <div style="width:44px;height:44px;background:linear-gradient(135deg,#90C2E7,#22819A);border-radius:10px;display:flex;align-items:center;justify-content:center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 5 9.5 5 14a7 7 0 0 0 14 0c0-4.5-7-12-7-12z" fill="white"/></svg>
      </div>
      <div>
        <div style="font-size:20px;font-weight:800;color:#0F172A">Hemo<span style="color:#22819A">Lab</span></div>
        <div style="font-size:10px;color:#94A3B8;letter-spacing:0.06em">QON TAHLILI NATIJALARI</div>
      </div>
    </div>
    <div style="text-align:right;font-size:12px;color:#64748B">
      <div>Sana: <strong>${date}</strong></div>
      <div>Shifokor: <strong>Dr. ${doctor}</strong></div>
    </div>
  </div>

  <div style="background:#F8FAFC;border-radius:12px;padding:16px 20px;margin-bottom:20px;border:1px solid #E2E8F0;display:flex;justify-content:space-between;align-items:center">
    <div>
      <div style="font-size:10px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">Bemor</div>
      <div style="font-size:18px;font-weight:800;color:#0F172A;margin-bottom:4px">${patient?.first_name} ${patient?.last_name}</div>
      <div style="font-size:13px;color:#64748B">${gLabel} &nbsp;•&nbsp; ${patient?.age || '—'} yosh${patient?.blood_type ? ` &nbsp;•&nbsp; Qon guruhi: <strong>${patient.blood_type}</strong>` : ''}</div>
    </div>
    ${imgTag}
  </div>

  ${warningBanner}

  <div style="margin-bottom:22px">
    <div style="font-size:14px;font-weight:700;color:#0F172A;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #E2E8F0">Qon hujayrasi tahlili natijalari</div>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:#F8FAFC">
          <th style="padding:9px 12px;text-align:left;border-bottom:2px solid #E2E8F0;color:#64748B;font-size:11px;text-transform:uppercase;letter-spacing:0.05em">Hujayra turi</th>
          <th style="padding:9px 12px;text-align:left;border-bottom:2px solid #E2E8F0;color:#64748B;font-size:11px;text-transform:uppercase;letter-spacing:0.05em">Ulush (%)</th>
          <th style="padding:9px 12px;text-align:left;border-bottom:2px solid #E2E8F0;color:#64748B;font-size:11px;text-transform:uppercase;letter-spacing:0.05em">Normativ ko'rsatkich (${gLabel})</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <div style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:10px;padding:12px 16px;font-size:12px;color:#92400E;margin-bottom:22px">
    <strong>Eslatma:</strong> Ushbu natija sun'iy intellekt tahlili asosida olingan bo'lib, yakuniy tibbiy xulosa hisoblanmaydi. Aniq tashxis uchun mutaxassis shifokorga murojaat qiling.
  </div>

  <div style="border-top:1px solid #E2E8F0;padding-top:14px;display:flex;justify-content:space-between;align-items:flex-end">
    <div style="font-size:11px;color:#94A3B8">HemoLab © ${new Date().getFullYear()}</div>
    <div style="text-align:right">
      <div style="font-size:11px;color:#94A3B8;margin-bottom:24px">Shifokor imzosi:</div>
      <div style="border-bottom:1px solid #CBD5E1;width:180px"></div>
      <div style="font-size:11px;color:#94A3B8;margin-top:4px">Dr. ${doctor}</div>
    </div>
  </div>

  <div class="no-print" style="margin-top:24px;text-align:center">
    <button onclick="window.print()" style="padding:12px 32px;background:#22819A;color:white;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer">🖨️ Chop etish / PDF saqlash</button>
  </div>
</body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 500);
}

// ─── Tashxis PDF chop etish ────────────────────────────────────
function printDiagnosisPDF({ diagnosis, patient, doctorName }) {
  const date = new Date().toLocaleDateString('uz-UZ');
  const diagDate = diagnosis.diagnosis_date
    ? new Date(diagnosis.diagnosis_date).toLocaleDateString('uz-UZ') : '—';
  const followDate = diagnosis.follow_up_date
    ? new Date(diagnosis.follow_up_date).toLocaleDateString('uz-UZ') : '—';

  const statusLabel = { yangi:'Yangi', davolanyapti:'Davolanyapti', yaxshilandi:'Yaxshilandi', tuzaldi:'Tuzaldi', surunkali:'Surunkali' };
  const severityLabel = { engil:'Engil', orta:"O'rta", ogir:"Og'ir", juda_ogir:"Juda og'ir" };
  const statusColor = { yangi:'#22819A', davolanyapti:'#F59E0B', yaxshilandi:'#3B82F6', tuzaldi:'#10B981', surunkali:'#EF4444' };
  const severityColor = { engil:'#10B981', orta:'#F59E0B', ogir:'#EF4444', juda_ogir:'#DC2626' };


  const section = (title, content) => content ? `
    <div style="margin-bottom:22px">
      <div style="font-size:11px;font-weight:700;color:#22819A;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;padding-bottom:6px;border-bottom:1.5px solid #E2E8F0">${title}</div>
      <div style="font-size:14px;color:#334155;line-height:1.7;white-space:pre-wrap">${content}</div>
    </div>` : '';

  const html = `<!DOCTYPE html>
<html lang="uz"><head><meta charset="UTF-8"/><title>Tibbiy Xulosanoma</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;color:#1E293B;background:white;padding:36px 40px;font-size:14px}
  @media print{body{padding:20px 28px}.no-print{display:none!important}@page{margin:1.5cm;size:A4}}
</style></head>
<body>

  <!-- HEADER -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:20px;border-bottom:3px solid #22819A;margin-bottom:28px">
    <div style="display:flex;align-items:center;gap:14px">
      <div style="width:52px;height:52px;background:linear-gradient(135deg,#90C2E7,#22819A);border-radius:14px;display:flex;align-items:center;justify-content:center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 2C12 2 5 9.5 5 14a7 7 0 0 0 14 0c0-4.5-7-12-7-12z" fill="white"/></svg>
      </div>
      <div>
        <div style="font-size:24px;font-weight:800;color:#0F172A">Hemo<span style="color:#22819A">Lab</span></div>
        <div style="font-size:11px;color:#94A3B8;letter-spacing:0.07em;margin-top:1px">TIBBIY AXBOROT TIZIMI</div>
      </div>
    </div>
    <div style="text-align:right">
      <div style="font-size:18px;font-weight:700;color:#0F172A;margin-bottom:4px">TIBBIY XULOSANOMA</div>
      <div style="font-size:12px;color:#64748B">Berilgan sana: <strong>${date}</strong></div>
      <div style="font-size:12px;color:#64748B">Hujjat №: <strong>DX-${String(diagnosis.id).padStart(5,'0')}</strong></div>
    </div>
  </div>

  <!-- BEMOR + DOKTOR -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px">
    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:18px 22px">
      <div style="font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px">Bemor ma'lumotlari</div>
      <div style="font-size:19px;font-weight:800;color:#0F172A;margin-bottom:6px">${patient?.first_name || ''} ${patient?.last_name || ''}</div>
      <table style="font-size:13px;color:#475569;border-collapse:collapse;width:100%">
        <tr><td style="padding:2px 0;color:#94A3B8;width:100px">Yoshi:</td><td><strong>${patient?.age || '—'} yosh</strong></td></tr>
        <tr><td style="padding:2px 0;color:#94A3B8">Jinsi:</td><td><strong>${patient?.gender === 'ayol' ? 'Ayol' : 'Erkak'}</strong></td></tr>
        ${patient?.blood_type ? `<tr><td style="padding:2px 0;color:#94A3B8">Qon guruhi:</td><td><strong>${patient.blood_type}</strong></td></tr>` : ''}
        ${patient?.phone ? `<tr><td style="padding:2px 0;color:#94A3B8">Telefon:</td><td><strong>${patient.phone}</strong></td></tr>` : ''}
      </table>
    </div>
    <div style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:12px;padding:18px 22px">
      <div style="font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px">Shifokor</div>
      <div style="font-size:17px;font-weight:800;color:#0F172A;margin-bottom:6px">Dr. ${doctorName || diagnosis.doctor_name || '—'}</div>
      <table style="font-size:13px;color:#475569;border-collapse:collapse;width:100%">
        <tr><td style="padding:2px 0;color:#94A3B8;width:120px">Tashxis sanasi:</td><td><strong>${diagDate}</strong></td></tr>
        <tr><td style="padding:2px 0;color:#94A3B8">Keyingi qabul:</td><td><strong>${followDate}</strong></td></tr>
      </table>
    </div>
  </div>

  <!-- TASHXIS ASOSIY -->
  <div style="background:linear-gradient(135deg,#22819A,#1a6478);border-radius:14px;padding:22px 28px;margin-bottom:28px;color:white">
    <div style="font-size:11px;opacity:0.75;margin-bottom:6px;letter-spacing:0.06em;text-transform:uppercase">Asosiy tashxis</div>
    <div style="font-size:22px;font-weight:800;margin-bottom:10px">${diagnosis.disease_name}</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <span style="background:rgba(255,255,255,0.2);padding:4px 14px;border-radius:20px;font-size:12px;font-weight:600">${statusLabel[diagnosis.status] || diagnosis.status}</span>
      <span style="background:rgba(255,255,255,0.2);padding:4px 14px;border-radius:20px;font-size:12px;font-weight:600">${severityLabel[diagnosis.severity] || diagnosis.severity}</span>
      ${diagnosis.icd_code ? `<span style="background:rgba(255,255,255,0.15);padding:4px 14px;border-radius:20px;font-size:12px">ICD: ${diagnosis.icd_code}</span>` : ''}
    </div>
  </div>

  <!-- MAZMUN -->
  <div style="margin-bottom:28px">
    ${section('Shifokor xulosasi (tavsif)', diagnosis.description)}
    ${section('Klinik alomatlar', diagnosis.symptoms)}
    ${section('Davolash rejasi', diagnosis.treatment)}
    ${section('Dori-darmonlar', diagnosis.medications)}
  </div>

  <!-- ESLATMA -->
  <div style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:10px;padding:14px 18px;font-size:12px;color:#92400E;margin-bottom:28px">
    <strong>Muhim eslatma:</strong> Ushbu xulosanoma tibbiy axborot tizimida qayd etilgan ma'lumotlar asosida tuzilgan bo'lib, rasmiy tibbiy hujjat hisoblanadi. Shifokor imzosi va muassasa muhri bilan tasdiqlanganidan so'ng kuchga kiradi.
  </div>

  <!-- FOOTER -->
  <div style="border-top:2px solid #E2E8F0;padding-top:20px;display:flex;justify-content:space-between;align-items:flex-end">
    <div>
      <div style="font-size:12px;color:#94A3B8;margin-bottom:4px">Shifokor:</div>
      <div style="font-size:15px;font-weight:700;color:#0F172A">Dr. ${doctorName || diagnosis.doctor_name || '—'}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:11px;color:#94A3B8;margin-bottom:28px">Imzo va muhr:</div>
      <div style="border-bottom:1.5px solid #CBD5E1;width:200px;margin-bottom:4px"></div>
      <div style="font-size:11px;color:#94A3B8">Shifokor imzosi</div>
    </div>
  </div>
  <div style="margin-top:16px;font-size:10px;color:#CBD5E1;text-align:center">
    HemoLab Tibbiy Axborot Tizimi &copy; ${new Date().getFullYear()} &nbsp;|&nbsp; Hujjat №: DX-${String(diagnosis.id).padStart(5,'0')} &nbsp;|&nbsp; ${date}
  </div>

  <div class="no-print" style="margin-top:28px;text-align:center">
    <button onclick="window.print()" style="padding:13px 36px;background:linear-gradient(135deg,#22819A,#1a6478);color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 6px 20px rgba(34,129,154,0.35)">
      🖨️ Chop etish / PDF saqlash
    </button>
  </div>

</body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 500);
}

// ─── Tashxis detail modali ─────────────────────────────────────
function DiagnosisDetailModal({ diagnosis, patients, user, onClose, onEdit }) {
  const patient = patients.find(p => p.id === (diagnosis.patient?.id ?? diagnosis.patient));
  const doctorName = user?.first_name
    ? `${user.first_name} ${user.last_name}`
    : (user?.username || diagnosis.doctor_name || '—');

  const statusLabel   = { yangi:'Yangi', davolanyapti:'Davolanyapti', yaxshilandi:'Yaxshilandi', tuzaldi:'Tuzaldi', surunkali:'Surunkali' };
  const severityLabel = { engil:'Engil', orta:"O'rta", ogir:"Og'ir", juda_ogir:"Juda og'ir" };
  const statusColor   = { yangi:'#22819A', davolanyapti:'#F59E0B', yaxshilandi:'#3B82F6', tuzaldi:'#10B981', surunkali:'#EF4444' };
  const severityColor = { engil:'#10B981', orta:'#F59E0B', ogir:'#EF4444', juda_ogir:'#DC2626' };

  // AI natijalarini parse qilish (symptoms maydonidan)
  let aiData = null;
  try {
    const parsed = diagnosis.symptoms ? JSON.parse(diagnosis.symptoms) : null;
    if (parsed?._ai) aiData = parsed;
  } catch {}

  const gKey = getGenderKey(patient);

  const InfoRow = ({ label, value }) => value ? (
    <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
      <span style={{ fontSize:11, color:'#94A3B8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</span>
      <span style={{ fontSize:14, color:'#1E293B', fontWeight:500 }}>{value}</span>
    </div>
  ) : null;

  const SectionTitle = ({ title }) => (
    <div style={{ fontSize:11, fontWeight:700, color:'#22819A', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8, display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ flex:1, height:1, background:'linear-gradient(90deg,rgba(34,129,154,0.25),transparent)' }}/>
      {title}
      <div style={{ flex:1, height:1, background:'linear-gradient(270deg,rgba(34,129,154,0.25),transparent)' }}/>
    </div>
  );

  const Section = ({ title, content }) => content ? (
    <div style={{ marginBottom:14 }}>
      <SectionTitle title={title}/>
      <div style={{ fontSize:14, color:'#334155', lineHeight:1.7, whiteSpace:'pre-wrap', background:'#F8FAFC', borderRadius:10, padding:'12px 16px', border:'1px solid #E2E8F0' }}>
        {content}
      </div>
    </div>
  ) : null;

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.55)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}
      onClick={onClose}
    >
      <div
        className="detail-modal"
        style={{ background:'white', borderRadius:24, width:'100%', maxWidth:680, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 32px 100px rgba(0,0,0,0.22)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding:'22px 28px 18px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between', background:'linear-gradient(135deg,#22819A,#1a6478)', borderRadius:'24px 24px 0 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:38, height:38, background:'rgba(255,255,255,0.2)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Activity size={18} color="white"/>
            </div>
            <div>
              <div style={{ fontSize:17, fontWeight:800, color:'white' }}>{diagnosis.disease_name}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', marginTop:1 }}>
                Tashxis ID: #DX-{String(diagnosis.id).padStart(5,'0')}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', cursor:'pointer', color:'white', width:34, height:34, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={18}/>
          </button>
        </div>

        <div style={{ padding:'24px 28px' }}>

          {/* Asosiy ma'lumotlar grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>

            {/* Bemor */}
            <div style={{ background:'#F8FAFC', borderRadius:14, padding:'16px 18px', border:'1px solid #E2E8F0' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Bemor</div>
              <div style={{ fontSize:16, fontWeight:800, color:'#0F172A', marginBottom:6 }}>
                {diagnosis.patient_name || (patient ? `${patient.first_name} ${patient.last_name}` : '—')}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {patient?.age && <InfoRow label="Yoshi" value={`${patient.age} yosh`}/>}
                {patient?.gender && <InfoRow label="Jinsi" value={patient.gender === 'ayol' ? 'Ayol' : 'Erkak'}/>}
                {patient?.blood_type && <InfoRow label="Qon guruhi" value={patient.blood_type}/>}
              </div>
            </div>

            {/* Shifokor + holat */}
            <div style={{ background:'#F0F9FF', borderRadius:14, padding:'16px 18px', border:'1px solid #BAE6FD' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Shifokor</div>
              <div style={{ fontSize:15, fontWeight:700, color:'#0F172A', marginBottom:10 }}>
                Dr. {diagnosis.doctor_name || doctorName}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <InfoRow label="Tashxis sanasi" value={diagnosis.diagnosis_date ? new Date(diagnosis.diagnosis_date).toLocaleDateString('uz-UZ') : '—'}/>
                {diagnosis.follow_up_date && <InfoRow label="Keyingi qabul" value={new Date(diagnosis.follow_up_date).toLocaleDateString('uz-UZ')}/>}
              </div>
            </div>
          </div>

          {/* Status + Daraja */}
          <div style={{ display:'flex', gap:10, marginBottom:20 }}>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:4, alignItems:'center', padding:'14px 16px', borderRadius:12, background:`${statusColor[diagnosis.status] || '#64748B'}12`, border:`1.5px solid ${statusColor[diagnosis.status] || '#64748B'}30` }}>
              <span style={{ fontSize:11, color:'#94A3B8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Status</span>
              <span style={{ fontSize:15, fontWeight:800, color: statusColor[diagnosis.status] || '#64748B' }}>{statusLabel[diagnosis.status] || diagnosis.status}</span>
            </div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:4, alignItems:'center', padding:'14px 16px', borderRadius:12, background:`${severityColor[diagnosis.severity] || '#64748B'}12`, border:`1.5px solid ${severityColor[diagnosis.severity] || '#64748B'}30` }}>
              <span style={{ fontSize:11, color:'#94A3B8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Daraja</span>
              <span style={{ fontSize:15, fontWeight:800, color: severityColor[diagnosis.severity] || '#64748B' }}>{severityLabel[diagnosis.severity] || diagnosis.severity}</span>
            </div>
            {diagnosis.icd_code && (
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:4, alignItems:'center', padding:'14px 16px', borderRadius:12, background:'rgba(59,130,246,0.08)', border:'1.5px solid rgba(59,130,246,0.2)' }}>
                <span style={{ fontSize:11, color:'#94A3B8', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>ICD Kodi</span>
                <span style={{ fontSize:15, fontWeight:800, color:'#3B82F6' }}>{diagnosis.icd_code}</span>
              </div>
            )}
          </div>

          {/* ── CV Hujayralar soni (Python kod natijasi) ── */}
          {aiData?.cv_counts && (
            <div style={{ marginBottom:14 }}>
              <SectionTitle title="🔬 OpenCV hujayralar soni"/>
              <div style={{ background:'white', borderRadius:12, border:'1px solid #E2E8F0', padding:'14px 16px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, marginBottom:14 }}>
                  {Object.entries(aiData.cv_counts).map(([name, count]) => (
                    <div key={name} style={{
                      padding:'10px 12px', borderRadius:10,
                      background:`${CV_COLORS[name]}12`,
                      border:`1.5px solid ${CV_COLORS[name]}30`,
                      textAlign:'center',
                    }}>
                      <div style={{ fontSize:22, fontWeight:900, color:CV_COLORS[name], lineHeight:1 }}>{count}</div>
                      <div style={{ fontSize:10, color:'#64748B', marginTop:4, fontWeight:600 }}>
                        {CV_ICONS[name]} {name}
                      </div>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={Object.entries(aiData.cv_counts).map(([name, value]) => ({ name, value }))}
                    margin={{ top:5, right:8, left:-15, bottom:0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false}/>
                    <XAxis dataKey="name" tick={{ fontSize:10, fill:'#64748B', fontWeight:600 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fontSize:10, fill:'#64748B' }} axisLine={false} tickLine={false}/>
                    <Tooltip
                      formatter={(val) => [`${val} ta`, 'Soni']}
                      contentStyle={{ fontSize:11, borderRadius:8, border:'1px solid #E2E8F0' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50}>
                      {Object.entries(aiData.cv_counts).map(([name], idx) => (
                        <Cell key={idx} fill={CV_COLORS[name] || '#22819A'}/>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {aiData.cv_total_images > 0 && (
                  <div style={{ fontSize:11, color:'#94A3B8', textAlign:'center', marginTop:6 }}>
                    {aiData.cv_total_images} ta rasm asosida jamlangan natija
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── AI Qon tahlili natijalari ── */}
          {aiData && (
            <div style={{ marginBottom:14 }}>
              <SectionTitle title="🔬 AI Qon tahlili natijalari"/>
              {aiData.warning && (
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(124,58,237,0.08)', borderRadius:10, border:'1.5px solid rgba(124,58,237,0.2)', marginBottom:10, fontSize:13, color:'#7C3AED', fontWeight:600 }}>
                  <AlertTriangle size={15}/> Noodatiy hujayralar aniqlandi — qo'shimcha tekshiruv tavsiya etiladi
                </div>
              )}
              <div style={{ background:'#F8FAFC', borderRadius:12, border:'1px solid #E2E8F0', overflow:'hidden' }}>
                {(aiData.results || []).sort((a,b) => b.percent - a.percent).map((item, i) => {
                  const color  = CLASS_COLORS[item.name] || '#22819A';
                  const normal = NORMAL_RANGES[item.name]?.[gKey] || '—';
                  return (
                    <div key={i} style={{ padding:'12px 16px', borderBottom: i < aiData.results.length-1 ? '1px solid #F1F5F9' : 'none' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:10, height:10, borderRadius:'50%', background:color, flexShrink:0 }}/>
                          <span style={{ fontSize:13, fontWeight:600, color:'#1E293B' }}>{item.name}</span>
                        </div>
                        <span style={{ fontSize:14, fontWeight:800, color }}>{item.percent}%</span>
                      </div>
                      <div style={{ height:7, background:'#E2E8F0', borderRadius:4, overflow:'hidden', marginBottom:4 }}>
                        <div style={{ width:`${item.percent}%`, height:'100%', background:color, borderRadius:4, transition:'width 0.6s ease' }}/>
                      </div>
                      <div style={{ fontSize:11, color:'#94A3B8' }}>Norma ({getGenderLabel(patient)}): {normal}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mazmun bo'limlari */}
          <Section title="Shifokor xulosasi" content={diagnosis.description}/>
          {!aiData && <Section title="Klinik alomatlar" content={diagnosis.symptoms}/>}
          <Section title="Davolash rejasi" content={diagnosis.treatment}/>
          <Section title="Dori-darmonlar" content={diagnosis.medications}/>

          {/* Tugmalar */}
          <div style={{ display:'flex', gap:10, marginTop:4, paddingTop:16, borderTop:'1px solid #F1F5F9' }}>
            <button onClick={onClose}
              style={{ flex:1, padding:'11px', borderRadius:12, background:'#F1F5F9', color:'#475569', border:'none', fontSize:14, fontWeight:500, cursor:'pointer' }}>
              Yopish
            </button>
            {onEdit && (
              <button onClick={onEdit}
                style={{ flex:1, padding:'11px', borderRadius:12, background:'rgba(34,129,154,0.1)', color:'#22819A', border:'1px solid rgba(34,129,154,0.25)', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                <Edit2 size={14}/> Tahrirlash
              </button>
            )}
            <button
              onClick={() => printDiagnosisPDF({ diagnosis, patient, doctorName: diagnosis.doctor_name || doctorName })}
              style={{ flex:2, padding:'11px', borderRadius:12, background:'linear-gradient(135deg,#22819A,#1a6478)', color:'white', border:'none', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 4px 14px rgba(34,129,154,0.3)' }}>
              <Printer size={15}/> PDF Hujjat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Badge komponentlari ───────────────────────────────────────
function StatusBadge({ status }) {
  const map    = { yangi:'#22819A', davolanyapti:'#F59E0B', yaxshilandi:'#3B82F6', tuzaldi:'#10B981', surunkali:'#EF4444' };
  const labels = { yangi:'Yangi', davolanyapti:'Davolanyapti', yaxshilandi:'Yaxshilandi', tuzaldi:'Tuzaldi', surunkali:'Surunkali' };
  const c = map[status] || '#64748B';
  return <span style={{ padding:'3px 10px', borderRadius:999, fontSize:12, fontWeight:600, background:`${c}18`, color:c }}>{labels[status] || status}</span>;
}
function SeverityBadge({ severity }) {
  const map    = { engil:'#10B981', orta:'#F59E0B', ogir:'#EF4444', juda_ogir:'#DC2626' };
  const labels = { engil:'Engil', orta:"O'rta", ogir:"Og'ir", juda_ogir:"Juda og'ir" };
  const c = map[severity] || '#64748B';
  return <span style={{ padding:'3px 10px', borderRadius:999, fontSize:12, fontWeight:600, background:`${c}18`, color:c }}>{labels[severity] || severity}</span>;
}

// ─── AI Tahlil modali ─────────────────────────────────────────
// Bir nechta tahlil natijalarini birlashtirish
function combineResults(allResults) {
  if (allResults.length === 1) return allResults[0];
  const classNames = allResults[0].results.map(r => r.name);
  const combined = classNames.map(name => {
    const avg = allResults.reduce((sum, r) => {
      const found = r.results.find(x => x.name === name);
      return sum + (found?.percent || 0);
    }, 0) / allResults.length;
    return { name, percent: Math.round(avg * 10) / 10, normal_range: allResults[0].results.find(x => x.name === name)?.normal_range || {} };
  });
  const topItem = combined.reduce((a, b) => a.percent > b.percent ? a : b);
  return {
    results: combined,
    top_class: topItem.name,
    top_percent: topItem.percent,
    warning: allResults.some(r => r.warning),
    image_count: allResults.length,
  };
}

function AnalyzeModal({ patients, user, onClose, onSaved }) {
  const [step, setStep]             = useState(1);
  const [selPatient, setSelPatient] = useState('');
  const [images, setImages]         = useState([]);    // File[]
  const [previews, setPreviews]     = useState([]);   // string[]
  const [result, setResult]         = useState(null);
  const [cvData, setCvData]         = useState(null);  // { image, counts }
  const [loading, setLoading]       = useState(false);
  const [analyzingIdx, setAnalyzingIdx] = useState(0);
  const [error, setError]           = useState('');
  const [dragOver, setDragOver]     = useState(false);
  const fileRef = useRef();

  const [diagForm, setDiagForm] = useState({
    disease_name:'', description:'', treatment:'',
    status:'yangi', severity:'orta',
    diagnosis_date: new Date().toISOString().split('T')[0],
  });
  const [diagSaving, setDiagSaving] = useState(false);
  const [saveError, setSaveError]   = useState('');

  const patient = patients.find(p => p.id === Number(selPatient));

  const addFiles = (fileList) => {
    const valid = [];
    const errs  = [];
    Array.from(fileList).forEach(file => {
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        errs.push(`${file.name}: faqat JPG/PNG`);
      } else if (file.size > 10 * 1024 * 1024) {
        errs.push(`${file.name}: 10 MB dan katta`);
      } else {
        valid.push(file);
      }
    });
    if (errs.length) { setError(errs.join(', ')); }
    if (!valid.length) return;
    setImages(prev => [...prev, ...valid]);
    setPreviews(prev => [...prev, ...valid.map(f => URL.createObjectURL(f))]);
    setError('');
  };

  const removeImage = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAnalyze = async () => {
    if (!images.length) return;
    setLoading(true); setError(''); setAnalyzingIdx(0);
    try {
      const allResults = [];
      const allCvResults = [];
      let firstCvImage = null;

      for (let i = 0; i < images.length; i++) {
        setAnalyzingIdx(i + 1);

        // AI klassifikatsiya
        const fdAi = new FormData();
        fdAi.append('image', images[i]);
        const aiRes = await api.post('/analyze/', fdAi);
        allResults.push(aiRes.data);

        // CV segmentatsiya (Python kodidagi tahlil)
        try {
          const fdCv = new FormData();
          fdCv.append('image', images[i]);
          const cvRes = await api.post('/analyze/cv/', fdCv);
          allCvResults.push(cvRes.data);
          if (!firstCvImage && cvRes.data?.processed_image) {
            firstCvImage = cvRes.data.processed_image;
          }
        } catch (e) {
          console.error('CV xato:', e);
        }
      }

      // CV countlarni jamlash
      const cvCounts = { Trombotsit: 0, Leykotsit: 0, Healthy: 0, Noodatiy: 0 };
      allCvResults.forEach(r => {
        Object.entries(r.counts || {}).forEach(([k, v]) => {
          cvCounts[k] = (cvCounts[k] || 0) + (v || 0);
        });
      });
      if (allCvResults.length > 0) {
        setCvData({ image: firstCvImage, counts: cvCounts, totalImages: allCvResults.length });
      }

      const combined = combineResults(allResults);
      setResult(combined);
      setDiagForm(prev => ({
        ...prev,
        disease_name: combined.top_class,
        description:  `AI tahlili (${images.length} ta rasm): ${combined.top_class} ${combined.top_percent}%.${combined.warning ? ' Noodatiy hujayralar aniqlandi.' : ''}`,
        severity:     combined.warning ? 'ogir' : 'orta',
      }));
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Tahlil amalga oshmadi');
    } finally { setLoading(false); setAnalyzingIdx(0); }
  };

  const handleSaveDiagnosis = async () => {
    if (!diagForm.disease_name.trim()) { setSaveError('Kasallik nomini kiriting'); return; }
    if (!selPatient) { setSaveError('Bemor tanlanmagan'); return; }
    setDiagSaving(true); setSaveError('');
    try {
      const aiData = result ? JSON.stringify({
        _ai: true,
        top_class: result.top_class,
        top_percent: result.top_percent,
        warning: result.warning,
        image_count: result.image_count || images.length,
        results: result.results,
        cv_counts: cvData?.counts || null,
        cv_total_images: cvData?.totalImages || 0,
      }) : '';
      const description = diagForm.description.trim() || `AI tahlili: ${diagForm.disease_name}`;
      await diagnosesAPI.create({
        patient:        Number(selPatient),
        disease_name:   diagForm.disease_name.trim(),
        description:    description,
        treatment:      diagForm.treatment || '',
        status:         diagForm.status,
        severity:       diagForm.severity,
        diagnosis_date: diagForm.diagnosis_date,
        symptoms:       aiData,
        medications:    '',
      });
      onSaved && onSaved();
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const msgs = Object.entries(data).map(([k, v]) =>
          `${k}: ${Array.isArray(v) ? v.join(', ') : v}`
        ).join(' | ');
        setSaveError(msgs);
      } else {
        setSaveError('Saqlashda xatolik yuz berdi');
      }
    } finally { setDiagSaving(false); }
  };

  const handlePrint = () => printReport({
    patient, result,
    doctor: user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username,
    imageUrl: previews[0] || null,
  });

  const resetAll = () => {
    setStep(1); setResult(null); setCvData(null); setImages([]); setPreviews([]);
    setSelPatient(''); setError(''); setSaveError('');
    setDiagForm({ disease_name:'', description:'', treatment:'', status:'yangi', severity:'orta', diagnosis_date: new Date().toISOString().split('T')[0] });
  };

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}
      onClick={onClose}
    >
      <div
        style={{ background:'white', borderRadius:20, width:'100%', maxWidth: step === 3 ? 1100 : 520, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding:'20px 28px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <FlaskConical size={18} color="#22819A"/>
            <span style={{ fontSize:17, fontWeight:700, color:'#0F172A' }}>Qon tahlili</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            {[1,2,3].map(s => (
              <div key={s} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{
                  width:26, height:26, borderRadius:'50%', fontSize:12, fontWeight:700,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background: step >= s ? '#22819A' : '#F1F5F9',
                  color:      step >= s ? 'white'   : '#94A3B8',
                }}>{s}</div>
                {s < 3 && <div style={{ width:20, height:2, background: step > s ? '#22819A' : '#E2E8F0' }}/>}
              </div>
            ))}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8' }}><X size={20}/></button>
        </div>

        <div style={{ padding:'22px 28px 24px' }}>

          {/* ── Step 1: Bemor tanlash ── */}
          {step === 1 && (
            <div>
              <div style={{ fontSize:14, color:'#64748B', marginBottom:16 }}>Tahlil qilinadigan bemorni tanlang</div>
              <select
                value={selPatient}
                onChange={e => setSelPatient(e.target.value)}
                style={{ width:'100%', padding:'12px 14px', border:'1.5px solid #E2E8F0', borderRadius:12, fontSize:14, outline:'none', background:'white', marginBottom:20 }}
              >
                <option value="">— Bemor tanlang —</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} ({p.gender === 'ayol' ? 'Ayol' : 'Erkak'}, {p.age} yosh)
                  </option>
                ))}
              </select>

              {patient && (
                <div style={{ background:'#F8FAFC', borderRadius:12, padding:'14px 18px', marginBottom:20, border:'1px solid #E2E8F0' }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'#0F172A', marginBottom:4 }}>{patient.first_name} {patient.last_name}</div>
                  <div style={{ fontSize:13, color:'#64748B' }}>
                    {getGenderLabel(patient)} • {patient.age} yosh
                    {patient.blood_type && ` • Qon guruhi: ${patient.blood_type}`}
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep(2)}
                disabled={!selPatient}
                style={{
                  width:'100%', padding:'12px', borderRadius:12,
                  background: selPatient ? '#22819A' : '#E2E8F0',
                  color:      selPatient ? 'white'   : '#94A3B8',
                  border:'none', fontSize:14, fontWeight:600,
                  cursor: selPatient ? 'pointer' : 'not-allowed',
                }}
              >
                Davom etish →
              </button>
            </div>
          )}

          {/* ── Step 2: Ko'p rasm yuklash ── */}
          {step === 2 && (
            <div>
              <div style={{ fontSize:13, color:'#64748B', marginBottom:14 }}>
                Bemor: <strong style={{ color:'#0F172A' }}>{patient?.first_name} {patient?.last_name}</strong>
                <span style={{ marginLeft:10, fontSize:12, color:'#94A3B8' }}>
                  (bir nechta mikroskop rasmi yuklang — umumiy natija chiqariladi)
                </span>
              </div>

              {/* Drop zona — har doim ko'rinadi */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                onClick={() => fileRef.current.click()}
                style={{
                  border:`2px dashed ${dragOver ? '#22819A' : '#CBD5E1'}`,
                  borderRadius:14, padding:'28px 20px', textAlign:'center',
                  cursor:'pointer', background: dragOver ? 'rgba(34,129,154,0.06)' : '#FAFAFA',
                  transition:'all 0.2s', marginBottom:14,
                }}
              >
                <Upload size={26} color="#22819A" style={{ marginBottom:8 }}/>
                <div style={{ fontSize:13, fontWeight:600, color:'#1E293B', marginBottom:3 }}>
                  Rasmlarni bu yerga tashlang yoki tanlang
                </div>
                <div style={{ fontSize:11, color:'#94A3B8' }}>JPG, PNG • Bir vaqtda bir nechta rasm qo'shish mumkin</div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  multiple
                  style={{ display:'none' }}
                  onChange={e => { addFiles(e.target.files); e.target.value = ''; }}
                />
              </div>

              {/* Tanlangan rasmlar grid */}
              {previews.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#475569', marginBottom:8 }}>
                    {previews.length} ta rasm tanlandi:
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px, 1fr))', gap:8 }}>
                    {previews.map((url, idx) => (
                      <div key={idx} style={{ position:'relative', aspectRatio:'1', borderRadius:10, overflow:'hidden', border:'1.5px solid #E2E8F0' }}>
                        <img src={url} alt={`rasm ${idx+1}`} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                        <button
                          onClick={e => { e.stopPropagation(); removeImage(idx); }}
                          style={{
                            position:'absolute', top:3, right:3,
                            width:20, height:20, borderRadius:'50%',
                            background:'rgba(0,0,0,0.55)', color:'white',
                            border:'none', cursor:'pointer',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:10, lineHeight:1,
                          }}
                        ><X size={10}/></button>
                        <div style={{ position:'absolute', bottom:2, left:3, fontSize:9, color:'rgba(255,255,255,0.9)', fontWeight:700 }}>{idx+1}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div style={{ padding:'10px 14px', background:'#FEF2F2', borderRadius:10, fontSize:13, color:'#EF4444', marginBottom:14 }}>{error}</div>
              )}

              {/* Progress */}
              {loading && (
                <div style={{ padding:'10px 14px', background:'rgba(34,129,154,0.08)', borderRadius:10, fontSize:13, color:'#22819A', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
                  <Loader size={14} style={{ animation:'spin 0.8s linear infinite' }}/>
                  Tahlil qilinmoqda: {analyzingIdx} / {images.length} ta rasm...
                </div>
              )}

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setStep(1)}
                  style={{ flex:1, padding:'11px', borderRadius:12, background:'#F1F5F9', color:'#475569', border:'none', fontSize:14, fontWeight:500, cursor:'pointer' }}>
                  ← Orqaga
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={!images.length || loading}
                  style={{
                    flex:2, padding:'11px', borderRadius:12,
                    background: images.length && !loading ? 'linear-gradient(135deg,#22819A,#1a6478)' : '#E2E8F0',
                    color:      images.length && !loading ? 'white' : '#94A3B8',
                    border:'none', fontSize:14, fontWeight:600,
                    cursor: images.length && !loading ? 'pointer' : 'not-allowed',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    boxShadow: images.length && !loading ? '0 4px 14px rgba(34,129,154,0.3)' : 'none',
                  }}
                >
                  {loading
                    ? <><Loader size={15} style={{ animation:'spin 0.8s linear infinite' }}/> Tahlil qilinmoqda...</>
                    : <><FlaskConical size={15}/> {images.length > 0 ? `${images.length} ta rasmni tahlil qilish` : 'Rasm tanlang'}</>}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Natija + Tashxis formi ── */}
          {step === 3 && result && (
            <div>
              {/* Bemor kartochkasi */}
              <div style={{ display:'flex', alignItems:'center', gap:14, background:'#F8FAFC', borderRadius:12, padding:'12px 16px', marginBottom:16, border:'1px solid #E2E8F0' }}>
                {/* Rasmlar preview (kichik) */}
                <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                  {previews.slice(0, 3).map((url, i) => (
                    <img key={i} src={url} alt={`rasm ${i+1}`}
                      style={{ width:44, height:44, objectFit:'cover', borderRadius:7, border:'1px solid #E2E8F0' }}/>
                  ))}
                  {previews.length > 3 && (
                    <div style={{ width:44, height:44, borderRadius:7, background:'#F1F5F9', border:'1px solid #E2E8F0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#64748B' }}>
                      +{previews.length - 3}
                    </div>
                  )}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#0F172A' }}>{patient?.first_name} {patient?.last_name}</div>
                  <div style={{ fontSize:12, color:'#64748B', marginTop:2 }}>
                    {getGenderLabel(patient)} • {patient?.age} yosh {patient?.blood_type && `• ${patient.blood_type}`}
                  </div>
                  <div style={{ fontSize:11, color:'#22819A', marginTop:2, fontWeight:600 }}>
                    {images.length} ta rasm asosida umumiy natija
                  </div>
                </div>
                {result.warning && (
                  <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#7C3AED', background:'rgba(124,58,237,0.08)', padding:'5px 10px', borderRadius:8, fontWeight:600, flexShrink:0 }}>
                    <AlertTriangle size={13}/> Noodatiy hujayra
                  </div>
                )}
              </div>

              {/* ── CV Segmentatsiya (Python kodidagi natija) ── */}
              {cvData && (
                <div style={{ marginBottom:14, background:'#0F172A', borderRadius:14, overflow:'hidden' }}>
                  {/* Title (plt.title simulyatsiyasi) */}
                  <div style={{
                    padding:'10px 16px', background:'rgba(0,0,0,0.5)',
                    display:'flex', flexWrap:'wrap', gap:14, alignItems:'center',
                    justifyContent:'center', fontSize:13, fontWeight:700, color:'white',
                  }}>
                    {Object.entries(cvData.counts).map(([name, count]) => (
                      <div key={name} style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{
                          width:10, height:10, borderRadius:'50%',
                          background:CV_COLORS[name],
                          boxShadow:`0 0 5px ${CV_COLORS[name]}`,
                        }}/>
                        {CV_ICONS[name]} {name}: <span style={{ color:CV_COLORS[name] }}>{count}</span>
                      </div>
                    ))}
                  </div>

                  {/* Rasm + Bar chart yonma-yon */}
                  <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:0 }}>
                    {/* Chap: CV rasm */}
                    <div style={{ position:'relative', background:'#0F172A' }}>
                      {cvData.image ? (
                        <img
                          src={cvData.image}
                          alt="CV segmentatsiya"
                          style={{
                            width:'100%', height:'100%', minHeight:280, maxHeight:380,
                            objectFit:'contain', display:'block',
                          }}
                        />
                      ) : (
                        <div style={{ padding:40, color:'#94A3B8', textAlign:'center' }}>
                          <Microscope size={36} style={{ opacity:0.4 }}/>
                          <div style={{ fontSize:12, marginTop:8 }}>CV rasm yo'q</div>
                        </div>
                      )}
                      <div style={{
                        position:'absolute', top:8, left:8,
                        background:'rgba(0,0,0,0.7)', color:'white',
                        borderRadius:18, padding:'3px 10px',
                        fontSize:10, fontWeight:700,
                        display:'flex', alignItems:'center', gap:5,
                      }}>
                        <Microscope size={11}/> OpenCV {cvData.totalImages > 1 && `(1/${cvData.totalImages})`}
                      </div>
                    </div>

                    {/* O'ng: Bar chart */}
                    <div style={{ background:'white', padding:'14px 12px' }}>
                      <div style={{
                        fontSize:12, fontWeight:700, color:'#0F172A',
                        marginBottom:8, textAlign:'center',
                      }}>
                        📊 Hujayralar soni
                      </div>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart
                          data={Object.entries(cvData.counts).map(([name, value]) => ({ name, value }))}
                          margin={{ top:5, right:8, left:-15, bottom:5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false}/>
                          <XAxis dataKey="name" tick={{ fontSize:10, fill:'#64748B', fontWeight:600 }} axisLine={false} tickLine={false}/>
                          <YAxis tick={{ fontSize:10, fill:'#64748B' }} axisLine={false} tickLine={false}/>
                          <Tooltip
                            formatter={(val) => [`${val} ta`, 'Soni']}
                            contentStyle={{ fontSize:11, borderRadius:8, border:'1px solid #E2E8F0' }}
                            cursor={{ fill:'rgba(34,129,154,0.05)' }}
                          />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50}>
                            {Object.entries(cvData.counts).map(([name], idx) => (
                              <Cell key={idx} fill={CV_COLORS[name] || '#22819A'}/>
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Ikki ustun */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>

                {/* Chap — AI natijalar */}
                <div style={{ background:'white', borderRadius:12, border:'1px solid #E2E8F0', padding:'14px 16px' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 }}>
                    🔬 AI tahlil natijalari
                  </div>
                  {result.results.sort((a, b) => b.percent - a.percent).map((item, i) => {
                    const color  = CLASS_COLORS[item.name] || '#22819A';
                    const normal = NORMAL_RANGES[item.name]?.[getGenderKey(patient)] || '—';
                    return (
                      <div key={i} style={{ marginBottom:10 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                          <span style={{ fontSize:12, fontWeight:600, color:'#334155' }}>{item.name}</span>
                          <span style={{ fontSize:12, fontWeight:700, color }}>{item.percent}%</span>
                        </div>
                        <div style={{ height:6, background:'#F1F5F9', borderRadius:3, overflow:'hidden', marginBottom:2 }}>
                          <div style={{ width:`${item.percent}%`, height:'100%', background:color, borderRadius:3 }}/>
                        </div>
                        <div style={{ fontSize:10, color:'#94A3B8' }}>Norma: {normal}</div>
                      </div>
                    );
                  })}
                </div>

                {/* O'ng — Tashxis formi */}
                <div style={{ background:'white', borderRadius:12, border:'1px solid #E2E8F0', padding:'14px 16px' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 }}>
                    📋 Tashxis yozish
                  </div>

                  <div style={{ marginBottom:10 }}>
                    <label style={{ fontSize:11, fontWeight:500, color:'#475569', display:'block', marginBottom:4 }}>Kasallik nomi *</label>
                    <input
                      value={diagForm.disease_name}
                      onChange={e => setDiagForm({ ...diagForm, disease_name: e.target.value })}
                      placeholder={result.top_class}
                      style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:13, outline:'none', boxSizing:'border-box' }}
                    />
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 8px' }}>
                    <div style={{ marginBottom:10 }}>
                      <label style={{ fontSize:11, fontWeight:500, color:'#475569', display:'block', marginBottom:4 }}>Status</label>
                      <select value={diagForm.status} onChange={e => setDiagForm({ ...diagForm, status: e.target.value })}
                        style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:12, outline:'none', background:'white' }}>
                        {STATUS_CHOICES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom:10 }}>
                      <label style={{ fontSize:11, fontWeight:500, color:'#475569', display:'block', marginBottom:4 }}>Darajasi</label>
                      <select value={diagForm.severity} onChange={e => setDiagForm({ ...diagForm, severity: e.target.value })}
                        style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:12, outline:'none', background:'white' }}>
                        {SEVERITY_CHOICES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom:10 }}>
                    <label style={{ fontSize:11, fontWeight:500, color:'#475569', display:'block', marginBottom:4 }}>Tavsif</label>
                    <textarea rows={2} value={diagForm.description}
                      onChange={e => setDiagForm({ ...diagForm, description: e.target.value })}
                      placeholder="Tashxis tavsifi..."
                      style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:12, outline:'none', resize:'none', boxSizing:'border-box' }}/>
                  </div>

                  <div style={{ marginBottom:10 }}>
                    <label style={{ fontSize:11, fontWeight:500, color:'#475569', display:'block', marginBottom:4 }}>Davolash</label>
                    <textarea rows={2} value={diagForm.treatment}
                      onChange={e => setDiagForm({ ...diagForm, treatment: e.target.value })}
                      placeholder="Davolash usuli..."
                      style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:12, outline:'none', resize:'none', boxSizing:'border-box' }}/>
                  </div>

                  <div>
                    <label style={{ fontSize:11, fontWeight:500, color:'#475569', display:'block', marginBottom:4 }}>Sana</label>
                    <input type="date" value={diagForm.diagnosis_date}
                      onChange={e => setDiagForm({ ...diagForm, diagnosis_date: e.target.value })}
                      style={{ width:'100%', padding:'8px 10px', border:'1.5px solid #E2E8F0', borderRadius:8, fontSize:12, outline:'none', boxSizing:'border-box' }}/>
                  </div>
                </div>
              </div>

              {saveError && (
                <div style={{ padding:'9px 14px', background:'#FEF2F2', borderRadius:8, fontSize:13, color:'#EF4444', marginBottom:10 }}>{saveError}</div>
              )}

              {/* Tugmalar */}
              <div style={{ display:'flex', gap:10 }}>
                <button
                  onClick={resetAll}
                  style={{ flex:1, padding:'11px', borderRadius:12, background:'#F1F5F9', color:'#475569', border:'none', fontSize:13, fontWeight:500, cursor:'pointer' }}
                >
                  Yangi tahlil
                </button>
                <button onClick={handlePrint}
                  style={{ padding:'11px 16px', borderRadius:12, background:'rgba(34,129,154,0.1)', color:'#22819A', border:'1px solid rgba(34,129,154,0.2)', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                  <Printer size={14}/> PDF
                </button>
                <button onClick={handleSaveDiagnosis} disabled={diagSaving}
                  style={{
                    flex:2, padding:'11px', borderRadius:12,
                    background:'linear-gradient(135deg,#22819A,#1a6478)', color:'white',
                    border:'none', fontSize:13, fontWeight:600, cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    boxShadow:'0 4px 14px rgba(34,129,154,0.3)',
                  }}>
                  {diagSaving
                    ? <><Loader size={14} style={{ animation:'spin 0.8s linear infinite' }}/> Saqlanmoqda...</>
                    : <><CheckCircle size={14}/> Tashxisni saqlash</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Asosiy sahifa ────────────────────────────────────────────
export default function DiagnosesPage() {
  const { isAdmin, user } = useAuth();
  const [diagnoses, setDiagnoses]       = useState([]);
  const [patients, setPatients]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [analyzeModal, setAnalyzeModal]   = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [modal, setModal]                 = useState(false);
  const [editDiagnosis, setEditDiagnosis] = useState(null);
  const [form, setForm]                 = useState(emptyForm);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');
  const [toast, setToast]               = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const load = async () => {
    try {
      const [dRes, pRes] = await Promise.all([diagnosesAPI.list(), patientsAPI.list()]);
      setDiagnoses(dRes.data?.results || dRes.data || []);
      setPatients(pRes.data?.results  || pRes.data  || []);
    } catch (e) {
      console.error('Ma\'lumotlarni yuklashda xato:', e);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = diagnoses.filter(d =>
    `${d.disease_name} ${d.patient_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (d) => {
    setEditDiagnosis(d);
    setForm({
      patient:        d.patient,
      disease_name:   d.disease_name,
      icd_code:       d.icd_code || '',
      description:    d.description,
      symptoms:       d.symptoms || '',
      treatment:      d.treatment || '',
      medications:    d.medications || '',
      status:         d.status,
      severity:       d.severity,
      diagnosis_date: d.diagnosis_date,
      follow_up_date: d.follow_up_date || '',
    });
    setError('');
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form };
      if (!payload.follow_up_date) delete payload.follow_up_date;
      if (!payload.icd_code)       delete payload.icd_code;
      await diagnosesAPI.update(editDiagnosis.id, payload);
      setModal(false);
      showToast('✅ Tashxis yangilandi!');
      load();
    } catch (err) {
      const data = err.response?.data;
      setError(data ? Object.values(data).flat().join(' ') : 'Xatolik yuz berdi');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Bu tashxisni o'chirmoqchimisiz?")) return;
    await diagnosesAPI.delete(id); load();
  };

  return (
    <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 20px' }}>

      {/* Toast xabarnomasi */}
      {toast && (
        <div style={{
          position:'fixed', bottom:28, right:28, zIndex:9999,
          background:'#0F172A', color:'white', borderRadius:14,
          padding:'13px 22px', fontSize:14, fontWeight:600,
          boxShadow:'0 8px 32px rgba(0,0,0,0.22)',
          display:'flex', alignItems:'center', gap:10,
          animation:'slideUp 0.3s ease',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:700, color:'#0F172A' }}>Tashxislar</div>
          <div style={{ fontSize:13, color:'#64748B', marginTop:2 }}>Bemorlar tashxislari ro'yxati</div>
        </div>

        {/* Faqat doktor uchun — Tahlil qo'shish tugmasi */}
        {!isAdmin && (
          <button
            onClick={() => setAnalyzeModal(true)}
            style={{
              display:'flex', alignItems:'center', gap:7,
              padding:'10px 18px', borderRadius:10,
              background:'#22819A', color:'white', border:'none',
              fontSize:14, fontWeight:600, cursor:'pointer',
              boxShadow:'0 4px 12px rgba(34,129,154,0.25)', transition:'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1a6478'}
            onMouseLeave={e => e.currentTarget.style.background = '#22819A'}
          >
            <FlaskConical size={15}/> Tahlil qo'shish
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{
        display:'flex', alignItems:'center', gap:10,
        background:'white', border:'1.5px solid #E2E8F0',
        borderRadius:10, padding:'9px 14px', marginBottom:20,
      }}>
        <Search size={15} color="#94A3B8"/>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Kasallik yoki bemor bo'yicha qidirish..."
          style={{ border:'none', outline:'none', fontSize:14, background:'transparent', flex:1, color:'#1E293B' }}
        />
      </div>

      {/* Ro'yxat */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
          <div className="loader" style={{ width:32, height:32 }}/>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'#94A3B8' }}>
          <Activity size={40} style={{ opacity:0.3, marginBottom:12 }}/>
          <p style={{ fontSize:14 }}>Tashxislar topilmadi</p>
        </div>
      ) : (
        <div style={{ background:'white', borderRadius:16, border:'1px solid #E2E8F0', overflow:'hidden' }}>
          {filtered.map((d, i) => (
            <div key={d.id}
              className="diag-row list-item"
              onClick={() => setSelectedDiagnosis(d)}
              style={{
                display:'flex', alignItems:'center', gap:16,
                padding:'14px 20px',
                borderBottom: i < filtered.length - 1 ? '1px solid #F1F5F9' : 'none',
              }}
            >
              <div style={{ width:40, height:40, borderRadius:10, background:'rgba(34,129,154,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Activity size={18} color="#22819A"/>
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:600, color:'#1E293B' }}>{d.disease_name}</div>
                <div style={{ fontSize:12, color:'#94A3B8', marginTop:2 }}>
                  {d.patient_name}
                  {d.doctor_name && ` • ${d.doctor_name}`}
                  {' • '}{new Date(d.diagnosis_date).toLocaleDateString('uz-UZ')}
                </div>
              </div>

              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <StatusBadge status={d.status}/>
                <SeverityBadge severity={d.severity}/>
              </div>

              {/* Doktor: tahrirlash + o'chirish */}
              {!isAdmin && (
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <button onClick={(e) => { e.stopPropagation(); openEdit(d); }} title="Tahrirlash"
                    style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, background:'transparent', border:'1px solid #E2E8F0', color:'#64748B', cursor:'pointer', transition:'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  ><Edit2 size={13}/></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }} title="O'chirish"
                    style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, background:'#FEF2F2', border:'1px solid #FECACA', color:'#EF4444', cursor:'pointer', transition:'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background='#EF4444'; e.currentTarget.style.color='white'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='#FEF2F2'; e.currentTarget.style.color='#EF4444'; }}
                  ><Trash2 size={13}/></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tashxis detail modali */}
      {selectedDiagnosis && (
        <DiagnosisDetailModal
          diagnosis={selectedDiagnosis}
          patients={patients}
          user={user}
          onClose={() => setSelectedDiagnosis(null)}
          onEdit={!isAdmin ? () => { setSelectedDiagnosis(null); openEdit(selectedDiagnosis); } : undefined}
        />
      )}

      {/* AI Tahlil modali */}
      {analyzeModal && (
        <AnalyzeModal
          patients={patients}
          user={user}
          onClose={() => setAnalyzeModal(false)}
          onSaved={() => {
            setAnalyzeModal(false);
            showToast('✅ Tashxis muvaffaqiyatli saqlandi!');
            load();
          }}
        />
      )}

      {/* Tahrirlash modali (doktor uchun) */}
      {modal && editDiagnosis && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}
          onClick={() => setModal(false)}
        >
          <div
            style={{ background:'white', borderRadius:20, width:'100%', maxWidth:580, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding:'20px 28px 16px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontSize:17, fontWeight:700, color:'#0F172A' }}>Tashxisni tahrirlash</div>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#94A3B8' }}><X size={20}/></button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ padding:'20px 28px' }}>
                {error && (
                  <div style={{ padding:'10px 14px', background:'#FEF2F2', borderRadius:8, fontSize:13, color:'#EF4444', marginBottom:14 }}>{error}</div>
                )}

                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:12, fontWeight:500, color:'#475569', display:'block', marginBottom:6 }}>Kasallik nomi *</label>
                  <input required value={form.disease_name} onChange={e => setForm({ ...form, disease_name: e.target.value })}
                    placeholder="Kasallik nomi"
                    style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box' }}/>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 14px' }}>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ fontSize:12, fontWeight:500, color:'#475569', display:'block', marginBottom:6 }}>Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                      style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:14, outline:'none', background:'white' }}>
                      {STATUS_CHOICES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ fontSize:12, fontWeight:500, color:'#475569', display:'block', marginBottom:6 }}>Darajasi</label>
                    <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}
                      style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:14, outline:'none', background:'white' }}>
                      {SEVERITY_CHOICES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 14px' }}>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ fontSize:12, fontWeight:500, color:'#475569', display:'block', marginBottom:6 }}>Tashxis sanasi *</label>
                    <input required type="date" value={form.diagnosis_date} onChange={e => setForm({ ...form, diagnosis_date: e.target.value })}
                      style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box' }}/>
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <label style={{ fontSize:12, fontWeight:500, color:'#475569', display:'block', marginBottom:6 }}>Keyingi tekshiruv</label>
                    <input type="date" value={form.follow_up_date} onChange={e => setForm({ ...form, follow_up_date: e.target.value })}
                      style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box' }}/>
                  </div>
                </div>

                {[
                  ['Tavsif *', 'description', true],
                  ['Alomatlar', 'symptoms', false],
                  ['Davolash', 'treatment', false],
                  ['Dorilar', 'medications', false],
                ].map(([label, key, req]) => (
                  <div key={key} style={{ marginBottom:14 }}>
                    <label style={{ fontSize:12, fontWeight:500, color:'#475569', display:'block', marginBottom:6 }}>{label}</label>
                    <textarea required={req} rows={2} value={form[key]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      placeholder={label.replace(' *', '')}
                      style={{ width:'100%', padding:'10px 13px', border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:14, outline:'none', resize:'vertical', boxSizing:'border-box' }}/>
                  </div>
                ))}
              </div>

              <div style={{ padding:'14px 28px 22px', display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" onClick={() => setModal(false)}
                  style={{ padding:'9px 20px', borderRadius:10, background:'#F1F5F9', color:'#475569', border:'none', fontSize:14, fontWeight:500, cursor:'pointer' }}>
                  Bekor qilish
                </button>
                <button type="submit" disabled={saving}
                  style={{ padding:'9px 20px', borderRadius:10, background:'#22819A', color:'white', border:'none', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                  {saving ? <><span className="loader" style={{ width:14, height:14 }}/> Saqlanmoqda...</> : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}