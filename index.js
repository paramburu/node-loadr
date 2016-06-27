'use strict';

const debug = require('debug')('loadr');

const fs = require('fs');
const mpath = require('path');

const BASE_PATH = mpath.dirname(require.main.filename);

const defaults = {
	namer: namer
};


function isFolder(folder) {
	return fs.statSync(folder.path).isDirectory();
}


function toCamelCase(str) {
	return str.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
}


function namer (module_name) {
	return toCamelCase(module_name);
}

function merger (previousValue, currentValue) {
	return Object.assign({}, previousValue, currentValue);
}

function traverse(options, cwd, modules) {
	let children = fs.readdirSync(cwd).map((path) => {
		return {
			name: path,
			path: mpath.join(cwd, path),
		};
	}).filter(isFolder).map((folder) => {
		let module = {};

		let loaded = treefy(options, folder.path, modules);

		if (Object.keys(loaded).length) {
			module[folder.name] = loaded;
		}

		return module;
	}).reduce(merger, {});

	if (!Object.keys(children).length) {
		return;
	}

	return children;
}


function load(options, cwd, __module) {
	let exports = {};

	try {
		let path = mpath.join(cwd, __module);
		exports[options.namer(__module)] = require(path);
		debug('loaded', path);
	} catch (e) {
	}

	return exports;
}


function treefy(options, cwd, modules) {
	let exports = {};
	let loaded = modules
		.map(load.bind(null, options, cwd))
		.reduce(merger, {});

	if (Object.keys(loaded).length) {
		exports = loaded;
	}

	let children = traverse(options, cwd, modules);

	if (children) {
		Object.assign(exports, children);
	}

	return exports;
}


module.exports = loadr;

function loadr(modules, base, options) {
	if (typeof modules === 'object') {
		options = modules;
		modules = options.modules;
		base = options.base;
	}

	options = Object.assign({}, options, defaults);

	let cwd = typeof base === 'string' ? mpath.resolve(BASE_PATH, base) : BASE_PATH;

	if (typeof modules === 'string') {
		modules = modules.split();
	}

	return treefy(options, cwd, modules);
}
