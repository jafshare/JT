import path from 'path'
import inquirer from "inquirer"
import figlet from 'figlet'
import { execaSync } from 'execa';
import { copySync } from 'fs-extra'
import { program } from 'commander'

import { PROJECT_NAME, TEMP_PATH, VERSION } from "./constant"
import { registries, templates } from './data'
import { error, info, success } from "./lib/log"
import { gitDownload } from "./lib/download"
export type Answers = {
  projectName: string,
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
      copySync(path.join(TEMP_PATH), process.cwd())
      console.log('拷贝成功')
    } catch (err) {
      error(err)
    }
    success('创建完成！')
    info()
    info(`cd ${answers.projectName}`)
  })
}

program.name(PROJECT_NAME).usage("[command] [options]")

program.version(VERSION)
  .command('init')
  .description('根据模板创建')
  .action(() => {
    createByTemplate()
  })
// 更改淘宝源
program.command('change-registry').alias('cr')
  .description('更换为淘宝下载源')
  .action(() => {
    //TODO 更换源
    try {
      // 判断 yarn | npm
      const command = 'yarn'
      execaSync(command, ['config', 'set', 'registry', registries.taobao])
      success('已更换为淘宝源')
    } catch (err) {
      error(err)
    }
  })

program.on("--help", () => {
  // 打印logo
  figlet('F T', (err, data) => {
    if (err) {
      error(err)
      return
    }
    info(data)
  })
})

// 解析命令
program.parse()


