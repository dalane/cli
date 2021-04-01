import { Command, command } from "commander";
import { AccountsApiDefinitionCache, ConfigStore, JWKSCache, OIDCConfigCache, ProjectsApiDefinitionCache } from "../../config";
import { CacheConfigTaskRunner } from "../../tasks/cache-config-runner";

export function createInitCommand(cacheConfigTaskRunner: CacheConfigTaskRunner) {
	const initCmd = command('init');
	initCmd.description('Initialises application configuration from the Auth Server and API servers');
	initCmd.action(async (options: {}, cmd: Command) => {
		await cacheConfigTaskRunner();
	});
	return initCmd;
}
