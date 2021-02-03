import { createConfigCmd } from './commands/config';
import { createConfigStore, Config } from './config';
import { program } from 'commander';
import { OAUTH_AUTH_SERVER } from './common/constants';
import { createOAuthWellknownUri } from './oauth';
import { createAuthoriseCmd } from './commands/authorise';
import { createFixturesCmd } from './commands/fixtures';
import { createResourcesCmd } from './commands/resources';

const { version, name } = require('../package.json');

export function main() {

	const defaultConfig: Config = {
		client_id: undefined,
		tokens: {},
		oauth_auth_server: OAUTH_AUTH_SERVER,
		oauth_wellknown_uri: createOAuthWellknownUri(OAUTH_AUTH_SERVER),
	};

	const config = createConfigStore(defaultConfig);

	program
		.version(version)
		.name(name)
		.addCommand(createAuthoriseCmd(config))
		.addCommand(createConfigCmd(config))
		.addCommand(createFixturesCmd(config))
		.addCommand(createResourcesCmd(config));

	program.parse(process.argv);

}
