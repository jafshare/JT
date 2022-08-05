import path from 'path'
import inquirer from "inquirer"
import { copy, mkdir, remove, existsSync } from 'fs-extra'

import { TEMP_PATH, VERSION } from "@/constant"
import { error, info, success } from "@/lib/log"
import { gitDownload } from "@/lib/download"
import configs from '@/config';
import defineCommand from '../defineCommand';
import COMMAND from '@/constant/command'
export type Answers = {
  projectName: string,
  template: string,
}
async function createByTemplate() {
  const templates = configs.templates
  const defaultProjectName = path.basename(process.cwd())
  const answers = await inquirer.prompt<Answers>([
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
  ])
  const template = templates.find((item) => item.name === answers.template) as Template
  const pathExists = existsSync(answers.projectName)
  // 下载模板
  try {
    if (pathExists) {
      const ans = await inquirer.prompt([
        {
          name: 'isOverride',
          type: 'confirm',
          message: `${answers.projectName} 已存在,是否继续`
        }
      ])
      if (!ans.isOverride) {
        return
      }
    }

    await gitDownload(template.remoteSrc as string, path.join(TEMP_PATH, answers.projectName), '模板下载中...')

    // 创建目录
    !pathExists && await mkdir(answers.projectName)
    // 拷贝文件
    await copy(path.join(TEMP_PATH, answers.projectName), answers.projectName)
    // 删除缓存文件
    await remove(path.join(TEMP_PATH, answers.projectName))
  } catch (err) {
    error(err)
    return
  }
  // TODO 后续处理
  success('\r\n创建完成！')
  info(`  cd ${answers.projectName}\r\n`)
}
export default defineCommand({
  name: COMMAND.INIT, use: (ctx) => {
    ctx.program.version(VERSION)
      .command(COMMAND.INIT)
      .description('根据模板创建')
      .action(() => {
        createByTemplate()
      })
  }
})
