import path from 'path'
import inquirer from "inquirer"
import figlet from 'figlet'
import { execaSync } from 'execa';
import { copy, mkdir, remove, existsSync } from 'fs-extra'
import { program } from 'commander'

import { PROJECT_NAME, TEMP_PATH, VERSION } from "./constant"
import { error, info, success } from "./lib/log"
import { gitDownload } from "./lib/download"
export type Answers = {
  projectName: string,
  template: string,
}
export type Template = {
  // 模板名称
  name: string,
  // 是否本地模板
  local: boolean,
  // 远程源地址
  remoteSrc?: string,
  // 本地源路径
  localPath?: string,
}
export type Registry = {
  name: string,
  src: string
}
// 配置加载
const configs: { registries: Registry[], templates: Template[] } = {
  registries: require("../config/registries.json"),
  templates: require("../config/templates.json")
}

function createByTemplate() {
  const templates = configs.templates
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
      message: "项目模板：",
      choices: templates.map((item) => item.name)
    }
  ]).then(async (answers) => {
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
  .action(async () => {
    const registries = configs.registries
    const ans = await inquirer.prompt([
      {
        name: 'registry',
        type: "list",
        message: `请选择镜像源`,
        choices: registries.map((item) => item.name)
      },
      {
        name: 'packageManager',
        type: 'list',
        message: '请选择包管理器',
        choices: ['npm', 'yarn']
      }
    ])
    //TODO 更换源
    try {
      // 判断 yarn | npm
      const command = ans.packageManager
      const registry = registries.find((item) => item.name === ans.registry) as Registry
      execaSync(command, ['config', 'set', 'registry', registry.src])
      success(`已更换为${ans.registry}源`)
    } catch (err) {
      error(err)
    }
  })

program.on("--help", () => {
  // 打印logo
  success("\r\n",figlet.textSync('F T', {
    font: 'Ghost',
    width: 80,
    whitespaceBreak: true
  }))
})

// 解析命令
program.parse()


