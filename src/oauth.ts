import { OAUTH_WELL_KNOWN_PATH } from "./common/constants";

export function createOAuthWellknownUri(server: string): string {
	const url = new URL(OAUTH_WELL_KNOWN_PATH, server);
	return url.toString();
}
