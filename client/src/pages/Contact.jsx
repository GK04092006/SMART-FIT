import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import API from '../services/api';

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Expedition Inquiry');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setStatusMessage('Please complete all required fields before sending your message.');
      return;
    }

    setSending(true);
    setStatusMessage('');

    try {
      const { data } = await API.post('/email/contact', {
        name,
        email,
        subject,
        message,
      });

      setSubmitted(true);
      setStatusMessage(data.message || 'Message sent successfully.');
      setTimeout(() => {
        setSubmitted(false);
        setStatusMessage('');
        setName('');
        setEmail('');
        setSubject('Expedition Inquiry');
        setMessage('');
      }, 5000);
    } catch (err) {
      setStatusMessage(err.response?.data?.message || 'Unable to send your message right now. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="main-content">
      <div className="container" style={{ padding: '3rem 1.5rem' }}>
        <div className="section-header">
          <span className="section-subtitle">Get in Touch</span>
          <h1 className="section-title">We are Here to Guide Your Journey</h1>
          <p className="section-desc">Have questions about expedition gear, custom group training, or booking logistics?</p>
        </div>

        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          {/* Contact Form */}
          <div className="glass-panel" style={{ padding: '2.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Send Us a Message</h3>

            {submitted ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--primary-emerald)' }}>
                <CheckCircle2 size={48} style={{ margin: '0 auto 1rem auto' }} />
                <h4>Message Transmitted!</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>An adventure specialist will respond within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: '600' }}>Your Name</label>
                  <input
                    type="text"
                    placeholder="Alex Hunter"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: '600' }}>Email Address</label>
                  <input
                    type="email"
                    placeholder="alex@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: '600' }}>Inquiry Topic</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="Expedition Inquiry">Expedition Inquiry</option>
                    <option value="Workout Program Question">Workout Program Question</option>
                    <option value="Private Custom Group Trip">Private Custom Group Trip</option>
                    <option value="General Support">General Support</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: '600' }}>Message</label>
                  <textarea
                    rows="4"
                    placeholder="Tell us about your fitness background and what trip you are interested in..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  ></textarea>
                </div>

                {statusMessage && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{statusMessage}</div>
                )}

                <button type="submit" className="btn-primary" style={{ justifyContent: 'center' }} disabled={sending}>
                  {sending ? 'Sending...' : <>Send Message <Send size={16} /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
