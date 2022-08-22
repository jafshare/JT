import { NodeSSH } from "node-ssh";
import fs from "fs";
import archiver from "archiver";
import { existsSync, unlinkSync } from "fs-extra";
import { arrow, error, success, underlineAndBold } from "@/lib/log";
import ora from "ora";
const ssh = new NodeSSH();
export type DeployConfig = {
  password?: string;
  // 密钥地址
  privateKeyPath?: string;
  // 主机地址
  host: string;
  // 主机端口，默认22
  port: number;
  // 登录用户
  username: string;
  // 本地打包地址
  sourcePath: string;
  // 远程部署地址
  remotePath: string;
  // dist文件名
  distDirName: string;
};
/**
 * 开始打包成zip
 * @param sourcePath 文件路径
 */
export const bundle = async (sourcePath: string) => {
  return new Promise((resolve, reject) => {
    if (!existsSync(sourcePath)) {
      error(`${underlineAndBold(sourcePath)}文件不存在`);
      return reject(new Error(`${sourcePath}文件不存在`));
    }
    const bundler = archiver("zip", {
      zlib: { level: 9 },
    });
    const destPath = sourcePath + ".zip";
    const output = fs.createWriteStream(destPath);
    output.on("close", (err: any) => {
      if (err) {
        return reject(new Error(`${sourcePath}文件不存在`));
      }
      return resolve(void 0);
    });
    bundler.pipe(output);
    bundler.directory(sourcePath, "/");
    bundler.finalize();
  });
};
/**
 * 连接服务器
 * @param config ssh配置
 * @returns
 */
export async function connectServer(config: DeployConfig) {
  const { username, password, host, port, privateKeyPath } = config;
  const sshConfig = {
    username,
    password,
    host,
    port,
    privateKeyPath,
  };
  return new Promise(async (resolve, reject) => {
    try {
      await ssh.connect(sshConfig);
      resolve(void 0);
    } catch (err) {
      reject(new Error(`连接服务器失败 ${err}`));
    }
  });
}
/**
 * 上传文件
 * @param config ssh配置
 */
export async function upload(config: DeployConfig) {
  return new Promise(async (resolve, reject) => {
    try {
      await ssh.putFile(
        config.sourcePath + ".zip",
        config.remotePath + `/${config.distDirName}.zip`
      );
      resolve(void 0);
    } catch (err) {
      reject(new Error(`上传文件失败 ${err}`));
    }
  });
}
/**
 * 解压缩
 * @param config 配置
 * @returns
 */
export async function unzip(config: DeployConfig) {
  return new Promise(async (resolve, reject) => {
    const archiveFilename = `${config.distDirName}.zip`;
    await ssh.execCommand(
      `unzip -o ${archiveFilename} && rm -f ${archiveFilename}`,
      {
        cwd: config.remotePath,
        onStderr(chunk) {
          reject(new Error(`解压错误 ${chunk.toString("utf-8")}`));
        },
      }
    );
    resolve(void 0);
  });
}
/**
 * 删除本地文件
 * @param config 配置
 */
export async function deleteLocal(config: DeployConfig) {
  try {
    unlinkSync(config.sourcePath + ".zip");
  } catch (err) {
    throw new Error(`删除本地文件失败 err`);
  }
}
export async function stepLoading(task: () => Promise<any>, message: string) {
  const loading = ora(message);
  loading.start();
  try {
    await task();
  } catch (e: any) {
    loading.fail(e?.message || "未知异常");
    // TODO 保存日志信息
    throw e;
  } finally {
    loading.stop();
  }
}
export async function deploy(config: DeployConfig) {
  try {
    // 第一步打包
    await stepLoading(async () => bundle(config.sourcePath), "开始压缩...");
    success("压缩完成");
    arrow();
    // 第二步连接服务器
    await stepLoading(async () => connectServer(config), "开始连接...");
    success(`连接完成(${underlineAndBold(config.host + ":" + config.port)})`);
    arrow();
    // 第三步上传文件
    await stepLoading(async () => upload(config), "开始上传...");
    success(`上传完成`);
    arrow();
    // 第四步解压缩
    await stepLoading(async () => unzip(config), "开始解压...");
    success(`解压完成`);
  } finally {
    // 第五步删除文件
    await stepLoading(async () => deleteLocal(config), "删除本地...");
    // 手动释放资源
    ssh.isConnected() && ssh.dispose();
  }
}
