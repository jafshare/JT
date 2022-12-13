import path from "path";
import os from "os";
export const AppData = path.join(os.homedir(), "AppData", "Roaming", "jt");
export const DEFAULT_CONFIG_DIR = path.join(__dirname, "..", "config");
export const CONFIG_DIR = path.join(AppData, "config");
export const TEMPLATE_PATH = path.join(CONFIG_DIR, "templates.json");
export const REGISTRY_PATH = path.join(DEFAULT_CONFIG_DIR, "registries.json");
export const DEPLOY_PATH = path.join(CONFIG_DIR, "deploys.json");
