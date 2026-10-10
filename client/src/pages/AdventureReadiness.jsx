import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck, AlertTriangle, ArrowRight, Dumbbell,
  RefreshCw, Compass, CheckCircle2, XCircle, ChevronLeft,
  Activity, Heart, Award, ArrowUpRight,
} from 'lucide-react';
import API from '../services/api';
import Breadcrumbs from '../components/Breadcrumbs';
import Loader from '../components/Loader';
import { useAuth } from '../hooks/useAuth';

const AdventureReadiness = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [readinessData, setReadinessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReadiness = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Pass notify=true so notification is safely dispatched for test flow
      const { data } = await API.get(`/readiness/${id}?notify=true`);
      setReadinessData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to calculate fitness readiness');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadiness();
  }, [id, isAuthenticated]);

  if (loading) {
    return (
      <div className="main-content" style={{ padding: '3rem 1.5rem' }}>
        <Loader text="Evaluating participant fitness score against expedition criteria..." />
      </div>
    );
  }

  if (error || !readinessData) {
    return (
      <div className="main-content" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '3rem', maxWidth: '500px', margin: '0 auto' }}>
          <AlertTriangle size={40} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h3>Readiness Evaluation Error</h3>
          <p style={{ color: 'var(--muted-text)', margin: '0.5rem 0 1.5rem 0' }}>{error}</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <Link to="/fitness/assessment" className="btn-primary">Take Assessment</Link>
            <Link to="/adventure" className="btn-secondary">Browse Adventures</Link>
          </div>
        </div>
      </div>
    );
  }

  const { isReady, readinessScore, checks, weakAreas = [], recommendedTraining = [], adventure, requirements, fitnessProfile } = readinessData;

  const handleContinueToRegistration = () => {
    navigate('/booking', { state: { item: adventure, itemType: 'Adventure' } });
  };

  return (
    <div className="main-content">
      <div className="container" style={{ padding: '2rem 1.5rem 4rem', maxWidth: '1000px' }}>
        <Breadcrumbs
          customCrumbs={[
            { label: 'Adventures', to: '/adventure' },
            { label: adventure?.title || 'Adventure', to: `/adventures/${adventure?.id || id}` },
            { label: 'Fitness Readiness', to: null },
          ]}
        />

        {/* Readiness Outcome Header */}
        <div
          className="glass-panel"
          style={{
            padding: '2.5rem',
            marginBottom: '2rem',
            borderRadius: 'var(--radius-lg)',
            border: isReady ? '2px solid rgba(16, 185, 129, 0.4)' : '2px solid rgba(239, 68, 68, 0.4)',
            background: isReady
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.08))'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(245, 158, 11, 0.08))',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: isReady ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isReady ? 'var(--primary)' : '#ef4444',
                  boxShadow: isReady ? '0 0 25px rgba(16,185,129,0.3)' : '0 0 25px rgba(239,68,68,0.3)',
                }}
              >
                {isReady ? <ShieldCheck size={38} /> : <AlertTriangle size={38} />}
              </div>
              <div>
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: isReady ? 'var(--primary)' : '#ef4444',
                  }}
                >
                  FITNESS READINESS EVALUATION
                </span>
                <h1 style={{ fontSize: '2rem', margin: '0.2rem 0 0.3rem 0', color: 'var(--text)' }}>
                  {isReady ? '✅ You are READY for this Adventure' : '❌ Currently NOT READY for this Adventure'}
                </h1>
                <p style={{ color: 'var(--muted-text)', margin: 0, fontSize: '0.95rem' }}>
                  Target: <strong>{adventure?.title}</strong> ({adventure?.difficulty} • {adventure?.location})
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted-text)', textTransform: 'uppercase', fontWeight: '700' }}>
                Readiness Match
              </span>
              <div style={{ fontSize: '2.5rem', fontWeight: '900', color: isReady ? 'var(--primary)' : '#ef4444' }}>
                {readinessScore}%
              </div>
            </div>
          </div>

          {/* Action Links based on READY / NOT READY (User Specification) */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {isReady ? (
              <>
                <button
                  type="button"
                  onClick={handleContinueToRegistration}
                  className="btn-primary"
                  style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  Continue to Registration <ArrowRight size={18} />
                </button>
                <Link to={`/adventures/${id}`} className="btn-secondary" style={{ padding: '0.75rem 1.25rem' }}>
                  View Adventure Details
                </Link>
                <Link to="/booking" className="btn-secondary" style={{ padding: '0.75rem 1.25rem' }}>
                  My Bookings
                </Link>
              </>
            ) : (
              <>
                <a href="#weak-areas" className="btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
                  View Weak Areas
                </a>
                <Link to="/fitness" className="btn-secondary" style={{ padding: '0.75rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Dumbbell size={16} /> Start Training Plan
                </Link>
                <Link to="/fitness/assessment" className="btn-secondary" style={{ padding: '0.75rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <RefreshCw size={16} /> Retake Assessment
                </Link>
                <Link to="/adventure" className="btn-secondary" style={{ padding: '0.75rem 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Compass size={16} /> Explore Easier Adventures
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Requirements Comparison Grid */}
        <div className="grid-2" style={{ marginBottom: '2rem' }}>
          {/* Detailed Metric Checks */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--text)' }}>
              Expedition Criteria Breakdown
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {[
                { label: 'Overall Composite Score', userVal: fitnessProfile?.assessmentScore || 0, reqVal: requirements?.requiredFitnessScore || 60, pass: checks?.overallFitness },
                { label: 'Endurance Capacity', userVal: fitnessProfile?.endurance || 0, reqVal: requirements?.requiredEndurance || 50, pass: checks?.endurance },
                { label: 'Strength Output', userVal: fitnessProfile?.strength || 0, reqVal: requirements?.requiredStrength || 50, pass: checks?.strength },
                { label: 'Stamina / Cardio', userVal: fitnessProfile?.stamina || 0, reqVal: requirements?.requiredStamina || 50, pass: checks?.stamina },
                { label: 'Flexibility Range', userVal: fitnessProfile?.flexibility || 0, reqVal: requirements?.requiredFlexibility || 50, pass: checks?.flexibility },
                { label: 'Minimum Age', userVal: `${user?.age || 20} Yrs`, reqVal: `${requirements?.minimumAge || 18}+ Yrs`, pass: checks?.age },
              ].map((row, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.75rem',
                    borderRadius: '8px',
                    background: row.pass ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.06)',
                    border: row.pass ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(239, 68, 68, 0.2)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {row.pass ? <CheckCircle2 size={16} color="var(--primary)" /> : <XCircle size={16} color="#ef4444" />}
                    <span style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text)' }}>{row.label}</span>
                  </div>
                  <div style={{ fontSize: '0.84rem' }}>
                    <span style={{ color: 'var(--muted-text)', marginRight: '0.5rem' }}>Req: {row.reqVal}</span>
                    <strong style={{ color: row.pass ? 'var(--primary)' : '#ef4444' }}>You: {row.userVal}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weak Areas & Tailored Recommendations */}
          <div id="weak-areas" className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--text)' }}>
              {isReady ? 'Preparation Suggestions' : 'Weak Areas & Training Plan'}
            </h3>

            {weakAreas.length > 0 ? (
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Areas Requiring Improvement
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                  {weakAreas.map((area, idx) => (
                    <span key={idx} className="badge badge-magenta" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}>
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '1.5rem' }}>
                <span className="badge badge-emerald" style={{ fontSize: '0.8rem' }}>
                  All requirements met or exceeded ✓
                </span>
              </div>
            )}

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Recommended Conditioning Workouts
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
                {recommendedTraining.map((rec, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                  >
                    <span style={{ fontSize: '0.86rem', color: 'var(--text)' }}>• {rec}</span>
                    <Link to="/fitness" style={{ color: 'var(--primary)', fontSize: '0.78rem', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      Start <ArrowUpRight size={13} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdventureReadiness;
