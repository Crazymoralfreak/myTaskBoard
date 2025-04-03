import React, { useState, useRef } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Box, 
  Typography, 
  Slider
} from '@mui/material';
import ReactCrop, { centerCrop, makeAspectCrop, Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface AvatarUploaderProps {
  open: boolean;
  onClose: () => void;
  onSave: (imageUrl: string) => void;
}

// Функция для центрирования и создания правильного кропа
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

// Функция для получения обрезанного изображения
function getCroppedImg(image: HTMLImageElement, crop: PixelCrop): Promise<string> {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Context not available');
  }

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height,
  );

  return new Promise((resolve) => {
    canvas.toBlob(blob => {
      if (!blob) {
        console.error('Canvas is empty');
        return;
      }
      resolve(URL.createObjectURL(blob));
    }, 'image/jpeg', 0.95);
  });
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({ open, onClose, onSave }) => {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
        setScale(1);
        setRotate(0);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  };

  const handleSave = async () => {
    if (imgRef.current && completedCrop) {
      const croppedImageUrl = await getCroppedImg(imgRef.current, completedCrop);
      onSave(croppedImageUrl);
      onClose();
    }
  };

  const handleCancel = () => {
    setImgSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="md" fullWidth>
      <DialogTitle>Загрузка аватара</DialogTitle>
      <DialogContent>
        {!imgSrc ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" gutterBottom>
              Выберите изображение для загрузки
            </Typography>
            <Button
              variant="contained"
              component="label"
            >
              Выбрать изображение
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={onSelectFile}
              />
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imgSrc}
                style={{ 
                  transform: `scale(${scale}) rotate(${rotate}deg)`,
                  maxWidth: '100%',
                  maxHeight: '400px'
                }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
            
            <Box sx={{ width: '100%', maxWidth: 500, mt: 2 }}>
              <Typography gutterBottom>Масштаб</Typography>
              <Slider
                value={scale}
                min={0.5}
                max={2}
                step={0.1}
                aria-labelledby="Scale"
                onChange={(_, value) => setScale(value as number)}
              />
              
              <Typography gutterBottom>Поворот</Typography>
              <Slider
                value={rotate}
                min={0}
                max={360}
                step={1}
                aria-labelledby="Rotate"
                onChange={(_, value) => setRotate(value as number)}
              />
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Отмена</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary" 
          disabled={!imgSrc || !completedCrop}
        >
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AvatarUploader; 