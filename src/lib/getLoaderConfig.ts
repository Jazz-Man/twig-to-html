import {getOptions} from "loader-utils";

/**
 *
 * @param context
 * @return {Object}
 */
export default (context: any) => {
  const query = getOptions(context) || {};
  const configKey = query.config || "htmlLoader";
  // @ts-ignore
  const config = context.options && context.options.hasOwnProperty(configKey) ? context.options[configKey] : {};

  // @ts-ignore
  delete query.config;

  return Object.assign(query, config);
}
