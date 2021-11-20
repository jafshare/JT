import chalk from "chalk"
const debug = (...args: any[]) => {
  console.log(chalk.greenBright(...args))
}
const success = (...args: any[]) => {
  debug(...args)
}
const info = (...args: any[]) => {
  console.log(chalk.white(...args))
}
const warn = (...args: any[]) => {
  console.log(chalk.yellowBright(...args))
}
const error = (...args: any[]) => {
  console.log(chalk.redBright(...args))
}
export {
  debug, info, warn, error, success
}