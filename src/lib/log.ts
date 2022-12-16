import chalk from "chalk";
const debug = (...args: any[]) => {
  console.log(chalk.greenBright(...args));
};
const success = (...args: any[]) => {
  debug(...args);
};
const info = (...args: any[]) => {
  console.log(chalk.white(...args));
};
const warn = (...args: any[]) => {
  console.log(chalk.yellowBright(...args));
};
const error = (...args: any[]) => {
  console.log(chalk.redBright(...args));
};
/**
 * 返回下划线修饰的字符
 * @param args 任意字符
 * @returns
 */
const underline = (...args: any[]) => {
  return chalk.underline(...args);
};
/**
 * 返回加粗后的字符
 * @param args 任意字符
 * @returns
 */
const bold = (...args: any[]) => {
  return chalk.bold(...args);
};
/**
 * 返回下划线修饰以及加粗的字符
 * @param args 任意字符
 * @returns
 */
const underlineAndBold = (...args: any[]) => {
  return chalk.underline.bold(...args);
};
/**
 * 返回红色文字
 * @param args 任意字符
 * @returns
 */
const danger = (...args: any[]) => {
  return chalk.redBright(...args);
};
/**
 * 换行
 * @param lineNumber 换行数，默认一行
 */
const newline = (lineNumber = 1) => {
  for (let index = 0; index < lineNumber; index++) {
    success();
  }
};
/**
 * 返回箭头
 */
const arrow = () => {
  success("   ⇓");
};
export {
  debug,
  info,
  warn,
  error,
  success,
  underline,
  bold,
  underlineAndBold,
  newline,
  arrow,
  danger
};
