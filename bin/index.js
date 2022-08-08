#! /usr/bin/env node
'use strict';

var figlet = require('figlet');
var path = require('path');
var chalk = require('chalk');
var commander = require('commander');
var inquirer = require('inquirer');
var fsExtra = require('fs-extra');
var process$1 = require('node:process');
var readline = require('node:readline');
var onetime = require('onetime');
var signalExit = require('signal-exit');
var cliSpinners = require('cli-spinners');
var wcwidth = require('wcwidth');
var bl = require('bl');
var gitly = require('gitly');
var node_buffer = require('node:buffer');
var path$1 = require('node:path');
var childProcess = require('node:child_process');
var crossSpawn = require('cross-spawn');
var os = require('os');
require('node:os');
require('get-stream');
require('merge-stream');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var figlet__default = /*#__PURE__*/_interopDefaultLegacy(figlet);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var inquirer__default = /*#__PURE__*/_interopDefaultLegacy(inquirer);
var process__default = /*#__PURE__*/_interopDefaultLegacy(process$1);
var readline__default = /*#__PURE__*/_interopDefaultLegacy(readline);
var onetime__default = /*#__PURE__*/_interopDefaultLegacy(onetime);
var signalExit__default = /*#__PURE__*/_interopDefaultLegacy(signalExit);
var cliSpinners__default = /*#__PURE__*/_interopDefaultLegacy(cliSpinners);
var wcwidth__default = /*#__PURE__*/_interopDefaultLegacy(wcwidth);
var gitly__default = /*#__PURE__*/_interopDefaultLegacy(gitly);
var path__default$1 = /*#__PURE__*/_interopDefaultLegacy(path$1);
var childProcess__default = /*#__PURE__*/_interopDefaultLegacy(childProcess);
var crossSpawn__default = /*#__PURE__*/_interopDefaultLegacy(crossSpawn);

const VERSION = '0.0.1';
const PROJECT_NAME = 'jt';
const TEMP_DIR_NAME = '.temp';
const TEMP_PATH = path__default["default"].join(__dirname, '..', TEMP_DIR_NAME);

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

const program = new commander.Command();

const restoreCursor = onetime__default["default"](() => {
	signalExit__default["default"](() => {
		process__default["default"].stderr.write('\u001B[?25h');
	}, {alwaysLast: true});
});

let isHidden = false;

const cliCursor = {};

cliCursor.show = (writableStream = process__default["default"].stderr) => {
	if (!writableStream.isTTY) {
		return;
	}

	isHidden = false;
	writableStream.write('\u001B[?25h');
};

cliCursor.hide = (writableStream = process__default["default"].stderr) => {
	if (!writableStream.isTTY) {
		return;
	}

	restoreCursor();
	isHidden = true;
	writableStream.write('\u001B[?25l');
};

cliCursor.toggle = (force, writableStream) => {
	if (force !== undefined) {
		isHidden = force;
	}

	if (isHidden) {
		cliCursor.show(writableStream);
	} else {
		cliCursor.hide(writableStream);
	}
};

const logSymbols = {
	info: 'ℹ️',
	success: '✅',
	warning: '⚠️',
	error: '❌️'
};

function ansiRegex({onlyFirst = false} = {}) {
	const pattern = [
	    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
		'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'
	].join('|');

	return new RegExp(pattern, onlyFirst ? undefined : 'g');
}

function stripAnsi(string) {
	if (typeof string !== 'string') {
		throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
	}

	return string.replace(ansiRegex(), '');
}

function isInteractive({stream = process.stdout} = {}) {
	return Boolean(
		stream && stream.isTTY &&
		process.env.TERM !== 'dumb' &&
		!('CI' in process.env)
	);
}

function isUnicodeSupported() {
	if (process.platform !== 'win32') {
		return process.env.TERM !== 'linux'; // Linux console (kernel)
	}

	return Boolean(process.env.CI) ||
		Boolean(process.env.WT_SESSION) || // Windows Terminal
		process.env.ConEmuTask === '{cmd::Cmder}' || // ConEmu and cmder
		process.env.TERM_PROGRAM === 'vscode' ||
		process.env.TERM === 'xterm-256color' ||
		process.env.TERM === 'alacritty';
}

const TEXT = Symbol('text');
const PREFIX_TEXT = Symbol('prefixText');
const ASCII_ETX_CODE = 0x03; // Ctrl+C emits this code

// TODO: Use class fields when ESLint 8 is out.

class StdinDiscarder {
	constructor() {
		this.requests = 0;

		this.mutedStream = new bl.BufferListStream();
		this.mutedStream.pipe(process__default["default"].stdout);

		const self = this; // eslint-disable-line unicorn/no-this-assignment
		this.ourEmit = function (event, data, ...args) {
			const {stdin} = process__default["default"];
			if (self.requests > 0 || stdin.emit === self.ourEmit) {
				if (event === 'keypress') { // Fixes readline behavior
					return;
				}

				if (event === 'data' && data.includes(ASCII_ETX_CODE)) {
					process__default["default"].emit('SIGINT');
				}

				Reflect.apply(self.oldEmit, this, [event, data, ...args]);
			} else {
				Reflect.apply(process__default["default"].stdin.emit, this, [event, data, ...args]);
			}
		};
	}

	start() {
		this.requests++;

		if (this.requests === 1) {
			this.realStart();
		}
	}

	stop() {
		if (this.requests <= 0) {
			throw new Error('`stop` called more times than `start`');
		}

		this.requests--;

		if (this.requests === 0) {
			this.realStop();
		}
	}

	realStart() {
		// No known way to make it work reliably on Windows
		if (process__default["default"].platform === 'win32') {
			return;
		}

		this.rl = readline__default["default"].createInterface({
			input: process__default["default"].stdin,
			output: this.mutedStream,
		});

		this.rl.on('SIGINT', () => {
			if (process__default["default"].listenerCount('SIGINT') === 0) {
				process__default["default"].emit('SIGINT');
			} else {
				this.rl.close();
				process__default["default"].kill(process__default["default"].pid, 'SIGINT');
			}
		});
	}

	realStop() {
		if (process__default["default"].platform === 'win32') {
			return;
		}

		this.rl.close();
		this.rl = undefined;
	}
}

let stdinDiscarder;

class Ora {
	constructor(options) {
		if (!stdinDiscarder) {
			stdinDiscarder = new StdinDiscarder();
		}

		if (typeof options === 'string') {
			options = {
				text: options,
			};
		}

		this.options = {
			text: '',
			color: 'cyan',
			stream: process__default["default"].stderr,
			discardStdin: true,
			...options,
		};

		this.spinner = this.options.spinner;

		this.color = this.options.color;
		this.hideCursor = this.options.hideCursor !== false;
		this.interval = this.options.interval || this.spinner.interval || 100;
		this.stream = this.options.stream;
		this.id = undefined;
		this.isEnabled = typeof this.options.isEnabled === 'boolean' ? this.options.isEnabled : isInteractive({stream: this.stream});
		this.isSilent = typeof this.options.isSilent === 'boolean' ? this.options.isSilent : false;

		// Set *after* `this.stream`
		this.text = this.options.text;
		this.prefixText = this.options.prefixText;
		this.linesToClear = 0;
		this.indent = this.options.indent;
		this.discardStdin = this.options.discardStdin;
		this.isDiscardingStdin = false;
	}

	get indent() {
		return this._indent;
	}

	set indent(indent = 0) {
		if (!(indent >= 0 && Number.isInteger(indent))) {
			throw new Error('The `indent` option must be an integer from 0 and up');
		}

		this._indent = indent;
		this.updateLineCount();
	}

	_updateInterval(interval) {
		if (interval !== undefined) {
			this.interval = interval;
		}
	}

	get spinner() {
		return this._spinner;
	}

	set spinner(spinner) {
		this.frameIndex = 0;

		if (typeof spinner === 'object') {
			if (spinner.frames === undefined) {
				throw new Error('The given spinner must have a `frames` property');
			}

			this._spinner = spinner;
		} else if (!isUnicodeSupported()) {
			this._spinner = cliSpinners__default["default"].line;
		} else if (spinner === undefined) {
			// Set default spinner
			this._spinner = cliSpinners__default["default"].dots;
		} else if (spinner !== 'default' && cliSpinners__default["default"][spinner]) {
			this._spinner = cliSpinners__default["default"][spinner];
		} else {
			throw new Error(`There is no built-in spinner named '${spinner}'. See https://github.com/sindresorhus/cli-spinners/blob/main/spinners.json for a full list.`);
		}

		this._updateInterval(this._spinner.interval);
	}

	get text() {
		return this[TEXT];
	}

	set text(value) {
		this[TEXT] = value;
		this.updateLineCount();
	}

	get prefixText() {
		return this[PREFIX_TEXT];
	}

	set prefixText(value) {
		this[PREFIX_TEXT] = value;
		this.updateLineCount();
	}

	get isSpinning() {
		return this.id !== undefined;
	}

	getFullPrefixText(prefixText = this[PREFIX_TEXT], postfix = ' ') {
		if (typeof prefixText === 'string') {
			return prefixText + postfix;
		}

		if (typeof prefixText === 'function') {
			return prefixText() + postfix;
		}

		return '';
	}

	updateLineCount() {
		const columns = this.stream.columns || 80;
		const fullPrefixText = this.getFullPrefixText(this.prefixText, '-');
		this.lineCount = 0;
		for (const line of stripAnsi(' '.repeat(this.indent) + fullPrefixText + '--' + this[TEXT]).split('\n')) {
			this.lineCount += Math.max(1, Math.ceil(wcwidth__default["default"](line) / columns));
		}
	}

	get isEnabled() {
		return this._isEnabled && !this.isSilent;
	}

	set isEnabled(value) {
		if (typeof value !== 'boolean') {
			throw new TypeError('The `isEnabled` option must be a boolean');
		}

		this._isEnabled = value;
	}

	get isSilent() {
		return this._isSilent;
	}

	set isSilent(value) {
		if (typeof value !== 'boolean') {
			throw new TypeError('The `isSilent` option must be a boolean');
		}

		this._isSilent = value;
	}

	frame() {
		const {frames} = this.spinner;
		let frame = frames[this.frameIndex];

		if (this.color) {
			frame = chalk__default["default"][this.color](frame);
		}

		this.frameIndex = ++this.frameIndex % frames.length;
		const fullPrefixText = (typeof this.prefixText === 'string' && this.prefixText !== '') ? this.prefixText + ' ' : '';
		const fullText = typeof this.text === 'string' ? ' ' + this.text : '';

		return fullPrefixText + frame + fullText;
	}

	clear() {
		if (!this.isEnabled || !this.stream.isTTY) {
			return this;
		}

		this.stream.cursorTo(0);

		for (let index = 0; index < this.linesToClear; index++) {
			if (index > 0) {
				this.stream.moveCursor(0, -1);
			}

			this.stream.clearLine(1);
		}

		if (this.indent || this.lastIndent !== this.indent) {
			this.stream.cursorTo(this.indent);
		}

		this.lastIndent = this.indent;
		this.linesToClear = 0;

		return this;
	}

	render() {
		if (this.isSilent) {
			return this;
		}

		this.clear();
		this.stream.write(this.frame());
		this.linesToClear = this.lineCount;

		return this;
	}

	start(text) {
		if (text) {
			this.text = text;
		}

		if (this.isSilent) {
			return this;
		}

		if (!this.isEnabled) {
			if (this.text) {
				this.stream.write(`- ${this.text}\n`);
			}

			return this;
		}

		if (this.isSpinning) {
			return this;
		}

		if (this.hideCursor) {
			cliCursor.hide(this.stream);
		}

		if (this.discardStdin && process__default["default"].stdin.isTTY) {
			this.isDiscardingStdin = true;
			stdinDiscarder.start();
		}

		this.render();
		this.id = setInterval(this.render.bind(this), this.interval);

		return this;
	}

	stop() {
		if (!this.isEnabled) {
			return this;
		}

		clearInterval(this.id);
		this.id = undefined;
		this.frameIndex = 0;
		this.clear();
		if (this.hideCursor) {
			cliCursor.show(this.stream);
		}

		if (this.discardStdin && process__default["default"].stdin.isTTY && this.isDiscardingStdin) {
			stdinDiscarder.stop();
			this.isDiscardingStdin = false;
		}

		return this;
	}

	succeed(text) {
		return this.stopAndPersist({symbol: logSymbols.success, text});
	}

	fail(text) {
		return this.stopAndPersist({symbol: logSymbols.error, text});
	}

	warn(text) {
		return this.stopAndPersist({symbol: logSymbols.warning, text});
	}

	info(text) {
		return this.stopAndPersist({symbol: logSymbols.info, text});
	}

	stopAndPersist(options = {}) {
		if (this.isSilent) {
			return this;
		}

		const prefixText = options.prefixText || this.prefixText;
		const text = options.text || this.text;
		const fullText = (typeof text === 'string') ? ' ' + text : '';

		this.stop();
		this.stream.write(`${this.getFullPrefixText(prefixText, ' ')}${options.symbol || ' '}${fullText}\n`);

		return this;
	}
}

function ora(options) {
	return new Ora(options);
}

/**
 * 模板下载
 */
const gitDownload = async (src, dest, loadingText) => {
    return new Promise(async (resolve, reject) => {
        const loading = loadingText ? ora(loadingText) : null;
        loading && loading.start();
        try {
            await gitly__default["default"](src, dest, { temp: TEMP_PATH });
            loading && loading.succeed();
            resolve(undefined);
        }
        catch (error) {
            loading && loading.fail('下载错误' + error);
            reject(error);
        }
    });
};

const CONFIG_DIR = path__default["default"].join(__dirname, "../config");
const TEMPLATE_PATH = path__default["default"].join(CONFIG_DIR, 'templates.json');
const REGISTRY_PATH = path__default["default"].join(CONFIG_DIR, 'registries.json');

const configs = {
    registries: require(REGISTRY_PATH),
    templates: require(TEMPLATE_PATH)
};

const defineCommand = (command) => {
    return command;
};

const COMMAND = {
    INIT: "init",
    INIT_ALIAS: "i",
    CHANGE_REGISTRY: "change-registry",
    CHANGE_REGISTRY_ALIAS: "cr",
    TEMPLATE: "template",
    TEMPLATE_ALIAS: "tp"
};

async function createByTemplate() {
    const templates = configs.templates;
    const defaultProjectName = path__default["default"].basename(process.cwd());
    const answers = await inquirer__default["default"].prompt([
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
    const pathExists = fsExtra.existsSync(answers.projectName);
    // 下载模板
    try {
        if (pathExists) {
            const ans = await inquirer__default["default"].prompt([
                {
                    name: 'isOverride',
                    type: 'confirm',
                    message: `${answers.projectName} 已存在,是否继续`
                }
            ]);
            if (!ans.isOverride) {
                return;
            }
        }
        await gitDownload(template.remoteSrc, path__default["default"].join(TEMP_PATH, answers.projectName), '模板下载中...');
        // 创建目录
        !pathExists && await fsExtra.mkdir(answers.projectName);
        // 拷贝文件
        await fsExtra.copy(path__default["default"].join(TEMP_PATH, answers.projectName), answers.projectName);
        // 删除缓存文件
        await fsExtra.remove(path__default["default"].join(TEMP_PATH, answers.projectName));
    }
    catch (err) {
        error(err);
        return;
    }
    // TODO 后续处理
    success('\r\n创建完成！');
    info(`  cd ${answers.projectName}\r\n`);
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
	let cwdPath = path__default$1["default"].resolve(cwd);
	const result = [];

	while (previous !== cwdPath) {
		result.push(path__default$1["default"].join(cwdPath, 'node_modules/.bin'));
		previous = cwdPath;
		cwdPath = path__default$1["default"].resolve(cwdPath, '..');
	}

	// Ensure the running `node` binary is used.
	result.push(path__default$1["default"].resolve(cwd, execPath, '..'));

	return [...result, path_].join(path__default$1["default"].delimiter);
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

	if (process__default["default"].platform === 'win32' && path__default$1["default"].basename(file, '.exe') === 'cmd') {
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
            .action(async () => {
            const registries = configs.registries;
            const ans = await inquirer__default["default"].prompt([
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
                    choices: ['npm', 'yarn']
                }
            ]);
            try {
                // 判断 yarn | npm
                const command = ans.packageManager;
                const registry = registries.find((item) => item.name === ans.registry);
                execaSync(command, ['config', 'set', 'registry', registry.src]);
                success(`已更换为${ans.registry}源`);
            }
            catch (err) {
                error(err);
            }
        });
    }
});

/**
 * 对模板仓库的封装
 */
class TemplateRegistry {
    templates = [];
    constructor() {
        this.load();
    }
    /**
     * 判断模板是否存在，根据name
     * @param name 模板名称
     * @returns 是否存在
     */
    exists(name) {
        return !!this.templates.find(tp => tp.name === name);
    }
    /**
     * 获取模板
     * @param name 模板名称
     */
    get(name) {
        if (!this.exists(name)) {
            throw new Error('模板不存在');
        }
        return this.templates.find(tp => tp.name === name);
    }
    /**
     * 添加模板
     * @param template 模板参数
     */
    add(template) {
        // 去重
        const isExists = this.exists(template.name);
        if (isExists) {
            throw new Error('模板已存在');
        }
        // TODO template校验
        this.templates.push(template);
        this.save();
    }
    /**
     *
     * @param name 模板名
     */
    remove(name) {
        const idx = this.templates.findIndex(tp => tp.name === name);
        if (idx >= 0) {
            this.templates.splice(idx, 1);
            this.save();
        }
    }
    /**
     * 更新模板
     * @param name 模板名称
     */
    updated(name, template) {
        const idx = this.templates.findIndex(tp => tp.name === name);
        if (idx < 0) {
            throw new Error('模板不存在');
        }
        const tp = this.templates[idx];
        // 合并数据
        Object.assign(tp, template);
        this.save();
    }
    /**
     * 清空
     */
    clear() {
        this.templates = [];
        this.save();
    }
    // 加载
    load() {
        this.templates = fsExtra.readJSONSync(TEMPLATE_PATH) || [];
    }
    // 保存
    save() {
        fsExtra.writeJSONSync(TEMPLATE_PATH, this.templates, { spaces: 2 });
    }
}
const templateRegistry = new TemplateRegistry();
var templateCommand = defineCommand({
    name: COMMAND.CHANGE_REGISTRY,
    use: (ctx) => {
        // 更改淘宝源
        ctx.program.command(COMMAND.TEMPLATE).alias(COMMAND.TEMPLATE_ALIAS)
            .description('模板功能')
            .option('-l, --ls', "列出所有模板信息")
            .option('-a, --add', "新增模板")
            .option('-r, --rm <templateName>', "删除模板")
            .option('-u, --update <templateName>', "更新模板")
            .option('-c, --clear', "清空模板")
            .option('-d, --detail <templateName>', "模板详情")
            .action(async (options) => {
            if (options.ls) {
                success(templateRegistry.templates.map((tp, index) => index + 1 + '. ' + tp.name).join('\r\n'));
            }
            else if (options.add) {
                //填写模板信息
                const ans = await inquirer__default["default"].prompt([
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
                success(`新增模板[${ans.templateName}]`);
            }
            else if (options.update) {
                if (!templateRegistry.exists(options.update)) {
                    error(`模板[${options.update}]不存在`);
                    return;
                }
                const record = templateRegistry.get(options.update);
                //填写模板信息
                const ans = await inquirer__default["default"].prompt([
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
                templateRegistry.updated(options.update, { name: ans.templateName, local: ans.local, localPath: ans.local ? ans.url : "", remoteSrc: ans.local ? "" : ans.url });
                success(`更新模板[${options.update}]`);
            }
            else if (options.rm) {
                if (!templateRegistry.exists(options.rm)) {
                    error(`模板[${options.rm}]不存在`);
                    return;
                }
                templateRegistry.remove(options.rm);
                success(`已删除模板[${options.rm}]`);
            }
            else if (options.clear) {
                templateRegistry.clear();
                success(`模板已清空`);
            }
            else if (options.detail) {
                if (!templateRegistry.exists(options.rm)) {
                    error(`模板[${options.rm}]不存在`);
                    return;
                }
                success(`模板已清空`);
            }
            else {
                if (Object.keys(options).length === 0) {
                    success(templateRegistry.templates.map((tp, index) => index + 1 + '. ' + tp.name).join('\r\n'));
                }
            }
        });
    }
});

program.name(PROJECT_NAME).usage("[command] [options]");
// 命令行
const commands = [initCommand, registryCommand, templateCommand];
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
