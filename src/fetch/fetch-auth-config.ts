import { OpenIdConfiguration } from "../common/auth/openid";
import { getJson } from "../common/fetch";

export async function fetchOpenIdConfig(uri: string): Promise<OpenIdConfiguration> {
	const result = await getJson<OpenIdConfiguration>(uri);
	if (result instanceof Error) {
		throw result;
	}
	return result.body;
}
