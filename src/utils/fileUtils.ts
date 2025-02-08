
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const validateFile = (file: File | null): { isValid: boolean; error?: { title: string; description: string } } => {
  if (!file) {
    return {
      isValid: false,
      error: {
        title: "Invalid file",
        description: "No file was provided"
      }
    };
  }

  const fileExtension = file.name.toLowerCase().split('.').pop();
  const validExtensions = ['epub', 'pdf'];
  
  if (!validExtensions.includes(fileExtension || '')) {
    return {
      isValid: false,
      error: {
        title: "Invalid file",
        description: "Please upload an EPUB or PDF file"
      }
    };
  }

  if (file.size === 0) {
    return {
      isValid: false,
      error: {
        title: "Invalid file",
        description: "The file appears to be empty"
      }
    };
  }

  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: {
        title: "File too large",
        description: "Please upload a file smaller than 100MB"
      }
    };
  }

  return { isValid: true };
};
