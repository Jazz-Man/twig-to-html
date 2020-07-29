import randomIdent from "./randomIdent";
import { isUrlRequest } from "loader-utils";

/**
 *
 * @param {string} url
 * @param {Object} config
 * @return {string|boolean}
 */

export default (url: string, config: any): string | false => {
  if (!isUrlRequest(url, config.root)) return false;
  if (url.indexOf("mailto:") > -1) return false;

  return randomIdent();
};
