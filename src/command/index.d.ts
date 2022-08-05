import type { Command } from "commander"
export type CommandPlugin = {
  name: string,
  use: (ctx: CommandPluginContext) => any
}
interface CommandPluginContext {
  program: Command
} 