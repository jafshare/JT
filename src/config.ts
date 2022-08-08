import { TEMPLATE_PATH, REGISTRY_PATH } from "./constant/path"

const configs: { registries: Registry[], templates: Template[] } = {
  registries: require(REGISTRY_PATH),
  templates: require(TEMPLATE_PATH)
}
export default configs