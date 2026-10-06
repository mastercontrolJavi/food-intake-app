import fs from "fs";
import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

Config.overrideWebpackConfig(enableTailwind);
Config.setVideoImageFormat("png");
Config.setPixelFormat("yuv420p");
Config.setChromiumOpenGlRenderer("swangle");
Config.setConcurrency(Number(process.env.REMOTION_CONCURRENCY ?? 3));

// Prefer the machine's pre-installed headless shell (no download); otherwise Remotion fetches its own.
const browser = process.env.REMOTION_BROWSER ?? "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
if (fs.existsSync(browser)) Config.setBrowserExecutable(browser);
