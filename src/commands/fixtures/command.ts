import { command, Command } from 'commander';
import { loadJsonFile } from '../../common/file';
import { AccountsApiDefinitionCache, ConfigStore, ProjectsApiDefinitionCache, TokenConfig, TokenStore } from '../../config';
import OpenApiClent, { OperationResponse } from 'openapi-client-axios-ts';
import Debug from 'debug';
import { AccessTokenPayload, RefreshTokenPayload } from '../../common/auth/oauth';
import { createClient as createAccountsApiClient } from '@dalane/accounts-api-client';
import { createClient as createProjectsApiClient } from '@dalane/projects-api-client';
import { OperationMethods } from '@dalane/accounts-api-client/schema/openapi';
import { getObjectProperty } from '../../common/objects';

const debug = Debug('dalane-cli');

/**
 * Format of a fixture in the fixtures JSON file
 */
export interface Fixture {
	/**
	 * The OpenApi operationId
	 */
	operationId: string;
	/**
	 * Data params to populate the request path. Optional as the request path may
	 * not require params.
	 */
	params?: RequestParams;
	/**
	 * HTTP request headers to be sent
	 */
	headers?: RequestHeaders;
	/**
	 * Data to be sent in the request. Optional as the request may be a
	 * GET request
	 */
	requestBody?: RequestBody;
	/**
	 * Specifying a name for the fixture allows the result of the operation to
	 * be queried in subsequent fixtures.
	 */
	name?: string;
	/**
	 * A unique string that ensures that if the fixture file is run against the
	 * API again then a cached successful response will be returned by the server preventing
	 * the query being applied again.
	 */
	idempotencyId?: string;
}

export interface FixturesFile {
	meta: {
		version: number;
	};
	fixtures: Fixture[];
}

export function createFixturesCmd(config: ConfigStore, tokenStore: TokenStore, accountsApiSchemaCache: AccountsApiDefinitionCache, projectsApiSchemaCache: ProjectsApiDefinitionCache) {
	const fixturesCmd = command('fixtures <file>');
	fixturesCmd.description('load fixtures from file');
	fixturesCmd.option('--http-basic', 'Load fixtures using Basic authentication. Default to false', false);
	fixturesCmd.option('--user <username>', 'Specify username for Basic authentication. Used with the flag --http-basic.');
	fixturesCmd.option('--password <password>', 'Specify password for Basic authentication. Used with the flag --http-basic.');
	fixturesCmd.action(async (file: string, options: { httpBasic: boolean; user?: string; password?: string; }, cmd: Command) => {
		const { httpBasic, user, password } = options;
		debug(`handling fixture command with file "${file}"`);
		const results: Results = [];
		const errors: ErrorFixtures = [];
		const { access, refresh } = tokenStore.store;
		const authHeader: string | undefined = createAuthHeader(httpBasic, access, refresh, user, password);
		if (authHeader === undefined) {
			debug('application is not authorised, discontinuing.');
			return;
		}
		debug('application is authorised, continuing.');
		const accountsSchema = accountsApiSchemaCache.store;
		const projectsSchema = projectsApiSchemaCache.store;
		if (accountsSchema === undefined) {
			console.error('There is no accounts schema defined. You must initialise the application using "dalane init" command.');
			return;
		}
		if (projectsSchema === undefined) {
			console.error('There is no projects schema defined. You must initialise the application using "dalane init" command.');
			return;
		}
		const accountsServer: string = config.get('api_uris.accounts');
		const projectsServer: string = config.get('api_uris.projects');
		const accountClient = await createAccountsApiClient({ server: { url: accountsServer }});
		const projectClient = await createProjectsApiClient({ server: { url: projectsServer } });
		// const accountClient = await accountsApi.init();
		// const projectClient = await projectsApi.init();
		const fixturesFile = await loadJsonFile<FixturesFile>(file);
		for (const fixture of fixturesFile.fixtures) {
			const { name, idempotencyId, operationId, requestBody: data, params, headers } = fixture;
			if (!operationId) {
				errors.push({ fixture, error: new Error('"operationId" is undefined') });
				debug('no operation id, continuing with next fixture');
				continue;
			}
			// the operationFn will be either from the account client or the project client so
			// we will check the account client first, if undefined we will check the
			// project client...
			//@ts-ignore

			const operationFn: (parameters?: string | number | ParamsArray | UnknownParamsObject | null | undefined, data?: unknown | undefined, config?: AxiosRequestConfig | undefined) => OperationResponse<unknown> = getObjectProperty(accountClient, operationId) ?? getObjectProperty(projectClient, operationId);
			if (operationFn === undefined) {
				errors.push({ fixture, error: new Error(`OperationId "${fixture.operationId}" was not recognised`) });
				debug(`operationId "${operationId}" not found, continuing with next fixture`);
				continue;
			}
			try {
				const populatedParams: RequestParams | undefined = !!params ? populateQueries(results, params) : params;
				const populatedData: RequestBody | undefined = !!data ? populateQueries(results, data) : data;
				debug('sending request to server');
				const operationResult = await operationFn(populatedParams, populatedData, {
					headers: {
						authorization: authHeader,
						...!!idempotencyId && { 'x-idempotency-id' : idempotencyId },
						...!!headers && headers,
					}
				});
				debug('server response received.');
				results.push({ name, data: operationResult.data });
				// wait 500 milliseconds to allow for views to be updated...
				await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
			} catch (error) {
				debug('error caught');
				console.error('error thrown', error);
				errors.push({
					error,
					fixture,
				});
				// if (error?.response?.data !== undefined) {
				// 	errors.push({ fixture, error: error.response });
				// } else {
				// 	errors.push({ fixture, error });
				// }
			}
		}
		console.log('results...', JSON.stringify(results, null, 2));
		console.log('errors...', JSON.stringify(errors, null, 2),)
	});
	return fixturesCmd;
}

interface RequestBody {
	[key: string]: string | number | boolean | null | RequestBody;
}

interface RequestParams {
	[key: string]: string | number;
}

type RequestHeaders = RequestParams;

type ResultData = { name?: string; data: any };
type Results = ResultData[];
type ErrorFixtures = { fixture: Fixture; error: any; }[];

/**
 * A regular expression that matches the string "${[name]:[path]}"
 */
const queryRegExp = /\${([^\|}]+):([^\|}]+)\|?([^/\n]+)?}/;

/**
 * Given a value, populates queries with a value from named fixture response
 * parameters. If the value is an array or an object it will iterate through
 * each item / key populating queries recursively.
 *
 * @param savedResults
 * @param params
 */
function populateQueries(savedResults: Results, params: any): any {

	function getResult(name: string): ResultData | undefined {
		return savedResults.find(result => result.name === name);
	}

	/**
	 * Iterates through each key and value in a fixtures params replacing queries with
	 * values from process.env or previously successful fixtures. If an object is found
	 * iterates through each of the child keys and values repeating the process.
	 *
	 * @param populated {RequestBody} A Map containing the saved results of previous fixtures
	 * @param object {object} The object to iterate through the keys and values
	 */
	function recursiveChildParamsForFixtures(value: any): any {
		if (Array.isArray(value)) {
			const populated: any[] = [];
			for (const item of value) {
				populated.push(recursiveChildParamsForFixtures(item));
			}
			return populated;
		}
		if (typeof value === 'object') {
			const keys = Object.keys(value);
			const populated: RequestBody = {};
			for (const key of keys) {
				populated[key] = recursiveChildParamsForFixtures(value[key]);
			}
			return populated;
		}
		if (typeof value === 'string' && queryRegExp.test(value)) {
			// @ts-ignore there should be no null result as we already tested the regular expression above
			const [ _, name, path] = <[ string, string, string ]>queryRegExp.exec(value);
			if (name === '.env') {
				const env = getDeepValue(process.env, path.split('.'));
				if (env === undefined) {
					throw new Error(`Unable to process fixture as the .env parameter "${path}" was not found in process.env`)
				}
				return env;
			}
			const savedResponses = getResult(name);
			if (savedResponses === undefined) {
				throw new Error(`Unable to process fixture as the fixture "${name}" was not found.`);
			}
			const param = getDeepValue(savedResponses.data, path.split('.'));
			if (param === undefined) {
				throw new Error(`Unable to process fixture as the query parameter "${path}" was not found in fixture "${name}".`);
			}
			return param
		}
		return value;
	}
	return recursiveChildParamsForFixtures(params);
}

function getDeepValue(object: { [key: string]: any; }, parts:string[]): any {
  let current = object;
  for (const part of parts) {
    if (typeof current[part] === 'undefined') {
      return void 0;
    } else {
      current = current[part];
    }
  }
  return current;
};

function createAuthHeader(useHttp: boolean, access?: TokenConfig<AccessTokenPayload>, refresh?: TokenConfig<RefreshTokenPayload>, username?: string, password?: string): string | undefined {
	const now = Date.now();
	if (useHttp === false) {
		if (access === undefined) {
			debug('application is not authorised');
			console.error('Application must be authorised first');
			return;
		}
		if ( access.expires_at < now) {
			debug('access token is expired');
			if (refresh === undefined) {
				debug('there is no refresh token');
				console.error('Application must be authorised first');
				return;
			}
			if (refresh.expires_at < now) {
				debug('refresh token has expired');
				console.error('The session has expired. You will need to reauthorise the application.');
				return;
			}
			// refresh access token using refresh token
			// const tokenEndpoint = config.get()
			// const tokens = await fetchRefreshCredentialsAccessToken()
		}
		return `Bearer ${access.value}`;
	}
	if (username === undefined) {
		console.error('--user must be specified if using flag --http-basic');
		return;
	}
	if (password === undefined) {
		console.error('--password must be specified if using flag --http-basic');
		return;
	}
	return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}
