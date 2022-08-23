import { defineConfig } from "rollup";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";
import json from "@rollup/plugin-json";

export default defineConfig({
  input: "src/index.ts",
  output: {
    dir: "bin",
    format: "commonjs",
    // 添加执行环境
    banner: "#! /usr/bin/env node",
  },
  plugins: [
    nodeResolve({
      // 仅作为模块导入
      modulesOnly: true,
      preferBuiltins: false,
    }),
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          // 转为ES2015
          module: "ES2015",
        },
      },
    }),
    json(),
  ],
});
