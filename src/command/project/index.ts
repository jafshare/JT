import { basename, join } from "path";
import inquirer from "inquirer";

import { copy } from "fs-extra";
import { readPackage } from "read-pkg";
import { writePackage } from "write-pkg";
import latestVersion from "latest-version";
import defineCommand from "../defineCommand";
import { error, success } from "@/lib/log";
import COMMAND from "@/constant/command";
import { runIt } from "@/utils/runIt";
export interface WhenType {
  // 是否会出现,仅当when === false则不会出现
  when?: boolean | ((choices: string[]) => boolean);
}
export type PackageRecord = {
  name: string;
  version: string;
  type?: "devDependencies" | "dependencies";
} & WhenType;
export type ScriptRecord = {
  name: string;
  script: string;
} & WhenType;
export type ConfigRecord = Record<
  string,
  {
    files: string[];
    packages: PackageRecord[];
    scripts?: ScriptRecord[];
    // 任意属性
    extraArgs?: Record<string, { value: any } & WhenType>;
  }
>;
/**
 * 配置
 * files的路径基于 assets 目录
 */
const getConfig = async (): Promise<ConfigRecord> => {
  return {
    git: {
      files: ["git/.husky", "git/commitlint.config.js"],
      packages: [
        {
          name: "husky",
          version: "^8.0.1",
          type: "devDependencies"
        },
        {
          name: "lint-staged",
          version: "^13.0.3",
          type: "devDependencies"
        },
        {
          name: "@commitlint/cli",
          version: "^17.3.0",
          type: "devDependencies"
        },
        {
          name: "@commitlint/config-conventional",
          version: "^17.3.0",
          type: "devDependencies"
        }
      ],
      scripts: [{ name: "prepare", script: "npx husky install" }],
      extraArgs: {
        "lint-staged": {
          value: {
            "*.{ts,tsx,js,jsx}":
              "eslint --cache --fix --ext .js,.ts,.jsx,.tsx .",
            "*.{js,jsx,tsx,ts,less,md,json}":
              "prettier --ignore-unknown --write"
          },
          when: (choices) => choices.includes("eslint")
        }
      }
    },
    editor: {
      files: ["editor/.editorconfig"],
      packages: []
    },
    prettier: {
      files: ["prettier/.prettierrc.json", "prettier/.prettierignore"],
      packages: [{ name: "prettier", version: "^2.8.1" }]
    },
    eslint: {
      files: ["eslint/.eslintignore", "eslint/.eslintrc.cjs"],
      packages: [
        { name: "eslint", version: "^8.29.0", type: "devDependencies" },
        {
          name: "@antfu/eslint-config",
          version: await latestVersion("@antfu/eslint-config"),
          type: "devDependencies"
        },
        {
          name: "eslint-config-prettier",
          version: "^8.0.0",
          when: (choices) => choices.includes("prettier")
        },
        {
          name: "eslint-plugin-prettier",
          version: "^4.2.1",
          when: (choices) => choices.includes("prettier")
        }
      ],
      scripts: [
        {
          name: "lint",
          script: "eslint --cache --fix  --ext .js,.ts,.jsx,.tsx ."
        }
      ]
    },
    typescript: {
      files: ["typescript/tsconfig.json"],
      packages: [
        {
          name: "typescript",
          version: await latestVersion("typescript"),
          type: "devDependencies"
        }
      ]
    }
  };
};
/**
 * 排除when ==== false的数据
 * @param data
 * @param choices
 * @returns
 */
function filterFalse(
  data:
    | ({ [propName: string]: any } & WhenType)[]
    | Record<string, { [propName: string]: any } & WhenType>,
  choices: string[]
) {
  if (Array.isArray(data)) {
    return data.filter((item) => runIt(item.when, [choices]) !== false);
  } else {
    const newData: any = {};
    for (const key in data) {
      const value = data[key];
      if (runIt(value.when, [choices]) !== false) {
        newData[key] = value;
      }
    }
    return newData;
  }
}
async function copyFiles(files: string[]) {
  for await (const filePath of files) {
    await copy(
      join(__dirname, "./assets/project", filePath),
      join(process.cwd(), basename(filePath)),
      { recursive: true }
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
async function writeScripts(scripts: ScriptRecord[]) {
  const pkg = await readPackage();
  scripts.forEach((script) => {
    pkg.scripts![script.name] = script.script;
  });
  await writePackage(pkg);
}
async function writeExtraArgs(extraArgs: Record<string, any>) {
  const pkg = await readPackage();
  for (const key in extraArgs) {
    pkg[key] = extraArgs[key].value;
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
        const config = await getConfig();
        const ans = await inquirer.prompt([
          {
            name: "type",
            type: "list",
            message: `选择项目配置`,
            choices: ["all", "custom"]
          },
          {
            name: "customChoices",
            type: "checkbox",
            message: "自定义配置",
            choices: Object.keys(config),
            when: ({ type }) => {
              return type === "custom";
            }
          }
        ]);
        try {
          let choices: string[] = [];
          const files: string[] = [];
          const packages: PackageRecord[] = [];
          const scripts: ScriptRecord[] = [];
          let extraArgs: Record<string, any> = {};
          // 安装所有
          if (ans.type === "all") {
            choices = Object.keys(config);
          } else {
            // 自定义安装
            choices = ans.customChoices;
          }
          for (const key of choices) {
            const _files = config[key].files || [];
            const _packages = config[key].packages || [];
            const _scripts = config[key].scripts || [];
            const _extraArgs = config[key].extraArgs || {};
            files.push(..._files);
            packages.push(...filterFalse(_packages, choices));
            scripts.push(...filterFalse(_scripts, choices));
            extraArgs = { ...extraArgs, ...filterFalse(_extraArgs, choices) };
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
          if (scripts.length > 0) {
            await writeScripts(scripts);
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
  }
});
