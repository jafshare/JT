#! /usr/bin/env node
'use strict';

var figlet = require('figlet');
var fsPath = require('path');
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
var path = require('node:path');
var childProcess = require('node:child_process');
var crossSpawn = require('cross-spawn');
var os = require('os');
require('node:os');
require('get-stream');
require('merge-stream');
var fs = require('fs');
var makeDir = require('make-dir');
var isStream$1 = require('is-stream');
var shellEscape = require('shell-escape');
var invariant = require('assert');
var SSH2 = require('ssh2');
var archiver = require('archiver');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var figlet__default = /*#__PURE__*/_interopDefaultLegacy(figlet);
var fsPath__default = /*#__PURE__*/_interopDefaultLegacy(fsPath);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var inquirer__default = /*#__PURE__*/_interopDefaultLegacy(inquirer);
var process__default = /*#__PURE__*/_interopDefaultLegacy(process$1);
var readline__default = /*#__PURE__*/_interopDefaultLegacy(readline);
var onetime__default = /*#__PURE__*/_interopDefaultLegacy(onetime);
var signalExit__default = /*#__PURE__*/_interopDefaultLegacy(signalExit);
var cliSpinners__default = /*#__PURE__*/_interopDefaultLegacy(cliSpinners);
var wcwidth__default = /*#__PURE__*/_interopDefaultLegacy(wcwidth);
var gitly__default = /*#__PURE__*/_interopDefaultLegacy(gitly);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var childProcess__default = /*#__PURE__*/_interopDefaultLegacy(childProcess);
var crossSpawn__default = /*#__PURE__*/_interopDefaultLegacy(crossSpawn);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var makeDir__default = /*#__PURE__*/_interopDefaultLegacy(makeDir);
var isStream__default = /*#__PURE__*/_interopDefaultLegacy(isStream$1);
var shellEscape__default = /*#__PURE__*/_interopDefaultLegacy(shellEscape);
var invariant__default = /*#__PURE__*/_interopDefaultLegacy(invariant);
var SSH2__default = /*#__PURE__*/_interopDefaultLegacy(SSH2);
var archiver__default = /*#__PURE__*/_interopDefaultLegacy(archiver);

const VERSION = '0.0.1';
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
const newline = (lineNumber = 1) => {
    for (let index = 0; index < lineNumber; index++) {
        success();
    }
};
const arrow = () => {
    success("   ⇓");
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

const CONFIG_DIR = fsPath__default["default"].join(__dirname, "../config");
const TEMPLATE_PATH = fsPath__default["default"].join(CONFIG_DIR, 'templates.json');
const REGISTRY_PATH = fsPath__default["default"].join(CONFIG_DIR, 'registries.json');
const DEPLOY_PATH = fsPath__default["default"].join(CONFIG_DIR, 'deploys.json');

const configs = {
    registries: require(REGISTRY_PATH),
    templates: require(TEMPLATE_PATH)
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

async function createByTemplate() {
    const templates = configs.templates;
    const defaultProjectName = 'jt-template';
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
    const projectPath = answers.projectName;
    const pathExists = fsExtra.existsSync(projectPath);
    // 下载模板
    try {
        if (pathExists) {
            const ans = await inquirer__default["default"].prompt([
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
        if (sourceUrl?.includes(specifyDirIdentity)) {
            [sourceUrl, specifyDir] = sourceUrl.split(specifyDirIdentity);
            // 需要支持多层文件夹语法
            if (specifyDir) {
                specifyDir = fsPath__default["default"].join(...specifyDir.split('.'));
            }
        }
        // 创建目录
        !pathExists && await fsExtra.mkdir(answers.projectName);
        // 如果是远程代码则拉取仓库
        !template.local && await gitDownload(sourceUrl, fsPath__default["default"].join(TEMP_PATH, answers.projectName), '模板下载中...');
        const sourcePath = template.local ? fsPath__default["default"].join(sourceUrl, specifyDir) : fsPath__default["default"].join(TEMP_PATH, answers.projectName, specifyDir);
        // 拷贝文件
        await fsExtra.copy(sourcePath, answers.projectName);
        // 删除缓存文件
        await fsExtra.remove(fsPath__default["default"].join(TEMP_PATH, answers.projectName));
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
        });
    }
});

/**
 * 存储基本类，封装基本的存储的功能
 */
class BaseRegistry {
    storePath;
    idPropName;
    data = [];
    constructor(storePath, idPropName = "id") {
        this.storePath = storePath;
        this.idPropName = idPropName;
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
            if (options.ls || Object.keys(options).length === 0) {
                success(templateRegistry.data.map((tp, index) => index + 1 + '. ' + tp.name).join('\r\n'));
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
                success(`更新模板${underlineAndBold(options.update)}`);
            }
            else if (options.rm) {
                if (!templateRegistry.exists(options.rm)) {
                    error(`模板${underlineAndBold(options.rm)}不存在`);
                    return;
                }
                templateRegistry.remove(options.rm);
                success(`已删除模板${underlineAndBold(options.rm)}`);
            }
            else if (options.clear) {
                templateRegistry.clear();
                success(`模板已清空`);
            }
            else if (options.detail) {
                if (!templateRegistry.exists(options.detail)) {
                    error(`模板${underlineAndBold(options.detail)}不存在`);
                    return;
                }
                success(JSON.stringify(templateRegistry.get(options.detail), null, 2));
            }
        });
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
        if (initial && initial?.[question.name]) {
            question.default = initial?.[question.name];
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
            sftp.mkdir(path, (err) => {
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
        if (config.privateKey != null || config.privateKeyPath != null) {
            if (config.privateKey != null) {
                invariant__default["default"](typeof config.privateKey === 'string', 'config.privateKey must be a valid string');
                invariant__default["default"](config.privateKeyPath == null, 'config.privateKeyPath must not be specified when config.privateKey is specified');
            }
            else if (config.privateKeyPath != null) {
                invariant__default["default"](typeof config.privateKeyPath === 'string', 'config.privateKeyPath must be a valid string');
                invariant__default["default"](config.privateKey == null, 'config.privateKey must not be specified when config.privateKeyPath is specified');
            }
            invariant__default["default"](config.passphrase == null || typeof config.passphrase === 'string', 'config.passphrase must be null or a valid string');
            if (config.privateKeyPath != null) {
                // Must be an fs path
                try {
                    config.privateKey = await readFile(config.privateKeyPath);
                }
                catch (err) {
                    if (err != null && err.code === 'ENOENT') {
                        throw new invariant.AssertionError({ message: 'config.privateKeyPath does not exist at given fs path' });
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
            connection.on('error', reject);
            const callback = (err, res) => {
                connection.removeListener('error', reject);
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
            connection.on('error', reject);
            connection.sftp((err, res) => {
                connection.removeListener('error', reject);
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
        invariant__default["default"](options.stdin == null || typeof options.stdin === 'string' || isStream__default["default"].readable(options.stdin), 'options.stdin must be a valid string or readable stream');
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
            connection.on('error', reject);
            connection.exec(command, options.execOptions != null ? options.execOptions : {}, (err, channel) => {
                connection.removeListener('error', reject);
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
                if (options.stdin != null) {
                    if (isStream__default["default"].readable(options.stdin)) {
                        options.stdin.pipe(channel, {
                            end: true,
                        });
                    }
                    else {
                        channel.write(options.stdin);
                        channel.end();
                    }
                }
                else {
                    channel.end();
                }
                let code = null;
                let signal = null;
                channel.on('exit', (code_, signal_) => {
                    code = code_ !== null && code_ !== void 0 ? code_ : null;
                    signal = signal_ !== null && signal_ !== void 0 ? signal_ : null;
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
                sftp.fastGet(unixifyPath(remoteFile), localFile, transferOptions || {}, (err) => {
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
        invariant__default["default"](await new Promise((resolve) => {
            fs__default["default"].access(localFile, fs__default["default"].constants.R_OK, (err) => {
                resolve(err === null);
            });
        }), `localFile does not exist at ${localFile}`);
        const sftp = givenSftp || (await this.requestSFTP());
        const putFile = (retry) => {
            return new Promise((resolve, reject) => {
                sftp.fastPut(localFile, unixifyPath(remoteFile), transferOptions || {}, (err) => {
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
                files.forEach((file) => {
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
        const localDirectoryStat = await new Promise((resolve) => {
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
        const files = scanned.files.map((item) => fsPath__default["default"].relative(localDirectory, item));
        const directories = scanned.directories.map((item) => fsPath__default["default"].relative(localDirectory, item));
        // Sort shortest to longest
        directories.sort((a, b) => a.length - b.length);
        let failed = false;
        try {
            // Do the directories first.
            await new Promise((resolve, reject) => {
                const queue = new PromiseQueue({ concurrency });
                directories.forEach((directory) => {
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
                files.forEach((file) => {
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
        const localDirectoryStat = await new Promise((resolve) => {
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
                                resolve(res.map((item) => item.filename));
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
        const files = scanned.files.map((item) => fsPath__default["default"].relative(remoteDirectory, item));
        const directories = scanned.directories.map((item) => fsPath__default["default"].relative(remoteDirectory, item));
        // Sort shortest to longest
        directories.sort((a, b) => a.length - b.length);
        let failed = false;
        try {
            // Do the directories first.
            await new Promise((resolve, reject) => {
                const queue = new PromiseQueue({ concurrency });
                directories.forEach((directory) => {
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
                files.forEach((file) => {
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
const bundle = async (sourcePath) => {
    return new Promise((resolve, reject) => {
        if (!fsExtra.existsSync(sourcePath)) {
            error(`${underlineAndBold(sourcePath)}文件不存在`);
            return reject(new Error(`${sourcePath}文件不存在`));
        }
        const bundler = archiver__default["default"]("zip", {
            zlib: { level: 9 },
        });
        const destPath = sourcePath + ".zip";
        const output = fs__default["default"].createWriteStream(destPath);
        output.on("close", (err) => {
            if (err) {
                return reject(new Error(`${sourcePath}文件不存在`));
            }
            return resolve(void 0);
        });
        bundler.pipe(output);
        bundler.directory(sourcePath, "/");
        bundler.finalize();
    });
};
/**
 * 连接服务器
 * @param config ssh配置
 * @returns
 */
async function connectServer(config) {
    const { username, password, host, port, privateKeyPath } = config;
    const sshConfig = {
        username,
        password,
        host,
        port,
        privateKeyPath,
    };
    return new Promise(async (resolve, reject) => {
        try {
            await ssh.connect(sshConfig);
            resolve(void 0);
        }
        catch (err) {
            reject(new Error(`连接服务器失败 ${err}`));
        }
    });
}
/**
 * 上传文件
 * @param config ssh配置
 */
async function upload(config) {
    return new Promise(async (resolve, reject) => {
        try {
            await ssh.putFile(config.sourcePath + ".zip", config.remotePath + `/${config.distDirName}.zip`);
            resolve(void 0);
        }
        catch (err) {
            reject(new Error(`上传文件失败 ${err}`));
        }
    });
}
/**
 * 解压缩
 * @param config 配置
 * @returns
 */
async function unzip(config) {
    return new Promise(async (resolve, reject) => {
        const archiveFilename = `${config.distDirName}.zip`;
        await ssh.execCommand(`unzip -o ${archiveFilename} && rm -f ${archiveFilename}`, {
            cwd: config.remotePath,
            onStderr(chunk) {
                reject(new Error(`解压错误 ${chunk.toString("utf-8")}`));
            },
        });
        resolve(void 0);
    });
}
/**
 * 删除本地文件
 * @param config 配置
 */
async function deleteLocal(config) {
    try {
        fsExtra.unlinkSync(config.sourcePath + ".zip");
    }
    catch (err) {
        throw new Error(`删除本地文件失败 err`);
    }
}
async function stepLoading(task, message) {
    const loading = ora(message);
    loading.start();
    try {
        await task();
    }
    catch (e) {
        loading.fail(e?.message || "未知异常");
        // TODO 保存日志信息
        throw e;
    }
    finally {
        loading.stop();
    }
}
async function deploy(config) {
    try {
        // 第一步打包
        await stepLoading(async () => bundle(config.sourcePath), "开始压缩...");
        success("压缩完成");
        arrow();
        // 第二步连接服务器
        await stepLoading(async () => connectServer(config), "开始连接...");
        success(`连接完成(${underlineAndBold(config.host + ":" + config.port)})`);
        arrow();
        // 第三步上传文件
        await stepLoading(async () => upload(config), "开始上传...");
        success(`上传完成`);
        arrow();
        // 第四步解压缩
        await stepLoading(async () => unzip(config), "开始解压...");
        success(`解压完成`);
    }
    finally {
        // 第五步删除文件
        await stepLoading(async () => deleteLocal(config), "删除本地...");
        // 手动释放资源
        ssh.isConnected() && ssh.dispose();
    }
}

/**
 * 参考项目: https://github.com/dadaiwei/fe-deploy-cli
 */
// 部署相关的页面
class DeployRegistry extends BaseRegistry {
    constructor() {
        super(DEPLOY_PATH, "name");
    }
}
const deployRegistry = new DeployRegistry();
var deployCommand = defineCommand({
    name: COMMAND.DEPLOY,
    use: (ctx) => {
        ctx.program
            .command(COMMAND.DEPLOY)
            .alias(COMMAND.DEPLOY_ALIAS)
            .description("部署功能")
            .option("-l, --ls", "列出所有部署配置")
            .option("-a, --add", "添加部署配置")
            .option("-r, --rm <deployName>", "删除部署配置")
            .option("-u, --update <deployName>", "更新部署配置")
            .option("-c, --clear", "清空部署配置")
            .option("-d, --detail <deployName>", "配置详情")
            .option("-s, --start", "执行部署")
            .action(async (options) => {
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
                        if (options.add && deployRegistry.exists(input)) {
                            return "配置已存在";
                        }
                        return true;
                    },
                },
                {
                    name: "mode",
                    type: "list",
                    message: "请选择SSH模式",
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
            ];
            if (options.ls || Object.keys(options).length === 0) {
                success(deployRegistry.data
                    .map((config, index) => index + 1 + ". " + config.name)
                    .join("\r\n"));
            }
            else if (options.add) {
                // 添加部署配置
                const ans = await inquirer__default["default"].prompt(questions);
                deployRegistry.add({
                    name: ans.name,
                    mode: ans.mode,
                    privateKeyPath: ans.privateKeyPath,
                    host: ans.host,
                    port: ans.port,
                    username: ans.username,
                    distDirName: ans.distDirName,
                    remotePath: ans.remotePath,
                });
                success(`新增配置${underlineAndBold(ans.name)}`);
            }
            else if (options.update) {
                if (!deployRegistry.exists(options.update)) {
                    error(`配置${underlineAndBold(options.update)}不存在`);
                    return;
                }
                const record = deployRegistry.get(options.update);
                const ans = await inquirer__default["default"].prompt(withDefault(questions, record));
                deployRegistry.updated(options.update, {
                    name: ans.name,
                    mode: ans.mode,
                    privateKeyPath: ans.privateKeyPath,
                    host: ans.host,
                    port: ans.port,
                    username: ans.username,
                    distDirName: ans.distDirName,
                    remotePath: ans.remotePath,
                });
                success(`更新配置${underlineAndBold(options.update)}`);
            }
            else if (options.rm) {
                if (!deployRegistry.exists(options.rm)) {
                    error(`配置${underlineAndBold(options.rm)}不存在`);
                    return;
                }
                deployRegistry.remove(options.rm);
                success(`已删除配置${underlineAndBold(options.rm)}`);
            }
            else if (options.clear) {
                deployRegistry.clear();
                success(`配置已清空`);
            }
            else if (options.detail) {
                if (!deployRegistry.exists(options.detail)) {
                    error(`配置${underlineAndBold(options.detail)}不存在`);
                    return;
                }
                success(JSON.stringify(deployRegistry.get(options.detail), null, 2));
            }
            else if (options.start) {
                // TODO 执行部署命令
                const configList = deployRegistry.data.map((item) => item.name);
                const ans = await inquirer__default["default"].prompt([
                    {
                        name: "name",
                        type: "list",
                        choices: configList,
                    },
                    {
                        name: "distDirName",
                        type: "input",
                        default: (params) => {
                            return deployRegistry.get(params.name)?.distDirName || "";
                        },
                        validate: validEmpty,
                    },
                    {
                        name: "password",
                        type: "password",
                        validate: validEmpty,
                        // 仅当选择了密钥，才需要输入
                        when: (params) => {
                            return deployRegistry.get(params.name)?.mode === "password";
                        },
                    },
                ]);
                const record = deployRegistry.get(ans.name);
                const deployConfig = {
                    ...record,
                    ...ans,
                };
                // 生成最后的路径
                deployConfig.sourcePath = fsPath.join(process.cwd(), deployConfig.distDirName);
                newline();
                await deploy(deployConfig);
                newline(2);
                success("部署完成");
                // 开始部署
            }
        });
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
