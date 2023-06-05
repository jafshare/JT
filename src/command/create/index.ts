import path from "path";

import { copy, existsSync, mkdir, mkdirSync, remove, rmSync } from "fs-extra";
import inquirer from "inquirer";

import configs from "@/config";
import { TEMP_PATH, VERSION } from "@/constant";
import COMMAND from "@/constant/command";
import { gitDownload } from "@/lib/download";
import { error, info, success, warn } from "@/lib/log";

import defineCommand from "../defineCommand";

export interface Answers {
  projectName: string;
  template: string;
}
async function createByTemplate() {
  const templates = configs.templates;
  if (templates.length === 0) {
    return warn("暂无可用模板，请添加(●'◡'●)");
  }
  const defaultProjectName = "jt-template";
  const answers = await inquirer.prompt<Answers>([
    {
      type: "input",
      name: "projectName",
      message: "项目名称：",
      default: defaultProjectName
    },
    {
      type: "list",
      name: "template",
      message: "项目模板：",
      choices: templates.map((item) => item.name)
    }
  ]);
  const template = templates.find(
    (item) => item.name === answers.template
  ) as Template;
  const projectPath = answers.projectName;
  const pathExists = existsSync(projectPath);
  // 下载模板
  try {
    if (pathExists) {
      const ans = await inquirer.prompt([
        {
          name: "isOverride",
          type: "confirm",
          message: `${answers.projectName} 已存在,是否继续`
        },
        {
          name: "mode",
          type: "list",
          message: "请选择覆盖模式",
          choices: ["override", "replace"]
        }
      ]);
      if (!ans.isOverride) {
        return;
      } else {
        // 如果确认覆盖，选择模式，如果是override,则不做处理,如果是replace，则替换整个目录
        if (ans.mode === "replace") {
          // 先删除目录，再创建
          rmSync(projectPath, { recursive: true });
          mkdirSync(projectPath);
        }
      }
    }
    const specifyDirIdentity = "%";
    let specifyDir = "";
    let sourceUrl = template.local ? template.localPath : template.remoteSrc;
    // 判断是否有指定目录的语法
    if (sourceUrl?.includes(specifyDirIdentity)) {
      [sourceUrl, specifyDir] = sourceUrl.split(specifyDirIdentity);
      // 需要支持多层文件夹语法
      if (specifyDir) {
        specifyDir = path.join(...specifyDir.split("."));
      }
    }
    // 创建目录
    !pathExists && (await mkdir(answers.projectName));
    // 初始化TEMP目录
    !existsSync(TEMP_PATH) && mkdirSync(TEMP_PATH);
    // 如果是远程代码则拉取仓库
    !template.local &&
      (await gitDownload(
        sourceUrl as string,
        path.join(TEMP_PATH, answers.projectName),
        "模板下载中..."
      ));
    const sourcePath = template.local
      ? path.join(sourceUrl as string, specifyDir)
      : path.join(TEMP_PATH, answers.projectName, specifyDir);
    // 拷贝文件
    await copy(sourcePath, answers.projectName);

    // 删除缓存文件
    await remove(path.join(TEMP_PATH, answers.projectName));
  } catch (err) {
    error(err);
    return;
  }
  // TODO 后续处理
  success("\r\n创建完成！");
  info(`  cd ${answers.projectName}\r\n`);
}
export default defineCommand({
  name: COMMAND.CREATE,
  use: (ctx) => {
    ctx.program
      .version(VERSION)
      .command(COMMAND.CREATE)
      .alias(COMMAND.CREATE_ALIAS)
      .description("根据模板创建")
      .action(() => {
        createByTemplate();
      });
  }
});
