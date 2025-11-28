import { Server } from 'socket.io';

let io: Server | null = null;

export function initializeWebSocket(server: any) {
  io = new Server(server, {
    path: '/api/socket',
    cors: { origin: '*' }
  });
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('subscribe:project', (projectId) => {
      socket.join(`project:${projectId}`);
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
  
  return io;
}

export function emitIndexingProgress(projectId: string, progress: any) {
  io?.to(`project:${projectId}`).emit('indexing:progress', progress);
}

export function emitTranscriptionStatus(meetingId: string, status: string) {
  io?.emit('transcription:status', { meetingId, status });
}
