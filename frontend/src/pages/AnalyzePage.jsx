import { useState, useRef, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import {
  Upload, X, FlaskConical, Loader, FileDown,
  Microscope, Brain, RefreshCw,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../services/api';

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

const CLASS_COLORS = {
  'Eritrosit':           { color: '#EF4444', icon: '🔴' },
  'Healthy blood cell':  { color: '#10B981', icon: '🟢' },
  'Leykotsit':           { color: '#3B82F6', icon: '🔵' },
  'Trombosit':           { color: '#F59E0B', icon: '🟡' },
  'Noodatiy hujayralar': { color: '#8B5CF6', icon: '⚠️' },
};

const GENDER_LABELS = { Erkaklar: '♂ Erkaklar', Ayollar: '♀ Ayollar', Bolalar: '🧒 Bolalar' };
const GENDER_OPTIONS = ['Erkaklar', 'Ayollar', 'Bolalar'];

export default function AnalyzePage() {
  const [file, setFile]             = useState(null);
  const [preview, setPreview]       = useState(null);
  const [cvResult, setCvResult]     = useState(null);
  const [aiResult, setAiResult]     = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [dragOver, setDragOver]     = useState(false);
  const [gender, setGender]         = useState('Erkaklar');
  const [pdfLoading, setPdfLoading] = useState(false);
  const fileRef   = useRef();
  const resultRef = useRef();

  const handleFiles = useCallback((newFiles) => {
    const img = Array.from(newFiles).find(f => f.type.startsWith('image/'));
    if (!img) { setError('Faqat rasm fayllari (JPG, PNG)'); return; }
    setFile(img);
    setPreview(URL.createObjectURL(img));
    setCvResult(null);
    setAiResult(null);
    setError('');
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setCvResult(null);
    setAiResult(null);

    const fd1 = new FormData();
    fd1.append('image', file);
    const fd2 = new FormData();
    fd2.append('image', file);

    const [cvRes, aiRes] = await Promise.allSettled([
      api.post('/analyze/cv/', fd1),
      api.post('/analyze/', fd2),
    ]);

    if (cvRes.status === 'fulfilled') setCvResult(cvRes.value.data);
    if (aiRes.status === 'fulfilled') setAiResult(aiRes.value.data);

    if (cvRes.status === 'rejected' && aiRes.status === 'rejected') {
      setError(
        cvRes.reason?.response?.data?.error ||
        aiRes.reason?.response?.data?.error ||
        'Tahlil amalga oshmadi'
      );
    }
    setLoading(false);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setCvResult(null);
    setAiResult(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const exportPdf = async () => {
    if (!resultRef.current) return;
    setPdfLoading(true);
    try {
      const canvas = await html2canvas(resultRef.current, {
        scale: 2, useCORS: true, backgroundColor: '#F8FAFC',
        windowWidth: resultRef.current.scrollWidth,
        windowHeight: resultRef.current.scrollHeight,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW  = pdf.internal.pageSize.getWidth();
      const pageH  = pdf.internal.pageSize.getHeight();
      const imgH   = pageW * (canvas.height / canvas.width);

      pdf.setFillColor(34, 129, 154);
      pdf.rect(0, 0, pageW, 14, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(11);
      pdf.text('Qon tahlili natijasi', 10, 9.5);
      pdf.setFontSize(9);
      pdf.text(new Date().toLocaleString('uz-UZ'), pageW - 10, 9.5, { align: 'right' });

      let yPos = 18, srcY = 0, remaining = imgH;
      while (remaining > 0) {
        const sliceH = Math.min(pageH - yPos, remaining);
        const srcH   = canvas.height * (sliceH / imgH);
        const sc     = document.createElement('canvas');
        sc.width = canvas.width; sc.height = Math.ceil(srcH);
        sc.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
        pdf.addImage(sc.toDataURL('image/png'), 'PNG', 0, yPos, pageW, sliceH);
        remaining -= sliceH; srcY += srcH; yPos = 0;
        if (remaining > 0) pdf.addPage();
      }
      pdf.save(`qon_tahlili_${Date.now()}.pdf`);
    } finally {
      setPdfLoading(false);
    }
  };

  const hasResult  = cvResult || aiResult;
  const chartData  = cvResult
    ? Object.entries(cvResult.counts).map(([name, value]) => ({ name, value }))
    : [];
  const totalCells = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ padding: '20px 24px', width: '100%', boxSizing: 'border-box' }}>

      {/* ─── Header ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FlaskConical size={22} color="#22819A" />
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Qon tahlili</div>
            <div style={{ fontSize: 13, color: '#64748B' }}>
              OpenCV segmentatsiya · EfficientNetB0 klassifikatsiya
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', gap: 4, background: 'white',
            padding: 4, borderRadius: 12, border: '1px solid #E2E8F0',
          }}>
            {GENDER_OPTIONS.map(g => (
              <button key={g} onClick={() => setGender(g)} style={{
                padding: '6px 12px', borderRadius: 8, border: 'none',
                background: gender === g ? '#22819A' : 'transparent',
                color: gender === g ? 'white' : '#64748B',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {GENDER_LABELS[g]}
              </button>
            ))}
          </div>

          {hasResult && (
            <>
              <button onClick={exportPdf} disabled={pdfLoading} style={{
                padding: '8px 16px', borderRadius: 10,
                background: pdfLoading ? '#94A3B8' : '#1E293B',
                color: 'white', border: 'none', cursor: pdfLoading ? 'not-allowed' : 'pointer',
                fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7,
              }}>
                {pdfLoading
                  ? <><Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Tayyorlanmoqda...</>
                  : <><FileDown size={14} /> PDF saqlash</>}
              </button>
              <button onClick={reset} style={{
                padding: '8px 16px', borderRadius: 10,
                background: '#F1F5F9', color: '#475569',
                border: '1px solid #E2E8F0', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7,
              }}>
                <RefreshCw size={14} /> Yangi tahlil
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── UPLOAD ───────────────────────────────────────────── */}
      {!hasResult && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, maxWidth: 960, margin: '0 auto' }}>
          <div>
            {!file ? (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? '#22819A' : '#CBD5E1'}`,
                  borderRadius: 18, padding: '70px 20px',
                  textAlign: 'center', cursor: 'pointer',
                  background: dragOver ? 'rgba(34,129,154,0.05)' : 'white',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 70, height: 70, borderRadius: 18,
                  background: 'rgba(34,129,154,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 18px',
                }}>
                  <Upload size={32} color="#22819A" />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>
                  Rasmni tanlang yoki shu yerga tashlang
                </div>
                <div style={{ fontSize: 13, color: '#94A3B8' }}>JPG, PNG · Mikroskop ostidagi qon rasmi</div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => handleFiles(e.target.files)} />
              </div>
            ) : (
              <div style={{ background: 'white', borderRadius: 18, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <div style={{ position: 'relative' }}>
                  <img src={preview} alt="preview"
                    style={{ width: '100%', maxHeight: 420, objectFit: 'contain', display: 'block', background: '#F8FAFC' }} />
                  <button onClick={reset} style={{
                    position: 'absolute', top: 10, right: 10, width: 32, height: 32,
                    borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: 'white',
                    border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <X size={15} />
                  </button>
                </div>
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 13, color: '#64748B', marginBottom: 14 }}>📁 {file.name}</div>
                  {error && (
                    <div style={{
                      padding: '10px 14px', background: '#FEF2F2', borderRadius: 10,
                      fontSize: 13, color: '#EF4444', marginBottom: 12,
                    }}>
                      {error}
                    </div>
                  )}
                  <button onClick={handleAnalyze} disabled={loading} style={{
                    width: '100%', padding: '13px',
                    background: loading ? '#94A3B8' : 'linear-gradient(135deg, #22819A, #1a6478)',
                    color: 'white', border: 'none', borderRadius: 12,
 
                    fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                    boxShadow: loading ? 'none' : '0 4px 18px rgba(34,129,154,0.35)',
                  }}>
                    {loading
                      ? <><Loader size={17} style={{ animation: 'spin 0.8s linear infinite' }} /> Tahlil qilinmoqda...</>
                      : <><FlaskConical size={17} /> Tahlil qilish</>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info panel */}
          <div style={{
            background: 'white', borderRadius: 18, border: '1px solid #E2E8F0',
            padding: '20px', fontSize: 13, color: '#64748B', lineHeight: 1.85,
          }}>
            <div style={{ fontWeight: 700, color: '#334155', marginBottom: 10, fontSize: 14 }}>
              🔬 Aniqlanadigan hujayralar
            </div>
            {Object.entries(CV_COLORS).map(([name, color]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ color: '#475569', fontWeight: 500 }}>{CV_ICONS[name]} {name}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #F1F5F9', margin: '14px 0' }} />
            <div style={{ fontWeight: 700, color: '#334155', marginBottom: 8, fontSize: 14 }}>📋 Ko'rsatmalar</div>
            <div>• Mikroskop ostidagi qon rasmi yuklang</div>
            <div>• OpenCV + EfficientNetB0 tahlil qiladi</div>
            <div>• Erkak/Ayol/Bola normal ko'rsatkichlari</div>
            <div>• Natijani PDF sifatida saqlash mumkin</div>
          </div>
        </div>
      )}

      {/* ─── NATIJA (to'liq ekran) ───────────────────────────── */}
      {hasResult && (
        <div ref={resultRef} style={{ width: '100%' }}>

          {/* ── 1. ASOSIY RASM — to'liq kenglikda ─────────────── */}
          <div style={{
            background: '#0F172A', borderRadius: 18, overflow: 'hidden',
            marginBottom: 16, position: 'relative',
          }}>
            {/* Count title (plt.title simulyatsiyasi) */}
            {cvResult && (
              <div style={{
                padding: '12px 20px',
                background: 'rgba(0,0,0,0.6)',
                display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center',
                justifyContent: 'center',
              }}>
                {Object.entries(cvResult.counts).map(([name, count]) => (
                  <div key={name} style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    color: 'white', fontSize: 14, fontWeight: 700,
                  }}>
                    <div style={{
                      width: 12, height: 12, borderRadius: '50%',
                      background: CV_COLORS[name],
                      boxShadow: `0 0 6px ${CV_COLORS[name]}`,
                    }} />
                    {CV_ICONS[name]} {name}: <span style={{ color: CV_COLORS[name], fontSize: 16 }}>{count}</span>
                  </div>
                ))}
                <div style={{ color: '#94A3B8', fontSize: 13, fontWeight: 600 }}>
                  | Jami: <span style={{ color: 'white' }}>{totalCells}</span> ta
                </div>
              </div>
            )}

            {/* Processed image */}
            {cvResult?.processed_image ? (
              <div style={{ position: 'relative' }}>
                <img
                  src={cvResult.processed_image}
                  alt="CV tahlil natijasi"
                  style={{
                    width: '100%',
                    maxHeight: 'calc(100vh - 260px)',
                    minHeight: 400,
                    objectFit: 'contain',
                    display: 'block',
                    background: '#0F172A',
                  }}
                />
                {/* Top-left badge */}
                <div style={{
                  position: 'absolute', top: 12, left: 12,
                  background: 'rgba(0,0,0,0.75)', color: 'white',
                  borderRadius: 22, padding: '5px 14px', fontSize: 12, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 6,
                  backdropFilter: 'blur(4px)',
                }}>
                  <Microscope size={13} /> OpenCV Segmentatsiya
                </div>
                {/* Legend bottom-left */}
                <div style={{
                  position: 'absolute', bottom: 12, left: 12,
                  display: 'flex', flexDirection: 'column', gap: 5,
                }}>
                  {Object.entries(CV_COLORS).map(([name, color]) => (
                    <div key={name} style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      background: 'rgba(0,0,0,0.72)', borderRadius: 22, padding: '3px 11px',
                      backdropFilter: 'blur(4px)',
                    }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: color }} />
                      <span style={{ color: 'white', fontSize: 11, fontWeight: 600 }}>{name}</span>
                    </div>
                  ))}
                </div>
                {/* Asl rasm thumbnail */}
                {preview && (
                  <div style={{
                    position: 'absolute', bottom: 12, right: 12,
                    background: 'rgba(0,0,0,0.72)', borderRadius: 12, padding: 6,
                    backdropFilter: 'blur(4px)',
                  }}>
                    <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 4, textAlign: 'center' }}>Asl rasm</div>
                    <img src={preview} alt="asl"
                      style={{ width: 90, height: 70, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                padding: 60, textAlign: 'center', color: '#64748B',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              }}>
                <Microscope size={52} color="#475569" />
                <div>OpenCV tahlil mavjud emas</div>
                {preview && (
                  <img src={preview} alt="original"
                    style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 10 }} />
                )}
              </div>
            )}
          </div>

          {/* ── 2. STATISTIKA + BAR CHART ─────────────────────── */}
          {cvResult && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

              {/* Hujayra soni kartochkalari */}
              <div style={{
                background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', padding: '20px 22px',
              }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>
                  🔬 Hujayralar soni
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {Object.entries(cvResult.counts).map(([name, count]) => {
                    const color = CV_COLORS[name] || '#22819A';
                    const pct   = totalCells > 0 ? Math.round((count / totalCells) * 100) : 0;
                    return (
                      <div key={name} style={{
                        padding: '14px 16px', borderRadius: 14,
                        background: `${color}12`,
                        border: `1.5px solid ${color}30`,
                      }}>
                        <div style={{ fontSize: 32, fontWeight: 900, color, lineHeight: 1 }}>{count}</div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 5, fontWeight: 500 }}>
                          {CV_ICONS[name]} {name}
                        </div>
                        <div style={{ marginTop: 10, height: 5, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
                        </div>
                        <div style={{ fontSize: 11, color, fontWeight: 700, marginTop: 4 }}>{pct}%</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{
                  marginTop: 16, padding: '10px 14px', background: '#F8FAFC',
                  borderRadius: 10, fontSize: 13, color: '#475569', fontWeight: 600,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span>Jami aniqlangan hujayralar</span>
                  <span style={{ color: '#22819A', fontSize: 16, fontWeight: 900 }}>{totalCells} ta</span>
                </div>
              </div>

              {/* Bar diagramma — Hujayralar soni */}
              <div style={{
                background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', padding: '20px 22px',
              }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>
                  📊 Hujayralar taqsimoti
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }}
                      axisLine={false} tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={false} tickLine={false}
                    />
                    <Tooltip
                      formatter={(val) => [`${val} ta`, 'Soni']}
                      contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #E2E8F0' }}
                      cursor={{ fill: 'rgba(34,129,154,0.06)' }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={70}>
                      {chartData.map((entry, idx) => (
                        <Cell key={idx} fill={CV_COLORS[entry.name] || '#22819A'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {/* Y eksen izoh */}
                <div style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                  Hujayralar soni (ta)
                </div>
              </div>
            </div>
          )}

          {/* ── 3. AI KLASSIFIKATSIYA — to'liq kenglikda ─────── */}
          {aiResult && (
            <div style={{
              background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', padding: '20px 24px',
            }}>
              <div style={{
                fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Brain size={17} color="#22819A" /> AI Klassifikatsiya natijasi
                <span style={{
                  marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#64748B',
                  background: '#F1F5F9', padding: '3px 10px', borderRadius: 20,
                }}>
                  {aiResult.model}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>

                {/* Top natija kartochkasi */}
                <div>
                  <div style={{
                    padding: '20px 22px', borderRadius: 16,
                    background: aiResult.warning
                      ? 'linear-gradient(135deg, #7C3AED, #5B21B6)'
                      : 'linear-gradient(135deg, #22819A, #1a6478)',
                    color: 'white', marginBottom: 12,
                  }}>
                    <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 6 }}>
                      {aiResult.warning ? '⚠️ Diqqat — noodatiy hujayralar aniqlandi' : '✅ Asosiy natija'}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>
                      {aiResult.top_class}
                    </div>
                    <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1 }}>
                      {aiResult.top_percent}%
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.7, marginTop: 6 }}>ishonch darajasi</div>
                  </div>

                  {/* Normal ko'rsatkich */}
                  {(() => {
                    const match = aiResult.results.find(r => r.name === aiResult.top_class);
                    const norm  = match?.normal_range?.[gender];
                    return norm ? (
                      <div style={{
                        padding: '12px 16px', background: '#F8FAFC',
                        borderRadius: 12, fontSize: 13,
                      }}>
                        <div style={{ color: '#64748B', marginBottom: 3 }}>
                          📊 {GENDER_LABELS[gender]} normal ko'rsatkich:
                        </div>
                        <div style={{ fontWeight: 800, color: '#1E293B', fontSize: 15 }}>{norm}</div>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Barcha klasslar — progress bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {aiResult.results
                    .sort((a, b) => b.percent - a.percent)
                    .map((item, i) => {
                      const c     = CLASS_COLORS[item.name] || { color: '#22819A', icon: '•' };
                      const isTop = item.name === aiResult.top_class;
                      return (
                        <div key={i} style={{
                          padding: '12px 16px',
                          background: isTop ? `${c.color}10` : '#F8FAFC',
                          borderRadius: 12,
                          border: isTop ? `1.5px solid ${c.color}40` : '1px solid #F1F5F9',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <span style={{
                              fontSize: 13, fontWeight: isTop ? 800 : 500,
                              color: isTop ? c.color : '#475569',
                            }}>
                              {c.icon} {item.name}
                              {isTop && <span style={{
                                marginLeft: 8, fontSize: 10, background: c.color,
                                color: 'white', borderRadius: 10, padding: '1px 7px',
                              }}>TOP</span>}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: c.color }}>
                              {item.percent}%
                            </span>
                          </div>
                          <div style={{ height: 6, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{
                              width: `${item.percent}%`, height: '100%',
                              background: c.color, borderRadius: 4,
                              transition: 'width 0.7s ease',
                            }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
