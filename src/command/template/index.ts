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
const chooseTemplate = async () => {
  return inquirer.prompt({
    name: 'name',
    type: 'list',
    message: '选择模板',
    choices: templateRegistry.data.map(item => item.name)
  });
}
export default defineCommand({
  name: COMMAND.CHANGE_REGISTRY,
  use: (ctx) => {
    // 更改淘宝源
    ctx.program.command(COMMAND.TEMPLATE).alias(COMMAND.TEMPLATE_ALIAS)
      .description('模板功能')
      .option('-l, --ls', "列出所有模板信息")
      .option('-a, --add', "新增模板")
      .option('-r, --rm [模板名称]', "删除模板")
      .option('-u, --update [模板名称]', "更新模板")
      .option('-c, --clear', "清空模板")
      .option('-d, --detail [模板名称]', "模板详情")
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
          success(`新增模板${underlineAndBold(ans.templateName)}`)
        } else if (options.update) {
          let id = options.update
          // 如果未提供配置名称，则提供选择
          if (typeof id === 'boolean') {
            if (templateRegistry.data.length === 0) return success()
            const ans = await chooseTemplate();
            id = ans.name
          }
          if (!templateRegistry.exists(id)) {
            error(`模板${underlineAndBold(id)}不存在`)
            return
          }
          const record = templateRegistry.get(id)!
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
          templateRegistry.updated(id, { name: ans.templateName, local: ans.local, localPath: ans.local ? ans.url : "", remoteSrc: ans.local ? "" : ans.url })
          success(`更新模板${underlineAndBold(id)}`)
        } else if (options.rm) {
          let id = options.rm
          // 如果未提供配置名称，则提供选择
          if (typeof id === 'boolean') {
            if (templateRegistry.data.length === 0) return success()
            const ans = await chooseTemplate();
            id = ans.name
          }
          if (!templateRegistry.exists(id)) {
            error(`模板${underlineAndBold(id)}不存在`)
            return
          }
          templateRegistry.remove(id)
          success(`已删除模板${underlineAndBold(id)}`)
        } else if (options.clear) {
          templateRegistry.clear()
          success(`模板已清空`)
        } else if (options.detail) {
          let id = options.detail
          // 如果未提供配置名称，则提供选择
          if (typeof id === 'boolean') {
            if (templateRegistry.data.length === 0) return success()
            const ans = await chooseTemplate();
            id = ans.name
          }

          if (!templateRegistry.exists(id)) {
            error(`模板${underlineAndBold(id)}不存在`)
            return
          }
          const record = templateRegistry.get(id)!
          success('------------------------------')
          success('模板名称:', record.name)
          success('是否本地模板:', record.local ? '是' : '否')
          success('模板路径:', record.local ? record.localPath : record.remoteSrc)
          success('------------------------------')
        }
      })
  }
})
