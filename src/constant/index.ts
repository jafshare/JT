import path from 'path'
const VERSION = '0.0.1'
const TEMP_DIR_NAME = '.temp'
const TEMP_PATH = path.join(__dirname, '..', TEMP_DIR_NAME)
export {
  TEMP_DIR_NAME,
  TEMP_PATH,
  VERSION
}