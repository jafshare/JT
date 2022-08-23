import { existsSync } from "fs-extra"
import { TEMPLATE_PATH, REGISTRY_PATH } from "./constant/path";
const configs: { registries: Registry[], templates: Template[] } = {
  registries: existsSync(REGISTRY_PATH) ? require(REGISTRY_PATH) : [],
  templates: existsSync(TEMPLATE_PATH) ? require(TEMPLATE_PATH) : []
}
export default configs