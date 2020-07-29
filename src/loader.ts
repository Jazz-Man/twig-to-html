import { parse as HTMLParser, HTMLElement } from "node-html-parser";
import getLoaderConfig from "./lib/getLoaderConfig";
import getUrl from "./lib/getUrl";
import getIdent from "./lib/getIdent";

const bgImageUrlTest = /url\(\s*(["']?)\s*([^{}]*\.[a-zA-z]{2,3})\s*\1\s*\)/;

const data = {};

const tags = {
  img: ["src", "srcset"],
  audio: "src",
  video: ["src", "poster"],
  track: "src",
  embed: "src",
  source: "src",
  input: "src",
  object: "data"
};

export type TagsType = typeof tags;

const querySelector = Object.keys(tags);

querySelector.push("[style]");

export interface HtmlOptions {
  root: string;
  exportAsDefault?: boolean;
  exportAsEs6Default?: boolean;
}

/**
 * @param {string} content
 * @return {*}
 */
module.exports = function(content: string): any {
  const config: HtmlOptions = getLoaderConfig(this);

  // @ts-ignore
  const callback = this.async();

  // @ts-ignore
  const context = this.context;

  const htmlDocument = HTMLParser(content);

  const elements = htmlDocument.querySelectorAll(querySelector.join(", "));

  /**
   * @param {HTMLElement} element
   * @param {string} attribute
   */
  const setAttribute = (element: HTMLElement, attribute: string) => {
    if (element.hasAttribute(attribute)) {
      const url = element.getAttribute(attribute);
      const ident = getIdent(url, config);
      if (ident) {
        data[ident] = url;
        element.setAttribute(attribute, ident);
      }
    }
  };

  elements.forEach((element: HTMLElement) => {
    if (tags.hasOwnProperty(element.tagName)) {
      const attribute: string | string[] = tags[element.tagName];

      if (Array.isArray(attribute)) {
        attribute.forEach(attr => {
          setAttribute(element, attr);
        });
      } else {
        setAttribute(element, attribute);
      }
    }

    if (element.hasAttribute("style")) {
      let style = element.getAttribute("style");

      // @ts-ignore
      let result = style.replace(bgImageUrlTest, (matched, index, original) => {
        const ident = getIdent(original, config);

        if (ident) {
          data[ident] = original;

          return `url(${ident})`;
        }

        return matched;
      });

      element.setAttribute("style", result);
    }
  });

  content = JSON.stringify(htmlDocument.toString());

  let exportsString = "module.exports = ";
  if (config.exportAsDefault) {
    exportsString = "exports.default = ";
  } else if (config.exportAsEs6Default) {
    exportsString = "export default ";
  }

  return callback(
    null,
    `${exportsString} ${content.replace(
      /xxxHTMLLINKxxx[0-9\.]+xxx/g,
      (match: string) => {
        if (!data[match]) return match;

        return `"+require(${JSON.stringify(
          getUrl(context, config.root, data[match])
        )})+"`;
      }
    )};`
  );
};

// export HtmlOptions;
