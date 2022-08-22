import { TEMPLATE_PATH } from '@/constant/path';
import inquirer from "inquirer"

import COMMAND from "@/constant/command"
import { error, success, underlineAndBold } from "@/lib/log"
import defineCommand from "../defineCommand";
import { BaseRegistry } from '../base/registry';
/**
 * 对模板仓库的封装
 */
class TemplateRegistry extends BaseRegistry<Template>{
  constructor() {
    super(TEMPLATE_PATH, 'name')
  }
}
const templateRegistry = new TemplateRegistry()
export default defineCommand({
  name: COMMAND.CHANGE_REGISTRY,
  use: (ctx) => {
    // 更改淘宝源
    ctx.program.command(COMMAND.TEMPLATE).alias(COMMAND.TEMPLATE_ALIAS)
      .description('模板功能')
      .option('-l, --ls', "列出所有模板信息")
      .option('-a, --add', "新增模板")
      .option('-r, --rm <templateName>', "删除模板")
      .option('-u, --update <templateName>', "更新模板")
      .option('-c, --clear', "清空模板")
      .option('-d, --detail <templateName>', "模板详情")
      .action(async (options) => {
        if (options.ls || Object.keys(options).length === 0) {
          success(templateRegistry.data.map((tp, index) => index + 1 + '. ' + tp.name).join('\r\n'))
        } else if (options.add) {
          //填写模板信息
          const ans = await inquirer.prompt([
            {
              name: 'templateName',
              type: "input",
              message: `请输入模板名称`,
              validate(input) {
                // 非空校验
                if (!input) {
                  return '不能为空'
                }
                // 校验模板是否存在
                if (templateRegistry.exists(input)) {
                  return '模板已存在'
                }
                return true;
              },
            },
            {
              name: 'local',
              type: 'confirm',
              message: '是否本地模板'
            },
            {
              name: 'url',
              type: 'input',
              message: '模板地址',
              validate(input) {
                // 非空校验
                // TODO后期添加协议校验
                if (!input) {
                  return '不能为空'
                }
                return true;
              },
            }
          ])
          templateRegistry.add({ name: ans.templateName, local: ans.local, localPath: ans.local ? ans.url : "", remoteSrc: ans.local ? "" : ans.url })
          success(`新增模板[${ans.templateName}]`)
        } else if (options.update) {
          if (!templateRegistry.exists(options.update)) {
            error(`模板[${options.update}]不存在`)
            return
          }
          const record = templateRegistry.get(options.update)!
          //填写模板信息
          const ans = await inquirer.prompt([
            {
              name: 'templateName',
              type: "input",
              message: `请输入模板名称`,
              default: record.name,
              validate(input) {
                // 非空校验
                if (!input) {
                  return '不能为空'
                }
                // 校验模板是否存在
                if (input !== record.name && templateRegistry.exists(input)) {
                  return '模板已存在'
                }
                return true;
              },
            },
            {
              name: 'local',
              type: 'confirm',
              message: '是否本地模板',
              default: record.local
            },
            {
              name: 'url',
              type: 'input',
              message: '模板地址',
              default: record.local ? record.localPath : record.remoteSrc,
              validate(input) {
                // 非空校验
                // TODO后期添加协议校验
                if (!input) {
                  return '不能为空'
                }
                return true;
              },
            }
          ])
          templateRegistry.updated(options.update, { name: ans.templateName, local: ans.local, localPath: ans.local ? ans.url : "", remoteSrc: ans.local ? "" : ans.url })
          success(`更新模板${underlineAndBold(options.update)}`)
        } else if (options.rm) {
          if (!templateRegistry.exists(options.rm)) {
            error(`模板${underlineAndBold(options.rm)}不存在`)
            return
          }
          templateRegistry.remove(options.rm)
          success(`已删除模板${underlineAndBold(options.rm)}`)
        } else if (options.clear) {
          templateRegistry.clear()
          success(`模板已清空`)
        } else if (options.detail) {
          if (!templateRegistry.exists(options.detail)) {
            error(`模板${underlineAndBold(options.detail)}不存在`)
            return
          }
          success(JSON.stringify(templateRegistry.get(options.detail), null, 2))
        }
      })
  }
})
