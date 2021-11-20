import chalk from "chalk"
const debug = (...args: any[]) => {
  chalk.greenBright(...args)
}
const info = (...args: any[]) => {
  chalk.white(...args)
}
const warn = (...args: any[]) => {
  chalk.yellowBright(...args)
}
const error = (...args: any[]) => {
  chalk.redBright(...args)
}
export {
  debug, info, warn, error
}