export {
	DomainError,
	DomainErrorCollection,
	DomainAttributeError,
	DomainBadRequestError,
	DomainInsufficientPermissionsError,
	DomainInternalServerError,
	DomainInvalidUserCredentialsError,
	DomainInvalidClientCredentialsError,
	DomainAuthenticationRequiredError,
	DomainNotFoundError,
	DomainPaymentError,
	DomainServiceRateLimitError,
	DomainConflictError,
	DomainTokenExpiredError,
	DomainInvalidTokenError,
	DomainInvalidSignatureError,
	DomainValidationError,
	DomainNotImplementedError,
	DomainUserNotRegisteredError,
	DomainAwaitingEmailVerificationError,
	DomainRelatedRecordMissing,
	DomainServiceUnavailableError
} from "./errors";

export {
	createDomainUserNotRegisteredError,
	createDomainInvalidUserCredentialsError,
	createDomainInvalidClientCredentialsError,
	createDomainAuthenticationRequiredError,
	createDomainInsufficientPermissionsError,
	createDomainNotFoundError,
	createDomainPaymentError,
	createDomainServiceRateLimitError,
	createDomainServiceUnavailableError,
	createDomainConflictError,
	createDomainTokenExpiredError,
	createDomainInvalidTokenError,
	createDomainNotImplementedError,
	createDomainInternalServerError,
	createDomainInvalidSignatureError,
	createDomainRelatedRecordMissingError,
	createDomainAwaitingEmailVerificationError,
	createDomainAttributeError,
	createDomainValidationError,
	createDomainBadRequestError,
} from "./factories";

export {
	ErrorObject,
	SerializedErrorPayload,
	deserializeErrorObject,
} from "./parsers";

export {
	ERROR_CODES,
	ATTR_ERR_SOURCE
} from "./constants";
