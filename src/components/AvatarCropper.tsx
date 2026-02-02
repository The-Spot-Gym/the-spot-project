import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { X, Check, ZoomIn, ZoomOut } from "lucide-react";

interface AvatarCropperProps {
  imageUrl: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export const AvatarCropper = ({ imageUrl, onCropComplete, onCancel }: AvatarCropperProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialZoom, setInitialZoom] = useState(1);

  const cropSize = 200;
  const minZoom = 1;
  const maxZoom = 3;

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      if (imageRef.current) {
        imageRef.current.src = img.src;
        setImageLoaded(true);
        // Center the crop circle initially
        if (containerRef.current) {
          const imgWidth = containerRef.current.offsetWidth;
          const imgHeight = containerRef.current.offsetHeight;
          setCropPosition({
            x: Math.max(0, (imgWidth - cropSize) / 2),
            y: Math.max(0, (imgHeight - cropSize) / 2),
          });
        }
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Clamp crop position when zoom changes
  useEffect(() => {
    if (!containerRef.current || !imageRef.current) return;
    
    const imgWidth = imageRef.current.offsetWidth * zoom;
    const imgHeight = imageRef.current.offsetHeight * zoom;
    
    setCropPosition(prev => ({
      x: Math.max(0, Math.min(prev.x, imgWidth - cropSize)),
      y: Math.max(0, Math.min(prev.y, imgHeight - cropSize)),
    }));
  }, [zoom]);

  const getEventPosition = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    if ('clientX' in e) {
      return { clientX: e.clientX, clientY: e.clientY };
    }
    return { clientX: 0, clientY: 0 };
  };

  const getPinchDistance = (touches: TouchList) => {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    // Check for pinch gesture
    if ('touches' in e && e.touches.length === 2) {
      const distance = getPinchDistance(e.nativeEvent.touches);
      setInitialPinchDistance(distance);
      setInitialZoom(zoom);
      return;
    }

    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const { clientX, clientY } = getEventPosition(e);
    
    setDragOffset({
      x: clientX - rect.left - cropPosition.x - cropSize / 2,
      y: clientY - rect.top - cropPosition.y - cropSize / 2,
    });
    setIsDragging(true);
  }, [cropPosition, zoom]);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    // Handle pinch zoom
    if ('touches' in e && e.touches.length === 2 && initialPinchDistance !== null) {
      const currentDistance = getPinchDistance(e.touches);
      if (currentDistance) {
        const scale = currentDistance / initialPinchDistance;
        const newZoom = Math.max(minZoom, Math.min(maxZoom, initialZoom * scale));
        setZoom(newZoom);
      }
      return;
    }

    if (!isDragging || !containerRef.current || !imageRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const { clientX, clientY } = getEventPosition(e);

    const imgWidth = imageRef.current.offsetWidth * zoom;
    const imgHeight = imageRef.current.offsetHeight * zoom;

    const x = Math.max(0, Math.min(clientX - rect.left - cropSize / 2 - dragOffset.x, imgWidth - cropSize));
    const y = Math.max(0, Math.min(clientY - rect.top - cropSize / 2 - dragOffset.y, imgHeight - cropSize));

    setCropPosition({ x, y });
  }, [isDragging, dragOffset, zoom, initialPinchDistance, initialZoom]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setInitialPinchDistance(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(minZoom, Math.min(maxZoom, prev + delta)));
  }, []);

  // Add global event listeners for drag
  useEffect(() => {
    if (isDragging || initialPinchDistance !== null) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, initialPinchDistance, handleDragMove, handleDragEnd]);

  const handleCrop = async () => {
    if (!imageRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = cropSize;
    canvas.height = cropSize;

    const displayedWidth = imageRef.current.offsetWidth;
    const displayedHeight = imageRef.current.offsetHeight;
    const actualWidth = imageRef.current.naturalWidth;
    const actualHeight = imageRef.current.naturalHeight;
    
    // Account for zoom in the scale calculation
    const scaleX = actualWidth / (displayedWidth * zoom);
    const scaleY = actualHeight / (displayedHeight * zoom);

    ctx.beginPath();
    ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

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

    canvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
    }, 'image/png');
  };

  const handleZoomChange = (value: number[]) => {
    setZoom(value[0]);
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
          ref={containerRef}
          className="relative mx-auto bg-muted rounded-lg overflow-hidden select-none"
          style={{ cursor: isDragging ? 'grabbing' : 'default' }}
          onWheel={handleWheel}
        >
          <div 
            className="relative"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
          >
            <img
              ref={imageRef}
              alt="Crop preview"
              className="max-w-full max-h-[50vh] block pointer-events-none"
              style={{ visibility: imageLoaded ? 'visible' : 'hidden' }}
              draggable={false}
            />
          </div>
          
          {imageLoaded && (
            <>
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/50 pointer-events-none" />
              
              {/* Circular crop area */}
              <div
                className="absolute border-4 border-white rounded-full cursor-grab active:cursor-grabbing touch-none"
                style={{
                  width: cropSize,
                  height: cropSize,
                  left: cropPosition.x,
                  top: cropPosition.y,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                }}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
              />
            </>
          )}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-4 mt-4 px-2">
          <ZoomOut className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Slider
            value={[zoom]}
            onValueChange={handleZoomChange}
            min={minZoom}
            max={maxZoom}
            step={0.1}
            className="flex-1"
          />
          <ZoomIn className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </div>

        <p className="text-sm text-muted-foreground text-center mt-4 mb-6">
          Drag the circle and use the slider or scroll to zoom
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
