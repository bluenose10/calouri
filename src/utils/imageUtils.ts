
import loadImage from 'blueimp-load-image';

/**
 * Compresses an image file to reduce size for faster uploads
 * @param file The image file to compress
 * @param maxWidth Maximum width of the compressed image (default: 1200px for better quality)
 * @param quality Compression quality 0-1 (default: 0.9 for better quality)
 * @returns Promise with compressed image as data URL
 */
export const compressImage = async (
  file: File,
  maxWidth = 1200,
  quality = 0.9
): Promise<string> => {
  // Log the file format information to help with debugging
  console.log('Image processing started for:', file.name);
  console.log('Image format:', file.type);
  console.log('Original file size:', Math.round(file.size / 1024), 'KB');
  
  // Detect if we're on a mobile device for extra optimization
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // Adjust settings specifically for OpenAI analysis on mobile
  if (isMobile) {
    console.log('Mobile device detected - using dedicated mobile compression settings');
    // OpenAI needs clear images - optimize for clarity not size
    maxWidth = 1000;    // Still reasonably sized but clear enough for analysis
    quality = 0.92;     // Higher quality for mobile uploads to ensure OpenAI can analyze
  }
  
  try {
    // Step 1: Convert HEIC to JPEG if needed
    let processedFile = file;
    
    const isHeic = file.type === 'image/heic' || 
                   file.type === 'image/heif' || 
                   file.name.toLowerCase().endsWith('.heic') || 
                   file.name.toLowerCase().endsWith('.heif');
                   
    if (isHeic) {
      console.log('Converting HEIC/HEIF to JPEG...');
      processedFile = await convertHeicToJpeg(file);
      console.log('HEIC conversion completed');
    }
    
    // Step 2: Fix orientation & strip EXIF data
    console.log('Correcting image orientation...');
    const orientationCorrectedBlob = await fixImageOrientation(processedFile);
    console.log('Orientation correction completed');
    
    // Step 3: Resize and compress the image with specific mobile adjustments
    console.log('Compressing and resizing image...');
    const compressedDataUrl = await resizeAndCompressImage(orientationCorrectedBlob, maxWidth, quality);
    
    // Check if the result meets minimum requirements for OpenAI
    if (compressedDataUrl.length < 10000) {
      console.warn('WARNING: Compressed image is too small, might cause analysis issues');
      // Try again with higher quality for better analysis
      console.log('Retrying compression with higher quality settings');
      // For OpenAI analysis, we need good quality images
      const betterQualityDataUrl = await resizeAndCompressImage(orientationCorrectedBlob, 
        Math.min(1200, file.size > 3000000 ? 1000 : 1200), 0.95);
      console.log('Second compression completed with higher quality, final size:', 
        Math.round(betterQualityDataUrl.length / 1024), 'KB');
      return betterQualityDataUrl;
    }
    
    console.log('Compression completed, final size:', Math.round(compressedDataUrl.length / 1024), 'KB');
    return compressedDataUrl;
  } catch (error) {
    console.error('Error in image processing pipeline:', error);
    throw new Error(`Image processing failed: ${error.message}`);
  }
};

/**
 * Converts HEIC/HEIF image to JPEG using heic2any library
 * This is more reliable than our previous approach
 */
const convertHeicToJpeg = async (file: File): Promise<File> => {
  try {
    // Try with heic2any library first (most reliable)
    const heic2any = await import('heic2any');
    
    console.log('Using heic2any for HEIC conversion');
    const convertedBlob = await heic2any.default({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9
    });
    
    // Handle both single blob and array of blobs return types
    const jpegBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    
    // Create a new File from the converted blob
    const jpegFile = new File(
      [jpegBlob], 
      file.name.replace(/\.heic$|\.heif$/i, '.jpg'), 
      { type: 'image/jpeg', lastModified: file.lastModified }
    );
    
    console.log('HEIC conversion successful using heic2any');
    return jpegFile;
  } catch (error) {
    console.error('Error with heic2any conversion:', error);
    
    // Fall back to our existing method
    console.log('Falling back to alternative HEIC conversion');
    return fallbackHeicConversion(file);
  }
};

/**
 * Fallback browser-based conversion for HEIC images
 */
const fallbackHeicConversion = async (file: File): Promise<File> => {
  try {
    // Read the file as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Create a Blob with the correct MIME type
    const blob = new Blob([arrayBuffer], { type: file.type });
    
    // Try to create an image bitmap (supported in some browsers)
    const imageBitmap = await createImageBitmap(blob);
    
    // Create a canvas to draw the image
    const canvas = document.createElement('canvas');
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    
    // Draw the image on the canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    ctx.drawImage(imageBitmap, 0, 0);
    
    // Convert to JPEG blob
    const jpegBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else throw new Error('Canvas to Blob conversion failed');
      }, 'image/jpeg', 0.9);
    });
    
    // Create a new file with the JPEG blob
    return new File([jpegBlob], file.name.replace(/\.heic$|\.heif$/i, '.jpg'), {
      type: 'image/jpeg',
      lastModified: file.lastModified
    });
  } catch (error) {
    console.error('Browser HEIC conversion failed:', error);
    throw new Error('HEIC format not supported. Please convert to JPEG or PNG before uploading.');
  }
};

/**
 * Fix image orientation based on EXIF data using blueimp-load-image
 */
const fixImageOrientation = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    loadImage(
      file,
      (canvas) => {
        if (canvas.type === 'error') {
          console.error('Error fixing orientation:', canvas);
          reject(new Error('Failed to fix image orientation'));
          return;
        }
        
        // Convert canvas to blob with corrected orientation
        (canvas as HTMLCanvasElement).toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to convert canvas to blob'));
              return;
            }
            resolve(blob);
          },
          'image/jpeg',
          0.9
        );
      },
      {
        orientation: true,        // Auto-rotate based on EXIF
        canvas: true,             // Force canvas output for consistent results
        maxWidth: 2048,           // Reasonable max width for high-resolution cameras
        maxHeight: 2048,          // Reasonable max height for high-resolution cameras
        cover: false,             // Don't crop the image
        meta: false,              // Don't need to extract metadata
        imageSmoothingQuality: 'high' // Better quality
      }
    );
  });
};

/**
 * Resize and compress image while maintaining quality
 * Enhanced for mobile image analysis
 */
const resizeAndCompressImage = async (
  blobOrFile: Blob | File,
  maxWidth = 1200,
  quality = 0.9
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Create a FileReader to read the blob/file
    const reader = new FileReader();
    reader.readAsDataURL(blobOrFile);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions if needed
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        // Make sure dimensions are sufficient for analysis
        // OpenAI has minimum requirements for detailed analysis
        if (width < 600 || height < 600) {
          console.log('Image dimensions too small for OpenAI, adjusting to minimum required for analysis');
          const scale = Math.max(600 / width, 600 / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw image on canvas with new dimensions
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Critical for OpenAI analysis: use better rendering quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Fill with white background first to handle transparent PNGs
        // This ensures images with transparency don't confuse the AI
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        
        // Draw image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Use "image/jpeg" explicitly for best OpenAI compatibility
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Log the compressed size
        console.log(`Original size: ${Math.round(blobOrFile.size / 1024)} KB, Compressed: ${Math.round(compressedDataUrl.length / 1024)} KB`);
        console.log(`Final image dimensions: ${width}x${height}`);
        
        // Verify minimum data URL length for OpenAI analysis
        if (compressedDataUrl.length < 1000) {
          console.error('ERROR: Compressed image data is too small for analysis');
          reject(new Error('Image compression resulted in data that is too small for analysis'));
          return;
        }
        
        resolve(compressedDataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('Error loading image'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
  });
};

/**
 * Calculates the data size of a base64 string in MB
 * @param base64String The base64 string
 * @returns Size in MB
 */
export const getBase64Size = (base64String: string): number => {
  // Remove data URL prefix if present
  const base64 = base64String.split(',')[1] || base64String;
  // Calculate bytes: each base64 character represents 6 bits = 3/4 bytes
  const bytes = (base64.length * 3) / 4;
  // Convert to MB
  return bytes / (1024 * 1024);
};

/**
 * Optimizes an image URL or src for carousel display
 * Allows for progressive loading of images
 * @param src Image URL or path
 * @param width Desired width for the image
 * @returns Optimized image URL
 */
export const optimizeCarouselImage = (src: string, width = 400): string => {
  // If it's a data URL, return as is
  if (src.startsWith('data:')) {
    return src;
  }
  
  // If it's an unsplash image, use their optimization parameters
  if (src.includes('unsplash.com')) {
    // Parse the URL to extract components
    try {
      const url = new URL(src);
      
      // Add width and quality parameters
      url.searchParams.set('w', width.toString());
      url.searchParams.set('q', '80');
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'crop');
      
      return url.toString();
    } catch {
      // If URL parsing fails, return original
      return src;
    }
  }
  
  // For other external images, we can't modify them directly
  return src;
};

/**
 * Preloads an image to ensure it's in browser cache
 * @param src Image URL to preload
 * @returns Promise that resolves when image is loaded
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    img.src = src;
  });
};

/**
 * Lazy loads images for carousels with a blur-up technique
 * @param container The container DOM element or null
 */
export const setupLazyCarouselImages = (container: HTMLElement | null): void => {
  // Handle null or undefined
  if (!container) {
    console.warn('setupLazyCarouselImages: No container provided');
    return;
  }
  
  // Find all images with data-src attribute
  const images = container.querySelectorAll('img[data-src]');
  
  // If no images found, exit
  if (images.length === 0) {
    return;
  }
  
  // Create IntersectionObserver to load images when they enter viewport
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.getAttribute('data-src');
          
          if (src) {
            // Set actual image source
            img.src = src;
            // Remove data attribute to avoid re-processing
            img.removeAttribute('data-src');
            // Stop observing this image
            observer.unobserve(img);
          }
        }
      });
    },
    { rootMargin: '100px' } // Start loading when within 100px of viewport
  );
  
  // Observe all images with data-src
  images.forEach(img => observer.observe(img));
};

/**
 * Determines if the browser has native HEIC support
 * @returns Boolean indicating whether HEIC is supported
 */
export const hasHeicSupport = (): boolean => {
  // Check if the browser supports HEIC format
  const canvas = document.createElement('canvas');
  const supportedTypes = canvas.toDataURL('image/heic') !== canvas.toDataURL();
  return supportedTypes;
};

/**
 * Detects if the device is running iOS
 * @returns Boolean indicating whether the device is iOS
 */
export const isIosDevice = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

/**
 * Check and reset camera permissions if needed
 * Returns true if permissions are likely granted
 */
export const checkCameraPermissions = async (): Promise<boolean> => {
  try {
    // First try to access camera - this will trigger permission prompt if not set
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: {
        facingMode: { ideal: 'environment' }, // Prefer back camera for food photos
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });
    
    // If we get here, we have permission
    // Stop the tracks immediately to release the camera
    stream.getTracks().forEach(track => track.stop());
    
    return true;
  } catch (error) {
    console.error('Camera permission error:', error);
    
    // Check if this was a permission error
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      const isPermissionError = 
        errorMessage.includes('permission') || 
        errorMessage.includes('denied') ||
        errorMessage.includes('not allowed');
        
      if (isPermissionError && 'permissions' in navigator) {
        try {
          // Query the current permission state
          const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
          
          if (permissionStatus.state === 'denied') {
            return false;
          }
        } catch (permError) {
          console.error('Error checking permissions:', permError);
        }
      }
    }
    
    return false;
  }
};
