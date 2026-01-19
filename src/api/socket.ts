import { io, Socket } from 'socket.io-client'

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

let socket: Socket | null = null

export function getSocket() {
  if (!socket) {
    socket = io(apiBaseUrl, {
      // Cho phép cả polling và websocket để tránh lỗi proxy/chặn websocket
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
    })

    // Log nhẹ để debug khi kết nối lỗi (không spam UI)
    socket.on('connect_error', (err) => {
      console.warn('[socket] connect_error', err?.message || err)
    })
  }
  return socket
}


