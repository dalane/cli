import Conf from 'conf';
import { AccessTokenPayload, RefreshTokenPayload } from './common/auth/oauth';
import { IdentityTokenPayload } from './common/auth/openid';
import { TokenPayload } from './common/auth/tokens';

export interface ConfigState {
	client_id: string | null;
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

let configStore: ConfigStore | undefined;
let tokenStore: TokenStore | undefined;

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
