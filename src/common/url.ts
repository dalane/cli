// source: https://www.w3resource.com/javascript-exercises/fundamental/javascript-fundamental-exercise-55.php
export const URL_Join = (...args: string[]) =>
	args
		.join('/')
		.replace(/[\/]+/g, '/')
		.replace(/^(.+):\//, '$1://')
		.replace(/^file:/, 'file:/')
		.replace(/\/(\?|&|#[^!])/g, '$1')
		// .replace(/\?/g, '&')
		// .replace('&', '?');
