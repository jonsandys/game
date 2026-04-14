import { defineConfig, type Plugin } from "vite";
import packageJson from "./package.json";

const buildVersion = packageJson.version;

function versionedHtmlPlugin(version: string): Plugin {
  return {
    name: "versioned-html-plugin",
    transformIndexHtml(html) {
      const withMeta = html.includes('name="app-version"')
        ? html
        : html.replace("</head>", `    <meta name="app-version" content="${version}" />\n  </head>`);

      return withMeta
        .replace(/(src|href)="(\.\/[^"?]+)"/g, `$1="$2?v=${version}"`)
        .replace(/(src|href)="(\/src\/main\.ts)"/g, `$1="$2?v=${version}"`);
    },
  };
}

export default defineConfig({
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion),
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "assets/app.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "assets/app.css";
          }

          return "assets/[name][extname]";
        },
      },
    },
  },
  plugins: [versionedHtmlPlugin(buildVersion)],
});
