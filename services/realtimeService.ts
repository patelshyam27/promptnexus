import supabase from './supabaseClient'

type SessionRow = {
  id?: string
  user_id: string
  device_id: string
  online: boolean
  last_seen?: string
}

/**
 * Start presence for a user+device.
 * - upserts a `sessions` row (user_id + device_id)
 * - starts a heartbeat to update `last_seen`
 * - subscribes to realtime changes for that user's sessions and calls `onChange`
 *
 * Returns a `stop()` function to teardown presence and subscription.
 */
export async function startPresence(
  userId: string,
  deviceId: string,
  onChange: (sessions: SessionRow[]) => void
) {
  const table = 'sessions'

  // upsert initial session row
  await supabase.from(table).upsert({ user_id: userId, device_id: deviceId, online: true, last_seen: new Date().toISOString() })

  // periodic heartbeat to keep last_seen fresh
  const heartbeat = setInterval(async () => {
    await supabase.from(table).update({ last_seen: new Date().toISOString(), online: true }).match({ user_id: userId, device_id: deviceId })
  }, 30_000)

  // helper to fetch current sessions for this user
  const fetchSessions = async (): Promise<SessionRow[]> => {
    const { data } = await supabase.from<SessionRow>(table).select('*').eq('user_id', userId)
    return (data as SessionRow[]) || []
  }

  // create a channel subscription filtered by user_id
  const channel = supabase
    .channel(`presence:${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` }, async () => {
      const sessions = await fetchSessions()
      onChange(sessions)
    })
    .subscribe()

  // initial callback with current state
  fetchSessions().then(onChange)

  const beforeUnload = async () => {
    clearInterval(heartbeat)
    await supabase.from(table).delete().match({ user_id: userId, device_id: deviceId })
  }

  // mark offline on page close
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', beforeUnload)
  }

  // tear down presence and subscription
  async function stop() {
    if (typeof window !== 'undefined') window.removeEventListener('beforeunload', beforeUnload)
    clearInterval(heartbeat)
    await supabase.from(table).delete().match({ user_id: userId, device_id: deviceId })
    try {
      await supabase.removeChannel(channel)
    } catch (e) {
      // ignore
    }
  }

  return { stop, fetchSessions }
}

export default startPresence
