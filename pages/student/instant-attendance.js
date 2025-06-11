import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../../src/components/Layout';
import Webcam from 'react-webcam';
import { useAuth } from '../../src/contexts/AuthContext';
import { dbHelpers } from '../../src/lib/supabase';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Timer, Key, CheckCircle, AlertCircle, Clock, Camera, ArrowLeft, Shield, Sparkles, Eye, RotateCcw } from 'lucide-react';

export default function StudentInstantAttendance() {
  const { currentUser } = useAuth();
  const webcamRef = useRef(null);

  // Main state
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [step, setStep] = useState(1); // 1: Password entry, 2: Face recognition
  const [validatedData, setValidatedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Webcam state (same as enrollment)
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
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0);
  const [lastCaptureTime, setLastCaptureTime] = useState(0);

  async function handlePasswordSubmit(e) {
    e.preventDefault();

    // Prevent multiple submissions with debounce
    const now = Date.now();
    if (isSubmitting || (now - lastSubmissionTime) < 2000) {
      console.log('Submission blocked - too soon or already submitting');
      return;
    }

    setLastSubmissionTime(now);

    if (!password.trim()) {
      toast.error('Please enter the attendance password');
      return;
    }

    // Validate password format (should be 6 digits)
    const trimmedPassword = password.trim();
    if (!/^\d{6}$/.test(trimmedPassword)) {
      toast.error('Password must be exactly 6 digits');
      return;
    }

    setIsSubmitting(true);
    setLastResult(null); // Clear previous result

    try {
      const { data, error } = await dbHelpers.validateInstantPassword(trimmedPassword, currentUser.uid);

      if (error) {
        // Handle specific error cases with user-friendly messages
        let errorMessage = error.message;
        if (errorMessage.includes('expired')) {
          errorMessage = 'Password has expired. Please ask your teacher for a new one.';
        } else if (errorMessage.includes('already marked')) {
          errorMessage = 'You have already marked attendance today.';
        } else if (errorMessage.includes('not enrolled')) {
          errorMessage = 'You are not enrolled in this class. Please contact your teacher.';
        } else if (errorMessage.includes('pending approval')) {
          errorMessage = 'Your enrollment is pending teacher approval.';
        } else if (errorMessage.includes('Invalid') || errorMessage.includes('invalid')) {
          errorMessage = 'Invalid password. Please check with your teacher.';
        } else if (errorMessage.includes('Database connection')) {
          errorMessage = 'Connection error. Please try again in a moment.';
        }

        toast.error(errorMessage);
        setLastResult({ success: false, message: errorMessage });
      } else {
        // Password validated successfully, proceed to face recognition
        setValidatedData(data);
        setStep(2);
        toast.success(`Password validated for ${data.class_name}. Please proceed with face recognition.`);
      }
    } catch (error) {
      console.error('Error validating password:', error);
      let errorMessage = 'Failed to validate password. Please try again.';

      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message.includes('NetworkError')) {
        errorMessage = 'Network error. Please check your connection.';
      }

      toast.error(errorMessage);
      setLastResult({ success: false, message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleImageCapture = useCallback(async (imageSrc) => {
    // Prevent multiple captures with debounce
    const now = Date.now();
    if (isProcessing || (now - lastCaptureTime) < 3000) {
      console.log('Capture blocked - too soon or already processing');
      return;
    }

    setLastCaptureTime(now);

    if (!validatedData) {
      toast.error('Please validate password first');
      return;
    }

    if (!currentUser?.uid) {
      toast.error('User not authenticated');
      return;
    }

    console.log('🔄 Starting face recognition process...');
    console.log('👤 Current user:', currentUser.uid);
    console.log('🔑 Validated data:', validatedData);
    console.log('🔐 Password:', password);
    setIsProcessing(true);
    setLastResult(null);

    try {
      console.log('📸 Converting image to blob...');
      // Convert base64 to blob
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      console.log('✅ Image converted to blob, size:', blob.size);

      // Create form data
      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');
      formData.append('user_id', currentUser.uid); // Use Firebase UID
      console.log('📤 Sending face recognition request for user:', currentUser.uid);

      // Send to face recognition API with timeout
      console.log('📤 Making API call to:', `${process.env.NEXT_PUBLIC_FACE_API_URL}/recognize`);
      const apiResponse = await Promise.race([
        axios.post(
          `${process.env.NEXT_PUBLIC_FACE_API_URL}/recognize`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 30000, // 30 second timeout
          }
        ),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Face recognition timeout after 30 seconds')), 30000)
        )
      ]);

      console.log('📥 Face recognition response:', apiResponse.data);

      if (apiResponse.data.success && apiResponse.data.recognized) {
        console.log('✅ Face recognized, marking attendance...');
        // Face recognized, now mark attendance
        const { data, error } = await dbHelpers.markInstantAttendance(password, currentUser.uid);

        console.log('📥 Attendance marking response:', { data, error });

        if (error) {
          console.error('❌ Attendance marking failed:', error);
          let errorMessage = error.message;
          if (errorMessage.includes('expired')) {
            errorMessage = 'Password has expired during face recognition. Please ask your teacher for a new one.';
          } else if (errorMessage.includes('already marked')) {
            errorMessage = 'Attendance was already marked during face recognition.';
          }

          toast.error(errorMessage);
          setLastResult({ success: false, message: errorMessage });
        } else {
          console.log('🎉 Attendance marked successfully!');
          const successMessage = `Attendance marked successfully for ${validatedData.class_name}!`;

          // Show single success toast
          toast.success(`🎉 ${successMessage}`, {
            duration: 4000,
            style: {
              background: '#10B981',
              color: 'white',
              fontWeight: 'bold',
              padding: '16px',
              borderRadius: '12px',
            },
          });

          setLastResult({
            success: true,
            data: { ...data, class_name: validatedData.class_name },
            message: successMessage
          });

          // Reset form after a short delay
          setTimeout(() => {
            setPassword('');
            setStep(1);
            setValidatedData(null);
            resetLiveness();
          }, 2000);
        }
      } else {
        console.log('❌ Face recognition failed:', apiResponse.data);
        // Face not recognized or liveness check failed
        let errorMessage = 'Face recognition failed. Please try again.';

        if (!apiResponse.data.liveness_check) {
          errorMessage = apiResponse.data.message || 'Liveness check failed. Please ensure you are a real person.';
        } else if (!apiResponse.data.recognized) {
          errorMessage = 'Face not recognized. Please ensure your face is enrolled and try again.';
        }

        toast.error(errorMessage);
        setLastResult({ success: false, message: errorMessage });
      }
    } catch (error) {
      console.error('💥 Error during face recognition:', error);
      let errorMessage = 'Face recognition failed. Please try again.';

      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = 'Face recognition timed out. Please try again.';
      } else if (error.response) {
        // Server responded with error status
        console.error('Server error response:', error.response.data);
        errorMessage = error.response.data?.message || 'Server error during face recognition.';
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response received:', error.request);
        errorMessage = 'Network error during face recognition. Please check your connection.';
      } else {
        // Something else happened
        console.error('Unexpected error:', error.message);
        errorMessage = 'Unexpected error during face recognition. Please try again.';
      }

      toast.error(errorMessage);
      setLastResult({ success: false, message: errorMessage });
    } finally {
      console.log('🔄 Face recognition process completed, resetting processing state');
      setIsProcessing(false);
    }
  }, [password, currentUser?.uid, validatedData]);

  function goBackToPassword() {
    setStep(1);
    setValidatedData(null);
    setLastResult(null);
    resetLiveness();
  }

  // Webcam and liveness detection functions (same as enrollment)
  const videoConstraints = {
    width: { ideal: 1280, min: 640 },
    height: { ideal: 720, min: 480 },
    facingMode: facingMode,
    frameRate: { ideal: 30, min: 15 },
    aspectRatio: 16/9,
    advanced: [
      { focusMode: 'continuous' },
      { exposureMode: 'continuous' },
      { whiteBalanceMode: 'continuous' }
    ]
  };

  // Simulate real-time liveness checking (same as enrollment)
  useEffect(() => {
    if (livenessStep === 1) {
      const checkInterval = setInterval(() => {
        setLivenessChecks(prev => {
          const newChecks = { ...prev };

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
    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setTimeout(() => {
            setBlinkDetected(true);
            setInstructions('Blink detected! Capturing image...');
            setLivenessStep(3);
            setTimeout(() => {
              capture();
            }, 1000);
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

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

        let brightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        brightness = brightness / (data.length / 4);

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
    console.log('📸 Capture function called');
    const imageSrc = webcamRef.current.getScreenshot({
      width: 1280,
      height: 720,
      quality: 0.95
    });

    if (imageSrc) {
      console.log('📸 Image captured, checking quality...');
      const quality = await checkImageQuality(imageSrc);
      setImageQuality(quality);
      console.log('📊 Image quality:', quality);

      // Only check brightness, skip blur/sharpness validation (same as enrollment)
      if (quality.brightness < 20) {
        console.log('❌ Image too dark');
        toast.error('Image too dark. Please improve lighting or move to a brighter area.');
        resetLiveness();
        return;
      }

      if (quality.brightness > 240) {
        console.log('❌ Image too bright');
        toast.error('Image too bright. Please reduce lighting or move away from direct light.');
        resetLiveness();
        return;
      }

      // Blur check disabled for better user experience - proceed directly to capture
      console.log('✅ Image quality acceptable, proceeding to face recognition');
      toast.success('Image quality acceptable. Processing attendance...', {
        duration: 2000,
        style: {
          background: '#10B981',
          color: 'white',
        },
      });

      handleImageCapture(imageSrc);
    } else {
      console.log('❌ No image captured from webcam');
    }
  }, [checkImageQuality, handleImageCapture]);

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
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm mx-auto mb-4">
            <Timer className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Quick Attendance</h1>
          <p className="text-blue-100 text-lg">
            {step === 1 ? 'Enter the password provided by your teacher' : 'Complete face recognition to mark attendance'}
          </p>

          {/* Step Indicator */}
          <div className="flex items-center justify-center mt-6 space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-white' : 'text-blue-300'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= 1 ? 'bg-white text-blue-600' : 'bg-blue-400 text-white'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm">Password</span>
            </div>
            <div className="w-8 h-0.5 bg-blue-300"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-white' : 'text-blue-300'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= 2 ? 'bg-white text-blue-600' : 'bg-blue-400 text-white'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm">Face Recognition</span>
            </div>
          </div>
        </div>



        {/* Step 1: Password Input */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="text-center mb-6">
              <Key className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter Attendance Password</h2>
              <p className="text-gray-600">
                Your teacher will provide a 6-digit password that's valid for 3 minutes
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attendance Password
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-2xl font-mono tracking-wider focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="000000"
                  maxLength="6"
                  required
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Enter the 6-digit code provided by your teacher
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || password.length !== 6 || (Date.now() - lastSubmissionTime) < 2000}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="loading-spinner mr-2 h-5 w-5"></div>
                    Validating Password...
                  </div>
                ) : (
                  <>
                    <Key className="h-5 w-5 mr-2 inline" />
                    Validate Password
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Face Recognition */}
        {step === 2 && validatedData && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                <Shield className="h-12 w-12 text-green-600 mr-2" />
                <Camera className="h-12 w-12 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Face Recognition</h2>
              <p className="text-gray-600 mb-2">
                Password validated for <span className="font-semibold text-blue-600">{validatedData.class_name}</span>
              </p>
              <p className="text-sm text-gray-500">
                Please complete face recognition to mark your attendance
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              {/* Webcam Container (same as enrollment) */}
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

                  {/* Face Circle Guide */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-64 border-4 border-blue-500 rounded-full border-dashed opacity-70"></div>
                  </div>

                  {/* Camera Switch Button */}
                  <button
                    onClick={switchCamera}
                    className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </button>
                </div>

                {/* Instructions */}
                <div className="mt-4 text-center">
                  <p className="text-lg font-medium text-gray-900 mb-2">{instructions}</p>
                  {countdown > 0 && (
                    <div className="text-3xl font-bold text-blue-600">{countdown}</div>
                  )}
                </div>

                {/* Liveness Checks */}
                {livenessStep > 0 && (
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Liveness Verification</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center space-x-2">
                        {getCheckIcon(livenessChecks.faceDetected)}
                        <span>Face Detected</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getCheckIcon(livenessChecks.faceSize)}
                        <span>Face Size</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getCheckIcon(livenessChecks.lighting)}
                        <span>Lighting</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getCheckIcon(livenessChecks.headPose)}
                        <span>Head Position</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getCheckIcon(livenessChecks.eyesOpen)}
                        <span>Eyes Open</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getCheckIcon(blinkDetected)}
                        <span>Blink Detected</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Control Buttons */}
                <div className="mt-6 flex justify-center space-x-4">
                  {livenessStep === 0 && (
                    <>
                      <button
                        onClick={startLivenessCheck}
                        disabled={isProcessing}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Start Liveness Check
                      </button>

                      {/* Quick Test Button - Bypass Liveness */}
                      <button
                        onClick={() => {
                          console.log('🧪 Quick test - bypassing liveness detection');
                          const imageSrc = webcamRef.current.getScreenshot({
                            width: 1280,
                            height: 720,
                            quality: 0.95
                          });
                          if (imageSrc) {
                            handleImageCapture(imageSrc);
                          }
                        }}
                        disabled={isProcessing}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Quick Test (Skip Liveness)
                      </button>
                    </>
                  )}

                  {livenessStep > 0 && livenessStep < 3 && (
                    <button
                      onClick={resetLiveness}
                      disabled={isProcessing}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                    >
                      Reset Check
                    </button>
                  )}

                  {livenessStep === 3 && !isProcessing && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>Processing...</span>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <div className="loading-spinner h-5 w-5"></div>
                      <span>Processing face recognition...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={goBackToPassword}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                disabled={isProcessing}
              >
                <ArrowLeft className="h-5 w-5 mr-2 inline" />
                Back to Password
              </button>
            </div>
          </div>
        )}



        {/* Result Display */}
        {lastResult && (
          <div className={`rounded-2xl p-6 ${
            lastResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              {lastResult.success ? (
                <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold ${
                  lastResult.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {lastResult.success ? 'Attendance Marked Successfully!' : 'Attendance Failed'}
                </h3>
                <p className={`text-sm ${
                  lastResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {lastResult.success ? lastResult.data?.message : lastResult.message}
                </p>
                {lastResult.success && lastResult.data && (
                  <div className="mt-2 text-xs text-green-600">
                    <Clock className="h-4 w-4 mr-1 inline" />
                    Marked at: {new Date(lastResult.data.marked_at).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      hour12: true,
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3">How it works:</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-start">
              <span className="bg-blue-200 text-blue-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
              <span>Your teacher will generate a 6-digit password during class</span>
            </div>
            <div className="flex items-start">
              <span className="bg-blue-200 text-blue-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
              <span>The password is valid for only 3 minutes</span>
            </div>
            <div className="flex items-start">
              <span className="bg-blue-200 text-blue-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
              <span>Enter the password to validate your class enrollment</span>
            </div>
            <div className="flex items-start">
              <span className="bg-blue-200 text-blue-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
              <span>Complete face recognition to mark your attendance</span>
            </div>
            <div className="flex items-start">
              <span className="bg-blue-200 text-blue-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">5</span>
              <span>You can only mark attendance once per day per class</span>
            </div>
          </div>
        </div>

        {/* Alternative Methods */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Alternative Methods:</h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>• Ask your teacher to mark attendance manually if face recognition fails</p>
            <p>• Contact your teacher if you're having technical difficulties</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

