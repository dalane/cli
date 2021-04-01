import { join } from "path";
import { URL_Join } from "./common/url";
import { OAUTH_WELL_KNOWN_PATH, OPENAPI_SCHEMA_PATH } from "./constants";

export function createOAuthWellknownUri(server: string): string {
	if (server === undefined) {
		throw new Error('The auth server host name is missing from the configuration.');
	}
	const url = new URL(OAUTH_WELL_KNOWN_PATH, server);
	return url.toString();
}

export function createOpenApiSchemaUri(server: string): string {
	if (server === undefined) {
		throw new Error('The API server host name is missing from the configuration.');
	}
	return URL_Join(server, OPENAPI_SCHEMA_PATH);
}
