import { program, command, Command } from 'commander';
import Conf from 'conf/dist/source';
import { Config } from '../../config';

export function createFixturesCmd(config: Conf<Config>) {
	const fixturesCmd = command('fixtures <file>');
	fixturesCmd.description('load fixtures from file');
	fixturesCmd.action((options: { key: string; value: string;}, cmd: Command) => {
		console.log(options);
	});
	return fixturesCmd;
}
