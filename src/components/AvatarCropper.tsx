import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Check } from "lucide-react";

interface AvatarCropperProps {
  imageUrl: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export const AvatarCropper = ({ imageUrl, onCropComplete, onCancel }: AvatarCropperProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const cropSize = 200; // Size of the circular crop area

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      if (imageRef.current) {
        imageRef.current.src = img.src;
        setImageLoaded(true);
        // Center the crop circle initially
        const container = canvasRef.current?.parentElement;
        if (container) {
          setCropPosition({
            x: (container.offsetWidth - cropSize) / 2,
            y: (container.offsetHeight - cropSize) / 2,
          });
        }
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !canvasRef.current) return;

    const container = canvasRef.current.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left - cropSize / 2, rect.width - cropSize));
    const y = Math.max(0, Math.min(e.clientY - rect.top - cropSize / 2, rect.height - cropSize));

    setCropPosition({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = async () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to crop size
    canvas.width = cropSize;
    canvas.height = cropSize;

    // Calculate scale between displayed image and actual image
    const displayedWidth = imageRef.current.offsetWidth;
    const displayedHeight = imageRef.current.offsetHeight;
    const actualWidth = imageRef.current.naturalWidth;
    const actualHeight = imageRef.current.naturalHeight;
    
    const scaleX = actualWidth / displayedWidth;
    const scaleY = actualHeight / displayedHeight;

    // Create circular clip
    ctx.beginPath();
    ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Draw the cropped portion
    ctx.drawImage(
      imageRef.current,
      cropPosition.x * scaleX,
      cropPosition.y * scaleY,
      cropSize * scaleX,
      cropSize * scaleY,
      0,
      0,
      cropSize,
      cropSize
    );

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Adjust Your Profile Picture</h3>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div
          className="relative inline-block mx-auto bg-muted rounded-lg overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? 'grabbing' : 'default' }}
        >
          <img
            ref={imageRef}
            alt="Crop preview"
            className="max-w-full max-h-[60vh] block"
            style={{ visibility: imageLoaded ? 'visible' : 'hidden' }}
          />
          
          {imageLoaded && (
            <>
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/50 pointer-events-none" />
              
              {/* Circular crop area */}
              <div
                className="absolute border-4 border-white rounded-full cursor-grab active:cursor-grabbing"
                style={{
                  width: cropSize,
                  height: cropSize,
                  left: cropPosition.x,
                  top: cropPosition.y,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                }}
                onMouseDown={handleMouseDown}
              />
            </>
          )}
          
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <p className="text-sm text-muted-foreground text-center mt-4 mb-6">
          Drag the circle to select the area you want as your profile picture
        </p>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleCrop}>
            <Check className="w-4 h-4 mr-2" />
            Crop & Upload
          </Button>
        </div>
      </div>
    </div>
  );
};