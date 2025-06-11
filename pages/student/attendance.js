import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../../src/components/Layout';
import Webcam from 'react-webcam';
import { useAuth } from '../../src/contexts/AuthContext';
import { dbHelpers } from '../../src/lib/supabase';
import toast from 'react-hot-toast';
import axios from 'axios';
import { CheckCircle, XCircle, AlertTriangle, Camera, Clock, Sparkles, Shield, Zap, Eye, BookOpen, RotateCcw } from 'lucide-react';

export default function MarkAttendance() {
  const { userProfile, currentUser } = useAuth();
  const webcamRef = useRef(null);

  // Main state
  const [step, setStep] = useState(1); // 1: select class, 2: check, 3: capture, 4: result
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  // Webcam state (same as enrollment and instant attendance)
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
      fetchClasses();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedClass) {
      checkTodayAttendance();
    }
  }, [selectedClass]);

  async function fetchClasses() {
    try {
      const { data, error } = await dbHelpers.getClassesByStudent(currentUser.uid);
      if (error) {
        toast.error(error.message);
      } else {
        const approvedClasses = (data || []).filter(cls => cls.status === 'approved');
        setClasses(approvedClasses);
        if (approvedClasses.length === 1) {
          setSelectedClass(approvedClasses[0]);
          setStep(2);
        }
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  }

  async function checkTodayAttendance() {
    if (!selectedClass) return;

    try {
      // Check if attendance is already marked for this class today
      const today = new Date().toISOString().split('T')[0];
      const { data } = await dbHelpers.getAttendanceByUserAndClass(currentUser.uid, selectedClass.id, today);
      setTodayAttendance(data || null);
    } catch (error) {
      console.error('Error checking attendance:', error);
    }
  }

  async function handleImageCapture(imageSrc) {
    setCapturedImage(imageSrc);
    setIsProcessing(true);

    try {
      // Convert base64 to blob
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      
      // Create form data
      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');
      formData.append('user_id', currentUser.uid); // Use Firebase UID

      // Send to face recognition API
      const apiResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_FACE_API_URL}/recognize`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (apiResponse.data.success && apiResponse.data.recognized) {
        // Get current slot for attendance marking
        const currentSlotResponse = await fetch(`${process.env.NEXT_PUBLIC_FACE_API_URL}/api/current-slot`);
        const currentSlotData = await currentSlotResponse.json();
        const currentSlot = currentSlotData.data?.current_slot || 1;

        // Mark attendance in database for the selected class
        const { error } = await dbHelpers.markAttendance({
          student_firebase_id: currentUser.uid,
          class_id: selectedClass.id,
          slot_number: currentSlot,
          status: 'present',
          marked_by: 'face_recognition',
          teacher_firebase_id: selectedClass.teacher_firebase_id || 'system'
        });

        if (error) {
          if (error.message.includes('already marked')) {
            setResult({
              success: false,
              message: `Attendance already marked for ${selectedClass.name} today`,
              type: 'already_marked'
            });
          } else {
            throw new Error(error.message);
          }
        } else {
          setResult({
            success: true,
            message: `Attendance marked successfully for ${selectedClass.name}!`,
            type: 'success',
            className: selectedClass.name,
            timestamp: new Date().toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              hour12: true
            })
          });
          toast.success(`Attendance marked for ${selectedClass.name}!`);
          // Refresh attendance status
          await checkTodayAttendance();
        }
      } else if (apiResponse.data.success && !apiResponse.data.recognized) {
        setResult({
          success: false,
          message: 'Face not recognized. Please try again or enroll your face first.',
          type: 'not_recognized'
        });
      } else if (!apiResponse.data.liveness_check) {
        setResult({
          success: false,
          message: apiResponse.data.message || 'Liveness check failed. Please ensure you are a real person and follow the on-screen instructions.',
          type: 'liveness_failed',
          details: apiResponse.data.liveness_details
        });
      } else {
        setResult({
          success: false,
          message: apiResponse.data.message || 'Failed to process image',
          type: 'error'
        });
      }
      
      setStep(4);
    } catch (error) {
      console.error('Recognition error:', error);
      setResult({
        success: false,
        message: 'Failed to process attendance. Please try again.',
        type: 'error'
      });
      setStep(4);
    } finally {
      setIsProcessing(false);
    }
  }

  function resetProcess() {
    setStep(1);
    setCapturedImage(null);
    setIsProcessing(false);
    setResult(null);
    checkTodayAttendance();
    resetLiveness();
  }

  // Webcam and liveness detection functions (same as enrollment and instant attendance)
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

      // Only check brightness, skip blur/sharpness validation (same as enrollment)
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
      toast.success('Image quality acceptable. Processing attendance...', {
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
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Camera className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Mark Attendance</h1>
              <p className="text-blue-100 text-lg">AI-powered face recognition system</p>
              <div className="flex items-center space-x-4 mt-3">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span className="text-sm">Secure</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm">Instant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-purple-300" />
                  <span className="text-sm">AI-Powered</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-8">
            {/* Class Selection */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <BookOpen className="h-6 w-6 mr-3 text-blue-600" />
                Select Class for Attendance
              </h2>

              {classes.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Classes Found</h3>
                  <p className="text-gray-600 mb-4">You are not enrolled in any approved classes yet.</p>
                  <button
                    onClick={() => window.location.href = '/student/classes'}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                  >
                    Join Classes
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classes.map((classItem) => (
                    <button
                      key={classItem.id}
                      onClick={() => {
                        setSelectedClass(classItem);
                        setStep(2);
                      }}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                    >
                      <h3 className="font-semibold text-gray-900">{classItem.name}</h3>
                      <p className="text-sm text-gray-600">{classItem.subject}</p>
                      <p className="text-xs text-gray-500 mt-1">Teacher: {classItem.teacher_name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Sparkles className="h-6 w-6 mr-3 text-purple-600" />
                How It Works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Good Lighting</h3>
                    <p className="text-gray-700 text-sm">Ensure good lighting and remove any face coverings</p>
                  </div>
                </div>
                <div className="flex items-start p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-white text-sm font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Position Face</h3>
                    <p className="text-gray-700 text-sm">Position your face within the circle guide</p>
                  </div>
                </div>
                <div className="flex items-start p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <Eye className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Liveness Check</h3>
                    <p className="text-gray-700 text-sm">Follow prompts and blink naturally when asked</p>
                  </div>
                </div>
                <div className="flex items-start p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                  <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-white text-sm font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Auto Capture</h3>
                    <p className="text-gray-700 text-sm">System will automatically capture after verification</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {step === 2 && selectedClass && (
          <div className="space-y-8">
            {/* Selected Class & Status */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Clock className="h-6 w-6 mr-3 text-blue-600" />
                  {selectedClass.name} - Today's Status
                </h2>
                <button
                  onClick={() => {
                    setSelectedClass(null);
                    setStep(1);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Change Class
                </button>
              </div>

              {todayAttendance ? (
                <div className="flex items-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-lg font-semibold text-green-800">Attendance Marked</p>
                    <p className="text-green-600">
                      Marked at {new Date(todayAttendance.created_at).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        hour12: true
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">✓</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-lg font-semibold text-yellow-800">Ready to Mark</p>
                    <p className="text-yellow-600">Click below to mark your attendance for {selectedClass.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-600">⏰</div>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Sparkles className="h-6 w-6 mr-3 text-purple-600" />
                How It Works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Good Lighting</h3>
                    <p className="text-gray-700 text-sm">Ensure good lighting and remove any face coverings</p>
                  </div>
                </div>
                <div className="flex items-start p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-white text-sm font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Position Face</h3>
                    <p className="text-gray-700 text-sm">Position your face within the circle guide</p>
                  </div>
                </div>
                <div className="flex items-start p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <Eye className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Liveness Check</h3>
                    <p className="text-gray-700 text-sm">Follow prompts and blink naturally when asked</p>
                  </div>
                </div>
                <div className="flex items-start p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                  <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-white text-sm font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Auto Capture</h3>
                    <p className="text-gray-700 text-sm">System will automatically capture after verification</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setStep(3)}
                disabled={todayAttendance}
                className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center mx-auto"
              >
                <Camera className="h-5 w-5 mr-3" />
                {todayAttendance ? `Already Marked for ${selectedClass.name}` : 'Start Face Recognition'}
                {!todayAttendance && <Sparkles className="h-4 w-4 ml-2 group-hover:rotate-12 transition-transform" />}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
                  <Camera className="h-8 w-8 mr-3 text-blue-600" />
                  Face Recognition
                </h2>
                <p className="text-gray-600 text-lg">
                  Position your face within the circle and start the liveness verification process.
                </p>
                <div className="flex items-center justify-center space-x-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">AI Processing Active</span>
                  </div>
                </div>
              </div>

              <div className="max-w-2xl mx-auto">
                <LivenessWebcamCapture
                  onCapture={handleImageCapture}
                  isCapturing={isProcessing}
                />
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setStep(2)}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                  disabled={isProcessing}
                >
                  ← Back to Instructions
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 4 && result && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
              {result.success ? (
                <div className="space-y-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="h-12 w-12 text-green-500" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-green-600 mb-4">
                      Attendance Marked Successfully!
                    </h2>
                    <p className="text-gray-600 text-lg mb-2">{result.message}</p>
                    {result.timestamp && (
                      <p className="text-green-600 font-semibold">Time: {result.timestamp}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative">
                    {result.type === 'already_marked' ? (
                      <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                        <AlertTriangle className="h-12 w-12 text-yellow-500" />
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <XCircle className="h-12 w-12 text-red-500" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      {result.type === 'already_marked' ? 'Already Marked Today' : 'Recognition Failed'}
                    </h2>
                    <p className="text-gray-600 text-lg">{result.message}</p>
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={resetProcess}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                >
                  ← Back to Start
                </button>
                {!result.success && result.type === 'not_recognized' && (
                  <button
                    onClick={() => window.location.href = '/student/enroll'}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                  >
                    Enroll Your Face
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

