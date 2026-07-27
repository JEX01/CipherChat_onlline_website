import React from 'react';

export default function SecurityBadge({ compact = false }) {
  return (
    <div className={`security-badge ${compact ? 'compact' : ''}`}>
      <span className="badge-icon">🔒</span>
      <span className="badge-text">
        {compact ? 'E2EE Active' : 'Client-Side Encryption Active'}
      </span>
      <span className="badge-pill">AES-256-GCM</span>
    </div>
  );
}
