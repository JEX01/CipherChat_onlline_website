import React, { useState, useMemo } from "react";
import SecurityBadge from "./SecurityBadge";

export default function JoinRoom({ onJoin }) {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);

  const passwordStrength = useMemo(() => {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1)
      return {
        label: "Weak",
        width: "20%",
        color: "#ff4d4d",
      };

    if (score <= 3)
      return {
        label: "Medium",
        width: "60%",
        color: "#ffb020",
      };

    return {
      label: "Strong",
      width: "100%",
      color: "#00ff88",
    };
  }, [password]);

  const handleSubmit = (e) => {
    e.preventDefault();

    setError("");

    if (!username.trim()) {
      setError("Please enter a display name.");
      return;
    }

    if (!roomId.trim()) {
      setError("Please enter a Room ID.");
      return;
    }

    if (!password) {
      setError("Please enter an encryption password.");
      return;
    }

    setJoining(true);

    setTimeout(() => {
      onJoin({
        username: username.trim(),
        roomId: roomId.trim().toLowerCase(),
        password,
      });
    }, 500);
  };

  return (
    <div className="join-container">

      <div className="join-card glass">

        <div className="join-content">

          <div className="join-left-column">

            {/* ==========================
                HERO
            =========================== */}

            <section className="hero-panel">

              <div className="join-header">

                <div className="logo-container">

            <div className="logo-circle">
              <span className="logo-icon">🛡️</span>
            </div>

            <div>

              <h1 className="logo-title">
                CipherChat
                <span className="version-tag">v2</span>
              </h1>

              <p className="subtitle">
                Secure Real-Time Communication Platform
              </p>

            </div>

          </div>

          <p className="hero-description">
            Browser-Based End-to-End Encryption using
            AES-256-GCM and PBKDF2.
          </p>

          <div className="tech-stack">

            <span className="tech-pill">AES-256-GCM</span>

            <span className="tech-pill">PBKDF2</span>

            <span className="tech-pill">HTTPS/WSS</span>

            <span className="tech-pill">WebCrypto</span>

            <span className="tech-pill">Self Hosted</span>

          </div>

              <div className="self-hosted-indicator">
                <span className="indicator-dot"></span>
                Organization-Controlled Secure Server
              </div>

              <SecurityBadge />

            </div>

            </section>

            {/* ==========================
                SESSION INFORMATION
            =========================== */}

            <section className="info-panel">

              <div className="privacy-specs">

          <div className="spec-title">
            🔒 SESSION INFORMATION
          </div>

          <div className="spec-row">
            <span className="spec-label">Deployment</span>
            <span className="spec-val">Self Hosted</span>
          </div>

          <div className="spec-row">
            <span className="spec-label">Encryption</span>
            <span className="spec-val">Client Side</span>
          </div>

          <div className="spec-row">
            <span className="spec-label">Algorithm</span>
            <span className="spec-val">AES-256-GCM</span>
          </div>

          <div className="spec-row">
            <span className="spec-label">Key Derivation</span>
            <span className="spec-val">PBKDF2</span>
          </div>

          <div className="spec-row">
            <span className="spec-label">Transport</span>
            <span className="spec-val">HTTPS / WSS</span>
          </div>

          <div className="spec-row">
            <span className="spec-label">Server Access</span>
            <span className="spec-val">Ciphertext Only</span>
          </div>

              </div>

            </section>

          </div>

          <div className="join-right-column">

            {/* ==========================
                  FORM
            =========================== */}

            <section className="form-panel">

              <form
                onSubmit={handleSubmit}
                className="join-form"
              >

                {error && (
                  <div className="error-alert">
                    {error}
                  </div>
                )}

                {/* Username */}

                <div className="input-group">

                  <label htmlFor="username">
                    👤 Display Name
                  </label>

                  <input
                    id="username"
                    type="text"
                    placeholder="e.g. Alice"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={20}
                    autoFocus
                  />

                </div>

          {/* Room */}

                <div className="input-group">

                  <label htmlFor="roomId">
                    🏠 Room ID
                  </label>

                  <input
                    id="roomId"
                    type="text"
                    placeholder="e.g. demo-room"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    maxLength={30}
                  />

                </div>

          {/* Password */}

                <div className="input-group">

                  <label htmlFor="password">
                    🔑 Encryption Password
                  </label>

                  <div className="password-input-wrapper">

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter secure room password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />

                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                    >
                      {showPassword ? "🙈" : "👁"}
                    </button>

                  </div>

                  {/* Password Strength */}

                  {password.length > 0 && (

                    <div className="password-strength">

                      <div className="strength-header">

                        <span>Password Strength</span>

                        <span
                          style={{
                            color: passwordStrength.color
                          }}
                        >
                          {passwordStrength.label}
                        </span>

                      </div>

                      <div className="strength-bar">

                        <div
                          className="strength-fill"
                          style={{
                            width: passwordStrength.width,
                            background: passwordStrength.color
                          }}
                        />

                      </div>

                    </div>

                  )}

                </div>

                {/* Join Button */}

                <button
                  type="submit"
                  className={`btn btn-primary btn-join ${joining ? "joining" : ""}`}
                  disabled={joining}
                >
                  {joining ? (
                    <>
                      <span className="loading-spinner"></span>
                      Joining Secure Room...
                    </>
                  ) : (
                    <>
                      🔒 Join Secure Room
                    </>
                  )}
                </button>

              </form>

            </section>

            {/* ==========================
                PRIVACY GUARANTEE
            =========================== */}

            <section className="privacy-panel">

              <div className="security-notice">

          <div className="notice-icon">
            🛡️
          </div>

          <div className="notice-content">

            <h3>Privacy Guarantee</h3>

            <ul className="notice-list">

              <li>
                ✅ Your encryption password never leaves this browser.
              </li>

              <li>
                ✅ Messages are encrypted before transmission.
              </li>

              <li>
                ✅ The server stores and relays ciphertext only.
              </li>

              <li>
                ✅ AES-256-GCM provides authenticated encryption.
              </li>

              <li>
                ✅ PBKDF2 derives your encryption key securely.
              </li>

            </ul>

          </div>

              </div>

            </section>

            {/* ==========================
                FOOTER
            =========================== */}

            <div className="join-footer">

          <span className="footer-pill">React</span>

          <span className="footer-pill">Socket.IO</span>

          <span className="footer-pill">WebCrypto API</span>

          <span className="footer-pill">Node.js</span>

          <span className="footer-pill">Express</span>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}