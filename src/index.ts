import path from 'path'
import inquirer from "inquirer"
import figlet from 'figlet'
import { program } from 'commander'

import { VERSION } from "./constant"
import { templates } from './data'
import { error, info } from "./lib/log"
import { gitDownload } from "./lib/download"
export type Answers = {
  project: string,
  template: string,
}
function createByTemplate() {
  const defaultProjectName = path.basename(process.cwd())
  inquirer.prompt<Answers>([
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
    const template = templates.find((item) => item.name === answers.template)
    if (!template) {
      error('选择的模板不存在')
      return
    }
    // 下载模板
    try {
      await gitDownload(template.remoteSrc as string, '模板下载中...')
    } catch (err) {
      error(err)
    }
  })
}
// 打印logo
figlet('F T', { width: 100 }, (err, data) => {
  if (err) {
    error(err)
    return
  }
  info(data)
})
program.version(VERSION)
  .command('init')
  .description('根据模板创建')
  .action(() => {
    createByTemplate()
  })
// 解析命令
program.parse()


