// @ts-ignore
import mix from "laravel-mix";

import HtmlWebpackPlugin, {
  Options as HtmlWebpackOptions
} from "html-webpack-plugin";
import { Configuration } from "webpack";
import { dirname, basename, extname, join, sep, resolve } from "path";
import { sync } from "globby";
import { HtmlOptions as HtmlLoaderOptions } from "./loader";

export interface TwigOptions {
  autoescape: boolean;
  functions: any;
}

export type FilesList = string | string[];

export interface FileConfigInterface {
  template: string;
}

export type FileConfig = FileConfigInterface[];

export interface PageConfiginterface extends HtmlWebpackOptions {
  template: string;
  filename: string;
}

export type PagesConfig = PageConfiginterface[];

export interface TwigToHtmlConfigInterface {
  files: FilesList;
  enabled: boolean;
  fileBase: string;
  twigOptions: TwigOptions;
  htmlOptions: HtmlLoaderOptions;
  htmlWebpack: HtmlWebpackOptions;
}

class TwigToHtml {
  private config: TwigToHtmlConfigInterface;

  dependencies = (): string[] => ["html-webpack-plugin", "twig-html-loader"];

  register(config: TwigToHtmlConfigInterface) {
    if (!config.files || config.files.length <= 0) {
      throw new Error(
        `Missing files\nEg: mix.twigToHtml({ files: ['path/to/twigfile.twig'] })`
      );
    }
    if (!config.fileBase) {
      throw new Error(
        `Missing fileBase\nEg: mix.twigToHtml({ fileBase: ['path/to/your/twig/templates'] })`
      );
    }
    this.config = Object.assign(
      {
        files: [],
        fileBase: undefined,
        twigOptions: null,
        htmlOptions: null,
        htmlWebpack: null,
        enabled: true
      },
      config
    );
  }

  webpackRules() {
    if (!this.config.enabled) return;

    const options: TwigOptions = Object.assign<TwigOptions, TwigOptions>(
      {
        autoescape: true,
        functions: {}
      },
      this.config.twigOptions
    );

    return {
      test: /\.twig$/,
      use: [
        {
          loader: resolve(__dirname, "./loader"),
          options: this.config.htmlOptions
        },
        {
          loader: "twig-html-loader",
          options: options
        }
      ]
    };
  }

  webpackPlugins() {
    if (!this.config.enabled) return;

    const normaliseFileConfig = (files: FilesList | FileConfig) =>
      typeof files[0] === "string"
        ? sync(files as FilesList).map(template => ({ template }))
        : typeof files[0] === "object"
        ? Object.values(files).reduce((prev, fileConfig) => {
            const paths = sync(fileConfig.template).map(template => ({
              ...fileConfig,
              template
            }));
            return prev.concat(paths);
          }, [])
        : [];

    const removeUnderscorePaths = (config: FileConfig) =>
      config.filter(
        item =>
          item.template
            .split("/")
            .map((chunk: string) => chunk.startsWith("_"))
            .filter(Boolean).length === 0
      );

    const addFilename = (config: FileConfig) =>
      config.map(item => {
        const isSubPath = this.config.fileBase !== dirname(item.template);
        const prefixPath = isSubPath
          ? dirname(item.template)
              .split(sep)
              .pop()
          : "";
        const newFileName = `${basename(
          item.template,
          extname(item.template)
        )}.html`;

        return {
          ...item,
          filename: join(prefixPath, newFileName)
        };
      });

    const createPages = (pages: PagesConfig) =>
      pages.map(page => {
        const options = Object.assign<HtmlWebpackOptions, HtmlWebpackOptions>(
          {
            ...page,
            hash: mix.inProduction()
          },
          this.config.htmlWebpack
        );

        return new HtmlWebpackPlugin(options);
      });

    return createPages(
      addFilename(removeUnderscorePaths(normaliseFileConfig(this.config.files)))
    );
  }

  webpackConfig(webpackConfig: Configuration) {
    if (!this.config.enabled) return;
    webpackConfig.output.publicPath = ""; // Fix path issues
  }
}

mix.extend("twigToHtml", new TwigToHtml());
