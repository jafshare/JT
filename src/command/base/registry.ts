import { existsSync, readJSONSync, writeJSONSync } from "fs-extra";
/**
 * 存储基本类，封装基本的存储的功能
 */
export class BaseRegistry<T extends Record<string, any>> {
  data: T[] = [];
  constructor(
    public storePath: string,
    public idPropName: keyof T = "id" as any
  ) {
    this.load();
  }

  /**
   * 判断数据是否存在，根据name
   * @param id 唯一值
   * @returns 是否存在
   */
  exists(id: string) {
    return !!this.data.find((data) => data[this.idPropName as keyof T] === id);
  }

  /**
   * 获取指定数据
   * @param id 唯一标识
   */
  get(id: string) {
    if (!this.exists(id)) {
      throw new Error("模板不存在");
    }
    return this.data.find((tp) => tp[this.idPropName as keyof T] === id);
  }

  /**
   * 添加模板
   * @param template 模板参数
   */
  add(data: T) {
    // 去重
    const isExists = this.exists(data[this.idPropName]);
    if (isExists) {
      throw new Error("数据已存在");
    }
    this.data.push(data);
    this.save();
  }

  /**
   * 删除数据
   * @param id 数据唯一标识
   */
  remove(id: string) {
    const idx = this.data.findIndex((data) => data[this.idPropName] === id);
    if (idx >= 0) {
      this.data.splice(idx, 1);
      this.save();
    }
  }

  /**
   * 更新数据
   * @param id 数据唯一标识
   */
  updated(id: string, data: T) {
    const idx = this.data.findIndex((data) => data[this.idPropName] === id);
    if (idx < 0) {
      throw new Error("数据不存在");
    }
    const target = this.data[idx];
    // 合并数据
    Object.assign(target as any, data);
    this.save();
  }

  /**
   * 清空
   */
  clear() {
    this.data = [];
    this.save();
  }

  // 加载
  load() {
    // 判断文件是否存在
    if (!existsSync(this.storePath)) {
      this.data = [];
      return;
    }
    this.data = readJSONSync(this.storePath) || [];
  }

  // 保存
  save() {
    writeJSONSync(this.storePath, this.data, { spaces: 2 });
  }
}
