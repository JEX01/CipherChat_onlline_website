import React, { useState, useEffect } from 'react';
import JoinRoom from './components/JoinRoom';
import ChatRoom from './components/ChatRoom';
import { socket } from './socket/socket';
import { deriveKey, encryptMessage, decryptMessage } from './crypto/crypto';

export default function App() {
  const [joined, setJoined] = useState(false);
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [cryptoKey, setCryptoKey] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');

  // Handle joining a room: derives the key and establishes socket connection
  const handleJoin = async ({ username, roomId, password }) => {
    try {
      setError('');
      // 1. Derive the 256-bit AES-GCM key client-side (Never sent to the server)
      const key = await deriveKey(password, roomId);
      
      setUsername(username);
      setRoomId(roomId);
      setPassword(password);
      setCryptoKey(key);
      setJoined(true);
    } catch (err) {
      console.error('Failed to join room:', err);
      setError('Key derivation failed. Please check your browser settings.');
    }
  };

  // Socket listener setup
  useEffect(() => {
    if (!joined || !cryptoKey) return;

    // Connect to Socket.IO server
    socket.connect();

    // Join the specific room with only display name and room ID (password is NOT sent)
    socket.emit('join-room', { roomId, username });

    // Handle online user updates
    socket.on('room-users', (usersList) => {
      setUsers(usersList);
    });

    // Handle system message for user joining
    socket.on('user-joined', ({ username: joinedUser }) => {
      setMessages((prev) => [
        ...prev,
        {
          plaintext: `${joinedUser} joined the secure room.`,
          isSystem: true,
          timestamp: new Date().toISOString()
        }
      ]);
    });

    // Handle system message for user leaving
    socket.on('user-left', ({ username: leftUser }) => {
      setMessages((prev) => [
        ...prev,
        {
          plaintext: `${leftUser} left the room.`,
          isSystem: true,
          timestamp: new Date().toISOString()
        }
      ]);
    });

    // Handle incoming encrypted messages
    socket.on('encrypted-message', async (payload) => {
      let decodedPlaintext = '';
      let isDecrypted = false;

      try {
        // Decrypt the ciphertext in the browser using the client-side key
        decodedPlaintext = await decryptMessage(payload.ciphertext, payload.iv, cryptoKey);
        isDecrypted = true;
      } catch (err) {
        // Graceful error display if key derivation/decryption fails
        decodedPlaintext = 'Unable to decrypt message — encryption key mismatch.';
        isDecrypted = false;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: payload.sender,
          plaintext: decodedPlaintext,
          timestamp: payload.timestamp,
          messageId: payload.messageId,
          isSystem: false,
          isDecrypted
        }
      ]);
    });

    // Cleanup listeners and connection when leaving room
    return () => {
      socket.off('room-users');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('encrypted-message');
      socket.disconnect();
    };
  }, [joined, cryptoKey, roomId, username]);

  const handleSendMessage = async (text) => {
    if (!cryptoKey) return;

    try {
      // 1. Encrypt message locally using client-side CryptoKey
      const { ciphertext, iv } = await encryptMessage(text, cryptoKey);

      // 2. Transmit only metadata, ciphertext, and IV to the server (No plaintext!)
      const messagePayload = {
        roomId,
        sender: username,
        ciphertext,
        iv,
        messageId: `${socket.id || 'client'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      };

      socket.emit('encrypted-message', messagePayload);
    } catch (err) {
      console.error('Encryption failed:', err);
      // Append a local error message to the thread
      setMessages((prev) => [
        ...prev,
        {
          plaintext: 'Error: Failed to encrypt and send your message.',
          isSystem: true,
          timestamp: new Date().toISOString()
        }
      ]);
    }
  };

  const handleLeaveRoom = () => {
    setJoined(false);
    setUsername('');
    setRoomId('');
    setPassword('');
    setCryptoKey(null);
    setUsers([]);
    setMessages([]);
  };

  return (
    <div className="app-viewport">
      {error && <div className="global-error">{error}</div>}
      {!joined ? (
        <JoinRoom onJoin={handleJoin} />
      ) : (
        <ChatRoom
          roomId={roomId}
          username={username}
          users={users}
          messages={messages}
          onSendMessage={handleSendMessage}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </div>
  );
}
