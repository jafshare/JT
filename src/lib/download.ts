import ora from "ora";
import gitly from "gitly";
import { TEMP_PATH } from "@/constant";
/**
 * 模板下载
 */

export const gitDownload = async (
  src: string,
  dest: string,
  loadingText?: string
): Promise<Error | undefined> => {
  return new Promise(async (resolve, reject) => {
    const loading = loadingText ? ora(loadingText) : null;
    loading && loading.start();
    try {
      await gitly(src, dest, { temp: TEMP_PATH });
      loading && loading.succeed();
      resolve(undefined);
    } catch (error) {
      loading && loading.fail(`下载错误${error}`);
      reject(error);
    }
  });
};
