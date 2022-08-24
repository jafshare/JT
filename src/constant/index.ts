import path from 'path'
// @ts-ignore
import pkg from '../../package.json'
const VERSION = 'V' + pkg.version
const PROJECT_NAME = 'jt'
const TEMP_DIR_NAME = '.temp'
const TEMP_PATH = path.join(__dirname, '..', TEMP_DIR_NAME)
export {
  TEMP_DIR_NAME,
  TEMP_PATH,
  VERSION,
  PROJECT_NAME
}