export const BACKEND_URL = 'https://yt-is06.onrender.com';

export const endpoints = {
  search: (query) => `${BACKEND_URL}/search?q=${encodeURIComponent(query)}`,
  audio: `${BACKEND_URL}/audio`,
  video: `${BACKEND_URL}/video`,
};

export const getThumbnailUrl = (videoId) => `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

export const primaryColor = '#007AFF';
export const successColor = '#34C759';
export const warningColor = '#FF9500';
export const errorColor = '#FF3B30';
export const favoriteColor = '#FFD700';

export const borderRadius = 14;
export const cardBorderRadius = 20;