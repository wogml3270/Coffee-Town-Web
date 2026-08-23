import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = path.resolve(import.meta.dirname, "../..");
const defaultManifestPath = path.join(import.meta.dirname, "asset-manifest.json");
const localEnvPath = path.join(import.meta.dirname, "aether.env.local");
const pollIntervalMs = 2_000;
const jobTimeoutMs = 5 * 60_000;

const parseEnv = (source) => Object.fromEntries(
  source
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const separator = line.indexOf("=");
      const key = line.slice(0, separator).trim();
      const rawValue = line.slice(separator + 1).trim();
      return [key, rawValue.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/u, "$1$2")];
    }),
);

const readLocalEnv = async () => {
  try {
    return parseEnv(await readFile(localEnvPath, "utf8"));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return {};
    throw error;
  }
};

const parseArguments = (argv) => {
  const options = { dryRun: false, assetId: null, manifestPath: defaultManifestPath };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--dry-run") options.dryRun = true;
    else if (argument === "--asset") options.assetId = argv[++index] ?? null;
    else if (argument === "--manifest") options.manifestPath = path.resolve(argv[++index] ?? "");
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
};

const validateManifest = async (manifest) => {
  if (manifest.version !== 1 || !manifest.defaults || !Array.isArray(manifest.assets)) {
    throw new Error("Aether asset manifest must use schema version 1.");
  }

  const ids = new Set();
  for (const asset of manifest.assets) {
    if (!asset.id || !/^[a-z0-9-]+$/u.test(asset.id)) throw new Error(`Invalid asset id: ${asset.id ?? "<missing>"}`);
    if (ids.has(asset.id)) throw new Error(`Duplicate asset id: ${asset.id}`);
    if (!asset.prompt?.trim()) throw new Error(`Asset ${asset.id} requires a prompt.`);
    if (!asset.outputDirectory?.trim()) throw new Error(`Asset ${asset.id} requires an outputDirectory.`);
    ids.add(asset.id);

    for (const referencePath of asset.referenceImages ?? []) {
      await access(path.resolve(projectRoot, referencePath));
    }
  }
};

const requestJson = async (url, options) => {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30_000) });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Aether request failed (${response.status}): ${body.slice(0, 300).replace(/\s+/gu, " ")}`);
  }
  return JSON.parse(body);
};

const createGenerationJob = async ({ apiBaseUrl, apiKey, asset, model }) => {
  const form = new FormData();
  form.append("prompt", asset.prompt);
  form.append("ai_model", asset.model ?? model);

  for (const referencePath of asset.referenceImages ?? []) {
    const absolutePath = path.resolve(projectRoot, referencePath);
    const bytes = await readFile(absolutePath);
    form.append("ref_images", new Blob([bytes], { type: "image/jpeg" }), path.basename(absolutePath));
  }

  const payload = await requestJson(`${apiBaseUrl}/public/v1/generate/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!payload.job_id) throw new Error(`Aether did not return a job_id for ${asset.id}.`);
  return payload.job_id;
};

const waitForJob = async ({ apiBaseUrl, apiKey, jobId }) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < jobTimeoutMs) {
    const job = await requestJson(`${apiBaseUrl}/public/v1/job/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (job.status === "Succeed") return job.image_urls ?? [];
    if (job.status === "Failed") throw new Error(`Aether job ${jobId} failed.`);
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  throw new Error(`Aether job ${jobId} timed out after ${jobTimeoutMs / 1000} seconds.`);
};

const extensionFor = (contentType, url) => {
  if (contentType.includes("webp")) return ".webp";
  if (contentType.includes("jpeg")) return ".jpg";
  if (contentType.includes("gif")) return ".gif";
  const extension = path.extname(new URL(url).pathname).toLowerCase();
  return [".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(extension) ? extension : ".png";
};

const downloadResults = async ({ asset, imageUrls, outputRoot, jobId }) => {
  const outputDirectory = path.resolve(projectRoot, outputRoot, asset.outputDirectory, asset.id);
  await mkdir(outputDirectory, { recursive: true });
  const files = [];

  for (const [index, imageUrl] of imageUrls.entries()) {
    const response = await fetch(imageUrl, { signal: AbortSignal.timeout(60_000) });
    if (!response.ok) throw new Error(`Asset download failed (${response.status}) for ${asset.id}.`);
    const extension = extensionFor(response.headers.get("content-type") ?? "", imageUrl);
    const filename = `${asset.id}-${index + 1}${extension}`;
    await writeFile(path.join(outputDirectory, filename), Buffer.from(await response.arrayBuffer()));
    files.push(filename);
  }

  await writeFile(path.join(outputDirectory, "generation.json"), `${JSON.stringify({
    assetId: asset.id,
    jobId,
    generatedAt: new Date().toISOString(),
    prompt: asset.prompt,
    files,
  }, null, 2)}\n`);
  return { outputDirectory, files };
};

const main = async () => {
  const options = parseArguments(process.argv.slice(2));
  const manifest = JSON.parse(await readFile(options.manifestPath, "utf8"));
  await validateManifest(manifest);
  const assets = options.assetId
    ? manifest.assets.filter((asset) => asset.id === options.assetId)
    : manifest.assets;
  if (options.assetId && assets.length === 0) throw new Error(`Unknown asset id: ${options.assetId}`);

  console.log(`Aether asset plan: ${assets.length} asset(s)`);
  for (const asset of assets) {
    console.log(`- ${asset.id}: ${asset.referenceImages?.length ?? 0} reference image(s) -> ${asset.outputDirectory}`);
  }
  if (options.dryRun) {
    console.log("Dry run complete. No API request was made.");
    return;
  }

  const localEnv = await readLocalEnv();
  const apiKey = process.env.AETHER_AI_API_KEY || localEnv.AETHER_AI_API_KEY;
  if (!apiKey) {
    throw new Error("AETHER_AI_API_KEY is required. Export it or create tools/aether/aether.env.local.");
  }

  const apiBaseUrl = manifest.defaults.apiBaseUrl.replace(/\/$/u, "");
  for (const asset of assets) {
    console.log(`Generating ${asset.id}...`);
    const jobId = await createGenerationJob({ apiBaseUrl, apiKey, asset, model: manifest.defaults.model });
    const imageUrls = await waitForJob({ apiBaseUrl, apiKey, jobId });
    const result = await downloadResults({ asset, imageUrls, outputRoot: manifest.defaults.outputRoot, jobId });
    console.log(`Saved ${result.files.length} file(s) to ${path.relative(projectRoot, result.outputDirectory)}.`);
  }
};

await main();
