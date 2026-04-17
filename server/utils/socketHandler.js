/**
 * Socket.io event handlers for real-time communication
 */

let io = null;

function initSocket(socketIo) {
  io = socketIo;

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('join-dashboard', () => {
      socket.join('dashboard');
      console.log(`📊 ${socket.id} joined dashboard room`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
}

/**
 * Broadcast new sensor data to all dashboard clients
 * @param {Object} data - Sensor reading data
 */
function broadcastSensorData(data) {
  if (io) {
    io.to('dashboard').emit('sensor-data', data);
  }
}

/**
 * Broadcast an alert to all connected clients
 * @param {Object} alert - Alert data
 */
function broadcastAlert(alert) {
  if (io) {
    io.emit('new-alert', alert);
  }
}

/**
 * Broadcast cylinder status update
 * @param {Object} cylinder - Updated cylinder data
 */
function broadcastCylinderUpdate(cylinder) {
  if (io) {
    io.emit('cylinder-update', cylinder);
  }
}

module.exports = {
  initSocket,
  broadcastSensorData,
  broadcastAlert,
  broadcastCylinderUpdate,
};
