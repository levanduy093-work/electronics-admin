import { useEffect } from 'react'
import { getSocket } from '../api/socket'

type DbChangePayload = {
  collection?: string
  operationType?: string
  documentId?: string
  fullDocument?: any
}

/**
 * Subscribe to MongoDB change stream events that backend emits via socket `db_change`.
 * Collections are the raw Mongo collection names (e.g. 'products', 'orders', 'banners').
 */
export function useDbChange(collections: string[], onChange: (payload: DbChangePayload) => void) {
  useEffect(() => {
    if (!collections.length) return
    const socket = getSocket()
    const handler = (payload: DbChangePayload) => {
      if (payload?.collection && collections.includes(payload.collection)) {
        if (import.meta.env.DEV) {
          console.debug('[db_change]', payload.collection, payload.operationType, payload.documentId)
        }
        onChange(payload)
      }
    }
    socket.on('db_change', handler)
    return () => {
      socket.off('db_change', handler)
    }
  }, [collections, onChange])
}

