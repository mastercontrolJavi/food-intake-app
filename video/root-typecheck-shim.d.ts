/**
 * Seen ONLY by the app's root tsconfig (which globs **\/*.ts and is type-checked by `next build`).
 * The app's build machine never installs video/node_modules, so these imports would not resolve there.
 * Shorthand ambient modules make them `any` for the root program, keeping the app build green without
 * touching any app config. video/tsconfig.json excludes this file, so the film's own typecheck uses the
 * real package types.
 */
declare module "remotion";
declare module "@remotion/*";
declare module "geist/*";
declare module "*.css";
