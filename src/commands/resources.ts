import { TokenStore } from '../config';
import { command, Command } from 'commander';

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
export function createResourcesCmd(tokenStore: TokenStore) {
	const authoriseCmd = command('resources <operation-id>');
	authoriseCmd.description('Make API requests on resources.')
	authoriseCmd.alias('resource');
	authoriseCmd.action(async (operationId: string, options: {}, cmd: Command) => {
		console.log(operationId);
	});
	return authoriseCmd;
}
