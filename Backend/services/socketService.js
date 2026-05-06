let io = null;

export function initSocket(socketServer) {
  io = socketServer;
}

export function getIo() {
  return io;
}

export function emitToUser(userId, event, payload) {
  if (!io || !userId) {
    return;
  }
  io.to(`user:${userId}`).emit(event, payload);
}