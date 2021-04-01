import { Client, ConfigStore, TokenStore } from "../../config";
import { command, Command } from 'commander';
import { createOAuthWellknownUri } from '../../oauth';
import { AuthoriseTaskRunner, AuthoriseTaskContext } from "../../tasks/authorise-task-runner";
import { SUPPORTED_TOKEN_AUDIENCES } from "../../constants";

export function createCmd(configStore: ConfigStore, tokenStore: TokenStore, taskRunner: AuthoriseTaskRunner) {
	const getClient = () => configStore.get('client');
	const setClient = (value: Client) => configStore.set('client', value);
	const getOAuthWellKnownUri = () => {
		const oauth_auth_server = configStore.get('oauth_auth_server');
		if (oauth_auth_server === undefined) {
			throw new Error('oauth_auth_server was not found in the config');
		}
		return createOAuthWellknownUri(oauth_auth_server);
	};
	const cmd = command('authorise');
	cmd.description('Authorises the app to the Dalane Cloud APIs.')
	cmd.alias('authorize');
	cmd.option('--user <username>', 'Specify username for dynamic client registration.');
	cmd.option('--password <password>', 'Specify password for dynamic client registration.');
	cmd.action(async (options: { user?: string; password?: string }, cmd: Command) => {
		try {
			const { user, password } = options;
			const oauth_wellknown_uri = getOAuthWellKnownUri();
			const ctx: AuthoriseTaskContext = {
				oauth_wellknown_uri,
				audience: SUPPORTED_TOKEN_AUDIENCES,
				user,
				password,
				client: getClient(),
			};
			const finalCtx: AuthoriseTaskContext = await taskRunner(ctx);
			const { validatedTokens, client } = finalCtx;
			if (client === null) {
				throw new Error('There were no client credentials obtained.');
			}
			setClient(client);
			if (validatedTokens === undefined) {
				throw new Error('There are no validated tokens to save');
			}
			tokenStore.set(validatedTokens);
		} catch (error) {
			console.error(`Authorisation was unable to complete. The following error was received: "${(<Error>error).message}".`)
		}
	});
	return cmd;
}
