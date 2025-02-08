
import React from 'react';
import { Upload } from 'lucide-react';
import { DropzoneProps } from 'react-dropzone';

interface CustomDropZoneProps extends Pick<DropzoneProps, 'getRootProps' | 'getInputProps'> {
  isDragActive: boolean;
}

const DropZone = ({ getRootProps, getInputProps, isDragActive }: CustomDropZoneProps) => {
  return (
    <div className="flex justify-center w-full">
      <div
        {...getRootProps()}
        className={`w-full max-w-xl p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center">
          <Upload className="w-12 h-12 mb-4 text-gray-400" />
          <p className="mb-2 text-lg font-medium text-gray-900">
            {isDragActive ? 'Drop the file here' : 'Drag & drop your EPUB or PDF file here'}
          </p>
          <p className="text-sm text-gray-500">or click to select a file</p>
          <p className="mt-2 text-xs text-gray-400">Maximum file size: 100MB</p>
        </div>
      </div>
    </div>
  );
};

export default DropZone;
