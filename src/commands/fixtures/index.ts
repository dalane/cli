import { command, Command } from 'commander';
import { ConfigStore } from '../../config';

export function createFixturesCmd(config: ConfigStore) {
	const fixturesCmd = command('fixtures <file>');
	fixturesCmd.description('load fixtures from file');
	fixturesCmd.action((options: { key: string; value: string;}, cmd: Command) => {
		console.log(options);
	});
	return fixturesCmd;
}
