export class BookingError extends Error {
  constructor(
    readonly code:
      | 'INVALID_INPUT'
      | 'SERVICE_NOT_FOUND'
      | 'OUTSIDE_HOURS'
      | 'TIME_UNAVAILABLE'
      | 'PAYMENT_SETUP_FAILED'
      | 'NOT_FOUND'
      | 'INVALID_STATE',
    message: string,
    readonly httpStatus = 400,
  ) {
    super(message)
    this.name = 'BookingError'
  }
}
