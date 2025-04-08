
// Simple in-memory cache for AI responses
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

/**
 * Generate a simple hash for the image to use as cache key
 */
export const generateImageHash = (imageUrl: string): string => {
  // Take first 100 chars and last 100 chars to create a unique-enough key
  const start = imageUrl.slice(0, 100);
  const end = imageUrl.slice(-100);
  return `${start}...${end}`.replace(/[^a-zA-Z0-9]/g, '');
};

/**
 * Check if item exists in cache and is still valid
 */
export const getCachedItem = <T>(key: string): T | null => {
  const cachedResult = cache[key];
  if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
    console.log("Using cached result");
    return cachedResult.data as T;
  }
  return null;
};

/**
 * Add item to cache
 */
export const setCachedItem = <T>(key: string, data: T): void => {
  cache[key] = {
    data,
    timestamp: Date.now()
  };
};
