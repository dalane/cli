import { createConfigStore, ConfigState, TokenState, createTokenStore, createAccountsOpenApiCache, createProjectsOpenApiCache, createOIDCConfigCache, createJWKSCache } from './config';
import { program } from 'commander';
import { ACCOUNTS_API_URI, OAUTH_AUTH_SERVER, PROJECTS_API_URI } from './constants';
import { createAuthoriseCmd, createConfigCmd, createResourcesCmd, createRevokeCmd, createFixturesCmd  } from './commands';
import { createSchemaCmd } from './commands/schemas';
import { createUpdateSchemasTaskRunner } from './tasks/update-schemas-task-runner';
import { createInitCommand } from './commands/init';
import { createCacheConfigTaskRunner } from './tasks/cache-config-runner';

// get the application version and the details of the terminal application from
// package.json
const { version, bin } = require('../package.json');

// the first key in the bin object is the name of the application used in the
// terminal
const name = Object.keys(bin)[0];

// these are the default names to use for the config store so that the
// library can handle multiple settings files
const configStoreName: string = 'config';
const tokenStoreName: string = 'tokens';
const accountsApiCacheName: string = 'account_openapi_definition';
const projectsApiCacheName: string = 'projects_openapi_definition';
const oidcConfigCacheName: string = 'oidc-config';
const jwksCacheName: string = 'jwks';

export function cli() {

	const defaultConfig: ConfigState = {
		client: null,
		oauth_auth_server: OAUTH_AUTH_SERVER,
		api_uris: {
			accounts: ACCOUNTS_API_URI,
			projects: PROJECTS_API_URI
		}
	};

	const defaultTokenState: TokenState = {};

	const configStore = createConfigStore(configStoreName, defaultConfig);
	const tokenStore = createTokenStore(tokenStoreName, defaultTokenState);
	const accountsApiDefCache = createAccountsOpenApiCache(accountsApiCacheName);
	const projectsApiDefCache = createProjectsOpenApiCache(projectsApiCacheName);
	const oidcConfigCache = createOIDCConfigCache(oidcConfigCacheName);
	const jwksCache = createJWKSCache(jwksCacheName);

	// task runners
	// const updateSchemaTaskRunner = createUpdateSchemasTaskRunner(configStore, accountsApiDefCache, projectsApiDefCache);
	const cacheConfigTaskRunner = createCacheConfigTaskRunner(configStore, oidcConfigCache, jwksCache, accountsApiDefCache, projectsApiDefCache);

	const pgm = program;
	pgm.version(version);
	pgm.name(name);
	pgm.addCommand(createAuthoriseCmd(configStore, tokenStore));
	pgm.addCommand(createConfigCmd(configStore));
	pgm.addCommand(createFixturesCmd(configStore,tokenStore, accountsApiDefCache, projectsApiDefCache));
	pgm.addCommand(createResourcesCmd(tokenStore));
	pgm.addCommand(createRevokeCmd(tokenStore));
	// pgm.addCommand(createSchemaCmd(updateSchemaTaskRunner));
	pgm.addCommand(createInitCommand(cacheConfigTaskRunner));

	pgm.parse(process.argv);

}
