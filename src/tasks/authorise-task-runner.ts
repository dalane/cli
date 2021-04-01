/**
 * Authorises a client by obtaining tokens from the auth server using client
 * credentials and saving them for future requests.
 *
 * Two tokens are received: access and refresh. The access token is used for
 * each request. The refresh token is used to obtain a new access token if it
 * has expired.
 *
 * If the client record included "openid" in its scope list then an ID token
 * will also be received. This provides information on the user that is linked
 * to the client.
 */
import Listr, { ListrContext } from "listr";
import { prompt } from 'enquirer';
import { fetchClientCredentialsAccessToken, fetchJwks, fetchOpenIdConfig } from "../fetch";
import { OAuthTokenError } from "../common/auth/errors";
import { AccessTokenPayload, OAuthTokenResponse, RefreshTokenPayload } from "../common/auth/oauth";
import { IdentityTokenPayload, OpenIdConfiguration } from "../common/auth/openid";
import { makeValidateEncodedTokenFn, makeValidateTokenFn } from "../common/auth/tokens";
import { convertSecondsToMilliseconds } from "../common/timestamp";
import { JsonWebKeySet } from "../common/auth/keys";
import { Client, TokenState } from "../config";
import { HttpError, postJson } from "../common/fetch";
import { hostname } from "os";

export interface AuthoriseTaskContext extends ListrContext {
	user?: string;
	password?: string;
	oauth_wellknown_uri: string;
	jwks_uri?: string;
	audience: string[];
	client: Client | null;
	oauth_config?: OpenIdConfiguration;
	jwks?: JsonWebKeySet;
	tokenResponse?: OAuthTokenResponse;
	validatedTokens?: TokenState
}

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
			title: 'Authorisation Server Discovery',
			task: (ctx: AuthoriseTaskContext, task) => {
				return new Listr([
						{
							title: `Retrieving OAuth / OIDC configuration`,
							task: async (ctx: AuthoriseTaskContext) => {
								const { oauth_wellknown_uri } = ctx;
								ctx.oauth_config = await fetchOpenIdConfig(oauth_wellknown_uri);
							}
						},
						{
							title: 'Retrieving Json WebKey set',
							task: async (ctx: AuthoriseTaskContext) => {
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
			title: 'Dynamic Client Registration',
			skip: (ctx: AuthoriseTaskContext) => ctx.client !== null,
			task: async (ctx: AuthoriseTaskContext, task) => {
				if (ctx.oauth_config === undefined) {
					throw new Error('Unable to complete dynamic client registration as there is no OAuth server configuration');
				}
				const { registration_endpoint } = ctx.oauth_config['openid-configuration'];
				if (registration_endpoint === undefined) {
					throw new Error('Unable to register application. No endpoint on the authorisation server registered.');
				}
				const createClientRequestBody = {
					application_type: 'service',
					identifier: hostname(),
					client_secret_expires_at: 0,
					grant_types: [ 'client_credentials' ],
					redirect_uris: [],
					description: `Dalane CLI Client Application on "${hostname()}"`,
					audiences: ctx.audience,
					scope: '*',
				};
				const headers = !!ctx.user || !!ctx.password ? { authorization: `Basic ${Buffer.from(`${ctx.user}:${ctx.password}`).toString('base64')}`} : undefined;
				const result = await postJson(registration_endpoint, createClientRequestBody, { headers });
				if (result instanceof HttpError) {
					throw new Error(`${result.url}, ${result.status}, ${result.body}`);
				}
				const { client_id, secret } = result.body;

				ctx.client = {
					client_id,
					client_secret: secret,
					scope: createClientRequestBody.scope,
					identifier: createClientRequestBody.identifier,
				};
			}
		},
		{
			title: 'Authorising client',
			task: () => new Listr([
				{
					title: 'Requesting new tokens',
					task: async (ctx: AuthoriseTaskContext, task) => {
						const { oauth_config, client } = ctx;
						if (oauth_config === undefined) {
							throw new Error('Unable to request tokens as the OAuth Configuration has not been received.');
						}
						const { token_endpoint } = oauth_config["openid-configuration"];
						if (token_endpoint === undefined) {
							throw Error('token endpoint is undefined. Unable to request tokens.')
						}
						if (client === null) {
							throw Error('Client is undefined. Unable to request tokens.')
						}
						const { client_id, client_secret, scope } = client;
						const fetchResult: OAuthTokenResponse | OAuthTokenError = await fetchClientCredentialsAccessToken(token_endpoint, client_id, client_secret, scope);
						if (fetchResult instanceof OAuthTokenError) {
							throw fetchResult;
						}
						ctx.tokenResponse = fetchResult;
					}
				},
				{
					title: 'Verifying tokens',
					task: async (ctx: AuthoriseTaskContext, task) => {
						const { tokenResponse, oauth_config, jwks, client, audience } = ctx;
						if (tokenResponse === undefined) {
							throw Error('Unable to verify tokens as there was no token payload');
						}
						if (oauth_config === undefined) {
							throw new Error('Unable to request tokens as the OAuth Configuration has not been received.');
						}
						if (jwks === undefined) {
							throw new Error('Unable to verify tokens as the JSON Web Key Set has not been received.');
						}
						if (client === null) {
							throw new Error('Unable to verify tokens as the client is undefined');
						}
						const { token_type: tokenType, id_token: idToken, access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn, refresh_token_expires_in, id_token_expires_in } = tokenResponse;
						const { issuer, id_token_signing_alg_values_supported, token_endpoint_auth_signing_alg_values_supported } = oauth_config["openid-configuration"];

						const keys = jwks.keys;

						// the audience for an ID Token is the client
						const idTokenAudience = client.identifier;
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
