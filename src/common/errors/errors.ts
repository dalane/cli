import { HTTP_STATUS_CODES } from "../constants";
import { ERROR_CODES, ATTR_ERR_SOURCE } from "./constants";
import { createDomainInternalServerError } from "./factories";

export abstract class DomainError extends Error {
  name: string;
  constructor(readonly uri: string, readonly status: number, readonly title: string, readonly code: string, readonly detail: string, readonly previous?: Error) {
    super(detail);
    const { constructor } = Object.getPrototypeOf(this);
    this.name = constructor.name;
  }
}

export class DomainErrorCollection extends DomainError {
  errors: DomainError[];
  constructor(uri: string, errors: Error[], previous?: Error) {
    const mappedErrors = errors.map(error => error instanceof DomainError ? error : createDomainInternalServerError(uri, error.message))
    super(uri, mappedErrors[0].status, mappedErrors[0].title, mappedErrors[0].code, mappedErrors[0].detail, previous);
    this.errors = mappedErrors;
  }
}

export class DomainBadRequestError extends DomainError {
  constructor(uri: string, detail: string, previous?: Error) {
    super(uri, HTTP_STATUS_CODES.BAD_REQUEST, 'Bad Request', ERROR_CODES.EBADREQUEST, detail, previous);
  }
}

export class DomainMethodNotAllowedError extends DomainError {
  constructor(uri: string, detail: string, previous?: Error) {
    super(uri, HTTP_STATUS_CODES.METHOD, 'Method Not Allowed', ERROR_CODES.EMETHOD, detail, previous);
  }
}

// FORBIDDEN ERRORS

export class DomainAwaitingEmailVerificationError extends DomainError {
  constructor(uri: string, detail: string, previous?: Error) {
    super(uri, HTTP_STATUS_CODES.FORBIDDEN, 'Awaiting Email Verification', ERROR_CODES.EEMAILVERIFICATION, detail, previous);
  }
}

export class DomainInsufficientPermissionsError extends DomainError {
  constructor(uri: string, detail: string, previous?: Error) {
    super(uri, HTTP_STATUS_CODES.FORBIDDEN, 'Insufficient Permissions', ERROR_CODES.EINSUFFICIENTPERMISSIONS, detail, previous);
  }
}

// BAD REQUEST ERRORS

export class DomainRelatedRecordMissing extends DomainError {
  constructor(uri: string, detail: string, previous?: Error) {
    super(uri, HTTP_STATUS_CODES.BAD_REQUEST, 'Related Record Missing', ERROR_CODES.ERELATEDREQUIRED, detail, previous);
  }
}

export class DomainInternalServerError extends DomainError {
  constructor(uri: string, detail: string, previous?: Error) {
    super(uri, HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR, 'Internal Server Error', ERROR_CODES.EINTERNALSERVER, detail, previous);
  }
}

export class DomainInvalidUserCredentialsError extends DomainError {
  constructor(uri: string, detail: string, previous?: Error) {
    super(uri, HTTP_STATUS_CODES.UNAUTHORIZED, 'Invalid User Credentials', ERROR_CODES.EINVALIDUSERCREDENTIALS, detail, previous);
  }
}

export class DomainInvalidClientCredentialsError extends DomainError {
  constructor(uri: string, detail: string, previous?: Error) {
    super(uri, HTTP_STATUS_CODES.UNAUTHORIZED, 'Invalid Client Credentials', ERROR_CODES.EINVALIDCLIENTCREDENTIALS, detail, previous);
  }
}

export class DomainAuthenticationRequiredError extends DomainError {
  constructor(uri: string, detail: string, previous?: Error) {
    super(uri, HTTP_STATUS_CODES.UNAUTHORIZED, 'Authentication Required', ERROR_CODES.EAUTHENTICATIONREQUIRED, detail, previous);
  }
}

export class DomainTokenExpiredError extends DomainError {
  constructor(uri: string, detail: string, previous?: Error) {
    super(uri, HTTP_STATUS_CODES.UNAUTHORIZED, 'Token Expired', ERROR_CODES.ETOKENEXPIRED, detail, previous);
  }
}

export class DomainNotFoundError extends DomainError {
  constructor(uri: string, detail: string, previous?: Error) {
    super(uri, HTTP_STATUS_CODES.NOT_FOUND, 'Not Found', ERROR_CODES.ENOTFOUND, detail, previous);
  }
}

export class DomainPaymentError extends DomainError {
  constructor(uri: string, detail: string, previous?: Error) {
    super(uri, HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY, 'Payment Error', ERROR_CODES.EPAYMENT, detail, previous);
  }
}

export class DomainServiceRateLimitError extends DomainError {
  constructor(uri: string, detail: string, previous?: Error) {
    super(uri, HTTP_STATUS_CODES.TOO_MANY_REQUESTS, 'Rate Limit', ERROR_CODES.ERATELIMITEXCEEDED, detail, previous);
  }
}

export class DomainServiceUnavailableError extends DomainError {
  constructor(uri: string, detail: string, previous?: Error) {
    super(uri, HTTP_STATUS_CODES.SERVICE_UNAVAILABLE, 'Service Unavailable', ERROR_CODES.ESERVICEUNAVAILABLE, detail, previous);
  }
}

export class DomainConflictError extends DomainError {
  constructor(uri: string, detail: string, previous?: Error) {
    super(uri, HTTP_STATUS_CODES.CONFLICT, 'Conflict', ERROR_CODES.ECONFLICT, detail, previous);
  }
}

export class DomainInvalidTokenError extends DomainError {
  constructor(uri: string, detail: string, previous?: Error) {
    super(uri, HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY, 'Invalid Token', ERROR_CODES.EINVALIDTOKEN, detail, previous);
  }
}

export class DomainInvalidSignatureError extends DomainError {
  constructor(uri: string, detail: string, previous?: Error) {
    super(uri, HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY, 'Invalid Signature', ERROR_CODES.EINVALIDSIGNATURE, detail, previous);
  }
}

export class DomainValidationError extends DomainError {
  constructor(uri: string, detail: string, readonly attributeErrors: DomainAttributeError[] = [], previous?: Error) {
    super(uri, HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY, 'Validation', ERROR_CODES.EVALIDATION, detail, previous);
  }
}

export class DomainNotImplementedError extends DomainError {
  constructor(uri: string, detail: string, previous?: Error) {
    super(uri, HTTP_STATUS_CODES.NOT_IMPLEMENTED, 'Not Implemented', ERROR_CODES.ENOTIMPLEMENTED, detail, previous);
  }
}

export class DomainUserNotRegisteredError extends DomainError {
  constructor(uri: string, detail: string, previous?: Error) {
    super(uri, HTTP_STATUS_CODES.FORBIDDEN, 'User Not Registered', ERROR_CODES.EUSERNOTREGISTERED, detail, previous);
  }
}

export class DomainAttributeError extends DomainError {
  constructor(uri: string, readonly attribute: string, title: string, detail: string, code: string = 'EATTRIBUTE', readonly source?: ATTR_ERR_SOURCE) {
    super(uri, HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY, title, code, detail);
    const { constructor } = Object.getPrototypeOf(this);
    this.name = constructor.name;
  }
}
