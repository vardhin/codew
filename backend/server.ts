import WebSocket, { WebSocketServer } from 'ws';
import { createServer } from 'http';
import fs from 'fs/promises';
import path from 'path';

// Define a type for message
type Message = string;

// Create an HTTP server
const server = createServer();

// Create the WebSocket server and attach it to the HTTP server
const wss = new WebSocketServer({ server });

// Store the current text data
let textData: Message = '';

// Define the files directory
const FILES_DIR = path.join(__dirname, 'files');

// Ensure the files directory exists
fs.mkdir(FILES_DIR, { recursive: true }).catch(console.error);

// Handle new client connections
wss.on('connection', (ws: WebSocket) => {
  // Send the current text to the newly connected client
  ws.send(JSON.stringify({ type: 'TEXT_UPDATED', content: textData }));

  // Send the initial file list to the newly connected client
  sendFileList(ws);

  // Handle incoming messages from clients
  ws.on('message', async (message: string) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'UPDATE_TEXT':
        textData = data.content;
        broadcastToAll(JSON.stringify({ type: 'TEXT_UPDATED', content: textData }));
        break;
      case 'SAVE_FILE':
        await saveFile(data.filename, data.content);
        broadcastToAll(JSON.stringify({ type: 'FILE_SAVED', filename: data.filename }));
        broadcastFileList();
        break;
      case 'GET_FILES':
        sendFileList(ws);
        break;
      case 'LOAD_FILE':
        const fileContent = await loadFile(data.filename);
        ws.send(JSON.stringify({ type: 'FILE_LOADED', filename: data.filename, content: fileContent }));
        break;
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

async function saveFile(filename: string, content: string) {
  await fs.writeFile(path.join(FILES_DIR, filename), content, 'utf-8');
}

async function getFiles(): Promise<string[]> {
  return fs.readdir(FILES_DIR);
}

async function loadFile(filename: string): Promise<string> {
  return fs.readFile(path.join(FILES_DIR, filename), 'utf-8');
}

function broadcastToAll(message: string) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

async function sendFileList(ws: WebSocket) {
  const files = await getFiles();
  ws.send(JSON.stringify({ type: 'FILE_LIST', files }));
}

async function broadcastFileList() {
  const files = await getFiles();
  broadcastToAll(JSON.stringify({ type: 'FILE_LIST', files }));
}

// Start the server listening on all network interfaces
const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSocket server running on ws://0.0.0.0:${PORT}`);
});
