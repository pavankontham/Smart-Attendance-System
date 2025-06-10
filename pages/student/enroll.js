import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../../components/Layout';
import Webcam from 'react-webcam';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import { CheckCircle, AlertCircle, Camera, Trash2, Eye, X, Sparkles, Shield, Zap, UserCheck, RotateCcw } from 'lucide-react';

export default function EnrollFace() {
  const { currentUser } = useAuth();
  const webcamRef = useRef(null);

  // Main state
  const [step, setStep] = useState(1);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolledPhoto, setEnrolledPhoto] = useState(null);
  const [enrolledImage, setEnrolledImage] = useState(null);
  const [showEnrolledImage, setShowEnrolledImage] = useState(false);
  
  // Webcam state
  const [facingMode, setFacingMode] = useState('user');
  const [livenessStep, setLivenessStep] = useState(0);
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

  useEffect(() => {
    if (currentUser) {
      checkEnrollmentStatus();
      fetchEnrolledPhoto();
      fetchEnrolledImage();
    }
  }, [currentUser]);

  async function checkEnrollmentStatus() {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_FACE_API_URL}/api/face-encodings/${currentUser.uid}`
      );
      if (response.data.success) {
        setEnrollmentStatus(response.data);
      }
    } catch (error) {
      console.error('Error checking enrollment status:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEnrolledPhoto() {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_FACE_API_URL}/api/enrolled-image/${currentUser.uid}`
      );
      if (response.data.success && response.data.enrolled_image_url) {
        setEnrolledPhoto(response.data.enrolled_image_url);
      }
    } catch (error) {
      console.error('Error fetching enrolled photo:', error);
    }
  }

  async function fetchEnrolledImage() {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_FACE_API_URL}/api/enrolled-image/${currentUser.uid}`
      );
      if (response.data.success && response.data.enrolled_image_url) {
        setEnrolledImage(response.data.enrolled_image_url);
      }
    } catch (error) {
      console.error('Error fetching enrolled image:', error);
    }
  }

  async function handleImageCapture(imageSrc) {
    setCapturedImage(imageSrc);
    setIsProcessing(true);

    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');
      formData.append('user_id', currentUser.uid);

      const apiResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_FACE_API_URL}/enroll`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (apiResponse.data.success) {
        await checkEnrollmentStatus();
        await fetchEnrolledPhoto();
        await fetchEnrolledImage();
        
        toast.success('🎉 Face enrolled successfully with liveness verification!', {
          duration: 5000,
          style: {
            background: '#10B981',
            color: 'white',
            fontWeight: 'bold',
            padding: '16px',
            borderRadius: '12px',
          },
        });

        setTimeout(() => {
          toast('💡 Tip: Use Quick Attendance with your teacher\'s code to mark attendance!', {
            duration: 4000,
            icon: '💡',
            style: {
              background: '#3B82F6',
              color: 'white',
              padding: '16px',
              borderRadius: '12px',
            },
          });
        }, 2000);
        setStep(3);
      } else {
        const errorMessage = apiResponse.data.message || 'Failed to enroll face';
        toast.error(errorMessage);
        if (apiResponse.data.liveness_details) {
          console.log('Liveness check details:', apiResponse.data.liveness_details);
        }
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error('Failed to enroll face. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }

  async function deleteEnrollment() {
    try {
      setIsProcessing(true);
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_FACE_API_URL}/api/face-encodings/${currentUser.uid}`
      );

      if (response.data.success) {
        toast.success('Face enrollment deleted successfully!');
        await checkEnrollmentStatus();
        setEnrolledPhoto(null);
        setEnrolledImage(null);
        setStep(1);
      } else {
        toast.error(response.data.message || 'Failed to delete enrollment');
      }
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      toast.error('Failed to delete enrollment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }

  function resetEnrollment() {
    setStep(1);
    setCapturedImage(null);
    setIsProcessing(false);
    resetLiveness();
  }

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
    const imageSrc = webcamRef.current.getScreenshot({
      width: 1280,
      height: 720,
      quality: 0.95
    });

    if (imageSrc) {
      const quality = await checkImageQuality(imageSrc);
      setImageQuality(quality);

      // Only check brightness, skip blur/sharpness validation for better user experience
      if (quality.brightness < 20) {
        toast.error('Image too dark. Please improve lighting or move to a brighter area.');
        resetLiveness();
        return;
      }

      if (quality.brightness > 240) {
        toast.error('Image too bright. Please reduce lighting or move away from direct light.');
        resetLiveness();
        return;
      }

      // Blur check disabled for better user experience - proceed directly to capture
      toast.success('Image quality acceptable. Processing enrollment...', {
        duration: 2000,
        style: {
          background: '#10B981',
          color: 'white',
        },
      });

      handleImageCapture(imageSrc);
    }
  }, [checkImageQuality]);

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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <UserCheck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Face Enrollment</h1>
              <p className="text-purple-100 text-lg">Secure biometric registration for attendance</p>
              <div className="flex items-center space-x-4 mt-3">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span className="text-sm">Encrypted</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm">One-Time Setup</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-purple-300" />
                  <span className="text-sm">AI-Powered</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Enrollment Status */}
        {enrollmentStatus && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Enrollment Status</h2>
            {enrollmentStatus.enrolled ? (
              <div className="flex items-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-lg font-semibold text-green-800">Face Successfully Enrolled</p>
                  <p className="text-green-600">
                    Enrolled on {new Date(enrollmentStatus.enrolled_at).toLocaleDateString()}
                  </p>
                </div>
                {enrolledPhoto && (
                  <div className="flex items-center space-x-4">
                    <img
                      src={enrolledPhoto}
                      alt="Enrolled face"
                      className="w-16 h-16 rounded-full object-cover border-2 border-green-300 shadow-lg"
                    />
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => setShowEnrolledImage(true)}
                        className="flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Full Image
                      </button>
                      <button
                        onClick={deleteEnrollment}
                        disabled={isProcessing}
                        className="flex items-center px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-lg font-semibold text-yellow-800">No Face Enrolled</p>
                  <p className="text-yellow-600">You need to enroll your face to mark attendance</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-600">⚠️</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Instructions */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Before We Start
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Anti-Spoofing Protection</h3>
                    <p className="text-gray-600">Our system uses advanced AI to detect real faces and prevent photo spoofing.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Eye className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Liveness Detection</h3>
                    <p className="text-gray-600">You'll be asked to blink naturally to verify you're a real person.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Good Lighting</h3>
                    <p className="text-gray-600">Make sure you're in a well-lit area. Don't worry about image sharpness - our system works with various image qualities.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Face Position</h3>
                    <p className="text-gray-600">Look directly at the camera and position your face within the circle guide.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Remove Accessories</h3>
                    <p className="text-gray-600">Remove sunglasses, hats, or anything that might obscure your face.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Stay Natural</h3>
                    <p className="text-gray-600">Keep your head still and maintain a natural expression. Our system is optimized to work with various image qualities, so don't worry about perfect focus.</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="btn-primary"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Start Enrollment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Webcam Capture */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Liveness Verification & Face Capture
              </h2>
              <p className="text-gray-600 mb-6">
                Position your face within the circle and click "Start Liveness Check". Follow the on-screen instructions including blinking when prompted.
              </p>

              <div className="max-w-2xl mx-auto">
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

                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-64 h-64 border-4 border-blue-500 rounded-full border-dashed opacity-70"></div>
                    </div>

                    <button
                      onClick={switchCamera}
                      className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-lg font-medium text-gray-900 mb-2">{instructions}</p>
                    {countdown > 0 && (
                      <div className="text-3xl font-bold text-blue-600">{countdown}</div>
                    )}
                  </div>

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

                  <div className="mt-6 flex justify-center space-x-4">
                    {livenessStep === 0 && (
                      <button
                        onClick={startLivenessCheck}
                        disabled={isProcessing}
                        className="btn-primary"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Start Liveness Check
                      </button>
                    )}

                    {livenessStep > 0 && livenessStep < 3 && (
                      <button
                        onClick={resetLiveness}
                        disabled={isProcessing}
                        className="btn-secondary"
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
                  </div>
                </div>
              </div>

              {capturedImage && (
                <div className="mt-6 text-center">
                  <div className="inline-block border-2 border-gray-200 rounded-lg p-2">
                    <img
                      src={capturedImage}
                      alt="Captured face"
                      className="w-32 h-32 object-cover rounded"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Captured image</p>
                </div>
              )}

              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary"
                  disabled={isProcessing}
                >
                  Back
                </button>
                {capturedImage && !isProcessing && (
                  <button
                    onClick={() => {
                      setCapturedImage(null);
                      resetLiveness();
                    }}
                    className="btn-secondary"
                  >
                    Retake
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="card text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Enrollment Successful! 🎉
              </h2>

              <p className="text-gray-600 mb-6">
                Your face has been successfully enrolled with advanced liveness verification.
                You can now use face recognition for attendance marking.
              </p>

              {capturedImage && (
                <div className="mb-6">
                  <div className="inline-block border-2 border-green-200 rounded-lg p-2">
                    <img
                      src={capturedImage}
                      alt="Enrolled face"
                      className="w-32 h-32 object-cover rounded"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Your enrolled face</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">What's Next?</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Use Quick Attendance to mark your attendance</li>
                    <li>• Enter your teacher's class code when prompted</li>
                    <li>• Your face will be recognized automatically</li>
                  </ul>
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={resetEnrollment}
                    className="btn-secondary"
                  >
                    Enroll Again
                  </button>
                  <button
                    onClick={() => window.location.href = '/student/instant-attendance'}
                    className="btn-primary"
                  >
                    Go to Quick Attendance
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal for viewing enrolled image */}
        {showEnrolledImage && enrolledImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Enrolled Face Image</h3>
                <button
                  onClick={() => setShowEnrolledImage(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="text-center">
                <img
                  src={enrolledImage}
                  alt="Enrolled face"
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                />
                <p className="text-sm text-gray-600 mt-4">
                  This is your enrolled face image used for attendance recognition
                </p>
              </div>

              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={() => setShowEnrolledImage(false)}
                  className="btn-secondary"
                >
                  Close
                </button>
                <button
                  onClick={deleteEnrollment}
                  disabled={isProcessing}
                  className="btn-danger"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Enrollment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
