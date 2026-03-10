export interface ApiError extends Error {
  statusCode?: number;
  /** Affected appointments when provider deactivation is blocked (enables admin reassignment UI) */
  affectedAppointments?: unknown[];
}
