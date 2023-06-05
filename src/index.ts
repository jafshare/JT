import figlet from "figlet";

import configCommand from "./command/config";
import createCommand from "./command/create";
import deployCommand from "./command/deploy";
import projectCommand from "./command/project";
import registryCommand from "./command/registry";
import templateCommand from "./command/template";
import versionCommand from "./command/version";
import { PROJECT_NAME } from "./constant";
import program from "./core";
import { success } from "./lib/log";

import type { CommandPlugin } from "./command/index.d";
// 初始化数据

program.name(PROJECT_NAME).usage("[command] [options]");
// 命令行
const commands: CommandPlugin[] = [
  createCommand,
  registryCommand,
  templateCommand,
  deployCommand,
  configCommand,
  projectCommand,
  versionCommand
];
for (const command of commands) {
  // 加载命令
  command.use({ program });
}
program.on("--help", () => {
  // 打印logo
  success(
    "\r\n",
    figlet.textSync(PROJECT_NAME.split("").join(" "), {
      font: "Ghost",
      width: 80,
      whitespaceBreak: true
    })
  );
});

// 解析命令
program.parse();
