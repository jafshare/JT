module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true
  },
  extends: [
    "@antfu/eslint-config-vue",
    "@vue/eslint-config-typescript",
    "@vue/eslint-config-prettier"
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": ["off"], // ts 定义数据类型为any不报错
    "@typescript-eslint/ban-types": [
      // 解决空对象报错
      "error",
      {
        extendDefaults: true,
        types: {
          "{}": false
        }
      }
    ],
    "no-empty": "off", // catch finally语句块报错
    "no-empty-function": "off", // 关闭空函数报错
    "no-console": "off", // 关闭console的报错
    "no-async-promise-executor": "off", // 取消Promise的executor的Promise
    "@typescript-eslint/no-empty-function": ["off"],
    "@typescript-eslint/no-var-requires": "off", // require报错
    "@typescript-eslint/ban-ts-comment": "off", // 禁用@ts-ignore等指令的报错
    "antfu/if-newline": "off"
  }
};
