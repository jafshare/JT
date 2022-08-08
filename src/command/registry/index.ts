import inquirer from "inquirer"
import { execaSync } from 'execa';

import COMMAND from "@/constant/command"
import { error, success } from "@/lib/log"
import configs from '@/config'
import defineCommand from "../defineCommand";
export default defineCommand({
  name: COMMAND.CHANGE_REGISTRY,
  use: (ctx) => {
    // 更改淘宝源
    ctx.program.command(COMMAND.CHANGE_REGISTRY).alias(COMMAND.CHANGE_REGISTRY_ALIAS)
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
  }
})
