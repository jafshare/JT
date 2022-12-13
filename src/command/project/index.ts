import inquirer from "inquirer";

import COMMAND from "@/constant/command";
import { error, success, underlineAndBold } from "@/lib/log";
import defineCommand from "../defineCommand";
import { readPackage } from "read-pkg";
import { copyFile } from "fs/promises";
import { join } from "path";
import { writePackage } from "write-pkg";
export type PackageRecord = {
  name: string;
  version: string;
  type?: "devDependencies" | "dependencies";
};
export type CommandRecord = { name: string; script: string };
export type ConfigRecord = Record<
  string,
  {
    files: string[];
    packages: PackageRecord[];
    commands?: CommandRecord[];
    // 任意属性
    extraArgs?: Record<string, any>;
  }
>;
const config: ConfigRecord = {
  git: {
    files: [],
    packages: [],
  },
  editor: {
    files: [".editorconfig"],
    packages: [],
  },
  eslint: {
    files: [".eslintignore"],
    packages: [],
    commands: [{ name: "lint", script: "eslint --cache" }],
    extraArgs: {
      "lint-staged": {
        "*": ["prettier --write --cache --ignore-unknown"],
        "packages/*/{src,types}/**/*.ts": ["eslint --cache --fix"],
        "packages/**/*.d.ts": ["eslint --cache --fix"],
        "playground/**/__tests__/**/*.ts": ["eslint --cache --fix"],
      },
    },
  },
  typescript: {
    files: ["tsconfig.json"],
    packages: [
      { name: "typescript", version: "^4.9.3", type: "devDependencies" },
    ],
  },
};
async function copyFiles(files: string[]) {
  for await (const filePath of files) {
    await copyFile(
      join(__dirname, "./assets/project", filePath),
      join(process.cwd(), filePath)
    );
  }
}
async function writePackageInfo(packages: PackageRecord[]) {
  const pkg = await readPackage();
  packages.forEach((packageInfo) => {
    if (packageInfo.type === "dependencies") {
      if (!pkg.dependencies) {
        pkg.dependencies = {} as any;
      }
      pkg.dependencies![packageInfo.name] = packageInfo.version;
    } else {
      if (!pkg.devDependencies) {
        pkg.devDependencies = {} as any;
      }
      pkg.devDependencies![packageInfo.name] = packageInfo.version;
    }
  });
  await writePackage(pkg);
}
async function writeCommand(commands: CommandRecord[]) {
  const pkg = await readPackage();
  commands.forEach((command) => {
    pkg.scripts![command.name] = command.script;
  });
  await writePackage(pkg);
}
async function writeExtraArgs(extraArgs: Record<string, any>) {
  const pkg = await readPackage();
  for (const key in extraArgs) {
    pkg[key] = extraArgs[key];
  }
  await writePackage(pkg);
}
export default defineCommand({
  name: COMMAND.PROJECT,
  use: (ctx) => {
    // 更改淘宝源
    ctx.program
      .command(COMMAND.PROJECT)
      .alias(COMMAND.PROJECT_ALIAS)
      .description("项目配置")
      .action(async () => {
        const ans = await inquirer.prompt([
          {
            name: "type",
            type: "list",
            message: `选择项目配置`,
            choices: ["all", "custom"],
          },
          {
            name: "customConfig",
            type: "checkbox",
            message: "自定义配置",
            choices: ["git", "eslint", "prettier", "editor", "typescript"],
            when: ({ type }) => {
              return type === "custom";
            },
          },
        ]);
        try {
          let files: string[] = [];
          let packages: PackageRecord[] = [];
          let commands: CommandRecord[] = [];
          let extraArgs: Record<string, any> = {};
          // 安装所有
          if (ans.type === "all") {
            files = [...config.eslint.files, ...config.editor.files];
            for (const key of Object.keys(config)) {
              const _files = config[key].files || [];
              const _packages = config[key].packages || [];
              const _commands = config[key].commands || [];
              const _extraArgs = config[key].extraArgs || {};
              files.push(..._files);
              packages.push(..._packages);
              commands.push(..._commands);
              extraArgs = { ...extraArgs, ..._extraArgs };
            }
          } else {
            // TODO 自定义安装
            console.log("ans:", ans.customConfig);
          }
          // 拷贝文件
          if (files.length > 0) {
            await copyFiles(files);
          }
          // 写入配置
          if (packages.length > 0) {
            await writePackageInfo(packages);
          }
          // 写入命令
          if (commands.length > 0) {
            await writeCommand(commands);
          }
          // 写入额外属性
          if (Object.keys(extraArgs).length > 0) {
            await writeExtraArgs(extraArgs);
          }
          success(`已添加配置，请执行安装命令`);
        } catch (err) {
          error(err);
        }
      });
  },
});
