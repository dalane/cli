// import { App } from "../app/server";
// import { normalisePath, readFile } from "../app/core/file-system";
// import Debug from 'debug';
// import { parse } from "jsonc-parser";
// import { generateUuid } from "../app/core/uuid";
// import { createProjectCommandHandlerFn, CreateProjectCommandData } from "../app/resources/projects/commands";
// import { userInfo } from "os";
// import { makeCreateObsCommandHandlerFn, CreateObsAggregateCommandData, makeAddObsElementCommandHandlerFn, AddObsElementCommandData } from "../app/resources/obs/commands";
// import { CreateWbsAggregateCommandData, makeCreateWbsCommandHandlerFn } from "../app/resources/wbs/commands";
// import { makeCreateRamCommandHandlerFn, AddRamAssignmentCommandData, makeAddRamAssignmentCommandHandlerFn, CreateProjectRamCommandData } from "../app/resources/ram/commands";
// import { AddWorkPackageCommand, makeAddWorkPackageCommandHandlerFn } from "../app/resources/work-package/commands";
// import { AddRiskCommand, makeAddRiskCommandHandlerFn } from "../app/resources/risks/commands";
// import { CreateAssumptionCommandData as AddAssumptionCommand, createAddAssumptionCommand } from "../app/resources/assumptions/commands";
// import { AddIssueCommand, makeAddIssueCommandHandlerFn } from "../app/resources/issues/commands";
// import { AddDependencyCommand, makeAddDependencyCommandHandlerFn } from "../app/resources/dependencies/commands";
// import { CreateRbsCommandData, makeCreateRbsCommandHandlerFn } from "../app/resources/rbs/commands";
// import { makeCreateOrganisationCommandFn, CreateOrganisationCommandData } from "../app/resources/organisations/commands";
// import { makeCreateUserCommandFn, CreateUserCommandData } from "../app/resources/users/commands";
// import { makeCreateTeamMemberCommandFn, CreateTeamMemberCommandData } from "../app/resources/team/commands";

// const debug = Debug('app:cli:fixtures');

// export const makeApplyFixturesFn = (application: App) => async (fixturesPath: any) => {

// 	if (undefined === fixturesPath) {
// 		return;
// 	}

// /** Apply an fixtures that might have been provided through a fixtures file before we start listening for updates. */
// 	debug('applying fixtures');

// 	const fixtures: any = await loadJsonFile(fixturesPath);
// 	const correlation_id = generateUuid();
// 	const metadata = {
// 		user: userInfo(),
// 		client: 'cli-0.0.1'
// 	};

// 	if (fixtures?.fixtures?.organisations) {
// 		debug('adding organisation fixtures');
// 		const createOrganisationCommandFn = makeCreateOrganisationCommandFn(application.commands);
// 		for (const organisation of <CreateOrganisationCommandData[]>fixtures.fixtures.organisations) {
// 			const { organisation_id, name, status, status_description } = organisation;
// 			const result = await createOrganisationCommandFn({ data: { organisation_id, name, status, status_description }});
// 			if (result instanceof Error) {
// 				debug(result);
// 				return process.exit(1);
// 			}
// 			debug(`fixture for organisation "${result.name}" ("${result.organisation_id}") added.`);
// 		}
// 	}

// 	if (fixtures?.fixtures?.users) {
// 		debug('adding user fixtures');
// 		const createUserCommandFn = makeCreateUserCommandFn(application.commands);
// 		for (const user of <CreateUserCommandData[]>fixtures.fixtures.users) {
// 			const { user_id, name, email } = user;
// 			const result = await createUserCommandFn({ data: { user_id, name, email }});
// 			if (result instanceof Error) {
// 				debug(result);
// 				return process.exit(1);
// 			}
// 			debug(`fixture for user "${result.name}" ("${result.user_id}") added.`);
// 		}
// 	}

// 	if (fixtures?.fixtures?.team_members) {
// 		debug('adding team member fixtures');
// 		const createTeamMemberCommandFn = makeCreateTeamMemberCommandFn(application.commands);
// 		for (const user of <CreateTeamMemberCommandData[]>fixtures.fixtures.team_members) {
// 			const {team_membership_id, user_id, organisation_id, role } = user;
// 			const result = await createTeamMemberCommandFn({ data: { team_membership_id, user_id, organisation_id, role }});
// 			if (result instanceof Error) {
// 				debug(result);
// 				return process.exit(1);
// 			}
// 			debug(`fixture for team membership ("${result.user_id}") added.`);
// 		}
// 	}

// 	if (fixtures?.fixtures?.projects) {
// 		debug('adding project fixtures');
// 		const createProjectCommand = createProjectCommandHandlerFn(application.commands);
// 		for (const project of <CreateProjectCommandData[]>fixtures.fixtures.projects) {
// 			const { project_id, organisation_id, friendly_id, name, status, owner_id } = project;
// 			const result = await createProjectCommand({
// 				data: {
// 					project_id,
// 					organisation_id,
// 					friendly_id,
// 					name,
// 					status,
// 					owner_id,
// 				},
// 				correlation_id,
// 				metadata
// 			});
// 			if (result instanceof Error) {
// 				debug(result);
// 				return process.exit(1);
// 			}
// 			debug(`project fixture for project "${result.name}" with project id "${result.project_id}" added.`);
// 		}
// 	}

// 	if (fixtures?.fixtures?.obs) {
// 		debug('adding obs fixtures');
// 		const createObsCommandHandlerFn = makeCreateObsCommandHandlerFn(application.commands);
// 		for (const obs of <CreateObsAggregateCommandData[]>fixtures.fixtures.obs) {
// 			const { project_id, elements } = obs;
// 			const createObsResult = await createObsCommandHandlerFn({
// 				data: {
// 					project_id,
// 					elements
// 				},
// 				correlation_id,
// 				metadata
// 			});
// 			if (createObsResult instanceof Error) {
// 				debug(`creation of OBS fixture returned error "${createObsResult.name}"`);
// 				return;
// 			}
// 			debug(`created obs fixture for project "${obs.project_id}".`);
// 		}
// 	}

// 	if (fixtures?.fixtures?.wbs) {
// 		debug('adding wbs fixtures');
// 		const createWbsCommandHandlerFn = makeCreateWbsCommandHandlerFn(application.commands);
// 		for (const wbs of <CreateWbsAggregateCommandData[]>fixtures.fixtures.wbs) {
// 			const { project_id, elements } = wbs;
// 			const createWbsResult = await createWbsCommandHandlerFn({
// 				data: {
// 					project_id,
// 					elements
// 				},
// 				correlation_id,
// 				metadata
// 			});
// 			if (createWbsResult instanceof Error) {
// 				debug(`creation of WBS fixture returned error "${createWbsResult.name}"`);
// 				return;
// 			}
// 			debug(`created wbs fixture for project "${wbs.project_id}".`);
// 		}
// 	}

// 	if (fixtures?.fixtures?.rbs) {
// 		debug('adding rbs fixtures');
// 		const createRbsCommandHandlerFn = makeCreateRbsCommandHandlerFn(application.commands);
// 		for (const rbs of <CreateRbsCommandData[]>fixtures.fixtures.rbs) {
// 			const { project_id, elements } = rbs;
// 			const createRbsResult = await createRbsCommandHandlerFn({
// 				data: {
// 					project_id,
// 					elements
// 				},
// 				correlation_id,
// 				metadata
// 			});
// 			if (createRbsResult instanceof Error) {
// 				debug(`creation of RBS returned error "${createRbsResult.name}"`);
// 				return;
// 			}
// 			debug(`created wbs fixture for project "${project_id}".`);
// 		}
// 	}

// 	if (fixtures?.fixtures?.work_packages) {
// 		debug('adding work package fixtures');
// 		const addWorkPackageCommandHandlerFn = makeAddWorkPackageCommandHandlerFn(application.commands);
// 		for (const work_package of <AddWorkPackageCommand[]>fixtures.fixtures.work_packages) {
// 			const data = { ...work_package };
// 			const result = await addWorkPackageCommandHandlerFn({ data, correlation_id, metadata });
// 			if (result instanceof Error) {
// 				debug(`creation of work package "${work_package.title}" returned error "${result.name}".`);
// 				throw result;
// 			}
// 			debug(`added work package "${work_package.title}" to project "${work_package.project_id}" wbs.`);
// 		}
// 	}

// 	if (fixtures?.fixtures?.risks) {
// 		debug('adding risk fixtures');
// 		const addRiskCommandHandlerFn = makeAddRiskCommandHandlerFn(application.commands);
// 		for (const risk of <AddRiskCommand[]>fixtures.fixtures.risks) {
// 			const result = await addRiskCommandHandlerFn({ data: { ...risk }, correlation_id, metadata });
// 			if (result instanceof Error) {
// 				debug(`creation of risk "${risk.name}" returned error "${result.name}".`);
// 				throw result;
// 			}
// 			debug(`added risk "${risk.name}" to project "${risk.project_id}".`);
// 		}
// 	}

// 	if (fixtures?.fixtures?.assumptions) {
// 		debug('adding assumption fixtures');
// 		const commandDispatcher = createAddAssumptionCommand(application.commands);
// 		for (const assumption of <AddAssumptionCommand[]>fixtures.fixtures.assumptions) {
// 			const data = { ...assumption };
// 			const result = await commandDispatcher({ data, correlation_id, metadata });
// 			if (result instanceof Error) {
// 				debug(`creation of assumption "${assumption.name}" returned error "${result.name}".`);
// 				throw result;
// 			}
// 			debug(`added assumption "${assumption.name}" to project "${assumption.project_id}".`);
// 		}
// 	}

// 	if (fixtures?.fixtures?.issues) {
// 		debug('adding issue fixtures');
// 		const addIssueCommandHandlerFn = makeAddIssueCommandHandlerFn(application.commands);
// 		for (const issue of <AddIssueCommand[]>fixtures.fixtures.issues) {
// 			const data = { ...issue };
// 			const result = await addIssueCommandHandlerFn({ data, correlation_id, metadata });
// 			if (result instanceof Error) {
// 				debug(`creation of issue "${issue.name}" returned error "${result.name}".`);
// 				throw result;
// 			}
// 			debug(`added issue "${issue.name}" to project "${issue.project_id}".`);
// 		}
// 	}

// 	if (fixtures?.fixtures?.dependencies) {
// 		debug('adding dependency fixtures');
// 		const addDependencyCommandHandlerFn = makeAddDependencyCommandHandlerFn(application.commands);
// 		for (const dependency of <AddDependencyCommand[]>fixtures.fixtures.dependencies) {
// 			const data = { ...dependency };
// 			const result = await addDependencyCommandHandlerFn({ data, correlation_id, metadata });
// 			if (result instanceof Error) {
// 				debug(`creation of dependency "${dependency.name}" returned error "${result.name}".`);
// 				throw result;
// 			}
// 			debug(`added dependency "${dependency.name}" to project "${dependency.project_id}".`);
// 		}
// 	}

// 	if (fixtures?.fixtures?.ram) {
// 		debug('adding ram fixtures');
// 		const createRamCommandHandlerFn = makeCreateRamCommandHandlerFn(application.commands);
// 		for (const ram of <CreateProjectRamCommandData[]>fixtures.fixtures.ram) {
// 			const { project_id, assignments } = ram;
// 			const createRamResult = await createRamCommandHandlerFn({
// 				data: {
// 					project_id
// 				},
// 				correlation_id,
// 				metadata
// 			});
// 			if (createRamResult instanceof Error) {
// 				debug(`creation of RAM fixture returned error "${createRamResult.name}"`);
// 				return;
// 			}
// 			debug(`created ram entity for project "${project_id}".`);
// 			if (fixtures?.fixtures?.ram_assignments) {
// 				const addRamAssignmentCommandHandlerFn = makeAddRamAssignmentCommandHandlerFn(application.commands);
// 				for (const _assignment of <AddRamAssignmentCommandData[]>fixtures.fixtures.ram_assignments) {
// 					const { assignment_id, wbs_element_id, obs_element_id, assignment } = _assignment;
// 					const result = await addRamAssignmentCommandHandlerFn({
// 						data: {
// 							project_id,
// 							assignment_id,
// 							wbs_element_id,
// 							obs_element_id,
// 							assignment
// 						},
// 						correlation_id,
// 						metadata
// 					});
// 					if (result instanceof Error) {
// 						debug(`creation of RAM assignment "${assignment_id}" returned error "${result.name}".`);
// 						throw result;
// 					}
// 					debug(`added ram assignment "${assignment_id}" to project "${ram.project_id}" RAM.`);
// 				}
// 			}
// 		}
// 	}

// };
