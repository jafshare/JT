import { execaSync } from "execa";
import inquirer from "inquirer";
import ora from "ora";

import configs from "@/config";
import COMMAND from "@/constant/command";
import { dangerText, error, success, underlineAndBoldText } from "@/lib/log";

import defineCommand from "../defineCommand";

export default defineCommand({
  name: COMMAND.CHANGE_REGISTRY,
  use: (ctx) => {
    // 更改淘宝源
    ctx.program
      .command(COMMAND.CHANGE_REGISTRY)
      .alias(COMMAND.CHANGE_REGISTRY_ALIAS)
      .description("更换为淘宝下载源")
      .option("-t, --test", "测试所有镜像源的连接速度")
      .action(async (opts) => {
        const registries = configs.registries;
        if (opts.test) {
          const fetch = require("node-fetch");
          const loading = ora("正在测试连接速度...");
          loading.start();
          try {
            const tasks = await Promise.all(
              registries.map(async (r) => {
                try {
                  const start = Date.now();
                  const res = await fetch(r.registry, { timeout: 5 * 1000 });
                  const end = Date.now();
                  return {
                    ...r,
                    err: null,
                    status: res.status,
                    duration: end - start
                  };
                } catch (error) {
                  return { ...r, err: error, status: 404, duration: Infinity };
                }
              })
            );
            loading.stop();
            success(
              `${"name".padEnd(10, " ")} ${"status".padEnd(8, " ")} duration`
            );
            // 展示结果
            tasks.forEach((t) => {
              if (t.err) {
                error(`${`${t.name} `.padEnd(10, " ")} ${t.err}`);
              } else {
                if (t.status > 400) {
                  error(
                    `${`${t.name} `.padEnd(10, " ")} ${
                      t.status + "".padEnd(6)
                    } ${t.duration} ms`
                  );
                } else {
                  success(
                    `${`${t.name} `.padEnd(10, " ")} ${
                      t.status + "".padEnd(6)
                    } ${t.duration} ms`
                  );
                }
              }
            });
          } catch (e: any) {
            loading.fail(dangerText(e?.message || "未知异常"));
            throw e;
          }
        } else {
          const ans = await inquirer.prompt([
            {
              name: "registry",
              type: "list",
              message: `请选择镜像源`,
              // choices: registries.map((item) => item.name)
              choices: registries.map((item) => ({
                label: `${`${item.name} `.padEnd(14, " ")} ${item.registry}`,
                value: item.name
              }))
            },
            {
              name: "packageManager",
              type: "list",
              message: "请选择包管理器",
              choices: ["npm", "yarn", "pnpm"]
            }
          ]);
          try {
            // 判断 yarn | npm
            const command = ans.packageManager;
            const registry = registries.find(
              (item) => item.name === ans.registry
            ) as Registry;
            execaSync(command, [
              "config",
              "set",
              "registry",
              registry.registry
            ]);
            success(`已更换为 ${underlineAndBoldText(ans.registry)} 源`);
          } catch (err) {
            error(err);
          }
        }
      });
  }
});
