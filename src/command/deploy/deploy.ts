import nodeSSH from 'node-ssh'
import archiver from 'archiver'
import fs from 'fs'
import { existsSync } from 'fs-extra';
import { error, success, underlineAndBold } from '@/lib/log';
/**
 * 开始打包成zip
 * @param sourcePath 文件路径
 */
export const bundle = async (sourcePath: string) => {
  return new Promise((resolve, reject) => {
    if (!existsSync(sourcePath)) {
      error(`${underlineAndBold(sourcePath)}文件不存在`)
      return reject(new Error(`${sourcePath}文件不存在`))
    }
    const bundler = archiver("zip", {
      zlib: { level: 9 }
    })
    const destPath = sourcePath + '.zip'
    const output = fs.createWriteStream(destPath)
    output.on('close', (err: any) => {
      if (err) {
        error(`关闭archiver异常${err}`)
        return reject(new Error(`${sourcePath}文件不存在`))
      }
      return resolve(void 0)
    })
    bundler.pipe(output)
    bundler.directory(sourcePath, '/')
    bundler.finalize()
  })

}

export async function deploy() {
}