/**
 * 模板下载
 */
import ora from 'ora';
const _download = require("download-git-repo")
function download(src: string, dest: string, options?: { clone?: boolean, }, cb?: (err: Error) => void): void;
function download(src: string, dest: string, cb?: (err: Error) => void): void;
function download(...args: any[]) {
  _download(...args)
}

export const gitDownload = async (src: string, dest: string, loadingText?: string): Promise<Error | undefined> => {
  return new Promise((resolve, reject) => {

    const loading = loadingText ? ora(loadingText) : null
    loading && loading.start()
    download(src, dest, (err) => {
      console.log(err)
      if (err) {
        loading && loading.fail('下载错误')
        reject(err)
      } else {
        loading && loading.succeed()
        resolve(undefined)
      }
    })
  })
}