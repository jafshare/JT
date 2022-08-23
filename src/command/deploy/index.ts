/**
 * 参考项目: https://github.com/dadaiwei/fe-deploy-cli
 */
import { join } from "path";
import { DEPLOY_PATH } from "@/constant/path";
import inquirer, { QuestionCollection } from "inquirer";

import COMMAND from "@/constant/command";
import { error, newline, success, underlineAndBold } from "@/lib/log";
import defineCommand from "../defineCommand";
import { BaseRegistry } from "../base/registry";
import { validEmpty, withDefault } from "@/lib/inquirerUtils";
import { deploy } from "./deploy";
export type DeployRecord = {
  name: string;
  // 连接模式 密码/密钥
  mode: "password" | "privateKey";
  // 密钥地址
  privateKeyPath?: string;
  // 主机地址
  host: string;
  // 主机端口，默认22
  port?: number;
  // 登录用户
  username: string;
  // 本地打包目录
  distDirName: string;
  // 远程部署地址
  remotePath: string;
};
// 部署相关的页面
class DeployRegistry extends BaseRegistry<DeployRecord> {
  constructor() {
    super(DEPLOY_PATH, "name");
  }
}
const deployRegistry = new DeployRegistry();

export default defineCommand({
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
        const questions: QuestionCollection<DeployRecord> = [
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
        if (options.ls) {
          success(
            deployRegistry.data
              .map((config, index) => index + 1 + ". " + config.name)
              .join("\r\n")
          );
        } else if (options.add) {
          // 添加部署配置
          const ans = await inquirer.prompt(questions);
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
        } else if (options.update) {
          if (!deployRegistry.exists(options.update)) {
            error(`配置${underlineAndBold(options.update)}不存在`);
            return;
          }
          const record = deployRegistry.get(options.update)!;
          const ans = await inquirer.prompt(withDefault(questions, record));
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
        } else if (options.rm) {
          if (!deployRegistry.exists(options.rm)) {
            error(`配置${underlineAndBold(options.rm)}不存在`);
            return;
          }
          deployRegistry.remove(options.rm);
          success(`已删除配置${underlineAndBold(options.rm)}`);
        } else if (options.clear) {
          deployRegistry.clear();
          success(`配置已清空`);
        } else if (options.detail) {
          if (!deployRegistry.exists(options.detail)) {
            error(`配置${underlineAndBold(options.detail)}不存在`);
            return;
          }
          success(JSON.stringify(deployRegistry.get(options.detail), null, 2));
        } else if (options.start || Object.keys(options).length === 0) {
          // TODO 执行部署命令
          const configList = deployRegistry.data.map((item) => item.name);
          const ans = await inquirer.prompt([
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
                const record = deployRegistry.get(params.name)!
                success('------------------------------')
                success('服务器地址: ' + record.host + ':' + record.port)
                success('登录用户: ' + record.username)
                success('本地路径: ' + join(
                  process.cwd(),
                  record.distDirName
                ))
                success('远程部署路径: ' + record.remotePath)
                success('------------------------------')
                return '是否部署:'
              }
            },
            {
              name: "password",
              type: "password",
              message: '服务器密码',
              validate: validEmpty,
              // 仅当选择了密钥，才需要输入
              when: (params) => {
                return params.isConfirm && deployRegistry.get(params.name)?.mode === "password";
              },
            },
          ]);
          if (!ans.isConfirm) {
            newline();
            error("取消部署")
            return
          }
          // TODO 确认配置，且提示是否需要修改
          const record = deployRegistry.get(ans.name);
          const deployConfig: DeployRecord & {
            password: string;
            sourcePath: string;
          } = {
            ...record,
            ...ans,
          };
          // 生成最后的路径
          deployConfig.sourcePath = join(
            process.cwd(),
            deployConfig.distDirName
          );
          newline();
          try {
            // 开始部署
            const start = Date.now();
            await deploy(deployConfig as any);
            const end = Date.now();
            newline(2);
            success(`部署成功,耗时${underlineAndBold(((end - start) / 1000).toFixed(1))}s`);
          } catch (err) {
            // TODO log日志输出
            newline(2);
            error(`部署失败 ${err}`);
          }
        }
      });
  },
});
