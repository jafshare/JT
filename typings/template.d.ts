declare type Template = {
  // 模板名称
  name: string,
  // 是否本地模板
  local: boolean,
  // 远程源地址
  remoteSrc?: string,
  // 本地源路径
  localPath?: string,
}