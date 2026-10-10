import React from 'react';

const Loader = ({ text = 'Loading experience...' }) => {
  return (
    <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
      <div className="loader-spinner"></div>
      <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontSize: '0.95rem' }}>{text}</p>
    </div>
  );
};

export default Loader;
