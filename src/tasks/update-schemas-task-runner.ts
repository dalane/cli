import Listr from "listr";
import { OpenAPIV3 } from "openapi-types";
import { AccountsApiDefinitionCache, ConfigStore, ProjectsApiDefinitionCache } from "../config";
import { prompt } from 'enquirer';
import { createOpenApiSchemaUri } from "../oauth";
import { getJson, HttpError } from "../common/fetch";
import { parseOpenApiDocument } from "../common/openapi/parser";

export interface UpdateSchemaTaskContext {
	accountsSchemaUri?: string;
	projectsSchemaUri?: string;
	accountsSchema?: OpenAPIV3.Document;
	projectsSchema?: OpenAPIV3.Document;
}

export type UpdateSchemaTaskRunner = () => Promise<UpdateSchemaTaskContext>;

export function createUpdateSchemasTaskRunner(configStore: ConfigStore, accountsApiCache: AccountsApiDefinitionCache, projectsApiCache: ProjectsApiDefinitionCache): UpdateSchemaTaskRunner {
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
	const task = new Listr<UpdateSchemaTaskContext>([
		{
			title: 'Checking configuration',
			task: () => new Listr([
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
					title: 'Projects API configuration',
					task: async (ctx, task) => {
						const configHost  = getProjectsApiHost();
						const host = configHost === undefined ? await promptProjectsApiUri() : configHost;
						if (host !== configHost) {
							setProjectsApiHost(host);
						}
						ctx.projectsSchemaUri = createOpenApiSchemaUri(host);
					}
				}
			]),
		},
		{
			title: 'Accounts API',
			task: () => new Listr([
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
						const parsedAccountsSchema = await parseOpenApiDocument(accountsSchema);
						setAccountsApiCache(parsedAccountsSchema);
					}
				},
			])
		},
		{
			title: 'Projects API',
			task: () => new Listr([
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
							throw new Error('Unable to save the projects schema as it is undefined');
						}
						const parsedProjectsSchema = await parseOpenApiDocument(projectsSchema);
						setProjectsApiCache(parsedProjectsSchema);
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
