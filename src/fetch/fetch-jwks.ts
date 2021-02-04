import { JsonWebKeySet } from "../common/auth/keys";
import { getJson } from "../common/fetch";

export async function fetchJwks(uri:string): Promise<JsonWebKeySet> {
	const result = await getJson<JsonWebKeySet>(uri);
	if (result instanceof Error) {
		throw result;
	}
	return result.body;
}
