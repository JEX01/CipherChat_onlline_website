const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Server } = require('socket.io');
const cors = require('cors');
const selfsigned = require('selfsigned');

const app = express();
const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// Enable CORS for development Vite server only
if (isDev) {
  app.use(cors({
    origin: 'http://localhost:3000'
  }));
  console.log('[Dev Mode] CORS enabled for http://localhost:3000');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.send({ status: 'ok', message: 'CipherChat Self-Hosted Server is running' });
});

// Serve static React production build assets
app.use(express.static(path.join(__dirname, '../client/dist')));

// SPA fallback: Route all other requests to the React frontend index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Certificate Management for HTTPS
const keyPath = path.join(__dirname, 'key.pem');
const certPath = path.join(__dirname, 'cert.pem');
let credentials = {};

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('Loading existing SSL certificates...');
  credentials = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };
} else {
  console.log('SSL certificates not found. Generating self-signed certificates...');
  const attrs = [
    { name: 'commonName', value: 'localhost' },
    { name: 'countryName', value: 'US' },
    { name: 'stateOrProvinceName', value: 'California' },
    { name: 'localityName', value: 'San Francisco' },
    { name: 'organizationName', value: 'CipherChat Local' },
    { name: 'organizationalUnitName', value: 'Development' }
  ];
  
  // Generate certificate valid for 365 days
  const pems = selfsigned.generate(attrs, { days: 365, keySize: 2048 });
  
  fs.writeFileSync(keyPath, pems.private);
  fs.writeFileSync(certPath, pems.cert);
  console.log('New SSL certificates generated and saved locally.');
  
  credentials = {
    key: pems.private,
    cert: pems.cert
  };
}

// Create HTTPS server
const server = https.createServer(credentials, app);

// Socket.IO configuration (CORS enabled only for dev workspace)
const io = new Server(server, {
  cors: isDev ? {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  } : undefined
});

// Map of socket.id -> { username, roomId }
const users = new Map();

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Handle user joining a room
  socket.on('join-room', ({ roomId, username }) => {
    // Basic validation
    if (!roomId || !username || typeof roomId !== 'string' || typeof username !== 'string') {
      console.warn(`[Blocked Join] Invalid join parameters from socket: ${socket.id}`);
      return;
    }

    const trimmedRoomId = roomId.trim();
    const trimmedUsername = username.trim();

    if (!trimmedRoomId || !trimmedUsername) {
      console.warn(`[Blocked Join] Empty join parameters from socket: ${socket.id}`);
      return;
    }

    socket.join(trimmedRoomId);
    users.set(socket.id, { username: trimmedUsername, roomId: trimmedRoomId });

    console.log(`User ${trimmedUsername} joined room: ${trimmedRoomId}`);

    // Notify room that a user joined
    socket.to(trimmedRoomId).emit('user-joined', { username: trimmedUsername });

    // Send the updated user list to everyone in the room
    sendRoomUsers(trimmedRoomId);
  });

  // Handle encrypted message relay (Server Trust Fix)
  socket.on('encrypted-message', (payload) => {
    // 1. Authenticate sender using server-side in-memory socket state
    const user = users.get(socket.id);
    if (!user) {
      console.warn(`[Blocked Message] Message sent from unauthenticated socket: ${socket.id}`);
      return;
    }

    // 2. Validate payload is an object
    if (!payload || typeof payload !== 'object') {
      console.warn(`[Malformed Payload] Non-object payload received from ${user.username}`);
      return;
    }

    const { ciphertext, iv, messageId, timestamp } = payload;

    // 3. Ensure critical fields are strings to prevent server crashes
    if (
      typeof ciphertext !== 'string' ||
      typeof iv !== 'string' ||
      (messageId !== undefined && typeof messageId !== 'string') ||
      (timestamp !== undefined && typeof timestamp !== 'string')
    ) {
      console.warn(`[Malformed Payload] Invalid data types in message from ${user.username}`);
      return;
    }

    // 4. Derive correct roomId and sender from server-side user context (prevents spoofing)
    const roomId = user.roomId;
    const sender = user.username;

    // 5. Log the encrypted relay metadata (NEVER log plaintext)
    console.log('\n[Encrypted Relay]');
    console.log(`Room:       ${roomId}`);
    console.log(`Sender:     ${sender}`);
    const ciphertextPreview = ciphertext.substring(0, 16);
    console.log(`Ciphertext: ${ciphertextPreview}... [Length: ${ciphertext.length}]`);
    console.log(`IV:         ${iv}`);
    console.log('Plaintext:  [UNAVAILABLE - End-to-End Encrypted]\n');

    // 6. Build the secure payload using verified room/sender fields
    const securePayload = {
      roomId,
      sender,
      ciphertext,
      iv,
      messageId: messageId || `${socket.id}-${Date.now()}`,
      timestamp: timestamp || new Date().toISOString()
    };

    // 7. Relay ONLY to client's actual subscribed room
    io.to(roomId).emit('encrypted-message', securePayload);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      const { username, roomId } = user;
      console.log(`User ${username} disconnected from socket ${socket.id}`);
      users.delete(socket.id);

      // Notify other room users
      socket.to(roomId).emit('user-left', { username });

      // Send the updated user list
      sendRoomUsers(roomId);
    }
  });
});

// Helper function to broadcast all users in a room
function sendRoomUsers(roomId) {
  const roomUsers = [];
  users.forEach((value, key) => {
    if (value.roomId === roomId) {
      roomUsers.push({ id: key, username: value.username });
    }
  });
  io.to(roomId).emit('room-users', roomUsers);
}

// Function to collect host machine IPv4 address(es) for LAN accessibility display
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const interfaceName in interfaces) {
    for (const iface of interfaces[interfaceName]) {
      // Filter out IPv6 and loopback interfaces
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

const PORT = process.env.PORT || 3001;
// Listen on '0.0.0.0' to accept external network interface connections over HTTPS
server.listen(PORT, '0.0.0.0', () => {
  const localIps = getLocalIpAddresses();
  console.log(`\n==================================================`);
  console.log(`CipherChat Self-Hosted Secure Server (HTTPS)`);
  console.log(`==================================================`);
  console.log(`Local Access: https://localhost:${PORT}`);
  
  if (localIps.length > 0) {
    console.log(`LAN Access:`);
    localIps.forEach(ip => {
      console.log(`              https://${ip}:${PORT}`);
    });
  } else {
    console.log(`LAN Access:   [No active network interface detected]`);
  }
  console.log(`Port:         ${PORT}`);
  console.log(`Privacy Mode: Self-Hosted / No CipherChat Cloud Required`);
  console.log(`Secure Context: Enabled (Required for WebCrypto over LAN)`);
  console.log(`==================================================\n`);
});
