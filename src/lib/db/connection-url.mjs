export function getRuntimePostgresConnectionUrl(connectionString) {
  const url = new URL(connectionString)
  if (url.hostname.endsWith('.pooler.supabase.com') && url.port === '5432') {
    url.port = '6543'
    return { connectionString: url.toString(), switchedToTransactionPooler: true }
  }
  return { connectionString, switchedToTransactionPooler: false }
}
