import { useCallback, useRef, useState } from 'react';
import { UploadCloud, X, Loader2, ImageIcon } from 'lucide-react';
import { uploadToCloudinary, isImageFile } from '@/lib/cloudinary';
import { cn } from '@/utils/cn';

interface ImageDropzoneProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
  aspect?: 'square' | 'video' | 'wide';
}

export default function ImageDropzone({
  value,
  onChange,
  label = 'Image',
  className,
  aspect = 'video',
}: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectClass =
    aspect === 'square' ? 'aspect-square' : aspect === 'wide' ? 'aspect-[21/9]' : 'aspect-video';

  const handleFile = useCallback(async (file: File) => {
    if (!isImageFile(file)) {
      setError('Зөвхөн зургийн файл (jpg, png, webp гэх мэт) оруулна уу');
      return;
    }

    setError('');
    setUploading(true);
    setProgress(0);

    try {
      const result = await uploadToCloudinary(file, setProgress);
      onChange(result.secure_url);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Зураг upload хийхэд алдаа гарлаа');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onChange]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className={className}>
      {label && (
        <label className="block font-manrope font-semibold text-[#1F1F1F] mb-2">
          {label}
        </label>
      )}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative w-full rounded-lg border-2 border-dashed cursor-pointer transition-all overflow-hidden bg-gray-50',
          aspectClass,
          isDragging
            ? 'border-[#C9A86A] bg-[#C9A86A]/10'
            : 'border-gray-300 hover:border-[#C9A86A]',
          uploading && 'pointer-events-none opacity-80'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {value && !uploading ? (
          <>
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center group">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white font-manrope text-sm flex items-center gap-2">
                <UploadCloud size={18} />
                Солих бол дарна уу
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 transition-all shadow-lg"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center">
            {uploading ? (
              <>
                <Loader2 size={32} className="text-[#C9A86A] animate-spin" />
                <p className="font-manrope text-sm text-gray-600">
                  Upload хийж байна... {progress}%
                </p>
                <div className="w-full max-w-[200px] h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#C9A86A] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="p-3 rounded-full bg-[#C9A86A]/10">
                  {value ? (
                    <ImageIcon size={24} className="text-[#C9A86A]" />
                  ) : (
                    <UploadCloud size={24} className="text-[#C9A86A]" />
                  )}
                </div>
                <p className="font-manrope text-sm text-gray-600">
                  Зургаа энд чирж оруулах эсвэл{' '}
                  <span className="text-[#C9A86A] font-semibold">сонгох</span>
                </p>
                <p className="font-manrope text-xs text-gray-400">
                  JPG, PNG, WEBP
                </p>
              </>
            )}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 font-manrope">{error}</p>
      )}
    </div>
  );
}
