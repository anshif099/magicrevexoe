import { randomUUID } from 'node:crypto'
import type { ErrorRequestHandler } from 'express'

const diagnosticCodes = new Set([
  'ER_BAD_FIELD_ERROR', 'ER_TABLEACCESS_DENIED_ERROR', 'ER_COLUMNACCESS_DENIED_ERROR',
  'ER_DBACCESS_DENIED_ERROR', 'ER_ACCESS_DENIED_ERROR', 'ER_PARSE_ERROR',
  'ER_WRONG_ARGUMENTS', 'ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT',
  'ER_QUERY_INTERRUPTED', 'PROTOCOL_CONNECTION_LOST', 'ECONNREFUSED', 'ETIMEDOUT',
])

export class HttpError extends Error {
  constructor(public readonly status: number, message: string) { super(message) }
}

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, next) => {
  if (response.headersSent) { next(error); return }
  if (error instanceof HttpError) {
    if ('code' in error && 'metric' in error && 'limit' in error && 'used' in error && 'remaining' in error && 'limitMode' in error) {
      const anonymous=_request.path.startsWith('/api/v1/public/')
      response.status(error.status).json({error:error.message,code:error.code,metric:error.metric,limit:anonymous?null:error.limit,used:anonymous?null:error.used,remaining:anonymous?null:error.remaining,limitMode:anonymous?'unavailable':error.limitMode});return
    }
    response.status(error.status).json({ error: error.message })
    return
  }
  // Parser errors get fixed public messages, never the raw body or error details.
  const status = typeof error === 'object' && error !== null && 'status' in error ? error.status : undefined
  if (status === 400 || status === 413 || status === 415) {
    response.status(status).json({ error: status === 413 ? 'Request body too large' : 'Invalid request body' })
    return
  }
  // Fixed allowlisted diagnostic only: mysql2 messages/sql can contain private
  // identifiers or submitted values. Never create/repair schema on a request.
  const code=typeof error==='object'&&error!==null&&'code' in error?error.code:undefined
  if(code==='ER_NO_SUCH_TABLE'){
    console.error('Database schema unavailable (ER_NO_SUCH_TABLE); verify the configured database and approved migration status. No automatic initialization was attempted.')
    response.set('Cache-Control','no-store').status(503).json({error:'Service setup is incomplete. Contact the administrator.',code:'APPLICATION_SCHEMA_UNAVAILABLE'})
    return
  }
  const reference = randomUUID()
  const failure = typeof code === 'string' && diagnosticCodes.has(code) ? code
    : error instanceof TypeError ? 'TypeError'
    : error instanceof RangeError ? 'RangeError' : 'UNCLASSIFIED'
  console.error('Unhandled request error', { reference, failure })
  response.set('Cache-Control','no-store').status(500).json({ error: 'Internal server error', reference })
}
