import { HTTP_STATUS_CODES } from "../enums";
import { GRANT_ERRORS } from "./constants";

export class OAuthTokenError extends Error {
  constructor(readonly status: HTTP_STATUS_CODES, readonly error: GRANT_ERRORS, readonly error_description?: string, readonly error_uri?: string) {
		super(`${error_description}`);
		this.name = `${status} ${error}`
  }
}

export interface OAuthTokenErrorPayload {
	error: GRANT_ERRORS;
	error_description?: string;
	error_uri?: string;
}

export function parseOAuthTokenErrorPayload(statusCode: HTTP_STATUS_CODES, responseBody: OAuthTokenErrorPayload): OAuthTokenError {
	const { error, error_description, error_uri } = responseBody;
	return new OAuthTokenError(statusCode, error, error_description, error_uri)
}
