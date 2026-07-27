import React, { useState, useEffect, useRef } from "react";
import UserList from "./UserList";
import Message from "./Message";
import SecurityBadge from "./SecurityBadge";

export default function ChatRoom({ roomId, username, users, messages, onSendMessage, onLeaveRoom }) {
  const [inputText, setInputText] = useState("");
  const [copied, setCopied] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {

    const timer = setInterval(() => {

        setSessionTime(prev => prev + 1);

    },1000);

    return () => clearInterval(timer);

  },[]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const formatTime = () => {

    const h = Math.floor(sessionTime / 3600);

    const m = Math.floor((sessionTime % 3600) / 60);

    const s = sessionTime % 60;

    if(h>0){

        return `${h}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;

    }

    return `${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;

  };

  return (
    <div className="chat-container glass">
      {/* Header */}
      <header className="chat-header">

    <div className="header-brand">

        <span className="brand-icon">🛡️</span>

        <div>

            <h2>CipherChat</h2>

            <span className="header-version">

                Secure Messaging Platform

            </span>

        </div>

    </div>

    <div className="header-center">

        <div className="header-card">

            <span className="header-title">

                Room

            </span>

            <span className="header-value">

                {roomId}

            </span>

        </div>

        <div className="header-card">

            <span className="header-title">

                Users

            </span>

            <span className="header-value">

                {users.length}

            </span>

        </div>

        <div className="header-card">

            <span className="header-title">

                Session

            </span>

            <span className="header-value">

                {formatTime()}

            </span>

        </div>

    </div>

    <div className="header-actions">

        <div className="connection-status">

            <span className="online-dot"></span>

            Connected

        </div>

        <button
            className="btn btn-secondary btn-copy"
            onClick={handleCopyRoomId}
        >

            {copied ? "Copied ✓" : "Copy Room"}

        </button>

        <SecurityBadge compact />

        <button
            onClick={onLeaveRoom}
            className="btn btn-danger btn-leave"
        >

            Leave

        </button>

      </div>

      </header>

      {/* Main chat layout */}
      <div className="chat-main">
        {/* Sidebar */}
        <UserList
            users={users}
            currentUsername={username}
        />

        {/* ===========================
            MESSAGE AREA
        =========================== */}

        <div className="message-area">
          <div className="messages-list">
            {messages.length === 0 ? (
              <div className="empty-chat-message">
                <span className="secure-icon">🛡️</span>
                <h3>Secure Room Established</h3>
                <p>This room is fully encrypted. Type a message below to start communicating securely.</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <Message 
                  key={msg.messageId || index} 
                  message={msg} 
                  isOwn={msg.sender === username} 
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form input */}
          <form onSubmit={handleSend} className="message-input-form">
            <input
              type="text"
              placeholder="Type your encrypted message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="message-input"
              maxLength={1000}
              required
            />
            <button type="submit" className="btn btn-primary btn-send">
              Send
            </button>
          </form>
            </div>

            {/* ===========================
                SECURITY DASHBOARD
            =========================== */}

            <aside className="security-dashboard glass">

                <h3 className="security-title">

                    🔒 Security Dashboard

                </h3>

                <div className="security-grid">

                    <div className="metric-card">

                        <span className="metric-label">

                            Algorithm

                        </span>

                        <span className="metric-value">

                            AES-256-GCM

                        </span>

                    </div>

                    <div className="metric-card">

                        <span className="metric-label">

                            Key Derivation

                        </span>

                        <span className="metric-value">

                            PBKDF2

                        </span>

                    </div>

                    <div className="metric-card">

                        <span className="metric-label">

                            Transport

                        </span>

                        <span className="metric-value">

                            HTTPS / WSS

                        </span>

                    </div>

                    <div className="metric-card">

                        <span className="metric-label">

                            Session

                        </span>

                        <span className="metric-value">

                            {formatTime()}

                        </span>

                    </div>

                    <div className="metric-card">

                        <span className="metric-label">

                            Online Users

                        </span>

                        <span className="metric-value">

                            {users.length}

                        </span>

                    </div>

                    <div className="metric-card">

                        <span className="metric-label">

                            Messages

                        </span>

                        <span className="metric-value">

                            {messages.length}

                        </span>

                    </div>

                    <div className="metric-card">

                        <span className="metric-label">

                            Encryption

                        </span>

                        <span className="metric-status success">

                            ACTIVE

                        </span>

                    </div>

                    <div className="metric-card">

                        <span className="metric-label">

                            Server Access

                        </span>

                        <span className="metric-status secure">

                            Ciphertext Only

                        </span>

                    </div>

                </div>

            </aside>

        </div>

      {/* Footer */}
      <footer className="chat-footer">
        <span className="footer-lock-icon">🔒</span>
        <p>Messages are encrypted in your browser using AES-256-GCM before transmission.</p>
      </footer>
    </div>
  );
}
