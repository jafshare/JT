import { existsSync } from "fs";
import { basename, join } from "path";

import { copy } from "fs-extra";
import inquirer from "inquirer";
import latestVersion from "latest-version";
import { isArray, mergeWith } from "lodash";
import { readPackage } from "read-pkg";
import { writePackage } from "write-pkg";

import COMMAND from "@/constant/command";
import { error, success } from "@/lib/log";

import defineCommand from "../defineCommand";

export interface FileDescriptor {
  source: string;
  dest: string;
}
export type FileRecord = string | { source: string; dest: string };
export interface PackageRecord {
  name: string;
  version: string;
  type?: "devDependencies" | "dependencies";
}
export interface ScriptRecord {
  name: string;
  script: string;
}
export type FrameworkType = "node" | "vue" | "react";
export type ChoiceType =
  | "git"
  | "editor"
  | "prettier"
  | "eslint"
  | "typescript";
export interface ConfigValue {
  files: FileRecord[];
  packages: (PackageRecord | false)[];
  scripts?: (ScriptRecord | false)[];
  // 任意属性
  extraArgs?: Record<string, any>;
}
export type ConfigRecord = Record<ChoiceType, ConfigValue>;
const allChoices: ChoiceType[] = [
  "git",
  "editor",
  "prettier",
  "eslint",
  "typescript"
];
/**
 * 配置
 * files的路径基于 assets 目录
 */
const getConfig = async ({
  choices = [],
  framework
}: {
  choices: string[];
  framework: FrameworkType;
}): Promise<ConfigRecord> => {
  const baseConfig: ConfigRecord = {
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
      extraArgs: choices.includes("eslint")
        ? {
            "lint-staged": {
              "*.{ts,tsx,js,jsx}":
                "eslint --cache --fix --ext .js,.ts,.jsx,.tsx .",
              "*.{js,jsx,tsx,ts,less,md,json}":
                "prettier --ignore-unknown --write"
            }
          }
        : {}
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
      files: ["eslint/.eslintignore"],
      packages: [
        { name: "eslint", version: "^8.29.0", type: "devDependencies" },
        {
          name: "eslint-plugin-import",
          version: await latestVersion("eslint-plugin-import"),
          type: "devDependencies"
        }
      ],
      scripts: []
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
  let mergeConfig: Partial<Record<keyof ConfigRecord, Partial<ConfigValue>>> =
    {};
  if (framework === "vue") {
    mergeConfig = {
      git: {
        extraArgs: choices.includes("eslint")
          ? {
              "lint-staged": {
                "*.{vue,ts,tsx,js,jsx}":
                  "eslint --cache --fix --ext .vue,.js,.ts,.jsx,.tsx .",
                "*.{vue,js,jsx,tsx,ts,less,md,json}":
                  "prettier --ignore-unknown --write"
              }
            }
          : {}
      },
      eslint: {
        files: [
          {
            source: "eslint/vue.eslintrc.cjs",
            dest: ".eslintrc.cjs"
          }
        ],
        packages: [
          {
            name: "@antfu/eslint-config-vue",
            version: await latestVersion("@antfu/eslint-config-vue"),
            type: "devDependencies"
          },
          {
            name: "@vue/eslint-config-typescript",
            version: "^11.0.2"
          },
          {
            name: "@vue/eslint-config-prettier",
            version: "^7.0.0"
          }
        ],
        scripts: [
          {
            name: "lint",
            script: "eslint --cache --fix  --ext .vue,.js,.ts,.jsx,.tsx ."
          }
        ]
      }
    };
  } else if (framework === "react") {
    mergeConfig = {
      eslint: {
        files: [
          {
            source: "eslint/react.eslintrc.cjs",
            dest: ".eslintrc.cjs"
          }
        ],
        packages: [
          {
            name: "@antfu/eslint-config-react",
            version: await latestVersion("@antfu/eslint-config-react"),
            type: "devDependencies"
          },
          {
            name: "eslint-config-prettier",
            version: "^8.0.0"
          },
          {
            name: "eslint-plugin-prettier",
            version: "^4.2.1"
          }
        ],
        scripts: [
          {
            name: "lint",
            script: "eslint --cache --fix  --ext .js,.ts,.jsx,.tsx ."
          }
        ]
      }
    };
  } else {
    mergeConfig = {
      eslint: {
        files: ["eslint/.eslintrc.cjs"],
        packages: [
          {
            name: "@antfu/eslint-config-ts",
            version: await latestVersion("@antfu/eslint-config-ts"),
            type: "devDependencies"
          },
          {
            name: "eslint-config-prettier",
            version: "^8.0.0"
          },
          {
            name: "eslint-plugin-prettier",
            version: "^4.2.1"
          }
        ],
        scripts: [
          {
            name: "lint",
            script: "eslint --cache --fix  --ext .js,.ts,.jsx,.tsx ."
          }
        ]
      }
    };
  }
  // 合并两个配置
  mergeWith(baseConfig, mergeConfig, (objValue, srcValue, key) => {
    // lint-stage采用覆盖的方式
    if (["lint-staged"].includes(key)) {
      return srcValue;
    }
    // 其他字段采用拼接
    if (isArray(objValue)) {
      return objValue.concat(srcValue);
    }
  });
  return baseConfig;
};
/**
 * 排除false的数据
 * @param data
 * @param choices
 * @returns
 */
function filterFalse(data: any[] | any) {
  if (Array.isArray(data)) {
    return data.filter((item) => item !== false);
  }
  return data;
}
function formatFiles(files: FileRecord[]): FileDescriptor[] {
  return files.map((file) => {
    if (typeof file === "string") {
      return { source: file, dest: basename(file) };
    }
    return file;
  });
}
async function copyFiles(
  files: FileDescriptor[],
  onOverride: (filename: string) => Promise<boolean>
) {
  for await (const copyDesc of files) {
    const source = join(__dirname, "./assets/project", copyDesc.source);
    const dest = join(process.cwd(), copyDesc.dest);
    if (existsSync(dest)) {
      const res = await onOverride(copyDesc.dest);
      if (!res) {
        continue;
      }
    }
    await copy(source, dest, { recursive: true });
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
  if (!extraArgs) return;
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
      .option("-i, --init", "初始化项目")
      .option("-a, --add", "添加功能")
      .action(async (options) => {
        if (options.init || Object.keys(options).length === 0) {
          const ans = await inquirer.prompt([
            {
              name: "framework",
              type: "list",
              message: "请选择项目框架",
              choices: [
                { name: "node项目", value: "node" },
                { name: "vue项目", value: "vue" },
                { name: "react项目", value: "react" }
              ]
            },
            {
              name: "type",
              type: "list",
              message: `选择项目配置`,
              choices: [
                { name: "全部", value: "all" },
                { name: "自定义", value: "custom" }
              ]
            },
            {
              name: "customChoices",
              type: "checkbox",
              message: "自定义配置",
              choices: allChoices,
              when: ({ type }) => {
                return type === "custom";
              }
            }
          ]);
          try {
            let choices: ChoiceType[] = [];
            const files: FileDescriptor[] = [];
            const packages: PackageRecord[] = [];
            const scripts: ScriptRecord[] = [];
            let extraArgs: Record<string, any> = {};
            // 安装所有
            if (ans.type === "all") {
              choices = allChoices;
            } else {
              // 自定义安装
              choices = ans.customChoices;
            }
            // 获取配置
            const config = await getConfig({
              choices,
              framework: ans.framework
            });
            for (const key of choices) {
              const _files = config[key].files || [];
              const _packages = config[key].packages || [];
              const _scripts = config[key].scripts || [];
              const _extraArgs = config[key].extraArgs || {};
              // 转换file的格式
              files.push(...formatFiles(_files));
              packages.push(...filterFalse(_packages));
              scripts.push(...filterFalse(_scripts));
              extraArgs = { ...extraArgs, ...filterFalse(_extraArgs) };
            }
            // 拷贝文件
            if (files.length > 0) {
              await copyFiles(files, async (filename: string) => {
                const ans = await inquirer.prompt([
                  {
                    name: "override",
                    type: "confirm",
                    message: `${filename}已存在，是否覆盖`
                  }
                ]);
                return ans.override;
              });
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
        } else if (options.add) {
          const ans = await inquirer.prompt([
            {
              name: "choices",
              message: "请选择需要添加的功能",
              type: "checkbox",
              choices: [
                { name: "工具函数", value: { source: "utils", dest: "utils" } },
                {
                  name: "工具Typings",
                  value: { source: "typings", dest: "typings" }
                }
              ]
            }
          ]);
          const choices = ans.choices;
          await copyFiles(choices, async (filename: string) => {
            const ans = await inquirer.prompt([
              {
                name: "override",
                type: "confirm",
                message: `${filename}已存在，是否覆盖`
              }
            ]);
            return ans.override;
          });
        }
      });
  }
});
