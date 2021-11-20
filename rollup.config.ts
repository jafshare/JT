import { defineConfig } from 'rollup'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json'
export default defineConfig({
  input: 'src/index.ts',
  output: {
    dir: "bin",
    format: "commonjs",
    // 添加执行环境
    banner: '#! /usr/bin/env node'
  },
  plugins: [
    typescript(
      {
        tsconfigOverride: {
          compilerOptions: {
            // 转为ESNext
            module: "ESNext"
          }
        }
      },
    ),
    nodeResolve({
      // 仅作为模块导入
      modulesOnly:true
    }),
    commonjs(),
    json()
  ]
})