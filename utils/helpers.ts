
export const cleanBase64 = (data: string): string => {
  if (!data) return '';
  return data.split(',')[1] || data;
};

export const getMimeType = (data: string): string => {
  if (!data) return 'image/jpeg';
  const match = data.match(/^data:(image\/\w+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

export const base64ToBlob = (base64: string): Blob => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export const getUniqueDeviceId = (): string => {
  let deviceId = localStorage.getItem('snap_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('snap_device_id', deviceId);
  }
  return deviceId;
};

export const getDeviceModel = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes("iPhone")) return "iPhone";
  if (ua.includes("iPad")) return "iPad";
  if (ua.includes("Android")) return "Android Phone";
  if (ua.includes("Mac")) return "Mac";
  if (ua.includes("Windows")) return "Windows PC";
  return "Unknown Device";
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit'
  });
};
