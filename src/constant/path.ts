import path from "path"

export const CONFIG_DIR = path.join(__dirname, "../config")
export const TEMPLATE_PATH = path.join(CONFIG_DIR,'templates.json')
export const REGISTRY_PATH = path.join(CONFIG_DIR,'registries.json')
export const DEPLOY_PATH = path.join(CONFIG_DIR,'deploys.json')