/**
 * 如果是一个函数则调用后返回
 * @param func
 * @param args
 */
export function runIt(func: any, ...args: any[]) {
  if (typeof func === "function") {
    return func(...args);
  }
  return func;
}
