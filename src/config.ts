import Conf from 'conf';
import { AccessTokenPayload, RefreshTokenPayload } from './common/auth/oauth';
import { IdentityTokenPayload } from './common/auth/openid';

export interface Config {
	client_id?: string;
	tokens: {
		access?: TokenConfig<AccessTokenPayload>;
		refresh?: TokenConfig<RefreshTokenPayload>;
		identity?: TokenConfig<IdentityTokenPayload>;
	};
	oauth_auth_server: string;
	oauth_wellknown_uri: string;
}

export interface TokenConfig<Decoded> {
	decoded?: Decoded;
	value: string;
	expires_at: number;
}

let configStore: Conf<Config>;

export function createConfigStore(defaultConfig: Config) {
	configStore = (configStore === undefined) ? new Conf({ defaults: defaultConfig }) : configStore;
	return configStore;
}
