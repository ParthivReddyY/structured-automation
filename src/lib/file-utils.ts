export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

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


export function getProcessingEndpoint(mimeType: string): string {
  if (isMultimodalFile(mimeType)) {
    return '/api/process-multimodal';
  }
  return '/api/process-file';
}


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


export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}


export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}


export async function processFileForAI(file: File): Promise<{
  fileName: string;
  mimeType: string;
  fileBase64?: string;
  fileContent?: string;
}> {
  const fileName = file.name;
  const mimeType = file.type;
  
  if (isMultimodalFile(mimeType)) {
    const fileBase64 = await fileToBase64(file);
    return { fileName, mimeType, fileBase64 };
  }
  
  const fileContent = await extractTextFromFile(file);
  return { fileName, mimeType, fileContent };
}
