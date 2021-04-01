import { command, Command } from 'commander';
import { UpdateSchemaTaskRunner } from "../../tasks/update-schemas-task-runner";

export function createSchemaCmd(updateSchemaTaskRunner: UpdateSchemaTaskRunner) {
	const schemaCmd = command('schema');
	schemaCmd.description('Manage OpenAPI schema definitions');

	const updateCmd = command('update');
	updateCmd.description('Update OpenAPI schemas from the server');
	updateCmd.action(async (options: {}, cmd: Command) => {
		const { accountsSchema } = await updateSchemaTaskRunner();
		console.log(accountsSchema);
	});

	schemaCmd.addCommand(updateCmd);
	return schemaCmd;
}
