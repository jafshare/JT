import type { QuestionCollection } from "inquirer"
/**
 * 非空校验
 * @param input 输入值
 * @returns 
 */
export const validEmpty = (input: string) => {
  // 非空校验
  if (!input) {
    return '不能为空'
  }
  return true;
}
/**
 * 返回添加default的问题列表
 * @param questions 问题列表
 * @param initial 默认值
 */
export const withDefault = <T extends Record<string, any>>(questions: QuestionCollection<T>, initial?: Record<string, any>): QuestionCollection<T> => {
  return (questions as any[]).map(question => {
    if (initial && initial?.[question.name]) {
      question.default = initial?.[question.name]
    }
    return question
  })
}