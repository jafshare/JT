import fs from "fs";
import { extname, join, normalize } from "path";
import { existsSync } from "fs-extra";
import archiver from "archiver";
import ora from "ora";
import extract from "extract-zip";
import defineCommand from "../defineCommand";
import COMMAND from "@/constant/command";
import { danger, newline, success, underlineAndBold } from "@/lib/log";
import { CONFIG_DIR } from "@/constant/path";
const bundleFilename = "jt_config.zip";
/**
 * 获取完整的路径，如果指定到文件，则使用指定的文件名，指定到目录，则使用base作为文件名
 * @param path 路径
 * @param filename 文件名，如果路径指定了文件名，则使用路径中的文件名
 * @returns 返回path + base 的路径
 */
export const getFullPath = (path: string, filename: string) => {
  let fullPath = path;
  // 如果是目录，则需要加上filename
  if (!extname(path)) {
    fullPath = join(path, filename);
  }
  return normalize(fullPath);
};
export const bundle = async (sourcePath: string, destPath: string) => {
  const outputPath = destPath;
  return new Promise((resolve, reject) => {
    if (!existsSync(sourcePath)) {
      return reject(new Error(`${sourcePath}文件不存在`));
    }
    const bundler = archiver("zip", {
      zlib: { level: 9 }
    });
    const output = fs.createWriteStream(outputPath);
    output.on("close", (err: any) => {
      if (err) {
        return reject(new Error(`${outputPath}关闭错误 ${err}`));
      }
      return resolve(outputPath);
    });
    bundler.pipe(output);
    bundler.directory(sourcePath, "/");
    bundler.finalize();
  });
};
export const unzip = async (sourcePath: string, destDirPath: string) => {
  return new Promise(async (resolve, reject) => {
    if (!existsSync(sourcePath)) {
      return reject(new Error(`${sourcePath}文件不存在`));
    }
    try {
      await extract(sourcePath, { dir: destDirPath });
      resolve(undefined);
    } catch (err) {
      reject(err);
    }
  });
};
/**
 * 提供配置导入导出
 */
export default defineCommand({
  name: COMMAND.CONFIG,
  use: (ctx) => {
    // 更改淘宝源
    ctx.program
      .command(COMMAND.CONFIG)
      .alias(COMMAND.CONFIG_ALIAS)
      .description("配置导入导出")
      .option("-i, --import [导入路径]", `导入模板(默认:${bundleFilename})`)
      .option("-e, --export [导出路径]", `导出模板(默认:${bundleFilename})`)
      .action(async (options) => {
        // 导入
        if (options.import) {
          let importPath = options.import;
          if (typeof importPath === "boolean") {
            importPath = process.cwd();
          }
          const loading = ora("正在导入...");
          try {
            await unzip(getFullPath(importPath, bundleFilename), CONFIG_DIR);
            loading.succeed("导入完成");
          } catch (err) {
            loading.fail(danger(`导入失败 ${err}`));
          }
        } else if (options.export) {
          // 导出
          let outputPath = options.export;
          // 如果未指定
          if (typeof outputPath === "boolean") {
            outputPath = process.cwd();
          }
          const loading = ora("正在导出...");
          try {
            const output = await bundle(
              CONFIG_DIR,
              getFullPath(outputPath, bundleFilename)
            );
            loading.succeed("导出完成");
            newline();
            success(`配置已导出 ${underlineAndBold(output)}`);
          } catch (err) {
            loading.fail(danger(`导出失败 ${err}`));
          }
        }
      });
  }
});
