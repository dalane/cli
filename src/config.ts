import Conf from 'conf';
import { AccessTokenPayload, RefreshTokenPayload } from './common/auth/oauth';
import { IdentityTokenPayload, OpenIdConfiguration } from './common/auth/openid';
import { TokenPayload } from './common/auth/tokens';
import { OpenAPIV3 } from 'openapi-types';
import { JsonWebKeySet } from './common/auth/keys';

export interface Client {
	client_id: string;
	client_secret: string;
	scope: string;
	identifier: string;
}

export interface ConfigState {
	client: Client | null;
	oauth_auth_server: string;
	api_uris: {
		accounts: string;
		projects: string;
	}
}

export interface TokenConfig<Decoded extends TokenPayload> {
	decoded?: Decoded;
	value: string;
	expires_at: number;
}

export interface TokenState {
		access?: TokenConfig<AccessTokenPayload>;
		refresh?: TokenConfig<RefreshTokenPayload>;
		identity?: TokenConfig<IdentityTokenPayload>;
}

export type ConfigStore = Conf<ConfigState>;
export type TokenStore = Conf<TokenState>;
export type AccountsApiDefinitionCache = Conf<OpenAPIV3.Document>;
export type ProjectsApiDefinitionCache = Conf<OpenAPIV3.Document>;
export type OIDCConfigCache = Conf<OpenIdConfiguration>;
export type JWKSCache = Conf<JsonWebKeySet>;

let configStore: ConfigStore | undefined;
let tokenStore: TokenStore | undefined;
let accountsApiDefCache: AccountsApiDefinitionCache | undefined;
let projectsApiDefCache: ProjectsApiDefinitionCache | undefined;
let oidcConfigCache: OIDCConfigCache | undefined;
let jwksCache: JWKSCache | undefined;

/**
 *
 * @param name {string} The name of the store to be saved in .config
 * @param defaultState {ConfigState} Defaults to be used on initialisation and reset
 */
export function createConfigStore(name: string, defaultState: ConfigState): ConfigStore {
	if (configStore === undefined) {
		configStore = new Conf<ConfigState>({ defaults: defaultState, configName: name });
	}
	return configStore;
}

export function createTokenStore(name: string, defaultState: TokenState): TokenStore {
	if (tokenStore === undefined) {
		tokenStore =new Conf<TokenState>({ defaults: defaultState, configName: name });
	}
	return tokenStore;
}

export function createAccountsOpenApiCache(name: string): AccountsApiDefinitionCache {
	if (accountsApiDefCache === undefined) {
		accountsApiDefCache = new Conf({ configName: name });
	}
	return accountsApiDefCache;
}

export function createProjectsOpenApiCache(name: string): ProjectsApiDefinitionCache {
	if (projectsApiDefCache === undefined) {
		projectsApiDefCache = new Conf({ configName: name });
	}
	return projectsApiDefCache;
}

export function createOIDCConfigCache(name: string): OIDCConfigCache {
	if (oidcConfigCache === undefined) {
		oidcConfigCache = new Conf({ configName: name });
	}
	return oidcConfigCache;
}

export function createJWKSCache(name: string): JWKSCache {
	if (jwksCache === undefined) {
		jwksCache = new Conf({ configName: name });
	}
	return jwksCache;
}
