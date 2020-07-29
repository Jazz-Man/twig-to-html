const { normalize, sep } = require("path");
const { urlToRequest } = require("loader-utils");
/**
 * @param {string} context
 * @param {string} root
 * @param {string} url
 */
export default (context: string, root: string, url: string) => {
  const rootPathComponents = normalize(root).split(sep).length;
  const contextPathComponents = normalize(context).split(sep).length;

  url = urlToRequest(url, root);

  /**
   * @type {number}
   */
  let count: number;

  if (contextPathComponents > rootPathComponents) {
    count = contextPathComponents - rootPathComponents;
  }

  let pathComponents = url.split(sep);

  if (count) {
    if (pathComponents.length > 1 && pathComponents[0] === ".") {
      pathComponents.shift();
    }

    url = pathComponents.slice(count).join(sep);

    let regexp = /\..\//gi;
    if (!regexp.test(url)) {
      url = `../${url}`;
    }
  }

  return url;
};
