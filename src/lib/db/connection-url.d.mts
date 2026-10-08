export function getRuntimePostgresConnectionUrl(connectionString: string): {
  connectionString: string
  switchedToTransactionPooler: boolean
}
