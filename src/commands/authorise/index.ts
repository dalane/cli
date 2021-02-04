import { ConfigStore, TokenStore } from "../../config";
import { AuthoriseTaskRunner, createAuthoriseTaskRunner } from "./tasks";
import { createCmd } from './command';
import { Command } from "../../common/commander";


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
 * @param configStore
 */
export function createAuthoriseCmd(configStore: ConfigStore, tokenStore: TokenStore) {
	const taskRunner: AuthoriseTaskRunner = createAuthoriseTaskRunner();
	return createCmd(configStore, tokenStore, taskRunner);
}

// async function pending(config: ConfigStore, tokenEndpoint: string, clientId: string, clientSecret: string) {
// 	const requestBody: OAuthTokenRequest = {
// 		client_id: clientId,
// 		client_secret: clientSecret,
// 		grant_type: GRANT_TYPE.CLIENT_CREDENTIALS
// 	};
// 	try {
// 		const result = await postJson<OAuthTokenRequest, OAuthTokenResponse>(tokenEndpoint, requestBody);
// 		if (result instanceof Error) {
// 			throw result;
// 		}
// 		const tokenPayload: OAuthTokenResponse = result.body;
// 		const accessToken: TokenConfig<AccessTokenPayload> = {
// 			value: tokenPayload.access_token,
// 			expires_at: Date.now() + (tokenPayload.expires_in * 1000),
// 		};
// 		config.set('tokens.access', accessToken);
// 		if (tokenPayload.refresh_token !== undefined) {
// 			const refreshToken: TokenConfig<RefreshTokenPayload> = {
// 				value: tokenPayload.refresh_token,
// 				expires_at: Date.now() + (tokenPayload.refresh_token_expires_in! * 1000),
// 			};
// 			config.set('tokens.refresh', refreshToken);
// 		}
// 		if (tokenPayload.id_token !== undefined) {
// 			const idToken: TokenConfig<IdentityTokenPayload> = {
// 				value: tokenPayload.id_token,
// 				expires_at: Date.now() + (tokenPayload.id_token_expires_in! * 1000),
// 			};
// 			config.set('tokens.identity', idToken);
// 		}
// 	} catch (error) {
// 		return error;
// 	}
// }

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
