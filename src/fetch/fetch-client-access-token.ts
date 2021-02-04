import { OAuthTokenError, OAuthTokenErrorPayload, parseOAuthTokenErrorPayload } from "../common/auth/errors";
import { createClientCredentialsTokenRequest, OAuthTokenResponse } from "../common/auth/oauth";
import { HttpError, postUrlEncoded } from "../common/fetch";

export async function fetchClientCredentialsAccessToken(uri: string, clientId: string, clientSecret: string): Promise<OAuthTokenResponse | OAuthTokenError> {
	const requestBody: URLSearchParams = createClientCredentialsTokenRequest(clientId, clientSecret);
	const response = await postUrlEncoded<OAuthTokenResponse, OAuthTokenErrorPayload>(uri, requestBody);
	if (response instanceof HttpError) {
		return parseOAuthTokenErrorPayload(response.status, response.body);
	}
	return response.body;
}
