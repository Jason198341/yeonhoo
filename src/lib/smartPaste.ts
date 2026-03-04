/**
 * Smart Paste & Drag-Drop utilities.
 * Converts Windows paths to MSYS2/Unix format and handles
 * file/image paste detection.
 */

/** Convert Windows path to MSYS2 Unix-style path */
export function toUnixPath(winPath: string): string {
  // C:\Users\foo → /c/Users/foo
  const replaced = winPath.replace(/\\/g, "/");
  const driveMatch = replaced.match(/^([A-Za-z]):\//);
  if (driveMatch) {
    return `/${driveMatch[1].toLowerCase()}/${replaced.slice(3)}`;
  }
  return replaced;
}

/** Escape spaces and special chars for shell */
function shellEscape(path: string): string {
  // Wrap in quotes if it has spaces or special chars
  if (/[\s()'"\[\]{}$&!#;|<>]/.test(path)) {
    return `"${path}"`;
  }
  return path;
}

/** Format file paths for terminal insertion */
export function formatPaths(paths: string[]): string {
  return paths.map((p) => shellEscape(toUnixPath(p))).join(" ");
}

/** Analyze clipboard text for smart paste behavior */
export function analyzePaste(text: string): {
  kind: "normal" | "multiline" | "large";
  lineCount: number;
  charCount: number;
} {
  const lineCount = text.split("\n").length;
  const charCount = text.length;

  if (charCount > 500) return { kind: "large", lineCount, charCount };
  if (lineCount > 1) return { kind: "multiline", lineCount, charCount };
  return { kind: "normal", lineCount, charCount };
}

/** Check if pasted text looks like a Windows file path */
export function isWindowsPath(text: string): boolean {
  return /^[A-Za-z]:\\/.test(text.trim());
}

/** Auto-convert Windows path in pasted text to Unix path */
export function convertPastedPaths(text: string): string {
  // Replace each Windows-style absolute path
  return text.replace(/[A-Za-z]:\\[^\s"'<>|]+/g, (match) => toUnixPath(match));
}
