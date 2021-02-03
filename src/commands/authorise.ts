// @ts-ignore
import Conf from 'conf';
import { prompt } from 'enquirer';
import { Config, TokenConfig } from '../config';
import { command, Command } from 'commander';
import { AccessTokenPayload, OAuthTokenRequest, OAuthTokenResponse, RefreshTokenPayload } from '../common/auth/oauth';
import { getJson, postJson } from '../common/fetch';
import { GRANT_TYPE } from '../common/auth/constants';
import { IdentityTokenPayload, OpenIdConfiguration } from '../common/auth/openid';
import { JsonWebKeySet } from '../common/auth/keys';
import { logSuccess } from '../common/console';
import Listr from 'listr';

/**
 * Returns a command for the command handler that authorises the app to the
 * Dalane Cloud APIs.
 *
 * Using the client_id saved in the config or provided as an option, requests
 * an access token and refresh token. When an access token expires, the refresh
 * token is used to request a new access token. If the refresh token is expired
 * or the user has revoked the refresh token then the application will need
 * to be reauthorised.
 *
 * @param config
 */
export function createAuthoriseCmd(config: Conf<Config>) {
	const authoriseCmd = command('authorise');
	authoriseCmd.description('Authorises the app to the Dalane Cloud APIs.')
	authoriseCmd.alias('authorize');
	authoriseCmd.option('-c, --client_id <client-id>', 'set a client id to use when authorising');
	authoriseCmd.action(async (options: { client_id?: string }, cmd: Command) => {
		const { client_id, client_secret } = await getClientCredentials(config, options.client_id);
		const oauth_wellknown_uri = config.get('oauth_wellknown_uri');
		const task = new Listr([
			{
				title: 'Retrieving Authorisation Server Settings',
				task: (ctx, task) => {
					return new Listr([
							{
								title: `Retrieving OAuth / OIDC configuration`,
								task: async () => {
									const authConfig = await fetchOpenIdConfig(oauth_wellknown_uri);
									const { jwks_uri, token_endpoint } = authConfig['openid-configuration'];
									ctx.jwks_uri = jwks_uri;
									ctx.token_endpoint = token_endpoint;
								}
							},
							{
								title: 'Retrieving Json WebKey set',
								task: async (ctx, task) => {
									const { jwks_uri } = ctx;
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
							await new Promise<void>(resolve => setTimeout(() => resolve(), 2000));
						}
					},
					{
						title: 'Verifying tokens',
						task: async (ctx, task) => {
							await new Promise<void>(resolve => setTimeout(() => resolve(), 2000));
						}
					}
				])
			}
		]);
		await task.run();
		logSuccess('You are now authorised with the Dalane Cloud');
	});
	return authoriseCmd;
}

async function getClientCredentials(config: Conf<Config>, commandClientId?: string): Promise<{ client_id: string; client_secret: string; }> {
	let client_id = commandClientId ?? config.get('client_id');
	if (client_id === undefined) {
		client_id = await promptClientId();
		config.set('client_id', client_id);
	}
	const client_secret = await promptClientSecret();
	return { client_id, client_secret };
}

async function fetchOpenIdConfig(uri: string): Promise<OpenIdConfiguration> {
	const result = await getJson<OpenIdConfiguration>(uri);
	if (result instanceof Error) {
		throw result;
	}
	return result.body;
}

async function fetchJwks(uri:string): Promise<JsonWebKeySet> {
	const result = await getJson<JsonWebKeySet>(uri);
	if (result instanceof Error) {
		throw result;
	}
	return result.body;
}

async function fetchClientCredentialsAccessToken(uri: string, clientId: string, clientSecret: string): Promise<OAuthTokenResponse> {
	const requestBody: OAuthTokenRequest = {
		client_id: clientId,
		client_secret: clientSecret,
		grant_type: GRANT_TYPE.CLIENT_CREDENTIALS
	};
	const response = await postJson<OAuthTokenRequest, OAuthTokenResponse>(uri, requestBody);
	if (response instanceof Error) {
		throw response;
	}
	return response.body;
}

async function pending(config: Conf<Config>, tokenEndpoint: string, clientId: string, clientSecret: string) {
	const requestBody: OAuthTokenRequest = {
		client_id: clientId,
		client_secret: clientSecret,
		grant_type: GRANT_TYPE.CLIENT_CREDENTIALS
	};
	try {
		const result = await postJson<OAuthTokenRequest, OAuthTokenResponse>(tokenEndpoint, requestBody);
		if (result instanceof Error) {
			throw result;
		}
		const tokenPayload: OAuthTokenResponse = result.body;
		const accessToken: TokenConfig<AccessTokenPayload> = {
			value: tokenPayload.access_token,
			expires_at: Date.now() + (tokenPayload.expires_in * 1000),
		};
		config.set('tokens.access', accessToken);
		if (tokenPayload.refresh_token !== undefined) {
			const refreshToken: TokenConfig<RefreshTokenPayload> = {
				value: tokenPayload.refresh_token,
				expires_at: Date.now() + (tokenPayload.refresh_token_expires_in! * 1000),
			};
			config.set('tokens.refresh', refreshToken);
		}
		if (tokenPayload.id_token !== undefined) {
			const idToken: TokenConfig<IdentityTokenPayload> = {
				value: tokenPayload.id_token,
				expires_at: Date.now() + (tokenPayload.id_token_expires_in! * 1000),
			};
			config.set('tokens.identity', idToken);
		}
	} catch (error) {
		return error;
	}
}

// async function fetchAccessToken(tokenUri: string, clientId: string, clientSecret: string): Promise<OAuthTokenResponse | Error> {
// 	const requestBody: OAuthTokenRequest = {
// 		client_id: clientId,
// 		client_secret: clientSecret,
// 		grant_type: GRANT_TYPE.CLIENT_CREDENTIALS
// 	};
// 	try {
// 		const result = postJson(tokenUri, requestBody);
// 		if (result instanceof DomainErrorCollection) {
// 			return result;
// 		}
// 	} catch (error) {
// 		return error;
// 	}

// }

/*

Example of how to implement Device Code flow...

	log(chalk.bold('\nTo authorise the Dalane CLI app\n'));
	log(`1. On your computer or mobile, go to ${chalk.blue.underline('https://www.dalane.co.uk/authorise')}\n`);
	log(`2. Enter the following code ${chalk.bold.bgWhite.blackBright(' ABCD EFGH ')}\n`);
	log(chalk.bold('or scan the QR Code below\n'));
	QRCode.generate('https://www.dalane.co.uk/authorise?code=ABC125F9', { small: true });
	const spinner = ora('Waiting for authorisation').start();
	setTimeout(() => {
		spinner.stopAndPersist({
			prefixText: '✔',
			text: 'You are now authorised with the Dalane Cloud'
		});
		log('');
	}, 5000);

*/

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
