const DEVICE_ID_KEY = "device_id";

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = "web-" + Math.random().toString(36).substring(2, 18);
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}
