export const versionRE = /^\d+\.\d+\.\d+$/;
export type VersionInput =
  | {
      major: string | number;
      minor: string | number;
      patch: string | number;
    }
  | string;
/**
 * 版本控制，用于对package.json的version字段更新
 * v1.0.0  第一位：主版本，一般是破坏性更新 第二位:次版本 第三位: 补丁版本
 */
export class Version {
  // 主版本
  major: string | number;
  // 次版本
  minor: string | number;
  // 补丁版本
  patch: string | number;
  constructor(version: VersionInput) {
    if (typeof version === "string") {
      // valid
      if (!versionRE.test(version)) {
        throw new Error(`错误的 Version(${version})`);
      }
      [this.major, this.minor, this.patch] = version.split(".");
    } else {
      this.major = version.major;
      this.minor = version.minor;
      this.patch = version.patch;
    }
  }

  /**
   * 下一个主版本
   */
  nextMajorVersion(): Version {
    return new Version({
      major: parseInt(this.major as string) + 1,
      minor: 0,
      patch: 0
    });
  }

  /**
   * 下一个次版本
   */
  nextMinorVersion(): Version {
    return new Version({
      major: this.major,
      minor: parseInt(this.minor as string) + 1,
      patch: 0
    });
  }

  /**
   * 下一个补丁版本
   */
  nextPatchVersion(): Version {
    return new Version({
      major: this.major,
      minor: this.minor,
      patch: parseInt(this.patch as string) + 1
    });
  }

  /**
   * 返回字符串格式
   */
  toString() {
    return [this.major, this.minor, this.patch].join(".");
  }
}
