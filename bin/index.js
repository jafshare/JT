#! /usr/bin/env node
'use strict';

var path = require('path');
var inquirer = require('inquirer');
var figlet = require('figlet');
var commander = require('commander');
var chalk = require('chalk');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var inquirer__default = /*#__PURE__*/_interopDefaultLegacy(inquirer);
var figlet__default = /*#__PURE__*/_interopDefaultLegacy(figlet);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);

const VERSION = '0.0.1';
const TEMP_DIR_NAME = '.temp';
const TEMP_PATH = path__default["default"].join(__dirname, '..', TEMP_DIR_NAME);

const templates = [
    { name: "electron-react-vite2", local: false, remoteSrc: "https://github.com/jafshare/Electron-React-Vite2" },
    { name: "electron-vue3-vite2", local: false, remoteSrc: "https://github.com/jafshare/Electron-Vue3-Vite" }
];

const info = (...args) => {
    chalk__default["default"].white(...args);
};
const error = (...args) => {
    chalk__default["default"].redBright(...args);
};

/**
 * 模板下载
 */
const _download = require("download-git-repo");
function download(...args) {
    _download(...args);
}
const gitDownload = async (src, loadingText) => {
    return new Promise((resolve, reject) => {
        // const loading = loadingText ? ora(loadingText) : null
        // loading && loading.start()
        download(src, TEMP_PATH, (err) => {
            console.log(err);
            if (err) {
                // loading && loading.fail()
                reject(err);
            }
            else {
                // loading && loading.succeed()
                resolve(undefined);
            }
        });
    });
};

function createByTemplate() {
    const defaultProjectName = path__default["default"].basename(process.cwd());
    inquirer__default["default"].prompt([
        {
            type: "input",
            name: "projectName",
            message: "项目名称：",
            default: defaultProjectName
        },
        {
            type: 'list',
            name: 'template',
            message: "项目模板",
            choices: templates.map((item) => item.name)
        }
    ]).then(async (answers) => {
        const template = templates.find((item) => item.name === answers.template);
        if (!template) {
            error('选择的模板不存在');
            return;
        }
        // 下载模板
        try {
            await gitDownload(template.remoteSrc, '模板下载中...');
        }
        catch (err) {
            error(err);
        }
    });
}
// 打印logo
figlet__default["default"]('F T', { width: 100 }, (err, data) => {
    if (err) {
        error(err);
        return;
    }
    info(data);
});
commander.program.version(VERSION)
    .command('init')
    .description('根据模板创建')
    .action(() => {
    createByTemplate();
});
// 解析命令
commander.program.parse();
