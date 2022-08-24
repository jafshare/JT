#! /usr/bin/env node
'use strict';

var figlet = require('figlet');
var fsPath = require('path');
var chalk = require('chalk');
var commander = require('commander');
var inquirer = require('inquirer');
var fsExtra = require('fs-extra');
var ora = require('ora');
var gitly = require('gitly');
var node_buffer = require('node:buffer');
var path = require('node:path');
var childProcess = require('node:child_process');
var process$1 = require('node:process');
var crossSpawn = require('cross-spawn');
var os = require('os');
require('node:os');
require('signal-exit');
require('get-stream');
require('merge-stream');
var fs = require('fs');
var child_process = require('child_process');
var makeDir = require('make-dir');
var shellEscape = require('shell-escape');
var invariant = require('assert');
var SSH2 = require('ssh2');
var archiver = require('archiver');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var figlet__default = /*#__PURE__*/_interopDefaultLegacy(figlet);
var fsPath__default = /*#__PURE__*/_interopDefaultLegacy(fsPath);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var inquirer__default = /*#__PURE__*/_interopDefaultLegacy(inquirer);
var ora__default = /*#__PURE__*/_interopDefaultLegacy(ora);
var gitly__default = /*#__PURE__*/_interopDefaultLegacy(gitly);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var childProcess__default = /*#__PURE__*/_interopDefaultLegacy(childProcess);
var process__default = /*#__PURE__*/_interopDefaultLegacy(process$1);
var crossSpawn__default = /*#__PURE__*/_interopDefaultLegacy(crossSpawn);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var makeDir__default = /*#__PURE__*/_interopDefaultLegacy(makeDir);
var shellEscape__default = /*#__PURE__*/_interopDefaultLegacy(shellEscape);
var invariant__default = /*#__PURE__*/_interopDefaultLegacy(invariant);
var SSH2__default = /*#__PURE__*/_interopDefaultLegacy(SSH2);
var archiver__default = /*#__PURE__*/_interopDefaultLegacy(archiver);

var name = "jtcommand";
var version = "1.0.5";
var description = "";
var author = "HunterJiang";
var main = "bin/index.js";
var bin = {
	jt: "./bin/index.js"
};
var repository = {
	type: "git",
	url: "https://github.com/jafshare/JT"
};
var scripts = {
	test: "ts-node src/index.ts",
	dev: "rollup -c -w",
	build: "rollup -c",
	link: "yarn link",
	unlink: "yarn unlink"
};
var dependencies = {
	"@types/archiver": "^5.3.1",
	archiver: "^5.3.1",
	chalk: "^4.1.2",
	commander: "^8.3.0",
	execa: "^6.0.0",
	figlet: "^1.5.2",
	"fs-extra": "^10.0.0",
	gitly: "^2.2.1",
	inquirer: "^8.2.0",
	"node-ssh": "11.1.1",
	ora: "5.4.1"
};
var devDependencies = {
	"@rollup/plugin-json": "^4.1.0",
	"@rollup/plugin-node-resolve": "^13.0.6",
	"@types/chalk": "^2.2.0",
	"@types/commander": "^2.12.2",
	"@types/execa": "^2.0.0",
	"@types/figlet": "^1.5.4",
	"@types/fs-extra": "^9.0.13",
	"@types/inquirer": "^8.1.3",
	"@types/node": "^16.11.9",
	"@types/rollup": "^0.54.0",
	rollup: "^2.60.0",
	"rollup-plugin-typescript2": "^0.31.0",
	"ts-node": "^10.4.0",
	typescript: "^4.5.2"
};
var pkg = {
	name: name,
	version: version,
	description: description,
	author: author,
	main: main,
	bin: bin,
	repository: repository,
	scripts: scripts,
	dependencies: dependencies,
	devDependencies: devDependencies
};

const VERSION = 'V' + pkg.version;
const PROJECT_NAME = 'jt';
const TEMP_DIR_NAME = '.temp';
const TEMP_PATH = fsPath__default["default"].join(__dirname, '..', TEMP_DIR_NAME);

const debug = (...args) => {
    console.log(chalk__default["default"].greenBright(...args));
};
const success = (...args) => {
    debug(...args);
};
const info = (...args) => {
    console.log(chalk__default["default"].white(...args));
};
const error = (...args) => {
    console.log(chalk__default["default"].redBright(...args));
};
/**
 * 返回下划线修饰以及加粗的字符
 * @param args 任意字符
 * @returns
 */
const underlineAndBold = (...args) => {
    return chalk__default["default"].underline.bold(...args);
};
/**
 * 返回红色文字
 * @param args 任意字符
 * @returns
 */
const danger = (...args) => {
    return chalk__default["default"].redBright(...args);
};
/**
 * 换行
 * @param lineNumber 换行数，默认一行
 */
const newline = (lineNumber = 1) => {
    for (let index = 0; index < lineNumber; index++) {
        success();
    }
};
/**
 * 返回箭头
 */
const arrow = () => {
    success("   ⇓");
};

const program = new commander.Command();

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

/**
 * 模板下载
 */
const gitDownload = (src, dest, loadingText) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        const loading = loadingText ? ora__default["default"](loadingText) : null;
        loading && loading.start();
        try {
            yield gitly__default["default"](src, dest, { temp: TEMP_PATH });
            loading && loading.succeed();
            resolve(undefined);
        }
        catch (error) {
            loading && loading.fail('下载错误' + error);
            reject(error);
        }
    }));
});

const CONFIG_DIR = fsPath__default["default"].join(__dirname, "../config");
const TEMPLATE_PATH = fsPath__default["default"].join(CONFIG_DIR, 'templates.json');
const REGISTRY_PATH = fsPath__default["default"].join(CONFIG_DIR, 'registries.json');
const DEPLOY_PATH = fsPath__default["default"].join(CONFIG_DIR, 'deploys.json');

const configs = {
    registries: fsExtra.existsSync(REGISTRY_PATH) ? require(REGISTRY_PATH) : [],
    templates: fsExtra.existsSync(TEMPLATE_PATH) ? require(TEMPLATE_PATH) : []
};

const defineCommand = (command) => {
    return command;
};

const COMMAND = {
    // 生成项目
    INIT: "init",
    INIT_ALIAS: "i",
    // 换源
    CHANGE_REGISTRY: "change-registry",
    CHANGE_REGISTRY_ALIAS: "cr",
    // 模板
    TEMPLATE: "template",
    TEMPLATE_ALIAS: "tp",
    // 部署
    DEPLOY: 'deploy',
    DEPLOY_ALIAS: 'dp',
};

function createByTemplate() {
    return __awaiter(this, void 0, void 0, function* () {
        const templates = configs.templates;
        const defaultProjectName = 'jt-template';
        const answers = yield inquirer__default["default"].prompt([
            {
                type: "input",
                name: "projectName",
                message: "项目名称：",
                default: defaultProjectName
            },
            {
                type: 'list',
                name: 'template',
                message: "项目模板：",
                choices: templates.map((item) => item.name)
            }
        ]);
        const template = templates.find((item) => item.name === answers.template);
        const projectPath = answers.projectName;
        const pathExists = fsExtra.existsSync(projectPath);
        // 下载模板
        try {
            if (pathExists) {
                const ans = yield inquirer__default["default"].prompt([
                    {
                        name: 'isOverride',
                        type: 'confirm',
                        message: `${answers.projectName} 已存在,是否继续`
                    },
                    {
                        name: 'mode',
                        type: 'list',
                        message: '请选择覆盖模式',
                        choices: ['override', 'replace']
                    }
                ]);
                if (!ans.isOverride) {
                    return;
                }
                else {
                    // 如果确认覆盖，选择模式，如果是override,则不做处理,如果是replace，则替换整个目录
                    if (ans.mode === 'replace') {
                        // 先删除目录，再创建
                        fsExtra.rmSync(projectPath, { recursive: true });
                        fsExtra.mkdirSync(projectPath);
                    }
                }
            }
            const specifyDirIdentity = '%';
            let specifyDir = '';
            let sourceUrl = template.local ? template.localPath : template.remoteSrc;
            // 判断是否有指定目录的语法
            if (sourceUrl === null || sourceUrl === void 0 ? void 0 : sourceUrl.includes(specifyDirIdentity)) {
                [sourceUrl, specifyDir] = sourceUrl.split(specifyDirIdentity);
                // 需要支持多层文件夹语法
                if (specifyDir) {
                    specifyDir = fsPath__default["default"].join(...specifyDir.split('.'));
                }
            }
            // 创建目录
            !pathExists && (yield fsExtra.mkdir(answers.projectName));
            // 如果是远程代码则拉取仓库
            !template.local && (yield gitDownload(sourceUrl, fsPath__default["default"].join(TEMP_PATH, answers.projectName), '模板下载中...'));
            const sourcePath = template.local ? fsPath__default["default"].join(sourceUrl, specifyDir) : fsPath__default["default"].join(TEMP_PATH, answers.projectName, specifyDir);
            // 拷贝文件
            yield fsExtra.copy(sourcePath, answers.projectName);
            // 删除缓存文件
            yield fsExtra.remove(fsPath__default["default"].join(TEMP_PATH, answers.projectName));
        }
        catch (err) {
            error(err);
            return;
        }
        // TODO 后续处理
        success('\r\n创建完成！');
        info(`  cd ${answers.projectName}\r\n`);
    });
}
var initCommand = defineCommand({
    name: COMMAND.INIT, use: (ctx) => {
        ctx.program.version(VERSION)
            .command(COMMAND.INIT)
            .alias(COMMAND.INIT_ALIAS)
            .description('根据模板创建')
            .action(() => {
            createByTemplate();
        });
    }
});

function stripFinalNewline(input) {
	const LF = typeof input === 'string' ? '\n' : '\n'.charCodeAt();
	const CR = typeof input === 'string' ? '\r' : '\r'.charCodeAt();

	if (input[input.length - 1] === LF) {
		input = input.slice(0, -1);
	}

	if (input[input.length - 1] === CR) {
		input = input.slice(0, -1);
	}

	return input;
}

function pathKey(options = {}) {
	const {
		env = process.env,
		platform = process.platform
	} = options;

	if (platform !== 'win32') {
		return 'PATH';
	}

	return Object.keys(env).reverse().find(key => key.toUpperCase() === 'PATH') || 'Path';
}

function npmRunPath(options = {}) {
	const {
		cwd = process__default["default"].cwd(),
		path: path_ = process__default["default"].env[pathKey()],
		execPath = process__default["default"].execPath,
	} = options;

	let previous;
	let cwdPath = path__default["default"].resolve(cwd);
	const result = [];

	while (previous !== cwdPath) {
		result.push(path__default["default"].join(cwdPath, 'node_modules/.bin'));
		previous = cwdPath;
		cwdPath = path__default["default"].resolve(cwdPath, '..');
	}

	// Ensure the running `node` binary is used.
	result.push(path__default["default"].resolve(cwd, execPath, '..'));

	return [...result, path_].join(path__default["default"].delimiter);
}

function npmRunPathEnv({env = process__default["default"].env, ...options} = {}) {
	env = {...env};

	const path = pathKey({env});
	options.path = env[path];
	env[path] = npmRunPath(options);

	return env;
}

const getRealtimeSignals=function(){
const length=SIGRTMAX-SIGRTMIN+1;
return Array.from({length},getRealtimeSignal);
};

const getRealtimeSignal=function(value,index){
return {
name:`SIGRT${index+1}`,
number:SIGRTMIN+index,
action:"terminate",
description:"Application-specific signal (realtime)",
standard:"posix"};

};

const SIGRTMIN=34;
const SIGRTMAX=64;

const SIGNALS=[
{
name:"SIGHUP",
number:1,
action:"terminate",
description:"Terminal closed",
standard:"posix"},

{
name:"SIGINT",
number:2,
action:"terminate",
description:"User interruption with CTRL-C",
standard:"ansi"},

{
name:"SIGQUIT",
number:3,
action:"core",
description:"User interruption with CTRL-\\",
standard:"posix"},

{
name:"SIGILL",
number:4,
action:"core",
description:"Invalid machine instruction",
standard:"ansi"},

{
name:"SIGTRAP",
number:5,
action:"core",
description:"Debugger breakpoint",
standard:"posix"},

{
name:"SIGABRT",
number:6,
action:"core",
description:"Aborted",
standard:"ansi"},

{
name:"SIGIOT",
number:6,
action:"core",
description:"Aborted",
standard:"bsd"},

{
name:"SIGBUS",
number:7,
action:"core",
description:
"Bus error due to misaligned, non-existing address or paging error",
standard:"bsd"},

{
name:"SIGEMT",
number:7,
action:"terminate",
description:"Command should be emulated but is not implemented",
standard:"other"},

{
name:"SIGFPE",
number:8,
action:"core",
description:"Floating point arithmetic error",
standard:"ansi"},

{
name:"SIGKILL",
number:9,
action:"terminate",
description:"Forced termination",
standard:"posix",
forced:true},

{
name:"SIGUSR1",
number:10,
action:"terminate",
description:"Application-specific signal",
standard:"posix"},

{
name:"SIGSEGV",
number:11,
action:"core",
description:"Segmentation fault",
standard:"ansi"},

{
name:"SIGUSR2",
number:12,
action:"terminate",
description:"Application-specific signal",
standard:"posix"},

{
name:"SIGPIPE",
number:13,
action:"terminate",
description:"Broken pipe or socket",
standard:"posix"},

{
name:"SIGALRM",
number:14,
action:"terminate",
description:"Timeout or timer",
standard:"posix"},

{
name:"SIGTERM",
number:15,
action:"terminate",
description:"Termination",
standard:"ansi"},

{
name:"SIGSTKFLT",
number:16,
action:"terminate",
description:"Stack is empty or overflowed",
standard:"other"},

{
name:"SIGCHLD",
number:17,
action:"ignore",
description:"Child process terminated, paused or unpaused",
standard:"posix"},

{
name:"SIGCLD",
number:17,
action:"ignore",
description:"Child process terminated, paused or unpaused",
standard:"other"},

{
name:"SIGCONT",
number:18,
action:"unpause",
description:"Unpaused",
standard:"posix",
forced:true},

{
name:"SIGSTOP",
number:19,
action:"pause",
description:"Paused",
standard:"posix",
forced:true},

{
name:"SIGTSTP",
number:20,
action:"pause",
description:"Paused using CTRL-Z or \"suspend\"",
standard:"posix"},

{
name:"SIGTTIN",
number:21,
action:"pause",
description:"Background process cannot read terminal input",
standard:"posix"},

{
name:"SIGBREAK",
number:21,
action:"terminate",
description:"User interruption with CTRL-BREAK",
standard:"other"},

{
name:"SIGTTOU",
number:22,
action:"pause",
description:"Background process cannot write to terminal output",
standard:"posix"},

{
name:"SIGURG",
number:23,
action:"ignore",
description:"Socket received out-of-band data",
standard:"bsd"},

{
name:"SIGXCPU",
number:24,
action:"core",
description:"Process timed out",
standard:"bsd"},

{
name:"SIGXFSZ",
number:25,
action:"core",
description:"File too big",
standard:"bsd"},

{
name:"SIGVTALRM",
number:26,
action:"terminate",
description:"Timeout or timer",
standard:"bsd"},

{
name:"SIGPROF",
number:27,
action:"terminate",
description:"Timeout or timer",
standard:"bsd"},

{
name:"SIGWINCH",
number:28,
action:"ignore",
description:"Terminal window size changed",
standard:"bsd"},

{
name:"SIGIO",
number:29,
action:"terminate",
description:"I/O is available",
standard:"other"},

{
name:"SIGPOLL",
number:29,
action:"terminate",
description:"Watched event",
standard:"other"},

{
name:"SIGINFO",
number:29,
action:"ignore",
description:"Request for process information",
standard:"other"},

{
name:"SIGPWR",
number:30,
action:"terminate",
description:"Device running out of power",
standard:"systemv"},

{
name:"SIGSYS",
number:31,
action:"core",
description:"Invalid system call",
standard:"other"},

{
name:"SIGUNUSED",
number:31,
action:"terminate",
description:"Invalid system call",
standard:"other"}];

const getSignals=function(){
const realtimeSignals=getRealtimeSignals();
const signals=[...SIGNALS,...realtimeSignals].map(normalizeSignal);
return signals;
};







const normalizeSignal=function({
name,
number:defaultNumber,
description,
action,
forced=false,
standard})
{
const{
signals:{[name]:constantSignal}}=
os.constants;
const supported=constantSignal!==undefined;
const number=supported?constantSignal:defaultNumber;
return {name,number,description,supported,action,forced,standard};
};

const getSignalsByName=function(){
const signals=getSignals();
return signals.reduce(getSignalByName,{});
};

const getSignalByName=function(
signalByNameMemo,
{name,number,description,supported,action,forced,standard})
{
return {
...signalByNameMemo,
[name]:{name,number,description,supported,action,forced,standard}};

};

const signalsByName=getSignalsByName();




const getSignalsByNumber=function(){
const signals=getSignals();
const length=SIGRTMAX+1;
const signalsA=Array.from({length},(value,number)=>
getSignalByNumber(number,signals));

return Object.assign({},...signalsA);
};

const getSignalByNumber=function(number,signals){
const signal=findSignalByNumber(number,signals);

if(signal===undefined){
return {};
}

const{name,description,supported,action,forced,standard}=signal;
return {
[number]:{
name,
number,
description,
supported,
action,
forced,
standard}};


};



const findSignalByNumber=function(number,signals){
const signal=signals.find(({name})=>os.constants.signals[name]===number);

if(signal!==undefined){
return signal;
}

return signals.find((signalA)=>signalA.number===number);
};

getSignalsByNumber();

const getErrorPrefix = ({timedOut, timeout, errorCode, signal, signalDescription, exitCode, isCanceled}) => {
	if (timedOut) {
		return `timed out after ${timeout} milliseconds`;
	}

	if (isCanceled) {
		return 'was canceled';
	}

	if (errorCode !== undefined) {
		return `failed with ${errorCode}`;
	}

	if (signal !== undefined) {
		return `was killed with ${signal} (${signalDescription})`;
	}

	if (exitCode !== undefined) {
		return `failed with exit code ${exitCode}`;
	}

	return 'failed';
};

const makeError = ({
	stdout,
	stderr,
	all,
	error,
	signal,
	exitCode,
	command,
	escapedCommand,
	timedOut,
	isCanceled,
	killed,
	parsed: {options: {timeout}},
}) => {
	// `signal` and `exitCode` emitted on `spawned.on('exit')` event can be `null`.
	// We normalize them to `undefined`
	exitCode = exitCode === null ? undefined : exitCode;
	signal = signal === null ? undefined : signal;
	const signalDescription = signal === undefined ? undefined : signalsByName[signal].description;

	const errorCode = error && error.code;

	const prefix = getErrorPrefix({timedOut, timeout, errorCode, signal, signalDescription, exitCode, isCanceled});
	const execaMessage = `Command ${prefix}: ${command}`;
	const isError = Object.prototype.toString.call(error) === '[object Error]';
	const shortMessage = isError ? `${execaMessage}\n${error.message}` : execaMessage;
	const message = [shortMessage, stderr, stdout].filter(Boolean).join('\n');

	if (isError) {
		error.originalMessage = error.message;
		error.message = message;
	} else {
		error = new Error(message);
	}

	error.shortMessage = shortMessage;
	error.command = command;
	error.escapedCommand = escapedCommand;
	error.exitCode = exitCode;
	error.signal = signal;
	error.signalDescription = signalDescription;
	error.stdout = stdout;
	error.stderr = stderr;

	if (all !== undefined) {
		error.all = all;
	}

	if ('bufferedData' in error) {
		delete error.bufferedData;
	}

	error.failed = true;
	error.timedOut = Boolean(timedOut);
	error.isCanceled = isCanceled;
	error.killed = killed && !timedOut;

	return error;
};

const aliases = ['stdin', 'stdout', 'stderr'];

const hasAlias = options => aliases.some(alias => options[alias] !== undefined);

const normalizeStdio = options => {
	if (!options) {
		return;
	}

	const {stdio} = options;

	if (stdio === undefined) {
		return aliases.map(alias => options[alias]);
	}

	if (hasAlias(options)) {
		throw new Error(`It's not possible to provide \`stdio\` in combination with one of ${aliases.map(alias => `\`${alias}\``).join(', ')}`);
	}

	if (typeof stdio === 'string') {
		return stdio;
	}

	if (!Array.isArray(stdio)) {
		throw new TypeError(`Expected \`stdio\` to be of type \`string\` or \`Array\`, got \`${typeof stdio}\``);
	}

	const length = Math.max(stdio.length, aliases.length);
	return Array.from({length}, (value, index) => stdio[index]);
};

function isStream(stream) {
	return stream !== null
		&& typeof stream === 'object'
		&& typeof stream.pipe === 'function';
}

const validateInputSync = ({input}) => {
	if (isStream(input)) {
		throw new TypeError('The `input` option cannot be a stream in sync mode');
	}
};

const nativePromisePrototype = (async () => {})().constructor.prototype;
['then', 'catch', 'finally'].map(property => [
	property,
	Reflect.getOwnPropertyDescriptor(nativePromisePrototype, property),
]);

const normalizeArgs = (file, args = []) => {
	if (!Array.isArray(args)) {
		return [file];
	}

	return [file, ...args];
};

const NO_ESCAPE_REGEXP = /^[\w.-]+$/;
const DOUBLE_QUOTES_REGEXP = /"/g;

const escapeArg = arg => {
	if (typeof arg !== 'string' || NO_ESCAPE_REGEXP.test(arg)) {
		return arg;
	}

	return `"${arg.replace(DOUBLE_QUOTES_REGEXP, '\\"')}"`;
};

const joinCommand = (file, args) => normalizeArgs(file, args).join(' ');

const getEscapedCommand = (file, args) => normalizeArgs(file, args).map(arg => escapeArg(arg)).join(' ');

const DEFAULT_MAX_BUFFER = 1000 * 1000 * 100;

const getEnv = ({env: envOption, extendEnv, preferLocal, localDir, execPath}) => {
	const env = extendEnv ? {...process__default["default"].env, ...envOption} : envOption;

	if (preferLocal) {
		return npmRunPathEnv({env, cwd: localDir, execPath});
	}

	return env;
};

const handleArguments = (file, args, options = {}) => {
	const parsed = crossSpawn__default["default"]._parse(file, args, options);
	file = parsed.command;
	args = parsed.args;
	options = parsed.options;

	options = {
		maxBuffer: DEFAULT_MAX_BUFFER,
		buffer: true,
		stripFinalNewline: true,
		extendEnv: true,
		preferLocal: false,
		localDir: options.cwd || process__default["default"].cwd(),
		execPath: process__default["default"].execPath,
		encoding: 'utf8',
		reject: true,
		cleanup: true,
		all: false,
		windowsHide: true,
		...options,
	};

	options.env = getEnv(options);

	options.stdio = normalizeStdio(options);

	if (process__default["default"].platform === 'win32' && path__default["default"].basename(file, '.exe') === 'cmd') {
		// #116
		args.unshift('/q');
	}

	return {file, args, options, parsed};
};

const handleOutput = (options, value, error) => {
	if (typeof value !== 'string' && !node_buffer.Buffer.isBuffer(value)) {
		// When `execaSync()` errors, we normalize it to '' to mimic `execa()`
		return error === undefined ? undefined : '';
	}

	if (options.stripFinalNewline) {
		return stripFinalNewline(value);
	}

	return value;
};

function execaSync(file, args, options) {
	const parsed = handleArguments(file, args, options);
	const command = joinCommand(file, args);
	const escapedCommand = getEscapedCommand(file, args);

	validateInputSync(parsed.options);

	let result;
	try {
		result = childProcess__default["default"].spawnSync(parsed.file, parsed.args, parsed.options);
	} catch (error) {
		throw makeError({
			error,
			stdout: '',
			stderr: '',
			all: '',
			command,
			escapedCommand,
			parsed,
			timedOut: false,
			isCanceled: false,
			killed: false,
		});
	}

	const stdout = handleOutput(parsed.options, result.stdout, result.error);
	const stderr = handleOutput(parsed.options, result.stderr, result.error);

	if (result.error || result.status !== 0 || result.signal !== null) {
		const error = makeError({
			stdout,
			stderr,
			error: result.error,
			signal: result.signal,
			exitCode: result.status,
			command,
			escapedCommand,
			parsed,
			timedOut: result.error && result.error.code === 'ETIMEDOUT',
			isCanceled: false,
			killed: result.signal !== null,
		});

		if (!parsed.options.reject) {
			return error;
		}

		throw error;
	}

	return {
		command,
		escapedCommand,
		exitCode: 0,
		stdout,
		stderr,
		failed: false,
		timedOut: false,
		isCanceled: false,
		killed: false,
	};
}

var registryCommand = defineCommand({
    name: COMMAND.CHANGE_REGISTRY,
    use: (ctx) => {
        // 更改淘宝源
        ctx.program.command(COMMAND.CHANGE_REGISTRY).alias(COMMAND.CHANGE_REGISTRY_ALIAS)
            .description('更换为淘宝下载源')
            .action(() => __awaiter(void 0, void 0, void 0, function* () {
            const registries = configs.registries;
            const ans = yield inquirer__default["default"].prompt([
                {
                    name: 'registry',
                    type: "list",
                    message: `请选择镜像源`,
                    choices: registries.map((item) => item.name)
                },
                {
                    name: 'packageManager',
                    type: 'list',
                    message: '请选择包管理器',
                    choices: ['npm', 'yarn', 'pnpm']
                }
            ]);
            try {
                // 判断 yarn | npm
                const command = ans.packageManager;
                const registry = registries.find((item) => item.name === ans.registry);
                execaSync(command, ['config', 'set', 'registry', registry.src]);
                success(`已更换为${underlineAndBold(ans.registry)}源`);
            }
            catch (err) {
                error(err);
            }
        }));
    }
});

/**
 * 存储基本类，封装基本的存储的功能
 */
class BaseRegistry {
    constructor(storePath, idPropName = "id") {
        this.storePath = storePath;
        this.idPropName = idPropName;
        this.data = [];
        this.load();
    }
    /**
     * 判断数据是否存在，根据name
     * @param id 唯一值
     * @returns 是否存在
     */
    exists(id) {
        return !!this.data.find(data => data[this.idPropName] === id);
    }
    /**
     * 获取指定数据
     * @param id 唯一标识
     */
    get(id) {
        if (!this.exists(id)) {
            throw new Error('模板不存在');
        }
        return this.data.find(tp => tp[this.idPropName] === id);
    }
    /**
     * 添加模板
     * @param template 模板参数
     */
    add(data) {
        // 去重
        const isExists = this.exists(data[this.idPropName]);
        if (isExists) {
            throw new Error('数据已存在');
        }
        this.data.push(data);
        this.save();
    }
    /**
     * 删除数据
     * @param id 数据唯一标识
     */
    remove(id) {
        const idx = this.data.findIndex(data => data[this.idPropName] === id);
        if (idx >= 0) {
            this.data.splice(idx, 1);
            this.save();
        }
    }
    /**
     * 更新数据
     * @param id 数据唯一标识
     */
    updated(id, data) {
        const idx = this.data.findIndex(data => data[this.idPropName] === id);
        if (idx < 0) {
            throw new Error('数据不存在');
        }
        const target = this.data[idx];
        // 合并数据
        Object.assign(target, data);
        this.save();
    }
    /**
     * 清空
     */
    clear() {
        this.data = [];
        this.save();
    }
    // 加载
    load() {
        // 判断文件是否存在
        if (!fsExtra.existsSync(this.storePath)) {
            this.data = [];
            return;
        }
        this.data = fsExtra.readJSONSync(this.storePath) || [];
    }
    // 保存
    save() {
        fsExtra.writeJSONSync(this.storePath, this.data, { spaces: 2 });
    }
}

/**
 * 对模板仓库的封装
 */
class TemplateRegistry extends BaseRegistry {
    constructor() {
        super(TEMPLATE_PATH, 'name');
    }
}
const templateRegistry = new TemplateRegistry();
const chooseTemplate = () => __awaiter(void 0, void 0, void 0, function* () {
    return inquirer__default["default"].prompt({
        name: 'name',
        type: 'list',
        message: '选择模板',
        choices: templateRegistry.data.map(item => item.name)
    });
});
var templateCommand = defineCommand({
    name: COMMAND.CHANGE_REGISTRY,
    use: (ctx) => {
        // 更改淘宝源
        ctx.program.command(COMMAND.TEMPLATE).alias(COMMAND.TEMPLATE_ALIAS)
            .description('模板功能')
            .option('-l, --ls', "列出所有模板信息")
            .option('-a, --add', "新增模板")
            .option('-r, --rm [模板名称]', "删除模板")
            .option('-u, --update [模板名称]', "更新模板")
            .option('-c, --clear', "清空模板")
            .option('-d, --detail [模板名称]', "模板详情")
            .action((options) => __awaiter(void 0, void 0, void 0, function* () {
            if (options.ls || Object.keys(options).length === 0) {
                success(templateRegistry.data.map((tp, index) => index + 1 + '. ' + tp.name).join('\r\n'));
            }
            else if (options.add) {
                //填写模板信息
                const ans = yield inquirer__default["default"].prompt([
                    {
                        name: 'templateName',
                        type: "input",
                        message: `请输入模板名称`,
                        validate(input) {
                            // 非空校验
                            if (!input) {
                                return '不能为空';
                            }
                            // 校验模板是否存在
                            if (templateRegistry.exists(input)) {
                                return '模板已存在';
                            }
                            return true;
                        },
                    },
                    {
                        name: 'local',
                        type: 'confirm',
                        message: '是否本地模板'
                    },
                    {
                        name: 'url',
                        type: 'input',
                        message: '模板地址',
                        validate(input) {
                            // 非空校验
                            // TODO后期添加协议校验
                            if (!input) {
                                return '不能为空';
                            }
                            return true;
                        },
                    }
                ]);
                templateRegistry.add({ name: ans.templateName, local: ans.local, localPath: ans.local ? ans.url : "", remoteSrc: ans.local ? "" : ans.url });
                success(`新增模板${underlineAndBold(ans.templateName)}`);
            }
            else if (options.update) {
                let id = options.update;
                // 如果未提供配置名称，则提供选择
                if (typeof id === 'boolean') {
                    if (templateRegistry.data.length === 0)
                        return success();
                    const ans = yield chooseTemplate();
                    id = ans.name;
                }
                if (!templateRegistry.exists(id)) {
                    error(`模板${underlineAndBold(id)}不存在`);
                    return;
                }
                const record = templateRegistry.get(id);
                //填写模板信息
                const ans = yield inquirer__default["default"].prompt([
                    {
                        name: 'templateName',
                        type: "input",
                        message: `请输入模板名称`,
                        default: record.name,
                        validate(input) {
                            // 非空校验
                            if (!input) {
                                return '不能为空';
                            }
                            // 校验模板是否存在
                            if (input !== record.name && templateRegistry.exists(input)) {
                                return '模板已存在';
                            }
                            return true;
                        },
                    },
                    {
                        name: 'local',
                        type: 'confirm',
                        message: '是否本地模板',
                        default: record.local
                    },
                    {
                        name: 'url',
                        type: 'input',
                        message: '模板地址',
                        default: record.local ? record.localPath : record.remoteSrc,
                        validate(input) {
                            // 非空校验
                            // TODO后期添加协议校验
                            if (!input) {
                                return '不能为空';
                            }
                            return true;
                        },
                    }
                ]);
                templateRegistry.updated(id, { name: ans.templateName, local: ans.local, localPath: ans.local ? ans.url : "", remoteSrc: ans.local ? "" : ans.url });
                success(`更新模板${underlineAndBold(id)}`);
            }
            else if (options.rm) {
                let id = options.rm;
                // 如果未提供配置名称，则提供选择
                if (typeof id === 'boolean') {
                    if (templateRegistry.data.length === 0)
                        return success();
                    const ans = yield chooseTemplate();
                    id = ans.name;
                }
                if (!templateRegistry.exists(id)) {
                    error(`模板${underlineAndBold(id)}不存在`);
                    return;
                }
                templateRegistry.remove(id);
                success(`已删除模板${underlineAndBold(id)}`);
            }
            else if (options.clear) {
                templateRegistry.clear();
                success(`模板已清空`);
            }
            else if (options.detail) {
                let id = options.detail;
                // 如果未提供配置名称，则提供选择
                if (typeof id === 'boolean') {
                    if (templateRegistry.data.length === 0)
                        return success();
                    const ans = yield chooseTemplate();
                    id = ans.name;
                }
                if (!templateRegistry.exists(id)) {
                    error(`模板${underlineAndBold(id)}不存在`);
                    return;
                }
                const record = templateRegistry.get(id);
                success('------------------------------');
                success('模板名称:', record.name);
                success('是否本地模板:', record.local ? '是' : '否');
                success('模板路径:', record.local ? record.localPath : record.remoteSrc);
                success('------------------------------');
            }
        }));
    }
});

/**
 * 非空校验
 * @param input 输入值
 * @returns
 */
const validEmpty = (input) => {
    // 非空校验
    if (!input) {
        return '不能为空';
    }
    return true;
};
/**
 * 返回添加default的问题列表
 * @param questions 问题列表
 * @param initial 默认值
 */
const withDefault = (questions, initial) => {
    return questions.map(question => {
        if (initial && (initial === null || initial === void 0 ? void 0 : initial[question.name])) {
            question.default = initial === null || initial === void 0 ? void 0 : initial[question.name];
        }
        return question;
    });
};

class PromiseQueue {
    constructor({ concurrency = 1 } = {}) {
        this.options = { concurrency };
        this.running = 0;
        this.queue = [];
        this.idleCallbacks = [];
    }
    clear() {
        this.queue = [];
    }
    onIdle(callback) {
        this.idleCallbacks.push(callback);
        return () => {
            const index = this.idleCallbacks.indexOf(callback);
            if (index !== -1) {
                this.idleCallbacks.splice(index, 1);
            }
        };
    }
    waitTillIdle() {
        return new Promise(resolve => {
            if (this.running === 0) {
                resolve();
                return;
            }
            const dispose = this.onIdle(() => {
                dispose();
                resolve();
            });
        });
    }
    add(callback) {
        return new Promise((resolve, reject) => {
            const runCallback = () => {
                this.running += 1;
                try {
                    Promise.resolve(callback()).then(val => {
                        resolve(val);
                        this.processNext();
                    }, err => {
                        reject(err);
                        this.processNext();
                    });
                }
                catch (err) {
                    reject(err);
                    this.processNext();
                }
            };
            if (this.running >= this.options.concurrency) {
                this.queue.push(runCallback);
            }
            else {
                runCallback();
            }
        });
    }
    // Internal function, don't use
    processNext() {
        this.running -= 1;
        const callback = this.queue.shift();
        if (callback) {
            callback();
        }
        else if (this.running === 0) {
            this.idleCallbacks.forEach(item => item());
        }
    }
}

/* @flow */
const defaultFilesystem = {
    join(pathA, pathB) {
        return fsPath__default["default"].join(pathA, pathB);
    },
    basename(path) {
        return fsPath__default["default"].basename(path);
    },
    stat(path) {
        return new Promise((resolve, reject) => {
            fs__default["default"].stat(path, (err, res) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            });
        });
    },
    readdir(path) {
        return new Promise((resolve, reject) => {
            fs__default["default"].readdir(path, (err, res) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            });
        });
    },
};
async function scanDirectoryInternal({ path, recursive, validate, result, fileSystem, queue, reject, }) {
    const itemStat = await fileSystem.stat(path);
    if (itemStat.isFile()) {
        result.files.push(path);
    }
    else if (itemStat.isDirectory()) {
        result.directories.push(path);
    }
    if (!itemStat.isDirectory() || recursive === 'none') {
        return;
    }
    const contents = await fileSystem.readdir(path);
    contents.forEach((item) => {
        const itemPath = fileSystem.join(path, item);
        if (!validate(itemPath)) {
            return;
        }
        queue
            .add(() => scanDirectoryInternal({
            path: itemPath,
            recursive: recursive === 'shallow' ? 'none' : 'deep',
            validate,
            result,
            fileSystem,
            queue,
            reject,
        }))
            .catch(reject);
    });
}
async function scanDirectory(path, { recursive = true, validate = null, concurrency = Infinity, fileSystem = defaultFilesystem, } = {}) {
    invariant__default["default"](path && typeof path === 'string', 'path must be a valid string');
    invariant__default["default"](typeof recursive === 'boolean', 'options.recursive must be a valid boolean');
    invariant__default["default"](validate === null || typeof validate === 'function', 'options.validate must be a valid function');
    invariant__default["default"](typeof concurrency === 'number', 'options.concurrency must be a valid number');
    invariant__default["default"](fileSystem !== null && typeof fileSystem === 'object', 'options.fileSystem must be a valid object');
    const queue = new PromiseQueue({
        concurrency,
    });
    const result = { files: [], directories: [] };
    const mergedFileSystem = { ...defaultFilesystem, ...fileSystem };
    await new Promise((resolve, reject) => {
        scanDirectoryInternal({
            path,
            recursive: recursive ? 'deep' : 'shallow',
            validate: validate != null ? validate : (item) => mergedFileSystem.basename(item).slice(0, 1) !== '.',
            result,
            fileSystem: mergedFileSystem,
            queue,
            reject,
        })
            .then(() => queue.waitTillIdle())
            .then(resolve, reject);
    });
    return result;
}

const DEFAULT_CONCURRENCY = 1;
const DEFAULT_VALIDATE = (path) => !fsPath__default["default"].basename(path).startsWith('.');
const DEFAULT_TICK = () => {
    /* No Op */
};
class SSHError extends Error {
    constructor(message, code = null) {
        super(message);
        this.code = code;
    }
}
function unixifyPath(path) {
    if (path.includes('\\')) {
        return path.split('\\').join('/');
    }
    return path;
}
async function readFile(filePath) {
    return new Promise((resolve, reject) => {
        fs__default["default"].readFile(filePath, 'utf8', (err, res) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(res);
            }
        });
    });
}
const SFTP_MKDIR_ERR_CODE_REGEXP = /Error: (E[\S]+): /;
async function makeDirectoryWithSftp(path, sftp) {
    let stats = null;
    try {
        stats = await new Promise((resolve, reject) => {
            sftp.stat(path, (err, res) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            });
        });
    }
    catch (_) {
        /* No Op */
    }
    if (stats) {
        if (stats.isDirectory()) {
            // Already exists, nothing to worry about
            return;
        }
        throw new Error('mkdir() failed, target already exists and is not a directory');
    }
    try {
        await new Promise((resolve, reject) => {
            sftp.mkdir(path, err => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    catch (err) {
        if (err != null && typeof err.stack === 'string') {
            const matches = SFTP_MKDIR_ERR_CODE_REGEXP.exec(err.stack);
            if (matches != null) {
                throw new SSHError(err.message, matches[1]);
            }
            throw err;
        }
    }
}
class NodeSSH {
    constructor() {
        this.connection = null;
    }
    getConnection() {
        const { connection } = this;
        if (connection == null) {
            throw new Error('Not connected to server');
        }
        return connection;
    }
    async connect(givenConfig) {
        invariant__default["default"](givenConfig != null && typeof givenConfig === 'object', 'config must be a valid object');
        const config = { ...givenConfig };
        invariant__default["default"](config.username != null && typeof config.username === 'string', 'config.username must be a valid string');
        if (config.host != null) {
            invariant__default["default"](typeof config.host === 'string', 'config.host must be a valid string');
        }
        else if (config.sock != null) {
            invariant__default["default"](typeof config.sock === 'object', 'config.sock must be a valid object');
        }
        else {
            throw new invariant.AssertionError({ message: 'Either config.host or config.sock must be provided' });
        }
        if (config.privateKey != null) {
            invariant__default["default"](typeof config.privateKey === 'string', 'config.privateKey must be a valid string');
            invariant__default["default"](config.passphrase == null || typeof config.passphrase === 'string', 'config.passphrase must be a valid string');
            if (!((config.privateKey.includes('BEGIN') && config.privateKey.includes('KEY')) ||
                config.privateKey.includes('PuTTY-User-Key-File-2'))) {
                // Must be an fs path
                try {
                    config.privateKey = await readFile(config.privateKey);
                }
                catch (err) {
                    if (err != null && err.code === 'ENOENT') {
                        throw new invariant.AssertionError({ message: 'config.privateKey does not exist at given fs path' });
                    }
                    throw err;
                }
            }
        }
        else if (config.password != null) {
            invariant__default["default"](typeof config.password === 'string', 'config.password must be a valid string');
        }
        if (config.tryKeyboard != null) {
            invariant__default["default"](typeof config.tryKeyboard === 'boolean', 'config.tryKeyboard must be a valid boolean');
        }
        if (config.tryKeyboard) {
            const { password } = config;
            if (config.onKeyboardInteractive != null) {
                invariant__default["default"](typeof config.onKeyboardInteractive === 'function', 'config.onKeyboardInteractive must be a valid function');
            }
            else if (password != null) {
                config.onKeyboardInteractive = (name, instructions, instructionsLang, prompts, finish) => {
                    if (prompts.length > 0 && prompts[0].prompt.toLowerCase().includes('password')) {
                        finish([password]);
                    }
                };
            }
        }
        const connection = new SSH2__default["default"].Client();
        this.connection = connection;
        await new Promise((resolve, reject) => {
            connection.on('error', reject);
            if (config.onKeyboardInteractive) {
                connection.on('keyboard-interactive', config.onKeyboardInteractive);
            }
            connection.on('ready', () => {
                connection.removeListener('error', reject);
                resolve();
            });
            connection.on('end', () => {
                if (this.connection === connection) {
                    this.connection = null;
                }
            });
            connection.on('close', () => {
                if (this.connection === connection) {
                    this.connection = null;
                }
                reject(new SSHError('No response from server', 'ETIMEDOUT'));
            });
            connection.connect(config);
        });
        return this;
    }
    isConnected() {
        return this.connection != null;
    }
    async requestShell(options) {
        const connection = this.getConnection();
        return new Promise((resolve, reject) => {
            const callback = (err, res) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            };
            if (options == null) {
                connection.shell(callback);
            }
            else {
                connection.shell(options, callback);
            }
        });
    }
    async withShell(callback, options) {
        invariant__default["default"](typeof callback === 'function', 'callback must be a valid function');
        const shell = await this.requestShell(options);
        try {
            await callback(shell);
        }
        finally {
            // Try to close gracefully
            if (!shell.close()) {
                // Destroy local socket if it doesn't work
                shell.destroy();
            }
        }
    }
    async requestSFTP() {
        const connection = this.getConnection();
        return new Promise((resolve, reject) => {
            connection.sftp((err, res) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(res);
                }
            });
        });
    }
    async withSFTP(callback) {
        invariant__default["default"](typeof callback === 'function', 'callback must be a valid function');
        const sftp = await this.requestSFTP();
        try {
            await callback(sftp);
        }
        finally {
            sftp.end();
        }
    }
    async execCommand(givenCommand, options = {}) {
        invariant__default["default"](typeof givenCommand === 'string', 'command must be a valid string');
        invariant__default["default"](options != null && typeof options === 'object', 'options must be a valid object');
        invariant__default["default"](options.cwd == null || typeof options.cwd === 'string', 'options.cwd must be a valid string');
        invariant__default["default"](options.stdin == null || typeof options.stdin === 'string', 'options.stdin must be a valid string');
        invariant__default["default"](options.execOptions == null || typeof options.execOptions === 'object', 'options.execOptions must be a valid object');
        invariant__default["default"](options.encoding == null || typeof options.encoding === 'string', 'options.encoding must be a valid string');
        invariant__default["default"](options.onChannel == null || typeof options.onChannel === 'function', 'options.onChannel must be a valid function');
        invariant__default["default"](options.onStdout == null || typeof options.onStdout === 'function', 'options.onStdout must be a valid function');
        invariant__default["default"](options.onStderr == null || typeof options.onStderr === 'function', 'options.onStderr must be a valid function');
        let command = givenCommand;
        if (options.cwd) {
            command = `cd ${shellEscape__default["default"]([options.cwd])} ; ${command}`;
        }
        const connection = this.getConnection();
        const output = { stdout: [], stderr: [] };
        return new Promise((resolve, reject) => {
            connection.exec(command, options.execOptions != null ? options.execOptions : {}, (err, channel) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (options.onChannel) {
                    options.onChannel(channel);
                }
                channel.on('data', (chunk) => {
                    if (options.onStdout)
                        options.onStdout(chunk);
                    output.stdout.push(chunk.toString(options.encoding));
                });
                channel.stderr.on('data', (chunk) => {
                    if (options.onStderr)
                        options.onStderr(chunk);
                    output.stderr.push(chunk.toString(options.encoding));
                });
                if (options.stdin) {
                    channel.write(options.stdin);
                }
                // Close stdout:
                channel.end();
                let code = null;
                let signal = null;
                channel.on('exit', (code_, signal_) => {
                    code = code_ || null;
                    signal = signal_ || null;
                });
                channel.on('close', () => {
                    resolve({
                        code: code != null ? code : null,
                        signal: signal != null ? signal : null,
                        stdout: output.stdout.join('').trim(),
                        stderr: output.stderr.join('').trim(),
                    });
                });
            });
        });
    }
    async exec(command, parameters, options = {}) {
        invariant__default["default"](typeof command === 'string', 'command must be a valid string');
        invariant__default["default"](Array.isArray(parameters), 'parameters must be a valid array');
        invariant__default["default"](options != null && typeof options === 'object', 'options must be a valid object');
        invariant__default["default"](options.stream == null || ['both', 'stdout', 'stderr'].includes(options.stream), 'options.stream must be one of both, stdout, stderr');
        for (let i = 0, { length } = parameters; i < length; i += 1) {
            invariant__default["default"](typeof parameters[i] === 'string', `parameters[${i}] must be a valid string`);
        }
        const completeCommand = `${command} ${shellEscape__default["default"](parameters)}`;
        const response = await this.execCommand(completeCommand, options);
        if (options.stream == null || options.stream === 'stdout') {
            if (response.stderr) {
                throw new Error(response.stderr);
            }
            return response.stdout;
        }
        if (options.stream === 'stderr') {
            return response.stderr;
        }
        return response;
    }
    async mkdir(path, method = 'sftp', givenSftp = null) {
        invariant__default["default"](typeof path === 'string', 'path must be a valid string');
        invariant__default["default"](typeof method === 'string' && (method === 'sftp' || method === 'exec'), 'method must be either sftp or exec');
        invariant__default["default"](givenSftp == null || typeof givenSftp === 'object', 'sftp must be a valid object');
        if (method === 'exec') {
            await this.exec('mkdir', ['-p', unixifyPath(path)]);
            return;
        }
        const sftp = givenSftp || (await this.requestSFTP());
        const makeSftpDirectory = async (retry) => makeDirectoryWithSftp(unixifyPath(path), sftp).catch(async (error) => {
            if (!retry || error == null || (error.message !== 'No such file' && error.code !== 'ENOENT')) {
                throw error;
            }
            await this.mkdir(fsPath__default["default"].dirname(path), 'sftp', sftp);
            await makeSftpDirectory(false);
        });
        try {
            await makeSftpDirectory(true);
        }
        finally {
            if (!givenSftp) {
                sftp.end();
            }
        }
    }
    async getFile(localFile, remoteFile, givenSftp = null, transferOptions = null) {
        invariant__default["default"](typeof localFile === 'string', 'localFile must be a valid string');
        invariant__default["default"](typeof remoteFile === 'string', 'remoteFile must be a valid string');
        invariant__default["default"](givenSftp == null || typeof givenSftp === 'object', 'sftp must be a valid object');
        invariant__default["default"](transferOptions == null || typeof transferOptions === 'object', 'transferOptions must be a valid object');
        const sftp = givenSftp || (await this.requestSFTP());
        try {
            await new Promise((resolve, reject) => {
                sftp.fastGet(unixifyPath(remoteFile), localFile, transferOptions || {}, err => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
        }
        finally {
            if (!givenSftp) {
                sftp.end();
            }
        }
    }
    async putFile(localFile, remoteFile, givenSftp = null, transferOptions = null) {
        invariant__default["default"](typeof localFile === 'string', 'localFile must be a valid string');
        invariant__default["default"](typeof remoteFile === 'string', 'remoteFile must be a valid string');
        invariant__default["default"](givenSftp == null || typeof givenSftp === 'object', 'sftp must be a valid object');
        invariant__default["default"](transferOptions == null || typeof transferOptions === 'object', 'transferOptions must be a valid object');
        invariant__default["default"](await new Promise(resolve => {
            fs__default["default"].access(localFile, fs__default["default"].constants.R_OK, err => {
                resolve(err === null);
            });
        }), `localFile does not exist at ${localFile}`);
        const sftp = givenSftp || (await this.requestSFTP());
        const putFile = (retry) => {
            return new Promise((resolve, reject) => {
                sftp.fastPut(localFile, unixifyPath(remoteFile), transferOptions || {}, err => {
                    if (err == null) {
                        resolve();
                        return;
                    }
                    if (err.message === 'No such file' && retry) {
                        resolve(this.mkdir(fsPath__default["default"].dirname(remoteFile), 'sftp', sftp).then(() => putFile(false)));
                    }
                    else {
                        reject(err);
                    }
                });
            });
        };
        try {
            await putFile(true);
        }
        finally {
            if (!givenSftp) {
                sftp.end();
            }
        }
    }
    async putFiles(files, { concurrency = DEFAULT_CONCURRENCY, sftp: givenSftp = null, transferOptions = {} } = {}) {
        invariant__default["default"](Array.isArray(files), 'files must be an array');
        for (let i = 0, { length } = files; i < length; i += 1) {
            const file = files[i];
            invariant__default["default"](file, 'files items must be valid objects');
            invariant__default["default"](file.local && typeof file.local === 'string', `files[${i}].local must be a string`);
            invariant__default["default"](file.remote && typeof file.remote === 'string', `files[${i}].remote must be a string`);
        }
        const transferred = [];
        const sftp = givenSftp || (await this.requestSFTP());
        const queue = new PromiseQueue({ concurrency });
        try {
            await new Promise((resolve, reject) => {
                files.forEach(file => {
                    queue
                        .add(async () => {
                        await this.putFile(file.local, file.remote, sftp, transferOptions);
                        transferred.push(file);
                    })
                        .catch(reject);
                });
                queue.waitTillIdle().then(resolve);
            });
        }
        catch (error) {
            if (error != null) {
                error.transferred = transferred;
            }
            throw error;
        }
        finally {
            if (!givenSftp) {
                sftp.end();
            }
        }
    }
    async putDirectory(localDirectory, remoteDirectory, { concurrency = DEFAULT_CONCURRENCY, sftp: givenSftp = null, transferOptions = {}, recursive = true, tick = DEFAULT_TICK, validate = DEFAULT_VALIDATE, } = {}) {
        invariant__default["default"](typeof localDirectory === 'string' && localDirectory, 'localDirectory must be a string');
        invariant__default["default"](typeof remoteDirectory === 'string' && remoteDirectory, 'remoteDirectory must be a string');
        const localDirectoryStat = await new Promise(resolve => {
            fs__default["default"].stat(localDirectory, (err, stat) => {
                resolve(stat || null);
            });
        });
        invariant__default["default"](localDirectoryStat != null, `localDirectory does not exist at ${localDirectory}`);
        invariant__default["default"](localDirectoryStat.isDirectory(), `localDirectory is not a directory at ${localDirectory}`);
        const sftp = givenSftp || (await this.requestSFTP());
        const scanned = await scanDirectory(localDirectory, {
            recursive,
            validate,
        });
        const files = scanned.files.map(item => fsPath__default["default"].relative(localDirectory, item));
        const directories = scanned.directories.map(item => fsPath__default["default"].relative(localDirectory, item));
        // Sort shortest to longest
        directories.sort((a, b) => a.length - b.length);
        let failed = false;
        try {
            // Do the directories first.
            await new Promise((resolve, reject) => {
                const queue = new PromiseQueue({ concurrency });
                directories.forEach(directory => {
                    queue
                        .add(async () => {
                        await this.mkdir(fsPath__default["default"].join(remoteDirectory, directory), 'sftp', sftp);
                    })
                        .catch(reject);
                });
                resolve(queue.waitTillIdle());
            });
            // and now the files
            await new Promise((resolve, reject) => {
                const queue = new PromiseQueue({ concurrency });
                files.forEach(file => {
                    queue
                        .add(async () => {
                        const localFile = fsPath__default["default"].join(localDirectory, file);
                        const remoteFile = fsPath__default["default"].join(remoteDirectory, file);
                        try {
                            await this.putFile(localFile, remoteFile, sftp, transferOptions);
                            tick(localFile, remoteFile, null);
                        }
                        catch (_) {
                            failed = true;
                            tick(localFile, remoteFile, _);
                        }
                    })
                        .catch(reject);
                });
                resolve(queue.waitTillIdle());
            });
        }
        finally {
            if (!givenSftp) {
                sftp.end();
            }
        }
        return !failed;
    }
    async getDirectory(localDirectory, remoteDirectory, { concurrency = DEFAULT_CONCURRENCY, sftp: givenSftp = null, transferOptions = {}, recursive = true, tick = DEFAULT_TICK, validate = DEFAULT_VALIDATE, } = {}) {
        invariant__default["default"](typeof localDirectory === 'string' && localDirectory, 'localDirectory must be a string');
        invariant__default["default"](typeof remoteDirectory === 'string' && remoteDirectory, 'remoteDirectory must be a string');
        const localDirectoryStat = await new Promise(resolve => {
            fs__default["default"].stat(localDirectory, (err, stat) => {
                resolve(stat || null);
            });
        });
        invariant__default["default"](localDirectoryStat != null, `localDirectory does not exist at ${localDirectory}`);
        invariant__default["default"](localDirectoryStat.isDirectory(), `localDirectory is not a directory at ${localDirectory}`);
        const sftp = givenSftp || (await this.requestSFTP());
        const scanned = await scanDirectory(remoteDirectory, {
            recursive,
            validate,
            concurrency,
            fileSystem: {
                basename(path) {
                    return fsPath__default["default"].posix.basename(path);
                },
                join(pathA, pathB) {
                    return fsPath__default["default"].posix.join(pathA, pathB);
                },
                readdir(path) {
                    return new Promise((resolve, reject) => {
                        sftp.readdir(path, (err, res) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(res.map(item => item.filename));
                            }
                        });
                    });
                },
                stat(path) {
                    return new Promise((resolve, reject) => {
                        sftp.stat(path, (err, res) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                resolve(res);
                            }
                        });
                    });
                },
            },
        });
        const files = scanned.files.map(item => fsPath__default["default"].relative(remoteDirectory, item));
        const directories = scanned.directories.map(item => fsPath__default["default"].relative(remoteDirectory, item));
        // Sort shortest to longest
        directories.sort((a, b) => a.length - b.length);
        let failed = false;
        try {
            // Do the directories first.
            await new Promise((resolve, reject) => {
                const queue = new PromiseQueue({ concurrency });
                directories.forEach(directory => {
                    queue
                        .add(async () => {
                        await makeDir__default["default"](fsPath__default["default"].join(localDirectory, directory));
                    })
                        .catch(reject);
                });
                resolve(queue.waitTillIdle());
            });
            // and now the files
            await new Promise((resolve, reject) => {
                const queue = new PromiseQueue({ concurrency });
                files.forEach(file => {
                    queue
                        .add(async () => {
                        const localFile = fsPath__default["default"].join(localDirectory, file);
                        const remoteFile = fsPath__default["default"].join(remoteDirectory, file);
                        try {
                            await this.getFile(localFile, remoteFile, sftp, transferOptions);
                            tick(localFile, remoteFile, null);
                        }
                        catch (_) {
                            failed = true;
                            tick(localFile, remoteFile, _);
                        }
                    })
                        .catch(reject);
                });
                resolve(queue.waitTillIdle());
            });
        }
        finally {
            if (!givenSftp) {
                sftp.end();
            }
        }
        return !failed;
    }
    dispose() {
        if (this.connection) {
            this.connection.end();
            this.connection = null;
        }
    }
}

const ssh = new NodeSSH();
/**
 * 开始打包成zip
 * @param sourcePath 文件路径
 */
const bundle = (config) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        if (!fsExtra.existsSync(config.sourcePath)) {
            return reject(new Error(`${config.sourcePath}文件不存在`));
        }
        const bundler = archiver__default["default"]("zip", {
            zlib: { level: 9 },
        });
        const output = fs__default["default"].createWriteStream(config.bundleFilePath);
        output.on("close", (err) => {
            if (err) {
                return reject(new Error(`${config.bundleFilePath}关闭错误 ${err}`));
            }
            return resolve(void 0);
        });
        bundler.pipe(output);
        bundler.directory(config.sourcePath, "/");
        bundler.finalize();
    });
});
/**
 * 连接服务器
 * @param config ssh配置
 * @returns
 */
function connectServer(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const { username, password, host, port, privateKeyPath } = config;
        const sshConfig = {
            username,
            password,
            host,
            port,
            privateKeyPath,
        };
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield ssh.connect(sshConfig);
                resolve(void 0);
            }
            catch (err) {
                reject(new Error(`连接服务器失败 ${err}`));
            }
        }));
    });
}
/**
 * 上传文件
 * @param config ssh配置
 */
function upload(config) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                // TODO 可能没有权限
                yield ssh.putFile(config.bundleFilePath, config.remotePath);
                resolve(void 0);
            }
            catch (err) {
                reject(new Error(`上传文件失败 ${err}`));
            }
        }));
    });
}
/**
 * 解压缩
 * @param config 配置
 * @returns
 */
function unzip(config) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const archiveFilename = config.bundleFilename;
            yield ssh.execCommand(`unzip -o ${archiveFilename} && rm -f ${archiveFilename}`, {
                cwd: config.cwd,
                onStderr(chunk) {
                    reject(new Error(`解压错误 ${chunk.toString("utf-8")}`));
                },
            });
            resolve(void 0);
        }));
    });
}
/**
 * 删除本地文件
 * @param config 配置
 */
function deleteLocal(config) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            fsExtra.unlinkSync(config.bundleFilePath);
        }
        catch (err) {
            throw new Error(`删除本地文件失败 err`);
        }
    });
}
function stepLoading(task, message, errorMessage) {
    return __awaiter(this, void 0, void 0, function* () {
        const loading = ora__default["default"](message);
        loading.start();
        try {
            yield task();
        }
        catch (e) {
            loading.fail(danger((errorMessage !== null && errorMessage !== void 0 ? errorMessage : e === null || e === void 0 ? void 0 : e.message) || "未知异常"));
            throw e;
        }
        finally {
            loading.stop();
        }
    });
}
function deploy(config) {
    return __awaiter(this, void 0, void 0, function* () {
        // 保存远程操作的目录
        config.cwd = config.remotePath;
        const bundleFilename = config.distDirName + '.zip';
        const bundleFilePath = config.sourcePath + '.zip';
        // 拼接路径信息
        const remotePath = config.remotePath + `/${config.distDirName}.zip`;
        // 更新config信息
        config.bundleFilePath = bundleFilePath;
        config.remotePath = remotePath;
        config.bundleFilename = bundleFilename;
        try {
            // 第一步打包
            yield stepLoading(() => __awaiter(this, void 0, void 0, function* () { return bundle(config); }), "开始压缩...");
            success(`压缩完成 ${underlineAndBold(bundleFilePath)}`);
            arrow();
            // 第二步连接服务器
            yield stepLoading(() => __awaiter(this, void 0, void 0, function* () { return connectServer(config); }), "开始连接...");
            success(`连接完成 ${underlineAndBold(config.host + ":" + config.port)}`);
            arrow();
            // 第三步上传文件
            yield stepLoading(() => __awaiter(this, void 0, void 0, function* () { return upload(config); }), "开始上传...");
            success(`上传完成 ${underlineAndBold(config.sourcePath)}`);
            arrow();
            // 第四步解压缩
            yield stepLoading(() => __awaiter(this, void 0, void 0, function* () { return unzip(config); }), "开始解压...");
            success(`解压完成 ${underlineAndBold(config.remotePath)}`);
        }
        finally {
            arrow();
            // 第五步删除文件
            yield stepLoading(() => __awaiter(this, void 0, void 0, function* () { return deleteLocal(config); }), "删除本地...");
            success(`删除完成 ${underlineAndBold(bundleFilePath)}`);
            // 手动释放资源
            ssh.isConnected() && ssh.dispose();
        }
    });
}
function execScript(cmd, opts) {
    return __awaiter(this, void 0, void 0, function* () {
        yield stepLoading(() => __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                child_process.exec(cmd, { cwd: opts === null || opts === void 0 ? void 0 : opts.cwd }, (err, stdout, stderr) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(void 0);
                });
            });
        }), (opts === null || opts === void 0 ? void 0 : opts.tip) || '正在执行...', `执行${underlineAndBold(cmd)}失败`);
        success(`执行完成 ${underlineAndBold(cmd)}`);
        arrow();
    });
}

// 部署相关的页面
class DeployRegistry extends BaseRegistry {
    constructor() {
        super(DEPLOY_PATH, "name");
    }
}
const displayDeployInfo = (record) => {
    success('------------------------------');
    success('配置名称:', record.name);
    success('服务器地址:', record.host + ':' + record.port);
    success('密钥模式:', record.mode === 'password' ? '密码' : '密钥');
    success('登录用户:', record.username);
    success('本地路径:', fsPath.join(process.cwd(), record.distDirName));
    success('远程部署路径:', record.remotePath);
    success('部署前执行脚本:', (record.beforeScript || ""));
    success('部署后执行脚本:', (record.afterScript || ""));
    success('------------------------------');
};
const deployRegistry = new DeployRegistry();
const chooseDeploy = () => __awaiter(void 0, void 0, void 0, function* () {
    return inquirer__default["default"].prompt({
        name: 'name',
        type: 'list',
        message: '请选择配置',
        choices: deployRegistry.data.map(item => item.name)
    });
});
var deployCommand = defineCommand({
    name: COMMAND.DEPLOY,
    use: (ctx) => {
        ctx.program
            .command(COMMAND.DEPLOY)
            .alias(COMMAND.DEPLOY_ALIAS)
            .description("部署功能")
            .option("-l, --ls", "列出所有部署配置")
            .option("-a, --add", "添加部署配置")
            .option("-r, --rm [配置名称]", "删除部署配置")
            .option("-u, --update [配置名称]", "更新部署配置")
            .option("-c, --clear", "清空部署配置")
            .option("-d, --detail [配置名称]", "配置详情")
            .option("-s, --start", "执行部署")
            .option("-p, --copy [配置名称]", "复制配置")
            .action((options) => __awaiter(void 0, void 0, void 0, function* () {
            const questions = [
                {
                    name: "name",
                    type: "input",
                    message: "请输入配置名称",
                    validate(input) {
                        // 非空校验
                        if (!input) {
                            return "不能为空";
                        }
                        // 校验配置是否存在
                        if ((options.add || options.copy) && deployRegistry.exists(input)) {
                            return "配置已存在";
                        }
                        // TODO 更新校验
                        if (options.update) {
                            return "配置已存在";
                        }
                        return true;
                    },
                },
                {
                    name: "mode",
                    type: "list",
                    message: "请选择密钥模式",
                    choices: [
                        { name: "密码", value: "password" },
                        { name: "密钥", value: "privateKey" },
                    ],
                },
                {
                    name: "privateKeyPath",
                    type: "input",
                    message: "请输入密钥路径",
                    // 仅当选择了密钥，才需要输入
                    when: (params) => {
                        return params.mode === "privateKey";
                    },
                    validate: validEmpty,
                },
                {
                    name: "host",
                    type: "input",
                    message: "请输入主机地址",
                    validate: validEmpty,
                },
                {
                    name: "port",
                    type: "number",
                    message: "请输入主机端口",
                    default: 22,
                    validate(input) {
                        // 非空校验
                        if (!input) {
                            return "不能为空";
                        }
                        if (input < 1 || input > 65535) {
                            return "非法端口";
                        }
                        return true;
                    },
                },
                {
                    name: "username",
                    type: "input",
                    message: "请输入登录用户",
                    validate: validEmpty,
                },
                {
                    name: "distDirName",
                    type: "input",
                    message: "本地目录名",
                    // 相当于默认名，每次执行命令都会重新询问
                    validate: validEmpty,
                },
                {
                    name: "remotePath",
                    type: "input",
                    message: "远程部署路径",
                    // 相当于默认名，每次执行命令都会重新询问
                    validate: validEmpty,
                },
                {
                    name: "beforeScript",
                    type: "input",
                    message: "部署前执行脚本",
                },
                {
                    name: "afterScript",
                    type: "input",
                    message: "部署后执行脚本",
                },
            ];
            if (options.ls) {
                success(deployRegistry.data
                    .map((config, index) => index + 1 + ". " + config.name)
                    .join("\r\n"));
            }
            else if (options.add) {
                // 添加部署配置
                const ans = yield inquirer__default["default"].prompt(questions);
                // 数据格式化
                for (const key in ans) {
                    const k = key;
                    const value = ans[k];
                    if (typeof value === 'string') {
                        ans[k] = value;
                    }
                }
                deployRegistry.add(ans);
                success(`新增配置${underlineAndBold(ans.name)}`);
            }
            else if (options.update) {
                let id = options.update;
                // 如果未提供配置名称，则提供选择
                if (typeof id === 'boolean') {
                    if (deployRegistry.data.length === 0)
                        return success();
                    const ans = yield chooseDeploy();
                    id = ans.name;
                }
                if (!deployRegistry.exists(id)) {
                    error(`配置${underlineAndBold(id)}不存在`);
                    return;
                }
                const record = deployRegistry.get(id);
                const ans = yield inquirer__default["default"].prompt(withDefault(questions, record));
                deployRegistry.updated(id, ans);
                success(`更新配置${underlineAndBold(id)}`);
            }
            else if (options.rm) {
                let id = options.rm;
                // 如果未提供配置名称，则提供选择
                if (typeof id === 'boolean') {
                    if (deployRegistry.data.length === 0)
                        return success();
                    const ans = yield chooseDeploy();
                    id = ans.name;
                }
                if (!deployRegistry.exists(id)) {
                    error(`配置${underlineAndBold(id)}不存在`);
                    return;
                }
                deployRegistry.remove(id);
                success(`已删除配置${underlineAndBold(id)}`);
            }
            else if (options.clear) {
                deployRegistry.clear();
                success(`配置已清空`);
            }
            else if (options.detail) {
                let id = options.detail;
                // 如果未提供配置名称，则提供选择
                if (typeof id === 'boolean') {
                    if (deployRegistry.data.length === 0)
                        return success();
                    const ans = yield chooseDeploy();
                    id = ans.name;
                }
                if (!deployRegistry.exists(id)) {
                    error(`配置${underlineAndBold(id)}不存在`);
                    return;
                }
                displayDeployInfo(deployRegistry.get(id));
            }
            else if (options.start || Object.keys(options).length === 0) {
                // 执行部署命令
                const configList = deployRegistry.data.map((item) => item.name);
                const ans = yield inquirer__default["default"].prompt([
                    {
                        name: "name",
                        type: "list",
                        message: '部署配置',
                        choices: configList,
                    },
                    {
                        name: 'isConfirm',
                        type: "confirm",
                        message: (params) => {
                            displayDeployInfo(deployRegistry.get(params.name));
                            return '是否部署:';
                        }
                    },
                    {
                        name: "password",
                        type: "password",
                        message: '服务器密码',
                        validate: validEmpty,
                        // 仅当选择了密钥，才需要输入
                        when: (params) => {
                            var _a;
                            return params.isConfirm && ((_a = deployRegistry.get(params.name)) === null || _a === void 0 ? void 0 : _a.mode) === "password";
                        },
                    },
                ]);
                if (!ans.isConfirm) {
                    newline();
                    error("取消部署");
                    return;
                }
                // TODO 确认配置，且提示是否需要修改
                const record = deployRegistry.get(ans.name);
                const deployConfig = Object.assign(Object.assign({}, record), ans);
                // 生成最后的路径
                deployConfig.sourcePath = fsPath.join(process.cwd(), deployConfig.distDirName);
                newline();
                try {
                    // 开始部署
                    const start = Date.now();
                    // 运行部署前脚本
                    if (deployConfig.beforeScript) {
                        yield execScript(deployConfig.beforeScript, { cwd: process.cwd(), tip: `正在执行${underlineAndBold(deployConfig.beforeScript)} ...` });
                    }
                    yield deploy(deployConfig);
                    if (deployConfig.afterScript) {
                        // 运行部署后脚本
                        yield execScript(deployConfig.afterScript, { cwd: process.cwd(), tip: `正在执行${underlineAndBold(deployConfig.afterScript)} ...` });
                    }
                    const end = Date.now();
                    newline(2);
                    success(`部署成功,总耗时${underlineAndBold(((end - start) / 1000).toFixed(1))}s`);
                }
                catch (err) {
                    // TODO log日志输出
                    newline(2);
                    error(`部署失败 ${err}`);
                }
            }
            else if (options.copy) {
                let id = options.copy;
                // 如果未提供配置名称，则提供选择
                if (typeof id === 'boolean') {
                    const ans = yield inquirer__default["default"].prompt({
                        name: 'name',
                        type: 'list',
                        message: '选择配置',
                        choices: deployRegistry.data.map(item => item.name)
                    });
                    id = ans.name;
                }
                const record = deployRegistry.get(id);
                // 添加部署配置
                const ans = yield inquirer__default["default"].prompt(withDefault(questions, record));
                // 数据格式化
                for (const key in ans) {
                    const k = key;
                    const value = ans[k];
                    if (typeof value === 'string') {
                        ans[k] = value;
                    }
                }
                deployRegistry.add(ans);
                success(`新增配置${underlineAndBold(ans.name)}`);
            }
        }));
    },
});

program.name(PROJECT_NAME).usage("[command] [options]");
// 命令行
const commands = [initCommand, registryCommand, templateCommand, deployCommand];
for (const command of commands) {
    // 加载命令
    command.use({ program });
}
program.on("--help", () => {
    // 打印logo
    success("\r\n", figlet__default["default"].textSync(PROJECT_NAME.split('').join(' '), {
        font: 'Ghost',
        width: 80,
        whitespaceBreak: true
    }));
});
// 解析命令
program.parse();
