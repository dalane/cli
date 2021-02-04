import Listr from "listr";
import { AuthoriseTaskContext } from "./context";
import { prompt } from 'enquirer';
import { fetchClientCredentialsAccessToken, fetchJwks, fetchOpenIdConfig } from "../../../fetch";
import { OAuthTokenError } from "../../../common/auth/errors";
import { AccessTokenPayload, OAuthTokenResponse, RefreshTokenPayload } from "../../../common/auth/oauth";
import { IdentityTokenPayload } from "../../../common/auth/openid";
import { makeValidateEncodedTokenFn, makeValidateTokenFn } from "../../../common/auth/tokens";
import { convertSecondsToMilliseconds } from "../../../common/timestamp";

export type AuthoriseTaskRunner = (ctx: AuthoriseTaskContext) => Promise<AuthoriseTaskContext>;

export function createAuthoriseTaskRunner(): AuthoriseTaskRunner {

	// Run tasks...
	//	-	Client Credentials
	//		-	Get client ID from config or ask user
	//		-	Get client secret from command options or ask user
	// -	Authorisation Server Discovery
	//		-	retrieve Auth server configuration from .well-known path
	//		-	retrieve Json Web Key Set from URI found in auth server configuration
	// -	Authorise Client
	//		-	get tokens from token_endpoint URI found in auth server configuration
	//		-	validate tokens received from token endpoint using Json Web Key Set
	//			and auth server config
	const task = new Listr<AuthoriseTaskContext>([
		{
			title: 'Client Credentials',
			task: (ctx, task) => new Listr([
				{
					title: 'Client Id',
					skip: (ctx) => ctx.client_id !== undefined,
					task: async (ctx, task) => {
						ctx.client_id = await promptClientId();
					}
				},
				{
					title: 'Client Secret',
					skip: (ctx) => ctx.client_secret !== undefined,
					task: async (ctx, task) => {
						ctx.client_secret = await promptClientSecret();
					}
				}
			])
		},
		{
			title: 'Authorisation Server Discovery',
			task: (ctx, task) => {
				return new Listr([
						{
							title: `Retrieving OAuth / OIDC configuration`,
							task: async () => {
								const { oauth_wellknown_uri } = ctx;
								ctx.oauth_config = await fetchOpenIdConfig(oauth_wellknown_uri);
							}
						},
						{
							title: 'Retrieving Json WebKey set',
							task: async (ctx, task) => {
								if (ctx.oauth_config === undefined) {
									throw new Error('Unable to retrieve JSON web key set as that Authorisation Server config is missing');
								}
								const { jwks_uri } = ctx.oauth_config["openid-configuration"];
								if (jwks_uri === undefined) {
									throw new Error('Unable to retrieve Json Web Key Set as the jwks_uri is missing from the auth server');
								}
								const jwks = await fetchJwks(jwks_uri);
								ctx.jwks = jwks;
							}
						}
				]);
			},
		},
		{
			title: 'Authorising client',
			task: () => new Listr([
				{
					title: 'Requesting new tokens',
					task: async (ctx, task) => {
						const { oauth_config, client_id, client_secret } = ctx;
						if (oauth_config === undefined) {
							throw new Error('Unable to request tokens as the OAuth Configuration has not been received.');
						}
						const { token_endpoint } = oauth_config["openid-configuration"];
						if (token_endpoint === undefined) {
							throw Error('token endpoint is undefined. Unable to request tokens.')
						}
						if (client_id === undefined) {
							throw Error('Client Id is undefined. Unable to request tokens.')
						}
						if (client_secret === undefined) {
							throw Error('Client secret is undefined. Unable to request tokens.')
						}
						const fetchResult: OAuthTokenResponse | OAuthTokenError = await fetchClientCredentialsAccessToken(token_endpoint, client_id, client_secret);
						if (fetchResult instanceof OAuthTokenError) {
							throw fetchResult;
						}
						ctx.tokenResponse = fetchResult;
					}
				},
				{
					title: 'Verifying tokens',
					task: async (ctx, task) => {
						const { tokenResponse, oauth_config, jwks, client_id, audience } = ctx;
						if (tokenResponse === undefined) {
							throw Error('Unable to verify tokens as there was no token payload');
						}
						if (oauth_config === undefined) {
							throw new Error('Unable to request tokens as the OAuth Configuration has not been received.');
						}
						if (jwks === undefined) {
							throw new Error('Unable to verify tokens as the JSON Web Key Set has not been received.');
						}
						if (client_id === undefined) {
							throw new Error('Unable to verify tokens as the client_id is undefined');
						}
						const { token_type: tokenType, id_token: idToken, access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn, refresh_token_expires_in, id_token_expires_in } = tokenResponse;
						const { issuer, id_token_signing_alg_values_supported, token_endpoint_auth_signing_alg_values_supported } = oauth_config["openid-configuration"];

						const keys = jwks.keys;

						// the audience for an ID Token is the client
						const idTokenAudience = client_id;
						const idTokenAlgorithmsSupported = id_token_signing_alg_values_supported;

						const validateEncodedIdToken = makeValidateEncodedTokenFn(issuer)(idTokenAudience)(idTokenAlgorithmsSupported);
						const validateIdToken = makeValidateTokenFn(validateEncodedIdToken)(keys);

						const accessTokenAudiences = audience;
						const accessTokenAlgorithmsSupported = token_endpoint_auth_signing_alg_values_supported;

						const validateEncodedAccessToken = makeValidateEncodedTokenFn(issuer)(accessTokenAudiences)(accessTokenAlgorithmsSupported);
						const validateAccessToken = makeValidateTokenFn(validateEncodedAccessToken)(keys);

						const refreshTokenAudiences = audience;
						const refreshTokenAlgorithmsSupported = token_endpoint_auth_signing_alg_values_supported;

						const validateEncodedRefreshToken = makeValidateEncodedTokenFn(issuer)(refreshTokenAudiences)(refreshTokenAlgorithmsSupported);
						const validateRefreshToken = makeValidateTokenFn(validateEncodedRefreshToken)(keys);

						ctx.validatedTokens = {};

						const validatedAccessToken = await validateAccessToken<AccessTokenPayload>(accessToken);
						if (validatedAccessToken instanceof Error) {
							return validatedAccessToken;
						}

						// the token iat (issued at time) is in seconds and the token payload expires_in is also in seconds.
						// internally we will use milliseconds as it is easier to compare to the javascript date output...
						const accessTokenExpiresAt = convertSecondsToMilliseconds(validatedAccessToken.payload.iat + expiresIn);

						ctx.validatedTokens.access = {
							value: accessToken,
							expires_at: accessTokenExpiresAt
						}

						if (!!idToken) {
							const decodedIdToken = await validateIdToken<IdentityTokenPayload>(idToken);
							if (decodedIdToken instanceof Error) {
								return decodedIdToken;
							}
							const id_token_expires: number | undefined = convertSecondsToMilliseconds(id_token_expires_in!);
							ctx.validatedTokens.identity = {
								decoded: decodedIdToken.payload,
								value: idToken,
								expires_at: id_token_expires
							};
						}

						if (!!refreshToken) {
							const validatedRefreshToken = await validateRefreshToken<RefreshTokenPayload>(refreshToken);
							if (validatedRefreshToken instanceof Error) {
								return validatedRefreshToken;
							}
							const refresh_token_expires: number | undefined = convertSecondsToMilliseconds(refresh_token_expires_in!);
							ctx.validatedTokens.refresh = {
								value: refreshToken,
								expires_at: refresh_token_expires
							};
						}
					}
				}
			])
		}
	]);
	return async (ctx: AuthoriseTaskContext) => await task.run(ctx);
}

async function promptClientId(): Promise<string> {
	const { client_id } = await prompt<{ client_id: string }>({
		type: 'input',
		name: 'client_id',
		message: 'What is your API client ID?'
	});
	return client_id;
}

async function promptClientSecret(): Promise<string> {
	const { client_secret } = await prompt<{ client_secret: string }>({
		type: 'password',
		name: 'client_secret',
		message: 'What is your API client secret?'
	});
	return client_secret;
}
