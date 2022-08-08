import { TEMPLATE_PATH } from '@/constant/path';
import { writeJSONSync, readJSONSync } from 'fs-extra'
import inquirer from "inquirer"
import { execaSync } from 'execa';

import COMMAND from "@/constant/command"
import { error, success } from "@/lib/log"
import defineCommand from "../defineCommand";
/**
 * 对模板仓库的封装
 */
class TemplateRegistry {
  templates: Template[] = [];
  constructor() {
    this.load();
  }
  /**
   * 判断模板是否存在，根据name
   * @param name 模板名称
   * @returns 是否存在
   */
  exists(name: string) {
    return !!this.templates.find(tp => tp.name === name)
  }
  /**
   * 获取模板
   * @param name 模板名称
   */
  get(name: string) {
    if (!this.exists(name)) {
      throw new Error('模板不存在')
    }
    return this.templates.find(tp => tp.name === name)
  }
  /**
   * 添加模板
   * @param template 模板参数 
   */
  add(template: Template) {
    // 去重
    const isExists = this.exists(template.name)
    if (isExists) {
      throw new Error('模板已存在')
    }
    // TODO template校验
    this.templates.push(template)
    this.save()
  }
  /**
   * 
   * @param name 模板名
   */
  remove(name: string) {
    const idx = this.templates.findIndex(tp => tp.name === name)
    if (idx >= 0) {
      this.templates.splice(idx, 1)
      this.save()
    }
  }
  /**
   * 更新模板
   * @param name 模板名称
   */
  updated(name: string, template: Template) {
    const idx = this.templates.findIndex(tp => tp.name === name)
    if (idx < 0) {
      throw new Error('模板不存在')
    }
    const tp = this.templates[idx]
    // 合并数据
    Object.assign(tp, template)
    this.save()
  }
  /**
   * 清空
   */
  clear() {
    this.templates = []
    this.save()
  }
  // 加载
  load() {
    this.templates = readJSONSync(TEMPLATE_PATH) || []
  }
  // 保存
  save() {
    writeJSONSync(TEMPLATE_PATH, this.templates, { spaces: 2 })
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
        console.log('tempaltes:', options)
        if (options.ls) {
          success(templateRegistry.templates.map((tp, index) => index + 1 + '. ' + tp.name).join('\r\n'))
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
          success(`更新模板[${options.update}]`)
        } else if (options.rm) {
          if (!templateRegistry.exists(options.rm)) {
            error(`模板[${options.rm}]不存在`)
            return
          }
          templateRegistry.remove(options.rm)
          success(`已删除模板[${options.rm}]`)
        } else if (options.clear) {
          templateRegistry.clear()
          success(`模板已清空`)
        } else if (options.detail) {
          if (!templateRegistry.exists(options.rm)) {
            error(`模板[${options.rm}]不存在`)
            return
          }
          success(`模板已清空`)
        } else {
          if (Object.keys(options).length === 0) {
            success(templateRegistry.templates.map((tp, index) => index + 1 + '. ' + tp.name).join('\r\n'))
          }
        }
      })
  }
})
