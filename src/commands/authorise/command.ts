import { ConfigStore, TokenStore } from "../../config";
import { command, Command } from 'commander';
import { createOAuthWellknownUri } from '../../oauth';
import { AuthoriseTaskContext } from "./tasks/context";
import { AuthoriseTaskRunner } from "./tasks";
import { SUPPORTED_TOKEN_AUDIENCES } from "../../constants";

export function createCmd(configStore: ConfigStore, tokenStore: TokenStore, taskRunner: AuthoriseTaskRunner) {
	const getClientId = () => configStore.get('client_id') ?? undefined;
	const getOAuthWellKnownUri = () => {
		const oauth_auth_server = configStore.get('oauth_auth_server');
		if (oauth_auth_server === undefined) {
			throw new Error('oauth_auth_server was not found in the config');
		}
		return createOAuthWellknownUri(oauth_auth_server);
	};
	const authoriseCmd = command('authorise');
	authoriseCmd.description('Authorises the app to the Dalane Cloud APIs.')
	authoriseCmd.alias('authorize');
	authoriseCmd.option('-s, --client_secret <secret>', 'Provide a client secret. If missing, you will be prompted to enter a value.');
	authoriseCmd.action(async (options: { client_secret?: string }, cmd: Command) => {
		try {
			const { client_secret } = options;
			const client_id = getClientId();
			const oauth_wellknown_uri = getOAuthWellKnownUri();
			const ctx: AuthoriseTaskContext = {
				oauth_wellknown_uri,
				audience: SUPPORTED_TOKEN_AUDIENCES,
				client_id,
				client_secret,
			};
			const finalCtx: AuthoriseTaskContext = await taskRunner(ctx);
			const { validatedTokens } = finalCtx;
			if (validatedTokens === undefined) {
				throw new Error('There are no validated tokens to save');
			}
			tokenStore.set(validatedTokens);
		} catch (error) {
			console.error(`Authorisation was unable to complete. The following error was received: "${(<Error>error).message}".`)
		}
	});
	return authoriseCmd;
}
