# 🛡️ CipherChat

CipherChat is a browser-based **End-to-End Encrypted (E2EE)** real-time chat application built with **React**, **Node.js**, **Socket.IO**, and the **WebCrypto API**. Messages are encrypted **inside the browser** using **AES-256-GCM** before transmission. The server acts only as a relay and **never has access to plaintext messages, passwords, or encryption keys**.

---

## ✨ Features

- 🔒 End-to-End Encryption (AES-256-GCM)
- 🔑 PBKDF2 Key Derivation (100,000 Iterations)
- 🌐 Native WebCrypto API
- ⚡ Real-Time Messaging with Socket.IO
- 🏠 Self-Hosted LAN Support
- 🔐 HTTPS / WSS Secure Communication
- 📱 Responsive Modern UI

---

## 🛠 Tech Stack

| Frontend      | Backend            | Crypto                |
| ------------- | ------------------ | ---------------------- |
| React + Vite  | Node.js + Express  | WebCrypto API           |
| CSS           | Socket.IO          | AES-256-GCM + PBKDF2    |

---

## 📁 Project Structure

```text
encrypted-chat/
├── client/
│   └── src/
├── server/
│   └── server.js
├── README.md
└── .gitignore
```

---

## 🚀 Installation

Clone the repository:

```bash
git clone https://github.com/JEX01/CipherChat.git
cd CipherChat
```

Install and build the client:

```bash
cd client
npm install
npm run build
```

Install and start the server:

```bash
cd ../server
npm install
npm start
```

On first launch, the server automatically generates a local self-signed SSL certificate (`cert.pem`) and private key (`key.pem`) if they do not already exist.

---

## 🌐 LAN Access

Connect all devices to the same Wi-Fi network. Open the HTTPS address displayed in the terminal:

```
https://YOUR_LOCAL_IP:3001
```

Example:

```
https://192.168.1.10:3001
```

Accept the browser's self-signed certificate warning to continue.

---

## 💬 Demo

Use the same Room ID and Password on two devices.

Example:

```
Display Name: Alice
Room ID: 101
Password: cipherchat
```

A second user joins with the same credentials and can securely exchange messages.

If another user joins using an incorrect password, decryption fails and CipherChat displays:

```
Unable to decrypt message. Encryption key mismatch.
```

---

## 🔐 How It Works

1. User enters a display name, room ID, and password.
2. PBKDF2 derives a 256-bit AES key locally.
3. Messages are encrypted with AES-256-GCM.
4. The server relays only ciphertext and IV.
5. Recipients decrypt messages using their locally derived key.

---

## 🏗️ Architecture

```text
Browser A
   │  AES-256 Encrypt
   │  HTTPS / WSS
   ▼
Node.js Server (Ciphertext Only)
   │  HTTPS / WSS
   ▼
   │  AES-256 Decrypt
Browser B
```

---

## 👁️ Server Visibility

| Data       | Visible |
| ---------- | :-----: |
| Plaintext  |   ❌    |
| Password   |   ❌    |
| AES Key    |   ❌    |
| Ciphertext |   ✅    |
| IV         |   ✅    |
| Username   |   ✅    |
| Room ID    |   ✅    |

---

## ⚠️ Limitations

- Room ID is used as the PBKDF2 salt.
- No Forward Secrecy.
- No Digital Signatures.
- Designed for educational purposes.

---

## 🔮 Future Improvements

- Signal Protocol / Double Ratchet
- ECDH Key Exchange
- Encrypted File Sharing
- Persistent Encrypted Storage
- Voice & Video Support

---

## 📄 License

This project was developed for educational purposes to demonstrate client-side encryption using the WebCrypto API.
