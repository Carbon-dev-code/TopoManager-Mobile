import { useState, useCallback } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Directory, Filesystem } from "@capacitor/filesystem";

export const useCamera = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const compressImage = useCallback(async ( base64: string, maxSize = 1024, quality = 0.6, ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = `data:image/jpeg;base64,${base64}`;
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > width && height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality).split(",")[1]);
      };
    });
  }, []);

  const takePhoto = useCallback(async (maxPhotos: number = 5, currentPhotos: string[] = []) => {
    try {
      if (currentPhotos.length >= maxPhotos) {
        setToastMessage(`Maximum ${maxPhotos} photos`);
        return null;
      }
      
      const photo = await Camera.getPhoto({
        quality: 60,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        width: 1024,
        height: 1024,
        correctOrientation: true,
      });
      
      if (!photo.base64String) {
        setToastMessage("Pas de photo");
        return null;
      }
      
      const compressed = await compressImage(photo.base64String, 1024, 0.6);
      const fileName = `parcelle/${Date.now()}.jpeg`;
      
      await Filesystem.writeFile({
        path: fileName,
        data: compressed,
        directory: Directory.Data,
        recursive: true,
      });
      
      return fileName;
    } catch (err) {
      console.error(err);
      setToastMessage("Erreur lors de la capture");
      return null;
    }
  }, [compressImage]);

  return {
    toastMessage,
    takePhoto,
    setToastMessage
  };
};
