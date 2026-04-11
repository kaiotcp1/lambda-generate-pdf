export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "HttpError";
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON(): { error: string; details?: unknown } {
    return {
      error: this.message,
      ...(this.details !== undefined && { details: this.details }),
    };
  }

  static badRequest(message = "Bad Request", details?: unknown): HttpError {
    return new HttpError(400, message, details);
  }

  static unauthorized(message = "Unauthorized"): HttpError {
    return new HttpError(401, message);
  }

  static forbidden(message = "Forbidden"): HttpError {
    return new HttpError(403, message);
  }

  static notFound(message = "Not Found"): HttpError {
    return new HttpError(404, message);
  }

  static conflict(message = "Conflict"): HttpError {
    return new HttpError(409, message);
  }

  static unprocessableEntity(message = "Unprocessable Entity", details?: unknown): HttpError {
    return new HttpError(422, message, details);
  }

  static tooManyRequests(message = "Too Many Requests"): HttpError {
    return new HttpError(429, message);
  }

  static internal(message = "Internal Server Error"): HttpError {
    return new HttpError(500, message);
  }

  static serviceUnavailable(message = "Service Unavailable"): HttpError {
    return new HttpError(503, message);
  }
}
