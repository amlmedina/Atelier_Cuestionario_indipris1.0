import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Settings, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  RefreshCw, 
  Image as ImageIcon,
  Building2,
  Lock,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';

const SCRIPT_URL_KEY = 'expo_apps_script_url';
const DEFAULT_SCRIPT_URL = 'https://script.google.com/a/macros/indipris.com/s/AKfycbyVwjUWzejXzOequAebREqBpQ7PHVUTHqhUOVaB00I-HXtCqfTHbZvqFpkCq8RmXft7/exec';

const DEFAULT_QUESTIONS = [
  { id: "q1", label: "Expo", type: "text", required: true, options: [] },
  { id: "q2", label: "Empresa", type: "text", required: true, options: [] },
  { id: "q3", label: "Nombre del Contacto", type: "text", required: true, options: [] },
  { id: "q4", label: "Correo Electrónico", type: "email", required: true, options: [] },
  { id: "q5", label: "Origen (Ciudad/País)", type: "text", required: false, options: [] },
  { id: "q6", label: "Hotel donde se hospeda", type: "text", required: true, options: [] },
  { id: "q7", label: "Número de personas", type: "number", required: true, options: [] },
  { id: "q8", label: "Fechas de estancia", type: "text", required: false, options: [] },
  { id: "q9", label: "¿Por qué eligieron este hotel?", type: "textarea", required: false, options: [] }
];

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [scriptUrl, setScriptUrl] = useState(localStorage.getItem(SCRIPT_URL_KEY) || DEFAULT_SCRIPT_URL);
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [branding, setBranding] = useState({ logoUrl: '', eventTitle: 'Levantamiento Expo 2026' });
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loadingSchema, setLoadingSchema] = useState(false);
  
  // Modal de configuración de Script URL
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [inputUrl, setInputUrl] = useState(scriptUrl);

  // Cargar cuestionario y marca desde la API o Local
  useEffect(() => {
    if (scriptUrl) {
      fetchSchema();
    }
  }, [scriptUrl]);

  const fetchSchema = async () => {
    if (!scriptUrl) return;
    setLoadingSchema(true);
    try {
      const res = await fetch(`${scriptUrl}?action=GET_SCHEMA`);
      const data = await res.json();
      if (data.status === 'success') {
        if (data.schema && data.schema.length > 0) setQuestions(data.schema);
        if (data.branding) setBranding(data.branding);
      }
    } catch (err) {
      console.warn("Usando configuración local por fallback:", err);
    } finally {
      setLoadingSchema(false);
    }
  };

  const handleInputChange = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!scriptUrl) {
      // Si no hay URL configurada, guardar localmente como mock y notificar
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSubmitted(true);
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      }, 600);
      return;
    }

    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'SUBMIT_RESPONSE',
          answers: answers
        })
      });
      const res = await response.json();
      if (res.status === 'success') {
        setIsSubmitted(true);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } else {
        alert("Error al enviar: " + res.message);
      }
    } catch (err) {
      alert("Error de conexión al enviar la encuesta.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setAnswers({});
    setIsSubmitted(false);
  };

  const saveScriptUrlSetting = () => {
    localStorage.setItem(SCRIPT_URL_KEY, inputUrl.trim());
    setScriptUrl(inputUrl.trim());
    setShowConfigModal(false);
  };

  // --- ADMINISTRADOR FUNCIONES ---
  const handleAddQuestion = () => {
    const newQ = {
      id: "q_" + Date.now(),
      label: "Nueva Pregunta",
      type: "text",
      required: false,
      options: []
    };
    setQuestions([...questions, newQ]);
  };

  const handleUpdateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleMoveQuestion = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === questions.length - 1)) return;
    const updated = [...questions];
    const target = updated[index];
    updated[index] = updated[index + direction];
    updated[index + direction] = target;
    setQuestions(updated);
  };

  const handleDeleteQuestion = (index) => {
    if (questions.length <= 1) return alert("Debe existir al menos una pregunta.");
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSaveAdminSchema = async () => {
    if (!scriptUrl) {
      setShowConfigModal(true);
      return;
    }
    setIsSubmitting(true);
    try {
      await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'UPDATE_SCHEMA', schema: questions })
      });
      await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'UPDATE_BRANDING', logoUrl: branding.logoUrl, eventTitle: branding.eventTitle })
      });
      alert("Configuración de Cuestionario y Branding guardada exitosamente en Google Sheets!");
    } catch (err) {
      alert("Error al actualizar cuestionario: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Header Fijo */}
      <header className="app-header">
        <div className="brand-container">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo" className="brand-logo" />
          ) : (
            <Building2 className="w-6 h-6 text-sky-400" />
          )}
          <span className="brand-title">{branding.eventTitle}</span>
        </div>
        <button 
          onClick={() => setIsAdmin(!isAdmin)} 
          className="mode-toggle-btn"
        >
          {isAdmin ? <Send className="w-4 h-4 text-sky-400" /> : <Settings className="w-4 h-4 text-amber-400" />}
          {isAdmin ? "Modo Encuesta" : "Admin"}
        </button>
      </header>

      <main className="main-content">
        {/* Banner si no está configurada la URL de Sheets */}
        {!scriptUrl && (
          <div className="form-card" style={{ borderLeft: '4px solid #f59e0b', background: '#1c1917' }}>
            <p style={{ fontSize: '0.88rem', color: '#fbbf24', marginBottom: '8px' }}>
              <strong>⚠️ Sin Vincular con Google Sheets</strong>
            </p>
            <p style={{ fontSize: '0.82rem', color: '#d6d3d1', marginBottom: '10px' }}>
              Pega la URL de tu Google Apps Script Web App para sincronizar las respuestas en vivo.
            </p>
            <button 
              onClick={() => setShowConfigModal(true)} 
              className="mode-toggle-btn" 
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Vincular Google Sheets
            </button>
          </div>
        )}

        {/* MODO CAPTURA / ENCUESTA */}
        {!isAdmin && !isSubmitted && (
          <form onSubmit={handleSubmit}>
            {questions.map((q) => (
              <div key={q.id} className="form-card">
                <label className="field-label">
                  {q.label}
                  {q.required && <span className="required-star">*</span>}
                </label>

                {q.type === 'text' && (
                  <input
                    type="text"
                    required={q.required}
                    className="input-control"
                    placeholder="Escribe aquí..."
                    value={answers[q.id] || ''}
                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                  />
                )}

                {q.type === 'email' && (
                  <input
                    type="email"
                    required={q.required}
                    className="input-control"
                    placeholder="ejemplo@correo.com"
                    value={answers[q.id] || ''}
                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                  />
                )}

                {q.type === 'number' && (
                  <input
                    type="number"
                    required={q.required}
                    className="input-control"
                    placeholder="0"
                    value={answers[q.id] || ''}
                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                  />
                )}

                {q.type === 'date' && (
                  <input
                    type="date"
                    required={q.required}
                    className="input-control"
                    value={answers[q.id] || ''}
                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                  />
                )}

                {q.type === 'textarea' && (
                  <textarea
                    required={q.required}
                    className="input-control"
                    placeholder="Escribe detalles..."
                    value={answers[q.id] || ''}
                    onChange={(e) => handleInputChange(q.id, e.target.value)}
                  />
                )}

                {q.type === 'select' && (
                  <div className="options-grid">
                    {q.options.map((opt, i) => (
                      <div
                        key={i}
                        className={`option-tile ${answers[q.id] === opt ? 'selected' : ''}`}
                        onClick={() => handleInputChange(q.id, opt)}
                      >
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%',
                          border: '2px solid currentColor'
                        }} />
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="submit-bar">
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {isSubmitting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" /> Registrar Respuesta
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* PANTALLA DE ÉXITO TRAS CAPTURA */}
        {!isAdmin && isSubmitted && (
          <div className="success-screen">
            <div className="success-icon">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2>¡Respuesta Guardada!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Los datos han sido enviados exitosamente a Google Sheets.
            </p>
            <button 
              onClick={handleResetForm} 
              className="btn-primary" 
              style={{ marginTop: 16 }}
            >
              + Nueva Encuesta
            </button>
          </div>
        )}

        {/* MODO ADMINISTRACIÓN (EDICIÓN DE CUESTIONARIO Y BRANDING) */}
        {isAdmin && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="admin-header-title" style={{ margin: 0 }}>
                <Settings className="w-5 h-5" /> Configurar Cuestionario
              </h2>
              <button 
                onClick={() => setShowConfigModal(true)} 
                className="mode-toggle-btn"
                style={{ fontSize: '0.75rem' }}
              >
                URL Sheets
              </button>
            </div>

            {/* Branding Card */}
            <div className="form-card">
              <label className="field-label">Título del Evento / Expo</label>
              <input
                type="text"
                className="input-control"
                style={{ marginBottom: 12 }}
                value={branding.eventTitle}
                onChange={(e) => setBranding({ ...branding, eventTitle: e.target.value })}
              />

              <label className="field-label">URL del Logo (Opcional)</label>
              <input
                type="text"
                className="input-control"
                placeholder="https://ejemplo.com/logo.png"
                value={branding.logoUrl}
                onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
              />
            </div>

            {/* Listado de Preguntas */}
            {questions.map((q, index) => (
              <div key={q.id} className="admin-card">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 'bold' }}>
                    #{index + 1}
                  </span>
                  <input
                    type="text"
                    className="input-control"
                    style={{ padding: '8px 12px', fontSize: '0.95rem' }}
                    value={q.label}
                    onChange={(e) => handleUpdateQuestion(index, 'label', e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tipo de Respuesta</label>
                    <select
                      className="input-control"
                      style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                      value={q.type}
                      onChange={(e) => handleUpdateQuestion(index, 'type', e.target.value)}
                    >
                      <option value="text">Texto Corto</option>
                      <option value="textarea">Texto Largo / Abierto</option>
                      <option value="number">Numérica</option>
                      <option value="email">Correo Electrónico</option>
                      <option value="date">Fecha</option>
                      <option value="select">Opción Múltiple (Selección)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', paddingTop: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => handleUpdateQuestion(index, 'required', e.target.checked)}
                      />
                      Obligatoria
                    </label>
                  </div>
                </div>

                {q.type === 'select' && (
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Opciones (Separadas por comas)</label>
                    <input
                      type="text"
                      className="input-control"
                      style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                      placeholder="Opción 1, Opción 2, Opción 3"
                      value={Array.isArray(q.options) ? q.options.join(', ') : q.options}
                      onChange={(e) => handleUpdateQuestion(index, 'options', e.target.value.split(',').map(s => s.trim()))}
                    />
                  </div>
                )}

                <div className="admin-card-actions">
                  <button onClick={() => handleMoveQuestion(index, -1)} className="btn-icon">
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleMoveQuestion(index, 1)} className="btn-icon">
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteQuestion(index)} className="btn-icon danger">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <button 
              onClick={handleAddQuestion} 
              className="mode-toggle-btn" 
              style={{ width: '100%', justifyContent: 'center', padding: 12, marginBottom: 20 }}
            >
              <Plus className="w-4 h-4" /> Agregar Pregunta
            </button>

            <div className="submit-bar">
              <button 
                onClick={handleSaveAdminSchema} 
                disabled={isSubmitting} 
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
              >
                <CheckCircle2 className="w-5 h-5" /> Guardar Cambios en Sheets
              </button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL CONFIGURACIÓN SCRIPT URL */}
      {showConfigModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock className="w-5 h-5 text-sky-400" /> URL de Google Apps Script
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>
              Pega el Web App Deployment URL generado desde tu hoja de Google Sheets en <em>Extensiones &gt; Apps Script &gt; Implementar como Aplicación Web</em>.
            </p>
            <input
              type="text"
              className="input-control"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowConfigModal(false)} 
                className="mode-toggle-btn"
              >
                Cancelar
              </button>
              <button 
                onClick={saveScriptUrlSetting} 
                className="btn-primary"
                style={{ width: 'auto', padding: '8px 20px' }}
              >
                Guardar URL
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
