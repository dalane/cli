import Conf from 'conf';
import { command, Command } from 'commander';
import { logError, logSuccess } from '../common/console';
import { prompt } from 'enquirer';
import { Config } from '../config';
import { createOAuthWellknownUri } from '../oauth';

const supportedEditableConfigSettings: string[] = [ 'client_id', 'oauth_auth_server' ];

export function createConfigCmd(config: Conf<Config>) {

	// if the oauth_auth_server changes then update the well-known uri with the new
	// server
	config.onDidChange('oauth_auth_server', (newValue: any, oldValue: any) => config.set('oauth_wellknown_uri', createOAuthWellknownUri(newValue)));

	const setCmd = command('set <key> [value]');
	setCmd.description('set a new config value');
	setCmd.action((key: string, value: string, options: any, cmd: Command) => {
		if (supportedEditableConfigSettings.includes(key) === false) {
			logError(`Invalid key "${key}"`);
			return;
		}
		config.set(key, value);
		logSuccess(`"${key}" set to ${value}`);
	});

	const getCmd = command('get <key>');
	getCmd.description('get the value of a setting');
	getCmd.action((key: string, options: {}, cmd: Command) => {
		if (config.has(key)) {
			return config.get(key);
		}
		logError(`"${key}" not found`);
	});

	const deleteCmd = command('delete <key>');
	getCmd.description('delete the value of a setting');
	getCmd.action((key: string, options: {}, cmd: Command) => {
		if (config.has(key)) {
			// @ts-ignore
			config.delete(key);
			logSuccess(`"${key}" deleted`);
		}
	});

	const resetCmd = command('reset [key]');
	resetCmd.description('Reset config to defaults', { key: 'Supply a key name if you want to reset just one key value'});
	resetCmd.action(async (key: string, options: {}, cmd: Command) => {
		const reset = await promptResetConfirmation(key);
		if (reset === true) {
			if (key === undefined) {
				config.clear();
				logSuccess('Configuration restored to default settings');
				return;
			}
			if (config.has(key) === false) {
				logError(`"${key} not found`);
				return;
			}
			// @ts-ignore
			config.reset(key);
			logSuccess(`"${key}" restored to its default setting`);
		}
	});

	const listCmd = command('list');
	listCmd.description('list settings');
	listCmd.action((options: {}, cmd: Command) => {
		console.log(config.store);
	});

	const configCmd = command('config');
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
		message: `Please confirm that you wish to reset ${key !== undefined ? `"${key}" to its default value` : 'all keys to their defaults'}?`
	});
	return reset;
}
