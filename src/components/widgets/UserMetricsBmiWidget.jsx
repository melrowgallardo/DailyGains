import React, { useState, useEffect } from 'react';
import { Scale, CheckCircle } from '../icons';
import { audio } from '../../services/audioService';
import { api } from '../../services/apiService';

export default function UserMetricsBmiWidget({ 
  userMetrics: initialMetrics, 
  onSaveMetrics 
}) {
  const [unitMode, setUnitMode] = useState('metric');

  // Stored internally in metric (cm, kg)
  const [heightCm, setHeightCm] = useState(175);
  const [weightKg, setWeightKg] = useState(70);

  // Imperial inputs state
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(9);
  const [weightLbs, setWeightLbs] = useState(154.3);

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load initial metrics
  useEffect(() => {
    const init = async () => {
      let metrics = initialMetrics;
      if (!metrics || !metrics.height_cm) {
        metrics = await api.getUserMetrics();
      }
      if (metrics && metrics.height_cm && metrics.weight_kg) {
        const cm = parseFloat(metrics.height_cm) || 175;
        const kg = parseFloat(metrics.weight_kg) || 70;
        setHeightCm(cm);
        setWeightKg(kg);
        
        const totalInches = Math.round(cm / 2.54);
        setHeightFt(Math.floor(totalInches / 12));
        setHeightIn(totalInches % 12);
        setWeightLbs(Math.round(kg * 2.20462 * 10) / 10);

        if (metrics.updated_at) {
          setLastUpdated(metrics.updated_at);
        }
      }
    };
    init();
  }, [initialMetrics]);

  // Unit switch handlers
  const toggleUnitMode = (mode) => {
    audio.playClick();
    if (mode === 'imperial' && unitMode === 'metric') {
      const totalInches = Math.round(heightCm / 2.54);
      setHeightFt(Math.floor(totalInches / 12));
      setHeightIn(totalInches % 12);
      setWeightLbs(Math.round(weightKg * 2.20462 * 10) / 10);
      setUnitMode('imperial');
    } else if (mode === 'metric' && unitMode === 'imperial') {
      const cm = Math.round(((heightFt * 12) + Number(heightIn)) * 2.54);
      const kg = Math.round((weightLbs / 2.20462) * 10) / 10;
      setHeightCm(cm);
      setWeightKg(kg);
      setUnitMode('metric');
    }
  };

  const handleImperialHeightChange = (ft, inc) => {
    const feet = Math.max(1, Math.min(8, Number(ft) || 0));
    const inches = Math.max(0, Math.min(11, Number(inc) || 0));
    setHeightFt(feet);
    setHeightIn(inches);
    const cm = Math.round(((feet * 12) + inches) * 2.54);
    setHeightCm(cm);
  };

  const handleImperialWeightChange = (lbsVal) => {
    const lbs = Math.max(40, Math.min(1000, Number(lbsVal) || 0));
    setWeightLbs(lbs);
    const kg = Math.round((lbs / 2.20462) * 10) / 10;
    setWeightKg(kg);
  };

  // Real-time BMI: weight (kg) / [height (m)]^2
  const heightM = Math.max(0.5, heightCm / 100);
  const bmiValue = parseFloat((weightKg / (heightM * heightM)).toFixed(1));

  // Determine BMI status category
  const getBmiStatus = (bmi) => {
    if (bmi < 18.5) {
      return {
        label: 'Underweight',
        color: '#06b6d4',
        bgColor: 'rgba(6, 182, 212, 0.12)',
        borderColor: 'rgba(6, 182, 212, 0.3)'
      };
    } else if (bmi < 25.0) {
      return {
        label: 'Normal Weight',
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.12)',
        borderColor: 'rgba(16, 185, 129, 0.3)'
      };
    } else if (bmi < 30.0) {
      return {
        label: 'Overweight',
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.12)',
        borderColor: 'rgba(245, 158, 11, 0.3)'
      };
    } else {
      return {
        label: 'Obese',
        color: '#ef4444',
        bgColor: 'rgba(239, 68, 68, 0.12)',
        borderColor: 'rgba(239, 68, 68, 0.3)'
      };
    }
  };

  const status = getBmiStatus(bmiValue);

  // Position percentage on progress bar (range 15 to 38)
  const minScale = 15.0;
  const maxScale = 38.0;
  const progressPercent = Math.max(2, Math.min(98, ((bmiValue - minScale) / (maxScale - minScale)) * 100));

  // Ideal weight range
  const healthyMinKg = Math.round(18.5 * heightM * heightM * 10) / 10;
  const healthyMaxKg = Math.round(24.9 * heightM * heightM * 10) / 10;

  // Save metrics handler
  const handleSave = async () => {
    audio.playSuccess();
    setIsSaving(true);
    setSaveStatus(null);

    const payload = {
      height_cm: heightCm,
      weight_kg: weightKg,
      bmi_value: bmiValue,
      bmi_status: status.label
    };

    try {
      let result;
      if (onSaveMetrics) {
        result = await onSaveMetrics(payload);
      } else {
        result = await api.saveUserMetrics(payload);
      }
      setSaveStatus('success');
      setLastUpdated(result?.updated_at || new Date().toISOString());
    } catch {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 3500);
    }
  };

  return (
    <div className="cyber-panel" style={{ padding: '22px 24px' }}>
      {/* Header with Title & Unit Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'var(--accent-cyan-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-cyan)',
            flexShrink: 0
          }}>
            <Scale size={20} />
          </div>
          <div>
            <h3 style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              margin: 0
            }}>
              Body Metrics & BMI
            </h3>
            <p style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              margin: '2px 0 0'
            }}>
              Track your height, weight, and body mass index
            </p>
          </div>
        </div>

        {/* Clean Unit Mode Toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-input)',
          padding: '3px',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            onClick={() => toggleUnitMode('metric')}
            style={{
              padding: '5px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              background: unitMode === 'metric' ? 'var(--bg-card)' : 'transparent',
              color: unitMode === 'metric' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              boxShadow: unitMode === 'metric' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Metric (cm / kg)
          </button>
          <button
            type="button"
            onClick={() => toggleUnitMode('imperial')}
            style={{
              padding: '5px 12px',
              fontSize: '0.78rem',
              fontWeight: 600,
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              background: unitMode === 'imperial' ? 'var(--bg-card)' : 'transparent',
              color: unitMode === 'imperial' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              boxShadow: unitMode === 'imperial' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Imperial (ft / lbs)
          </button>
        </div>
      </div>

      {/* Main Content Grid: Inputs on Left, BMI Card on Right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        alignItems: 'center'
      }}>
        {/* Left: Input Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Height Input */}
          <div>
            <label style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              marginBottom: '6px'
            }}>
              <span>Height</span>
              <span style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem', fontWeight: 500 }}>
                {unitMode === 'metric' ? `${heightCm} cm` : `${heightFt}'${heightIn}" (${heightCm} cm)`}
              </span>
            </label>

            {unitMode === 'metric' ? (
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="50"
                  max="260"
                  step="0.5"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Math.max(40, Number(e.target.value) || 0))}
                  placeholder="e.g. 175"
                  className="cyber-input"
                  style={{ paddingRight: '45px' }}
                />
                <span style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '0.84rem',
                  color: 'var(--text-muted)',
                  fontWeight: 500
                }}>
                  cm
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="number"
                    min="2"
                    max="7"
                    value={heightFt}
                    onChange={(e) => handleImperialHeightChange(e.target.value, heightIn)}
                    className="cyber-input"
                    style={{ paddingRight: '32px' }}
                  />
                  <span style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)'
                  }}>
                    ft
                  </span>
                </div>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="number"
                    min="0"
                    max="11"
                    value={heightIn}
                    onChange={(e) => handleImperialHeightChange(heightFt, e.target.value)}
                    className="cyber-input"
                    style={{ paddingRight: '32px' }}
                  />
                  <span style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)'
                  }}>
                    in
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Weight Input */}
          <div>
            <label style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              marginBottom: '6px'
            }}>
              <span>Weight</span>
              <span style={{ color: 'var(--accent-blue)', fontSize: '0.8rem', fontWeight: 500 }}>
                {unitMode === 'metric' ? `${weightKg} kg` : `${weightLbs} lbs (${weightKg} kg)`}
              </span>
            </label>

            {unitMode === 'metric' ? (
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="20"
                  max="350"
                  step="0.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Math.max(10, Number(e.target.value) || 0))}
                  placeholder="e.g. 70"
                  className="cyber-input"
                  style={{ paddingRight: '45px' }}
                />
                <span style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '0.84rem',
                  color: 'var(--text-muted)',
                  fontWeight: 500
                }}>
                  kg
                </span>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="50"
                  max="800"
                  step="0.5"
                  value={weightLbs}
                  onChange={(e) => handleImperialWeightChange(e.target.value)}
                  className="cyber-input"
                  style={{ paddingRight: '45px' }}
                />
                <span style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '0.84rem',
                  color: 'var(--text-muted)',
                  fontWeight: 500
                }}>
                  lbs
                </span>
              </div>
            )}
          </div>

          {/* Simple "Save Metrics" Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="cyber-btn cyber-btn-cyan"
              style={{
                flex: 1,
                padding: '10px 18px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.88rem'
              }}
            >
              <span>{isSaving ? 'Saving...' : 'Save Metrics'}</span>
            </button>

            {saveStatus === 'success' && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#10b981',
                padding: '4px 10px',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.12)'
              }}>
                <CheckCircle size={14} />
                <span>Saved</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: BMI Result & Minimalist Progress Gauge */}
        <div style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Large, Legible BMI Result Text */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 500,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                BMI Result
              </span>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                color: status.color,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                marginTop: '4px'
              }}>
                {isNaN(bmiValue) ? '--' : bmiValue}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{
                display: 'inline-block',
                padding: '5px 12px',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: status.bgColor,
                color: status.color,
                border: `1px solid ${status.borderColor}`
              }}>
                {status.label}
              </span>
            </div>
          </div>

          {/* Minimalist Gauge / Progress Bar */}
          <div>
            {/* Color-coded segments */}
            <div style={{
              height: '8px',
              borderRadius: '9999px',
              overflow: 'hidden',
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ flex: '3.5', background: '#06b6d4' }} title="Underweight (< 18.5)" />
              <div style={{ flex: '6.5', background: '#10b981' }} title="Normal (18.5 - 24.9)" />
              <div style={{ flex: '5.0', background: '#f59e0b' }} title="Overweight (25.0 - 29.9)" />
              <div style={{ flex: '8.0', background: '#ef4444' }} title="Obese (≥ 30.0)" />
            </div>

            {/* Position Indicator Dot */}
            <div style={{
              position: 'relative',
              height: '14px',
              marginTop: '4px'
            }}>
              <div style={{
                position: 'absolute',
                left: `${progressPercent}%`,
                transform: 'translateX(-50%)',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: status.color,
                boxShadow: `0 0 0 3px var(--bg-card), 0 2px 6px ${status.color}`,
                transition: 'left 0.25s ease'
              }} />
            </div>

            {/* Scale legend */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginTop: '2px',
              fontWeight: 500
            }}>
              <span>&lt; 18.5 Under</span>
              <span>18.5 – 24.9 Normal</span>
              <span>25 – 29.9 Over</span>
              <span>30+ Obese</span>
            </div>
          </div>

          {/* Clean footnote */}
          <div style={{
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Healthy weight range:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
              {healthyMinKg} – {healthyMaxKg} kg
            </span>
          </div>

          {lastUpdated && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>
              Synced: {new Date(lastUpdated).toLocaleDateString()} {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
