import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Zap, Activity, Mountain, Trophy, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'react-router-dom';

/* ── Rule-based response engine ─────────────────────────────────────────── */
const getResponse = (input, user, score) => {
  const q = input.toLowerCase().trim();
  const name = user?.name?.split(' ')[0] || 'Athlete';
  const level = user?.fitnessLevel || 'Intermediate';

  // Greeting
  if (/^(hi|hello|hey|sup|yo)/.test(q)) {
    return `Hey ${name}! 👋 I'm your SMARTFIT AI coach. Ask me about workouts, adventures, or your fitness score. What's on your mind?`;
  }

  // Score queries
  if (/score|fitness score/.test(q)) {
    if (score === 0) return `You haven't taken a fitness assessment yet, ${name}. Head to the Assessment page to get your score — it unlocks adventure eligibility!`;
    return `Your current fitness score is **${score}/100** (${level} level). ${score >= 60 ? '✅ You qualify for most adventure categories!' : `You need ${60 - score} more points to unlock Advanced adventures. Keep training!`}`;
  }

  // Eligibility
  if (/eligible|qualify|ready for|can i do/.test(q)) {
    if (score === 0) return `Complete a fitness assessment first to check adventure eligibility. Your score determines which expeditions are safe for you.`;
    if (score >= 80) return `With a score of ${score}, you qualify for **Extreme** tier adventures like Ladakh Bike Rides, Snow Treks, and Rock Climbing! 🏔️`;
    if (score >= 60) return `Score ${score} qualifies you for **Advanced** adventures — trekking, kayaking, and most expedition types. Keep improving to unlock Extreme!`;
    if (score >= 40) return `Score ${score} is **Intermediate** level — you're eligible for Moderate adventures like rafting and day treks. Push your score above 60 for advanced expeditions.`;
    return `At score ${score}, you're in **Beginner** territory. Start with light yoga and cardio workouts, then retest in 4–6 weeks!`;
  }

  // Adventure recs
  if (/recommend|suggest|which adventure|what adventure/.test(q)) {
    if (score >= 80) return `For Elite athletes like you, I recommend: 🏔️ Ladakh Himalayan Bike Ride, 🧗 Red Rock Climbing (Moab), or 🎿 Spiti Snow Trek. These demand your full fitness capacity!`;
    if (score >= 60) return `Great options for your Advanced level: 🚣 Rishikesh Rafting, 🪂 Bir Billing Paragliding, or 🏕️ Rajasthan Desert Safari. All achievable with your current fitness!`;
    return `Start with: 🌊 Goa Surfing Day, 🧘 Nature Yoga Retreats, or 🚶 Easy Kodaikanal Trek. Build your score to unlock bigger expeditions!`;
  }

  // Workout recs
  if (/workout|exercise|train|improve score/.test(q)) {
    const plans = {
      Beginner: '30-min Zone 2 walk/jog 4x/week + bodyweight squats and push-ups. Focus on consistency!',
      Intermediate: '45-min interval runs 3x/week + strength circuit + Saturday long hike. Target: 60+ push-ups.',
      Advanced: 'Weekly long run 12km+, strength overload progressive sets, and 2 HIIT sessions. Add elevation training.',
      Elite: 'Periodized training: Speed/Power/Endurance cycles. Add altitude simulation and sport-specific cross-training.',
    };
    return `For ${level} athletes: ${plans[level] || plans.Intermediate}`;
  }

  // Safety
  if (/safe|safety|sos|emergency|danger/.test(q)) {
    return `SMARTFIT ADVENTURE has real-time GPS tracking, geofencing alerts, and a one-tap SOS system for all live events. Every expedition has a dedicated medical team and rescue protocols. Your safety is our #1 priority. 🛡️`;
  }

  // XP / Badges
  if (/xp|badge|level|reward|points/.test(q)) {
    return `You earn XP by completing workouts (+50 XP), finishing assessments (+150 XP), and completing adventures (+300 XP). Level up to unlock exclusive badges and certificates. Check your Engagement page! 🏆`;
  }

  // Weather
  if (/weather|rain|temperature|condition/.test(q)) {
    return `All SMARTFIT events have live weather monitoring with go/no-go criteria defined by organizers. If weather conditions are unsafe, events are automatically flagged. You'll get alerts 24h before departure.`;
  }

  // Nutrition
  if (/eat|food|diet|nutrition|calorie/.test(q)) {
    return `For adventure preparation: 🥩 Lean protein (1.6g/kg body weight), 🌾 Complex carbs for endurance fuel, 💧 3L water daily, and electrolytes on long days. Pre-event: carb-load 2 days before!`;
  }

  // Fallback
  const tips = [
    `Try asking: "Am I eligible for trekking?", "What workout should I do?", or "How do I improve my score?"`,
    `I can help with fitness advice, adventure eligibility, training plans, and safety info. What would you like to know?`,
    `Pro tip: Complete the Fitness Assessment to unlock personalised recommendations based on your actual scores!`,
  ];
  return tips[Math.floor(Math.random() * tips.length)];
};

/* ── Quick Actions ─────────────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: '🎯 My eligibility', query: 'Am I eligible for adventures?' },
  { label: '💪 Workout plan', query: 'What workout should I do?' },
  { label: '🏔️ Adventure recs', query: 'Which adventure do you recommend?' },
  { label: '📊 My score', query: 'What is my fitness score?' },
];

const AIAssistant = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: `Hi there! 👋 I'm SMARTFIT AI, your personal fitness & adventure coach. Ask me anything about training, eligibility, or expeditions!`,
    },
  ]);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const fitnessScore = user?.fitnessScore || 0;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typing]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const sendMessage = async (text) => {
    const query = text || input.trim();
    if (!query) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: query }]);
    setTyping(true);
    await new Promise(r => setTimeout(r, 600 + Math.random() * 600));
    const response = getResponse(query, user, fitnessScore);
    setMessages(prev => [...prev, { role: 'bot', text: response }]);
    setTyping(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Format bold **text**
  const formatText = (text) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? <strong key={i} style={{ color: 'var(--primary-emerald)' }}>{part}</strong> : part
    );
  };

  return (
    <>
      {/* ── FAB ────────────────────────────────────────────────────────── */}
      <button
        id="ai-assistant-fab"
        className="ai-fab"
        onClick={() => setOpen(o => !o)}
        title="SMARTFIT AI Assistant"
        aria-label="Open AI Assistant"
      >
        {open ? <X size={22} /> : <Bot size={24} />}
      </button>

      {/* ── Chat Window ───────────────────────────────────────────────── */}
      {open && (
        <div className="ai-chat-window">
          {/* Header */}
          <div className="ai-chat-header">
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--primary-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>SMARTFIT AI</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--primary-emerald)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary-emerald)', display: 'inline-block' }} />
                Online — Fitness &amp; Adventure Coach
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ marginLeft: 'auto', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          {/* Quick Actions */}
          <div style={{ padding: '0.6rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {QUICK_ACTIONS.map(({ label, query }) => (
              <button
                key={label}
                onClick={() => sendMessage(query)}
                style={{
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.15)',
                  color: 'var(--text-muted)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.25rem 0.65rem',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { e.target.style.color = 'var(--primary-emerald)'; e.target.style.borderColor = 'rgba(16,185,129,0.4)'; }}
                onMouseLeave={e => { e.target.style.color = 'var(--text-muted)'; e.target.style.borderColor = 'rgba(16,185,129,0.15)'; }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="ai-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`ai-msg ${msg.role}`}>
                {formatText(msg.text)}
              </div>
            ))}
            {typing && (
              <div className="ai-msg bot" style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '0.75rem 1rem' }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--primary-emerald)',
                    animation: 'pulse 1.2s infinite',
                    animationDelay: `${i * 0.2}s`,
                  }} />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="ai-input-row">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about fitness, adventures, eligibility..."
              style={{ fontSize: '0.85rem' }}
            />
            <button
              onClick={() => sendMessage()}
              className="btn-primary"
              style={{ padding: '0.6rem 0.9rem', borderRadius: 'var(--radius-sm)', minWidth: 'auto' }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
