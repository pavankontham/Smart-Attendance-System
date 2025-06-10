import { useRef, useCallback, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, RotateCcw, Eye, EyeOff, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function LivenessWebcamCapture({ onCapture, isCapturing = false }) {
  const webcamRef = useRef(null);
  const [facingMode, setFacingMode] = useState('user');
  const [livenessStep, setLivenessStep] = useState(0); // 0: ready, 1: detecting, 2: blink prompt, 3: success
  const [livenessChecks, setLivenessChecks] = useState({
    faceDetected: false,
    faceSize: false,
    lighting: false,
    headPose: false,
    eyesOpen: false
  });
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [instructions, setInstructions] = useState('Position your face in the circle');
  const [imageQuality, setImageQuality] = useState({ blur: 0, brightness: 0 });

  const videoConstraints = {
    width: { ideal: 1280, min: 640 },
    height: { ideal: 720, min: 480 },
    facingMode: facingMode,
    frameRate: { ideal: 30, min: 15 },
    aspectRatio: 16/9,
    // Enhanced quality settings
    advanced: [
      { focusMode: 'continuous' },
      { exposureMode: 'continuous' },
      { whiteBalanceMode: 'continuous' }
    ]
  };

  // Simulate real-time liveness checking (in a real implementation, this would use MediaPipe)
  useEffect(() => {
    if (livenessStep === 1) {
      const checkInterval = setInterval(() => {
        // Simulate progressive liveness checks
        setLivenessChecks(prev => {
          const newChecks = { ...prev };
          
          // Simulate face detection
          if (!newChecks.faceDetected) {
            newChecks.faceDetected = true;
            setInstructions('Face detected! Keep looking at the camera');
          } else if (!newChecks.faceSize) {
            newChecks.faceSize = true;
            setInstructions('Good face size. Checking lighting...');
          } else if (!newChecks.lighting) {
            newChecks.lighting = true;
            setInstructions('Lighting looks good. Please face the camera directly');
          } else if (!newChecks.headPose) {
            newChecks.headPose = true;
            setInstructions('Perfect head position. Keep your eyes open naturally');
          } else if (!newChecks.eyesOpen) {
            newChecks.eyesOpen = true;
            setInstructions('Eyes detected! Now please blink naturally');
            setLivenessStep(2);
            startBlinkDetection();
          }
          
          return newChecks;
        });
      }, 1000);

      return () => clearInterval(checkInterval);
    }
  }, [livenessStep]);

  const startBlinkDetection = () => {
    setCountdown(5);
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Simulate blink detection after countdown
          setTimeout(() => {
            setBlinkDetected(true);
            setInstructions('Blink detected! Liveness verified');
            setLivenessStep(3);
            setTimeout(() => {
              capture();
            }, 1000);
          }, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Function to check image quality
  const checkImageQuality = useCallback((imageSrc) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Calculate brightness
        let brightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        brightness = brightness / (data.length / 4);

        // Simple blur detection using edge detection
        let edgeCount = 0;
        for (let i = 0; i < data.length - 4; i += 4) {
          const diff = Math.abs((data[i] + data[i + 1] + data[i + 2]) - (data[i + 4] + data[i + 5] + data[i + 6]));
          if (diff > 30) edgeCount++;
        }
        const sharpness = edgeCount / (data.length / 4);

        resolve({ brightness, sharpness });
      };
      img.src = imageSrc;
    });
  }, []);

  const capture = useCallback(async () => {
    // Get high-quality screenshot with specific dimensions
    const imageSrc = webcamRef.current.getScreenshot({
      width: 1280,
      height: 720,
      quality: 0.95
    });

    if (imageSrc) {
      // Check image quality before proceeding
      const quality = await checkImageQuality(imageSrc);
      setImageQuality(quality);

      // Validate image quality - more lenient thresholds
      if (quality.brightness < 30) {
        setInstructions('Image too dark. Please improve lighting and try again.');
        setTimeout(() => resetLiveness(), 3000);
        return;
      }

      if (quality.brightness > 220) {
        setInstructions('Image too bright. Please reduce lighting and try again.');
        setTimeout(() => resetLiveness(), 3000);
        return;
      }

      if (quality.sharpness < 0.05) {  // Reduced from 0.1 to 0.05
        setInstructions('Image too blurry. Please hold steady and ensure good focus.');
        setTimeout(() => resetLiveness(), 3000);
        return;
      }

      // Image quality is good, proceed with capture
      if (onCapture) {
        onCapture(imageSrc);
      }
    }
  }, [onCapture, checkImageQuality]);

  const startLivenessCheck = () => {
    setLivenessStep(1);
    setLivenessChecks({
      faceDetected: false,
      faceSize: false,
      lighting: false,
      headPose: false,
      eyesOpen: false
    });
    setBlinkDetected(false);
    setInstructions('Starting liveness detection...');
  };

  const switchCamera = useCallback(() => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  }, []);

  const resetLiveness = () => {
    setLivenessStep(0);
    setLivenessChecks({
      faceDetected: false,
      faceSize: false,
      lighting: false,
      headPose: false,
      eyesOpen: false
    });
    setBlinkDetected(false);
    setCountdown(0);
    setInstructions('Position your face in the circle');
  };

  const getCheckIcon = (passed) => {
    if (passed) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <div className="h-4 w-4 rounded-full border-2 border-gray-300"></div>;
  };

  return (
    <div className="webcam-container">
      <div className="relative">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          screenshotQuality={0.95}
          videoConstraints={videoConstraints}
          className="w-full h-auto rounded-lg"
          style={{
            filter: 'contrast(1.1) brightness(1.05)',
            imageRendering: 'crisp-edges'
          }}
        />
        
        {/* Face detection overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`border-2 border-dashed rounded-full w-64 h-64 flex items-center justify-center transition-colors ${
            livenessStep === 3 ? 'border-green-400' : 
            livenessStep > 0 ? 'border-blue-400' : 'border-white'
          }`}>
            {livenessStep === 0 && (
              <div className="text-white text-center">
                <Camera className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Position your face here</p>
              </div>
            )}
            {livenessStep === 1 && (
              <div className="text-blue-400 text-center">
                <Loader className="h-8 w-8 mx-auto mb-2 animate-spin" />
                <p className="text-sm">Analyzing...</p>
              </div>
            )}
            {livenessStep === 2 && (
              <div className="text-yellow-400 text-center">
                <Eye className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Blink in {countdown}s</p>
              </div>
            )}
            {livenessStep === 3 && (
              <div className="text-green-400 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Verified!</p>
              </div>
            )}
          </div>
        </div>

        {/* Liveness status panel */}
        {livenessStep > 0 && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-lg max-w-xs">
            <h4 className="text-sm font-semibold mb-2">Liveness Checks</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center space-x-2">
                {getCheckIcon(livenessChecks.faceDetected)}
                <span>Face Detection</span>
              </div>
              <div className="flex items-center space-x-2">
                {getCheckIcon(livenessChecks.faceSize)}
                <span>Face Size</span>
              </div>
              <div className="flex items-center space-x-2">
                {getCheckIcon(livenessChecks.lighting)}
                <span>Lighting Quality</span>
              </div>
              <div className="flex items-center space-x-2">
                {getCheckIcon(livenessChecks.headPose)}
                <span>Head Position</span>
              </div>
              <div className="flex items-center space-x-2">
                {getCheckIcon(livenessChecks.eyesOpen)}
                <span>Eyes Detected</span>
              </div>
              <div className="flex items-center space-x-2">
                {getCheckIcon(blinkDetected)}
                <span>Blink Detected</span>
              </div>
            </div>
          </div>
        )}

        {/* Image Quality Indicator */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Image Quality</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span>Brightness:</span>
              <span className={`font-medium ${
                imageQuality.brightness >= 30 && imageQuality.brightness <= 220 ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {imageQuality.brightness > 0 ? Math.round(imageQuality.brightness) : '--'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Sharpness:</span>
              <span className={`font-medium ${
                imageQuality.sharpness >= 0.05 ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {imageQuality.sharpness > 0 ? (imageQuality.sharpness * 100).toFixed(1) + '%' : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-20 left-0 right-0 text-center">
          <div className="bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg mx-4">
            <p className="text-sm">{instructions}</p>
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
          
          {livenessStep === 0 && (
            <button
              type="button"
              onClick={startLivenessCheck}
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
                  <Eye className="h-4 w-4 mr-2" />
                  Start Liveness Check
                </>
              )}
            </button>
          )}

          {livenessStep > 0 && livenessStep < 3 && (
            <button
              type="button"
              onClick={resetLiveness}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-full font-medium transition-colors"
            >
              Reset
            </button>
          )}

          {livenessStep === 3 && !isCapturing && (
            <button
              type="button"
              onClick={resetLiveness}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-medium transition-colors"
            >
              Capture Another
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
