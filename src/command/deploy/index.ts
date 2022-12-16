/**
 * 参考项目: https://github.com/dadaiwei/fe-deploy-cli
 */
import { join } from "path";
import type { QuestionCollection } from "inquirer";
import inquirer from "inquirer";
import defineCommand from "../defineCommand";
import { BaseRegistry } from "../base/registry";
import { deploy, execScript } from "./deploy";
import { DEPLOY_PATH } from "@/constant/path";

import COMMAND from "@/constant/command";
import { error, newline, success, underlineAndBold, warn } from "@/lib/log";
import { validEmpty, withDefault } from "@/lib/inquirerUtils";
export interface DeployRecord {
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
  // 部署前脚本
  beforeScript?: string;
  // 部署后脚本
  afterScript?: string;
}
// 部署相关的页面
class DeployRegistry extends BaseRegistry<DeployRecord> {
  constructor() {
    super(DEPLOY_PATH, "name");
  }
}
const emptyMessage = "暂无可用配置，请添加(●'◡'●)";
const displayDeployInfo = (record: DeployRecord) => {
  success("------------------------------");
  success("配置名称:", record.name);
  success("服务器地址:", `${record.host}:${record.port}`);
  success("密钥模式:", record.mode === "password" ? "密码" : "密钥");
  success("登录用户:", record.username);
  success("本地路径:", join(process.cwd(), record.distDirName));
  success("远程部署路径:", record.remotePath);
  success("部署前执行脚本:", record.beforeScript || "");
  success("部署后执行脚本:", record.afterScript || "");
  success("------------------------------");
};
const deployRegistry = new DeployRegistry();
const chooseDeploy = async () => {
  return inquirer.prompt({
    name: "name",
    type: "list",
    message: "请选择配置",
    choices: deployRegistry.data.map((item) => item.name)
  });
};
export default defineCommand({
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
              if (
                (options.add || options.copy) &&
                deployRegistry.exists(input)
              ) {
                return "配置已存在";
              }
              return true;
            }
          },
          {
            name: "mode",
            type: "list",
            message: "请选择密钥模式",
            choices: [
              { name: "密码", value: "password" },
              { name: "密钥", value: "privateKey" }
            ]
          },
          {
            name: "privateKeyPath",
            type: "input",
            message: "请输入密钥路径",
            // 仅当选择了密钥，才需要输入
            when: (params) => {
              return params.mode === "privateKey";
            },
            validate: validEmpty
          },
          {
            name: "host",
            type: "input",
            message: "请输入主机地址",
            validate: validEmpty
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
            }
          },
          {
            name: "username",
            type: "input",
            message: "请输入登录用户",
            validate: validEmpty
          },
          {
            name: "distDirName",
            type: "input",
            message: "本地目录名",
            // 相当于默认名，每次执行命令都会重新询问
            validate: validEmpty
          },
          {
            name: "remotePath",
            type: "input",
            message: "远程部署路径",
            // 相当于默认名，每次执行命令都会重新询问
            validate: validEmpty
          },
          {
            name: "beforeScript",
            type: "input",
            message: "部署前执行脚本"
          },
          {
            name: "afterScript",
            type: "input",
            message: "部署后执行脚本"
          }
        ];
        if (options.ls) {
          success(
            deployRegistry.data
              .map((config, index) => `${index + 1}. ${config.name}`)
              .join("\r\n")
          );
        } else if (options.add) {
          // 添加部署配置
          const ans = await inquirer.prompt(questions);
          // 数据格式化
          for (const key in ans) {
            const k = key as NonNullable<keyof DeployRecord>;
            const value = ans[k];
            if (typeof value === "string") {
              (ans as Record<string, any>)[k] = value;
            }
          }
          deployRegistry.add(ans);
          success(`新增配置${underlineAndBold(ans.name)}`);
        } else if (options.update) {
          let id = options.update;
          // 如果未提供配置名称，则提供选择
          if (typeof id === "boolean") {
            if (deployRegistry.data.length === 0) return warn(emptyMessage);
            const ans = await chooseDeploy();
            id = ans.name;
          }
          if (!deployRegistry.exists(id)) {
            error(`配置${underlineAndBold(id)}不存在`);
            return;
          }
          const record = deployRegistry.get(id)!;
          // 修改name的校验规则
          (questions as any[]).find((item) => item.name === "name").validate = (
            input: any
          ) => {
            // 非空校验
            if (!input) {
              return "不能为空";
            }
            if (record.name !== input && deployRegistry.exists(input)) {
              return "配置已存在";
            }
            return true;
          };
          const ans = await inquirer.prompt(withDefault(questions, record));
          deployRegistry.updated(id, ans);
          success(`更新配置${underlineAndBold(id)}`);
        } else if (options.rm) {
          let id = options.rm;
          // 如果未提供配置名称，则提供选择
          if (typeof id === "boolean") {
            if (deployRegistry.data.length === 0) return warn(emptyMessage);
            const ans = await chooseDeploy();
            id = ans.name;
          }
          if (!deployRegistry.exists(id)) {
            error(`配置${underlineAndBold(id)}不存在`);
            return;
          }
          deployRegistry.remove(id);
          success(`已删除配置${underlineAndBold(id)}`);
        } else if (options.clear) {
          // 确认清空
          const ans = await inquirer.prompt([
            { name: "isConfirm", type: "confirm", message: "确认清空?" }
          ]);
          if (!ans.isConfirm) return;
          deployRegistry.clear();
          success(`配置已清空`);
        } else if (options.detail) {
          let id = options.detail;
          // 如果未提供配置名称，则提供选择
          if (typeof id === "boolean") {
            if (deployRegistry.data.length === 0) return warn(emptyMessage);
            const ans = await chooseDeploy();
            id = ans.name;
          }
          if (!deployRegistry.exists(id)) {
            error(`配置${underlineAndBold(id)}不存在`);
            return;
          }
          displayDeployInfo(deployRegistry.get(id)!);
        } else if (options.start || Object.keys(options).length === 0) {
          // 当配置不存在则退出
          if (deployRegistry.data.length === 0) return warn(emptyMessage);
          // 执行部署命令
          const configList = deployRegistry.data.map((item) => item.name);
          const ans = await inquirer.prompt([
            {
              name: "name",
              type: "list",
              message: "部署配置",
              choices: configList
            },
            {
              name: "isConfirm",
              type: "confirm",
              message: (params) => {
                displayDeployInfo(deployRegistry.get(params.name)!);
                return "是否部署?";
              }
            },
            {
              name: "password",
              type: "password",
              message: "服务器密码",
              validate: validEmpty,
              // 仅当选择了密钥，才需要输入
              when: (params) => {
                return (
                  params.isConfirm &&
                  deployRegistry.get(params.name)?.mode === "password"
                );
              }
            }
          ]);
          if (!ans.isConfirm) {
            newline();
            warn("取消部署");
            return;
          }
          // TODO 确认配置，且提示是否需要修改
          const record = deployRegistry.get(ans.name);
          const deployConfig: DeployRecord & {
            password: string;
            sourcePath: string;
          } = {
            ...record,
            ...ans
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
            // 运行部署前脚本
            if (deployConfig.beforeScript) {
              await execScript(deployConfig.beforeScript, {
                cwd: process.cwd(),
                tip: `正在执行${underlineAndBold(
                  deployConfig.beforeScript
                )} ...`
              });
            }
            await deploy(deployConfig as any);
            if (deployConfig.afterScript) {
              // 运行部署后脚本
              await execScript(deployConfig.afterScript, {
                cwd: process.cwd(),
                tip: `正在执行${underlineAndBold(deployConfig.afterScript)} ...`
              });
            }
            const end = Date.now();
            newline(2);
            success(
              `部署成功,总耗时${underlineAndBold(
                ((end - start) / 1000).toFixed(1)
              )}s`
            );
          } catch (err) {
            // TODO log日志输出
            newline(2);
            error(`部署失败 ${err}`);
          }
        } else if (options.copy) {
          // 当配置不存在则退出
          let id = options.copy;
          // 如果未提供配置名称，则提供选择
          if (typeof id === "boolean") {
            if (deployRegistry.data.length === 0) return warn(emptyMessage);
            const ans = await inquirer.prompt({
              name: "name",
              type: "list",
              message: "选择配置",
              choices: deployRegistry.data.map((item) => item.name)
            });
            id = ans.name;
          }
          if (!deployRegistry.exists(id)) {
            error(`配置${underlineAndBold(id)}不存在`);
            return;
          }
          const record = deployRegistry.get(id)!;
          // 添加部署配置
          const ans = await inquirer.prompt(withDefault(questions, record));
          // 数据格式化
          for (const key in ans) {
            const k = key as NonNullable<keyof DeployRecord>;
            const value = ans[k];
            if (typeof value === "string") {
              (ans as Record<string, any>)[k] = value;
            }
          }
          deployRegistry.add(ans);
          success(`新增配置${underlineAndBold(ans.name)}`);
        }
      });
  }
});
