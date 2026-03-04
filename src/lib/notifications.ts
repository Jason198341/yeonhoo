import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

let permissionReady = false;

async function ensurePermission(): Promise<boolean> {
  if (permissionReady) return true;
  let granted = await isPermissionGranted();
  if (!granted) {
    const result = await requestPermission();
    granted = result === "granted";
  }
  permissionReady = granted;
  return granted;
}

export async function notifyPermissionPrompt() {
  if (!(await ensurePermission())) return;
  sendNotification({
    title: "Yeonhoo — Claude Code",
    body: "Permission prompt waiting for your response",
  });
}

export async function notifyTaskComplete(duration: number) {
  if (!(await ensurePermission())) return;
  sendNotification({
    title: "Yeonhoo — Task Complete",
    body: `Claude Code task finished (${Math.round(duration)}s)`,
  });
}

export async function notifyError(message: string) {
  if (!(await ensurePermission())) return;
  sendNotification({
    title: "Yeonhoo — Error",
    body: message,
  });
}
