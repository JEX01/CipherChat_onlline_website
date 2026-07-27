import React from 'react';

export default function Message({ message, isOwn }) {
  const { sender, plaintext, timestamp, isSystem, isDecrypted } = message;

  // Format timestamp into hh:mm
  const formatTime = (timeStr) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (isSystem) {
    return (
      <div className="message-system">
        <span className="system-text">{plaintext}</span>
      </div>
    );
  }

  return (
    <div className={`message-wrapper ${isOwn ? 'own' : 'other'}`}>
      {!isOwn && <span className="message-sender">{sender}</span>}
      <div className={`message-bubble ${!isDecrypted && !isSystem ? 'decryption-failed' : ''}`}>
        {!isDecrypted && !isSystem && (
          <div className="decryption-error-header">
            <span className="error-icon">⚠️</span>
            <span className="error-title">Decryption Error</span>
          </div>
        )}
        <p className="message-text">{plaintext}</p>
        <span className="message-time">{formatTime(timestamp)}</span>
      </div>
    </div>
  );
}
