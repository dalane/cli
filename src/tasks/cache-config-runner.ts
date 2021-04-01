import { prompt } from "enquirer";
import Listr, { ListrContext } from "listr";
import { OpenAPIV3 } from "openapi-types";
import { JsonWebKeySet } from "../common/auth/keys";
import { OpenIdConfiguration } from "../common/auth/openid";
import { getJson, HttpError } from "../common/fetch";
import { AccountsApiDefinitionCache, ConfigStore, JWKSCache, OIDCConfigCache, ProjectsApiDefinitionCache } from "../config";
import { fetchJwks, fetchOpenIdConfig } from "../fetch";
import { createOAuthWellknownUri, createOpenApiSchemaUri } from "../oauth";

interface Context extends ListrContext {
	jwks_uri?: string;
	accountsSchemaUri?: string;
	projectsSchemaUri?: string;
}

export type CacheConfigTaskRunner = () => Promise<any>;

export function createCacheConfigTaskRunner(configStore: ConfigStore, oidcConfigCache: OIDCConfigCache, jwksCache: JWKSCache, accountsApiCache: AccountsApiDefinitionCache, projectsApiCache: ProjectsApiDefinitionCache): CacheConfigTaskRunner {
	const getOAuthWellKnownUri = () => {
		const oauth_auth_server = configStore.get('oauth_auth_server');
		if (oauth_auth_server === undefined) {
			throw new Error('oauth_auth_server was not found in the config');
		}
		return createOAuthWellknownUri(oauth_auth_server);
	};
	const setOIDCConfig = (config: OpenIdConfiguration) => oidcConfigCache.set(config);
	const setJWKS = (jwks: JsonWebKeySet) => jwksCache.set(jwks);
	const getAccountsApiHost = (): string | undefined => {
		const { accounts } = configStore.get('api_uris');
		return accounts;
	};
	const getProjectsApiHost = (): string | undefined => {
		const { projects } = configStore.get('api_uris');
		return projects;
	};
	const setAccountsApiHost = (value: string) => configStore.set('api_uris.accounts', value);
	const setProjectsApiHost = (value: string) => configStore.set('api_uris.projects', value);
	const setAccountsApiCache = (schema: OpenAPIV3.Document) => {
		accountsApiCache.set(schema);
	};
	const setProjectsApiCache = (schema: OpenAPIV3.Document) => {
		projectsApiCache.set(schema);
	};
	const task = new Listr<Context>([
		{
			title: 'Authorisation Server Discovery',
			task: (ctx, task) => {
				return new Listr<Context>([
						{
							title: `Retrieving OAuth / OIDC configuration`,
							task: async (ctx, task) => {
								const oauth_wellknown_uri = getOAuthWellKnownUri();
								const oidcConfig = await fetchOpenIdConfig(oauth_wellknown_uri);
								setOIDCConfig(oidcConfig);
								ctx.jwks_uri = oidcConfig["openid-configuration"].jwks_uri;
							}
						},
						{
							title: 'Retrieving Json WebKey set',
							task: async (ctx, task) => {
								const { jwks_uri } = ctx;
								if (jwks_uri === undefined) {
									throw new Error('Unable to retrieve Json Web Key Set as the jwks_uri is missing');
								}
								const jwks = await fetchJwks(jwks_uri);
								setJWKS(jwks);
							}
						}
				])
			}
		},
		{
			title: 'Accounts API',
			task: () => new Listr<Context>([
				{
					title: 'Accounts API configuration',
					task: async (ctx, task) => {
						const configHost  = getAccountsApiHost();
						const host = configHost === undefined ? await promptAccountsApiUri() : configHost;
						if (host !== configHost) {
							setAccountsApiHost(host);
						}
						ctx.accountsSchemaUri = createOpenApiSchemaUri(host);
					}
				},
				{
					title: 'Retrieving schema from host',
					task: async (ctx, task) => {
						const { accountsSchemaUri } = ctx;
						if (accountsSchemaUri === undefined) {
							throw new Error('Unable to retrieve the Accounts API schema as the host is undefined.');
						}
						const getSchemaResult = await getJson(accountsSchemaUri);
						if (getSchemaResult instanceof HttpError) {
							throw new Error(`The server responded with error "${getSchemaResult.statusText}"`);
						}
						ctx.accountsSchema = getSchemaResult.body
					}
				},
				{
					title: 'Verifying and caching schema',
					task: async (ctx, task) => {
						const { accountsSchema } = ctx;
						if (accountsSchema === undefined) {
							throw new Error('Unable to save the accounts schema as it is undefined');
						}
						setAccountsApiCache(accountsSchema);
					}
				},
			])
		},
		{
			title: 'Projects API',
			task: () => new Listr([
				{
					title: 'Projects API configuration',
					task: async (ctx, task) => {
						const configHost  = getProjectsApiHost();
						const host = configHost === undefined ? await promptProjectsApiUri() : configHost;
						if (host !== configHost) {
							setProjectsApiHost(host);
						}
						ctx.projectsSchemaUri = createOpenApiSchemaUri(host);
					}
				},
				{
					title: 'Retrieving schema from host',
					task: async (ctx, task) => {
						const { projectsSchemaUri } = ctx;
						if (projectsSchemaUri === undefined) {
							throw new Error('Unable to retrieve the Projects API schema as the host is undefined.');
						}
						const getSchemaResult = await getJson(projectsSchemaUri);
						if (getSchemaResult instanceof HttpError) {
							throw new Error(`The server responded with error "${getSchemaResult.statusText}"`);
						}
						ctx.projectsSchema = getSchemaResult.body
					}
				},
				{
					title: 'Verifying and caching schema',
					task: async (ctx, task) => {
						const { projectsSchema } = ctx;
						if (projectsSchema === undefined) {
							console.error('Unable to save the projects schema as it is undefined');
							return;
						}
						setProjectsApiCache(projectsSchema);
					}
				}
			])
		}
	]);
	return () => task.run();
}

async function promptAccountsApiUri(): Promise<string> {
	const { accounts_api_uri } = await prompt< { accounts_api_uri: string }>({
		type: 'input',
		name: 'accounts_api_uri',
		message: 'Please enter an address for the accounts API (including version path)'
	});
	return accounts_api_uri;
}

async function promptProjectsApiUri(): Promise<string> {
	const { projects_api_uri } = await prompt< { projects_api_uri: string }>({
		type: 'input',
		name: 'projects_api_uri',
		message: 'Please enter an address for the accounts API (including version path)'
	});
	return projects_api_uri;
}
