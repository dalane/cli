import { DomainError, DomainValidationError } from "./errors";
import { ERROR_CODES, ATTR_ERR_SOURCE } from "./constants";
import { createDomainUserNotRegisteredError, createDomainInvalidUserCredentialsError, createDomainInvalidClientCredentialsError, createDomainAuthenticationRequiredError, createDomainInsufficientPermissionsError, createDomainNotFoundError, createDomainPaymentError, createDomainServiceRateLimitError, createDomainServiceUnavailableError, createDomainConflictError, createDomainTokenExpiredError, createDomainInvalidTokenError, createDomainNotImplementedError, createDomainInternalServerError, createDomainInvalidSignatureError, createDomainRelatedRecordMissingError, createDomainAwaitingEmailVerificationError, createDomainAttributeError, createDomainBadRequestError } from "./factories";
import { HTTP_STATUS_CODES } from "../enums";

export function deserializeErrorObject(uri: string, errorObj: ErrorObject): DomainError {
  const { status, code, title, detail, source } = errorObj;
  switch (code) {
    case ERROR_CODES.EBADREQUEST: {
      return createDomainBadRequestError(uri, detail);
    }
    case ERROR_CODES.EUSERNOTREGISTERED: {
      return createDomainUserNotRegisteredError(uri, detail);
    }
    case ERROR_CODES.EINVALIDUSERCREDENTIALS: {
      return createDomainInvalidUserCredentialsError(uri, detail);
    }
    case ERROR_CODES.EINVALIDCLIENTCREDENTIALS: {
      return createDomainInvalidClientCredentialsError(uri, detail);
    }
    case ERROR_CODES.EAUTHENTICATIONREQUIRED: {
      return createDomainAuthenticationRequiredError(uri, detail);
    }
    case ERROR_CODES.EINSUFFICIENTPERMISSIONS: {
      return createDomainInsufficientPermissionsError(uri, detail);
    }
    case ERROR_CODES.ENOTFOUND: {
      return createDomainNotFoundError(uri, detail);
    }
    case ERROR_CODES.EPAYMENT: {
      return createDomainPaymentError(uri, detail);
    }
    case ERROR_CODES.ERATELIMITEXCEEDED: {
      return createDomainServiceRateLimitError(uri, detail);
    }
    case ERROR_CODES.ESERVICEUNAVAILABLE: {
      return createDomainServiceUnavailableError(uri, detail);
    }
    case ERROR_CODES.ECONFLICT: {
      return createDomainConflictError(uri, detail);
    }
    case ERROR_CODES.ETOKENEXPIRED: {
      return createDomainTokenExpiredError(uri, detail);
    }
    case ERROR_CODES.EINVALIDTOKEN: {
      return createDomainInvalidTokenError(uri, detail);
    }
    case ERROR_CODES.ENOTIMPLEMENTED: {
      return createDomainNotImplementedError(uri, detail);
    }
    case ERROR_CODES.EINTERNALSERVER: {
      return createDomainInternalServerError(uri, detail);
    }
    case ERROR_CODES.EINVALIDSIGNATURE: {
      return createDomainInvalidSignatureError(uri, detail);
    }
    case ERROR_CODES.ERELATEDREQUIRED: {
      return createDomainRelatedRecordMissingError(uri, detail);
    }
    case ERROR_CODES.EEMAILVERIFICATION: {
      return createDomainAwaitingEmailVerificationError(uri, detail);
    }
    default: {
      if (status === HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY) {
        const parsedAttribute = source?.pointer ?? source?.parameter;
        const parsedSource = !!source?.pointer ? ATTR_ERR_SOURCE.POINTER : ATTR_ERR_SOURCE.PARAMETER;
        return createDomainAttributeError(parsedAttribute!, title, detail, code ?? 'EATTRIBUTE', parsedSource);
      } else {
        return createDomainInternalServerError(uri, detail);
      }
    }
  }
}


export interface SerializedErrorPayload {
  errors: ErrorObject[];
}

export interface ErrorObject {
  status: HTTP_STATUS_CODES;
  code?: string;
  title: string;
  detail: string;
  source?: {
    pointer?: string;
    parameter?: string;
  };
  stack?: any;
}
