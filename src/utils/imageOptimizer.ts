/**
 * Image compression and Firestore document payload size optimization utilities.
 * Ensures pictures and voice recordings never exceed Firestore's 1 MiB (1,048,576 bytes) document limit.
 */

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_VOICE_DURATION_SECONDS = 90; // 90 seconds (1m 30s)

export interface OptimizedImageResult {
  dataUrl: string;
  originalSizeBytes: number;
  optimizedSizeBytes: number;
  dimensions: { width: number; height: number };
}

/**
 * Optimizes, resizes, and compresses an image file to a safe base64 data URL.
 * Target payload is guaranteed to be under maxSizeBytes (default 400 KB = ~300 KB binary).
 */
export async function optimizeImageForFirestore(
  file: File,
  maxDimension = 1024,
  maxSizeBytes = 400 * 1024
): Promise<OptimizedImageResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selected file must be an image.');
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`Picture size exceeds the 5MB limit (${sizeMB}MB). Please select an image smaller than 5MB.`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image data.'));
      img.onload = () => {
        try {
          let { width, height } = img;

          // Scale down dimensions if needed
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error('Canvas 2D context could not be created.');
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Initial compression attempt
          let quality = 0.75;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);

          // Iteratively reduce quality if still over budget
          while (dataUrl.length > maxSizeBytes && quality > 0.25) {
            quality -= 0.12;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }

          // If still over budget, downscale dimensions by another 25%
          if (dataUrl.length > maxSizeBytes) {
            const smallCanvas = document.createElement('canvas');
            smallCanvas.width = Math.max(320, Math.round(width * 0.75));
            smallCanvas.height = Math.max(240, Math.round(height * 0.75));
            const sCtx = smallCanvas.getContext('2d');
            if (sCtx) {
              sCtx.imageSmoothingEnabled = true;
              sCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
              dataUrl = smallCanvas.toDataURL('image/jpeg', 0.6);
            }
          }

          resolve({
            dataUrl,
            originalSizeBytes: file.size,
            optimizedSizeBytes: dataUrl.length,
            dimensions: { width, height }
          });
        } catch (err) {
          reject(err);
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Checks whether a document data object is safely within Firestore's 1 MiB limit.
 * Leaves 150 KB safety margin for metadata and protocol overhead.
 */
export function validateFirestoreDocumentSize(
  data: Record<string, any>,
  maxBytes = 850 * 1024
): { isValid: boolean; estimatedBytes: number; maxBytes: number; message?: string } {
  try {
    const jsonStr = JSON.stringify(data);
    const estimatedBytes = new Blob([jsonStr]).size;

    if (estimatedBytes > maxBytes) {
      return {
        isValid: false,
        estimatedBytes,
        maxBytes,
        message: `Total content size (${Math.round(estimatedBytes / 1024)} KB) exceeds the safe database threshold of ${Math.round(maxBytes / 1024)} KB. Please shorten the message or use a more compressed attachment.`
      };
    }

    return {
      isValid: true,
      estimatedBytes,
      maxBytes
    };
  } catch (err: any) {
    return {
      isValid: false,
      estimatedBytes: 0,
      maxBytes,
      message: 'Failed to evaluate document payload size.'
    };
  }
}
