import { join } from "path";

import { existsSync } from "fs-extra";
import inquirer from "inquirer";
import { readPackageSync } from "read-pkg";
import { writePackageSync } from "write-pkg";

import COMMAND from "@/constant/command";
import { newline, success } from "@/lib/log";

import { Version, versionRE } from "./version";
import defineCommand from "../defineCommand";

export default defineCommand({
  name: COMMAND.RELEASE_VERSION,
  use(ctx) {
    ctx.program
      .command(COMMAND.RELEASE_VERSION)
      .alias(COMMAND.RELEASE_VERSION_ALIAS)
      .description("版本控制")
      .action(async () => {
        // 判断package.json是否存在
        const cwd = process.cwd();
        const pkgPath = join(cwd, "package.json");
        if (!existsSync(pkgPath)) {
          throw new Error("package.json 文件未找到");
        }
        const pkg = readPackageSync();
        const currentVersion = pkg.version;
        let version!: Version;
        // 如果不存在，则需要初始化一下
        if (!currentVersion) {
          const ans = await inquirer.prompt([
            {
              name: "version",
              type: "input",
              message: "请输入版本号",
              validate: (ipt) => {
                return versionRE.test(ipt);
              }
            }
          ]);
          version = new Version(ans.version);
        } else {
          const _version = new Version(currentVersion);
          const nextMajorVersion = _version.nextMajorVersion();
          const nextMinorVersion = _version.nextMinorVersion();
          const nextPatchVersion = _version.nextPatchVersion();
          const ans = await inquirer.prompt([
            {
              name: "version",
              type: "list",
              message: "请选择版本",
              choices: [
                {
                  name: `补丁版本 ${nextPatchVersion.toString()}`,
                  value: nextPatchVersion
                },
                {
                  name: `次版本 ${nextMinorVersion.toString()}`,
                  value: nextMinorVersion
                },
                {
                  name: `主版本 ${nextMajorVersion.toString()}`,
                  value: nextMajorVersion
                }
              ]
            }
          ]);
          version = ans.version;
        }
        pkg.version = version.toString();
        writePackageSync(pkg);
        newline();
        success(`版本已更新为 ${version.toString()}`);
      });
  }
});
