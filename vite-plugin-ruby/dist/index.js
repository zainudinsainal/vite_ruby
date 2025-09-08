import path, { basename, join, posix, relative, resolve } from "path";
import { existsSync, promises, readFileSync } from "fs";
import { URL, fileURLToPath } from "url";
import createDebugger from "debug";
import { globSync } from "tinyglobby";

//#region src/constants.ts
const APP_ENV = process.env.RAILS_ENV || process.env.RACK_ENV || process.env.APP_ENV;
const ENV_PREFIX = "VITE_RUBY";
const ALL_ENVS_KEY = "all";
const KNOWN_CSS_EXTENSIONS = [
	"css",
	"less",
	"sass",
	"scss",
	"styl",
	"stylus",
	"pcss",
	"postcss"
];
const KNOWN_ENTRYPOINT_TYPES = [
	"html",
	"jsx?",
	"tsx?",
	...KNOWN_CSS_EXTENSIONS
];
const ENTRYPOINT_TYPES_REGEX = /* @__PURE__ */ new RegExp(`\\.(${KNOWN_ENTRYPOINT_TYPES.join("|")})(\\?.*)?$`);

//#endregion
//#region src/utils.ts
function slash(path$1) {
	return path$1.replace(/\\/g, "/");
}
function isObject(value) {
	return Object.prototype.toString.call(value) === "[object Object]";
}
function screamCase(key) {
	return key.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
}
function configOptionFromEnv(optionName) {
	return process.env[`${ENV_PREFIX}_${screamCase(optionName)}`];
}
function booleanOption(value) {
	if (value === "true") return true;
	if (value === "false") return false;
	return value;
}
function loadJsonConfig(filepath) {
	return JSON.parse(readFileSync(filepath, {
		encoding: "utf8",
		flag: "r"
	}));
}
function cleanConfig(object) {
	Object.keys(object).forEach((key) => {
		const value = object[key];
		if (value === void 0 || value === null) delete object[key];
		else if (isObject(value)) cleanConfig(value);
	});
	return object;
}

//#endregion
//#region src/config.ts
const defaultConfig = loadJsonConfig(fileURLToPath(new URL("../default.vite.json", import.meta.url)));
function filterEntrypointsForRolldown(entrypoints) {
	return entrypoints.filter(([_name, filename]) => ENTRYPOINT_TYPES_REGEX.test(filename));
}
function filterEntrypointAssets(entrypoints) {
	return entrypoints.filter(([_name, filename]) => !ENTRYPOINT_TYPES_REGEX.test(filename));
}
function resolveEntrypointFiles(projectRoot$1, sourceCodeDir, config$1) {
	const inputGlobs = config$1.ssrBuild ? [config$1.ssrEntrypoint] : [`~/${config$1.entrypointsDir}/**/*`, ...config$1.additionalEntrypoints];
	const entrypointFiles = globSync(resolveGlobs(projectRoot$1, sourceCodeDir, inputGlobs), { absolute: true });
	if (config$1.ssrBuild) {
		if (entrypointFiles.length === 0) throw new Error(`No SSR entrypoint available, please create \`${config$1.ssrEntrypoint}\` to do an SSR build.`);
		else if (entrypointFiles.length > 1) throw new Error(`Expected a single SSR entrypoint, found: ${entrypointFiles}`);
		return entrypointFiles.map((file) => ["ssr", file]);
	}
	return entrypointFiles.map((filename) => {
		let name = relative(sourceCodeDir, filename);
		if (name.startsWith("..")) name = relative(projectRoot$1, filename);
		return [name, filename];
	});
}
function resolveGlobs(projectRoot$1, sourceCodeDir, patterns) {
	return patterns.map((pattern) => slash(resolve(projectRoot$1, pattern.replace(/^~\//, `${sourceCodeDir}/`))));
}
function configFromEnv() {
	const envConfig = {};
	Object.keys(defaultConfig).forEach((optionName) => {
		const envValue = configOptionFromEnv(optionName);
		if (envValue !== void 0) envConfig[optionName] = envValue;
	});
	return envConfig;
}
function loadConfiguration(viteMode, projectRoot$1, userConfig) {
	const envConfig = configFromEnv();
	const mode = envConfig.mode || APP_ENV || viteMode;
	const filePath = join(projectRoot$1, envConfig.configPath || defaultConfig.configPath);
	const multiEnvConfig = loadJsonConfig(filePath);
	const fileConfig = {
		...multiEnvConfig[ALL_ENVS_KEY],
		...multiEnvConfig[mode]
	};
	return coerceConfigurationValues({
		...defaultConfig,
		...fileConfig,
		...envConfig,
		mode
	}, projectRoot$1, userConfig);
}
function coerceConfigurationValues(config$1, projectRoot$1, userConfig) {
	const port = config$1.port = parseInt(config$1.port);
	const https = config$1.https = userConfig.server?.https || booleanOption(config$1.https);
	const fs = {
		allow: [projectRoot$1],
		strict: userConfig.server?.fs?.strict ?? true
	};
	const server = {
		fs,
		host: config$1.host,
		https,
		port,
		strictPort: true
	};
	if (booleanOption(config$1.skipProxy)) server.origin = userConfig.server?.origin || `${https ? "https" : "http"}://${config$1.host}:${config$1.port}`;
	const hmr = userConfig.server?.hmr ?? {};
	if (typeof hmr === "object" && !hmr.hasOwnProperty("clientPort")) {
		hmr.clientPort ||= port;
		server.hmr = hmr;
	}
	const root = join(projectRoot$1, config$1.sourceCodeDir);
	const ssrEntrypoint = userConfig.build?.ssr;
	config$1.ssrBuild = Boolean(ssrEntrypoint);
	if (typeof ssrEntrypoint === "string") config$1.ssrEntrypoint = ssrEntrypoint;
	const outDir = relative(root, config$1.ssrBuild ? config$1.ssrOutputDir : join(config$1.publicDir, config$1.publicOutputDir));
	const base = resolveViteBase(config$1);
	const entrypoints = resolveEntrypointFiles(projectRoot$1, root, config$1);
	return {
		...config$1,
		server,
		root,
		outDir,
		base,
		entrypoints
	};
}
function resolveViteBase({ assetHost, base, publicOutputDir }) {
	if (assetHost && !assetHost.startsWith("http")) assetHost = `//${assetHost}`;
	return [ensureTrailingSlash(assetHost || base || "/"), publicOutputDir ? ensureTrailingSlash(slash(publicOutputDir)) : ""].join("");
}
function ensureTrailingSlash(path$1) {
	return path$1.endsWith("/") ? path$1 : `${path$1}/`;
}

//#endregion
//#region src/manifest.ts
const debug$1 = createDebugger("vite-plugin-ruby:assets-manifest");
function assetsManifestPlugin() {
	let config$1;
	let viteRubyConfig;
	async function fingerprintRemainingAssets(ctx, bundle, manifest) {
		const remainingAssets = filterEntrypointAssets(viteRubyConfig.entrypoints);
		for (const [filename, absoluteFilename] of remainingAssets) {
			const content = await promises.readFile(absoluteFilename);
			const ref = ctx.emitFile({
				name: path.basename(filename),
				type: "asset",
				source: content
			});
			const hashedFilename = ctx.getFileName(ref);
			manifest.set(path.relative(config$1.root, absoluteFilename), {
				file: hashedFilename,
				src: filename
			});
		}
	}
	return {
		name: "vite-plugin-ruby:assets-manifest",
		apply: "build",
		enforce: "post",
		configResolved(resolvedConfig) {
			config$1 = resolvedConfig;
			viteRubyConfig = config$1.viteRuby;
		},
		async generateBundle(_options, bundle) {
			if (!config$1.build.manifest) return;
			const manifestDir = typeof config$1.build.manifest === "string" ? path.dirname(config$1.build.manifest) : ".vite";
			const fileName = `${manifestDir}/manifest-assets.json`;
			const manifest = /* @__PURE__ */ new Map();
			await fingerprintRemainingAssets(this, bundle, manifest);
			debug$1({
				manifest,
				fileName
			});
			this.emitFile({
				fileName,
				type: "asset",
				source: JSON.stringify(Object.fromEntries(manifest), null, 2)
			});
		}
	};
}

//#endregion
//#region src/index.ts
const projectRoot = configOptionFromEnv("root") || process.cwd();
let watchAdditionalPaths = [];
function ViteRubyPlugin() {
	return [{
		name: "vite-plugin-ruby",
		config,
		configureServer
	}, assetsManifestPlugin()];
}
const debug = createDebugger("vite-plugin-ruby:config");
function config(userConfig, env) {
	const config$1 = loadConfiguration(env.mode, projectRoot, userConfig);
	const { assetsDir, base, outDir, server, root, entrypoints, ssrBuild } = config$1;
	const isLocal = config$1.mode === "development" || config$1.mode === "test";
	const rollupOptions = userConfig.build?.rollupOptions;
	let rollupInput = rollupOptions?.input;
	if (typeof rollupInput === "string") rollupInput = { [rollupInput]: rollupInput };
	const build = {
		emptyOutDir: userConfig.build?.emptyOutDir ?? (ssrBuild || isLocal),
		sourcemap: !isLocal,
		...userConfig.build,
		assetsDir,
		manifest: !ssrBuild,
		outDir,
		rolldownOptions: {
			...rollupOptions,
			input: {
				...rollupInput,
				...Object.fromEntries(filterEntrypointsForRolldown(entrypoints))
			},
			output: {
				...outputOptions(assetsDir, ssrBuild),
				...rollupOptions?.output
			}
		}
	};
	const envDir = userConfig.envDir || projectRoot;
	debug({
		base,
		build,
		envDir,
		root,
		server,
		entrypoints: Object.fromEntries(entrypoints)
	});
	watchAdditionalPaths = resolveGlobs(projectRoot, root, config$1.watchAdditionalPaths || []);
	const alias = {
		"~/": `${root}/`,
		"@/": `${root}/`
	};
	return cleanConfig({
		resolve: { alias },
		base,
		envDir,
		root,
		server,
		build,
		viteRuby: config$1
	});
}
function configureServer(server) {
	server.watcher.add(watchAdditionalPaths);
	return () => server.middlewares.use((req, res, next) => {
		if (req.url === "/index.html" && !existsSync(resolve(server.config.root, "index.html"))) {
			res.statusCode = 404;
			const file = readFileSync(fileURLToPath(new URL("dev-server-index.html", import.meta.url)), "utf-8");
			res.end(file);
		}
		next();
	});
}
function outputOptions(assetsDir, ssrBuild) {
	const outputFileName = (ext) => ({ name }) => {
		if (!name) return posix.join(assetsDir, `[name]-[hash].${ext}`);
		const shortName = basename(name).split(".")[0];
		return posix.join(assetsDir, `${shortName}-[hash].${ext}`);
	};
	return {
		assetFileNames: ssrBuild ? void 0 : outputFileName("[ext]"),
		entryFileNames: ssrBuild ? void 0 : outputFileName("js")
	};
}

//#endregion
export { ViteRubyPlugin as default, projectRoot };