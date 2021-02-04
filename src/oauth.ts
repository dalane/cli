import { OAUTH_WELL_KNOWN_PATH } from "./constants";

export function createOAuthWellknownUri(server: string): string {
	if (server === undefined) {
		throw new Error('The auth server host name is missing from the configuration.');
	}
	const url = new URL(OAUTH_WELL_KNOWN_PATH, server);
	return url.toString();
}
