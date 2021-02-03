import chalk from "chalk";

const log = console.log;
const error = console.error;

const formatSuccess = chalk.bgGreen.whiteBright;
const formatError = chalk.bgRed.whiteBright;

export const logSuccess = (message: string) => log(formatSuccess(message));
export const logError = (message: string) => error(formatError(message));
