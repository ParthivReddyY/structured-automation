/**
 * Utility functions for file handling and conversion
 */

/**
 * Convert a File object to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data:*/*;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Extract text content from a text-based file
 */
export async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      resolve(reader.result as string);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Determine if a file is multimodal (PDF or image) or plain text
 */
export function isMultimodalFile(mimeType: string): boolean {
  const multimodalTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/heic',
    'image/heif',
  ];
  
  return multimodalTypes.includes(mimeType);
}

/**
 * Get the appropriate API endpoint based on file type
 */
export function getProcessingEndpoint(mimeType: string): string {
  if (isMultimodalFile(mimeType)) {
    return '/api/process-multimodal';
  }
  return '/api/process-file';
}

/**
 * Validate file size (default 10MB max)
 */
export function validateFileSize(file: File, maxSizeMB: number = 10): { valid: boolean; error?: string } {
  const maxBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate file type
 */
export function validateFileType(file: File): { valid: boolean; error?: string } {
  const allowedTypes = [
    'text/plain',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/heic',
    'image/heif',
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Supported types: TXT, PDF, DOCX, PNG, JPEG, WebP, HEIC, HEIF`,
    };
  }
  
  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Process file for AI analysis
 */
export async function processFileForAI(file: File): Promise<{
  fileName: string;
  mimeType: string;
  fileBase64?: string;
  fileContent?: string;
}> {
  const fileName = file.name;
  const mimeType = file.type;
  
  // For multimodal files (PDF, images), convert to base64
  if (isMultimodalFile(mimeType)) {
    const fileBase64 = await fileToBase64(file);
    return { fileName, mimeType, fileBase64 };
  }
  
  // For text files, extract text content
  const fileContent = await extractTextFromFile(file);
  return { fileName, mimeType, fileContent };
}
