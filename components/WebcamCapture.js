import { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, RotateCcw } from 'lucide-react';

export default function WebcamCapture({ onCapture, isCapturing = false }) {
  const webcamRef = useRef(null);
  const [facingMode, setFacingMode] = useState('user');

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc && onCapture) {
      onCapture(imageSrc);
    }
  }, [onCapture]);

  const switchCamera = useCallback(() => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  }, []);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: facingMode
  };

  return (
    <div className="webcam-container">
      <div className="relative">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="w-full h-auto rounded-lg"
        />
        
        {/* Overlay for face detection guide */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="border-2 border-white border-dashed rounded-full w-64 h-64 flex items-center justify-center">
            <div className="text-white text-center">
              <Camera className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Position your face here</p>
            </div>
          </div>
        </div>

        {/* Camera controls */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
          <button
            type="button"
            onClick={switchCamera}
            className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
            title="Switch Camera"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          
          <button
            type="button"
            onClick={capture}
            disabled={isCapturing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-full font-medium transition-colors"
          >
            {isCapturing ? (
              <div className="flex items-center">
                <div className="loading-spinner mr-2 h-4 w-4"></div>
                Processing...
              </div>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
