import { command, Command } from 'commander';
import { logError, logSuccess } from '../common/console';
import { prompt } from 'enquirer';
import { ConfigState, ConfigStore } from '../config';
import { loadJsonFile } from '../common/file';

export function createConfigCmd(configStore: ConfigStore) {

	const loadCmd = command('load <path>');
	loadCmd.description('Load config settings from a JSON or JSONC file.');
	loadCmd.action(async (path: string, cmd: Command) => {
		const config = await loadJsonFile<ConfigState>(path);
		configStore.set(config);
	});

	const setCmd = command('set <key> [value]');
	setCmd.description('set a new config value');
	setCmd.action((key: string, value: string, options: any, cmd: Command) => {
		if (configStore.has(key) === false) {
			logError(`Invalid key "${key}"`);
			return;
		}
		configStore.set(key, value);
		logSuccess(`"${key}" set to ${value}`);
	});

	const getCmd = command('get <key>');
	getCmd.description('get the value of a setting');
	getCmd.action((key: string, options: {}, cmd: Command) => {
		if (configStore.has(key)) {
			return configStore.get(key);
		}
		logError(`"${key}" not found`);
	});

	const deleteCmd = command('delete <key>');
	getCmd.description('delete the value of a setting');
	getCmd.action((key: string, options: {}, cmd: Command) => {
		if (configStore.has(key)) {
			// @ts-ignore as library typechecks key names against the type specified during initialisation
			configStore.delete(key);
			logSuccess(`"${key}" deleted`);
		}
	});

	const resetCmd = command('reset [key]');
	resetCmd.description('Reset config to defaults', { key: 'Supply a key name if you want to reset just one key value'});
	resetCmd.action(async (key: string, options: {}, cmd: Command) => {
		const reset = await promptResetConfirmation(key);
		if (reset === true) {
			if (key === undefined) {
				configStore.clear();
				logSuccess('Configuration restored to default settings');
				return;
			}
			if (configStore.has(key) === false) {
				logError(`"${key} not found`);
				return;
			}
			// @ts-ignore
			configStore.reset(key);
			logSuccess(`"${key}" restored to its default setting`);
		}
	});

	const listCmd = command('list');
	listCmd.description('list settings');
	listCmd.action((options: {}, cmd: Command) => {
		console.log(configStore.store);
	});

	const configCmd = command('config');
	configCmd.addCommand(loadCmd);
	configCmd.addCommand(setCmd);
	configCmd.addCommand(getCmd);
	configCmd.addCommand(listCmd);
	configCmd.addCommand(deleteCmd);
	configCmd.addCommand(resetCmd);

	return configCmd;

}

async function promptResetConfirmation(key?: string): Promise<boolean> {
	const { reset } = await prompt<{ reset: boolean}>({
		type: 'confirm',
		name: 'reset',
		initial: false,
		message: `Please confirm that you wish to reset ${key !== undefined ? `"${key}" to its default value?` : 'all keys to their defaults?'}`
	});
	return reset;
}
