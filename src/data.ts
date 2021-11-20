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

export const templates: Template[] = [
  { name: "electron-react-vite2", local: false, remoteSrc: "https://github.com/jafshare/Electron-React-Vite2" },
  { name: "electron-vue3-vite2", local: false, remoteSrc: "https://github.com/jafshare/Electron-Vue3-Vite" }
]