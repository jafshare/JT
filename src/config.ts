import { Registry } from "./command/registry/index.d"
const configs: { registries: Registry[], templates: Template[] } = {
  registries: require("../config/registries.json"),
  templates: require("../config/templates.json")
}
export default configs