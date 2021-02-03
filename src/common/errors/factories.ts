import { DomainAttributeError, DomainBadRequestError, DomainInsufficientPermissionsError, DomainInternalServerError, DomainInvalidUserCredentialsError, DomainInvalidClientCredentialsError, DomainAuthenticationRequiredError, DomainNotFoundError, DomainPaymentError, DomainServiceRateLimitError, DomainConflictError, DomainTokenExpiredError, DomainInvalidTokenError, DomainInvalidSignatureError, DomainValidationError, DomainNotImplementedError, DomainUserNotRegisteredError, DomainAwaitingEmailVerificationError, DomainRelatedRecordMissing, DomainServiceUnavailableError, DomainMethodNotAllowedError } from "./errors";
import { ATTR_ERR_SOURCE } from "./constants";


export function createDomainBadRequestError(uri: string, detail: string, previous?: Error): DomainBadRequestError {
  return new DomainBadRequestError(uri, detail, previous);
}

export function createDomainMethodNotAllowedError(uri: string, detail: string, previous?: Error): DomainMethodNotAllowedError {
  return new DomainMethodNotAllowedError(uri, detail, previous);
}

export function createDomainInsufficientPermissionsError(uri: string, detail: string, previous?: Error): DomainInsufficientPermissionsError {
  return new DomainInsufficientPermissionsError(uri, detail, previous);
}

export function createDomainInternalServerError(uri: string, detail: string, previous?: Error): DomainInternalServerError {
  return new DomainInternalServerError(uri, detail, previous);
}

export function createDomainInvalidUserCredentialsError(uri: string, detail: string, previous?: Error): DomainInvalidUserCredentialsError {
  return new DomainInvalidUserCredentialsError(uri, detail, previous);
}

export function createDomainInvalidClientCredentialsError(uri: string, detail: string, previous?: Error): DomainInvalidClientCredentialsError {
  return new DomainInvalidClientCredentialsError(uri, detail, previous);
}

export function createDomainAuthenticationRequiredError(uri: string, detail: string, previous?: Error): DomainAuthenticationRequiredError {
  return new DomainAuthenticationRequiredError(uri, detail, previous);
}

export function createDomainNotFoundError(uri: string, detail: string, previous?: Error): DomainNotFoundError {
  return new DomainNotFoundError(uri, detail, previous);
}

export function createDomainPaymentError(uri: string, detail: string, previous?: Error): DomainPaymentError {
  return new DomainPaymentError(uri, detail, previous);
}

export function createDomainServiceRateLimitError(uri: string, detail: string, previous?: Error): DomainServiceRateLimitError {
  return new DomainServiceRateLimitError(uri, detail, previous);
}

export function createDomainConflictError(uri: string, detail: string, previous?: Error): DomainConflictError {
  return new DomainConflictError(uri, detail, previous);
}

export function createDomainTokenExpiredError(uri: string, detail: string, previous?: Error): DomainTokenExpiredError {
  return new DomainTokenExpiredError(uri, detail, previous);
}

export function createDomainInvalidTokenError(uri: string, detail: string, previous?: Error): DomainInvalidTokenError {
  return new DomainInvalidTokenError(uri, detail, previous);
}

export function createDomainInvalidSignatureError(uri: string, detail: string, previous?: Error): DomainInvalidSignatureError {
  return new DomainInvalidSignatureError(uri, detail, previous);
}

export function createDomainValidationError(uri: string, detail: string, attributeErrors: DomainAttributeError[], previous?: Error): DomainValidationError {
  return new DomainValidationError(uri, detail, attributeErrors, previous);
}

export function createDomainNotImplementedError(uri: string, detail: string, previous?: Error): DomainNotImplementedError {
  return new DomainNotImplementedError(uri, detail, previous);
}

export function createDomainUserNotRegisteredError(uri: string, detail: string, previous?: Error): DomainUserNotRegisteredError {
  return new DomainUserNotRegisteredError(uri, detail, previous);
}

export function createDomainAwaitingEmailVerificationError(uri: string, detail: string, previous?: Error): DomainAwaitingEmailVerificationError {
  return new DomainAwaitingEmailVerificationError(uri, detail, previous);
}

export function createDomainRelatedRecordMissingError(uri: string, detail: string, previous?: Error): DomainRelatedRecordMissing {
  return new DomainRelatedRecordMissing(uri, detail, previous);
}

export function createDomainServiceUnavailableError(uri: string, detail: string, previous?: Error): DomainServiceUnavailableError {
  return new DomainServiceUnavailableError(uri, detail, previous);
}

export function createDomainAttributeError(attribute: string, title: string, detail: string, code: string, source?: ATTR_ERR_SOURCE): DomainAttributeError {
  return new DomainAttributeError(attribute, title, detail, code, source);
}
