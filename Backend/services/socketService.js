let io = null;

function initSocket(socketServer) {
  io = socketServer;
}

function getIo() {
  return io;
}

function emitToUser(userId, event, payload) {
  if (!io || !userId) {
    return;
  }

  io.to(`user:${userId}`).emit(event, payload);
}

module.exports = { initSocket, getIo, emitToUser };
