// @ts-ignore
import { TokenStore } from '../config';
import { command, Command } from 'commander';
import { logSuccess } from '../common/console';
import { prompt } from 'enquirer';

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
export function createRevokeCmd(tokenStore: TokenStore) {
	const authoriseCmd = command('revoke');
	authoriseCmd.description('Revokes all tokens and deauthorises the application.')
	authoriseCmd.action(async (options: {}, cmd: Command) => {
		const confirm = await promptRevoke();
		if (confirm === false) {
			return;
		}
		tokenStore.clear();
		logSuccess('You have revoked application permissions.')
	});
	return authoriseCmd;
}

async function promptRevoke(): Promise<boolean> {
	const { reset } = await prompt<{ reset: boolean}>({
		type: 'confirm',
		name: 'reset',
		initial: false,
		message: `Please confirm that you wish to revoke application permissions?`
	});
	return reset;
}
