import { io, Socket } from 'socket.io-client'

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

let socket: Socket | null = null

export function getSocket() {
  const token = localStorage.getItem('token')
  const authPayload = token ? { token: `Bearer ${token}` } : undefined

  if (!socket) {
    socket = io(apiBaseUrl, {
      // Cho phép cả polling và websocket để tránh lỗi proxy/chặn websocket
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      auth: authPayload,
    })

    // Log nhẹ để debug khi kết nối lỗi (không spam UI)
    socket.on('connect_error', (err) => {
      console.warn('[socket] connect_error', err?.message || err)
    })
  }
  else {
    const currentToken = (socket.auth as { token?: string } | undefined)?.token
    const nextToken = authPayload?.token
    if (currentToken !== nextToken) {
      socket.auth = authPayload || {}
      socket.disconnect()
      socket.connect()
    }
  }
  return socket
}

