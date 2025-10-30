
import React, { useRef, useEffect, useState } from 'react';
import { CameraIcon } from './IconComponents';

interface CameraScannerProps {
  onCapture: (base64Image: string, mimeType: string) => void;
  isScanning: boolean;
  captureButtonText?: string;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onCapture, isScanning, captureButtonText }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const enableCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Could not access the camera. Please check permissions and try again.");
      }
    };

    enableCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.9);
        const base64Image = dataUrl.split(',')[1];
        onCapture(base64Image, mimeType);
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-4">
        {error && <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">{error}</div>}
        <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden border-4 border-slate-300 shadow-lg">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            {isScanning && (
                <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center text-white z-10">
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-400"></div>
                    <p className="mt-4 text-lg font-semibold">Menganalisis Jawaban...</p>
                </div>
            )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <button
            onClick={handleCapture}
            disabled={isScanning || !!error}
            className="w-full mt-6 bg-blue-600 text-white font-bold py-4 px-6 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center text-xl"
        >
            <CameraIcon className="w-8 h-8 mr-3" />
            {isScanning ? 'Memindai...' : (captureButtonText || 'Pindai Lembar Jawaban')}
        </button>
    </div>
  );
};

export default CameraScanner;
