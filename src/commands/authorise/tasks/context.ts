import { ListrContext } from "listr";
import { JsonWebKeySet } from "../../../common/auth/keys";
import { OAuthTokenResponse } from "../../../common/auth/oauth";
import { OpenIdConfiguration } from "../../../common/auth/openid";
import { TokenState } from "../../../config";

export interface AuthoriseTaskContext extends ListrContext {
	oauth_wellknown_uri: string;
	audience: string[];
	client_id?: string;
	client_secret?: string;
	oauth_config?: OpenIdConfiguration;
	jwks?: JsonWebKeySet;
	tokenResponse?: OAuthTokenResponse;
	validatedTokens?: TokenState
}
