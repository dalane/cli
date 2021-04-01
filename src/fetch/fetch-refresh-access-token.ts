import { OAuthTokenError, OAuthTokenErrorPayload, parseOAuthTokenErrorPayload } from "../common/auth/errors";
import { createRefreshCredentialsTokenRequest, OAuthTokenResponse } from "../common/auth/oauth";
import { HttpError, postUrlEncoded } from "../common/fetch";

export async function fetchRefreshCredentialsAccessToken(uri: string, refreshToken: string, clientId: string, clientSecret?: string): Promise<OAuthTokenResponse | OAuthTokenError> {
	const requestBody: URLSearchParams = createRefreshCredentialsTokenRequest(refreshToken, clientId, clientSecret);
	const response = await postUrlEncoded<OAuthTokenResponse, OAuthTokenErrorPayload>(uri, requestBody);
	if (response instanceof HttpError) {
		return parseOAuthTokenErrorPayload(response.status, response.body);
	}
	return response.body;
}
