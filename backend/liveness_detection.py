import cv2
import numpy as np
import mediapipe as mp
from typing import Tuple, List, Dict, Optional
import math

class LivenessDetector:
    """Advanced liveness detection using MediaPipe Face Mesh and blink detection"""
    
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.mp_drawing = mp.solutions.drawing_utils
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Eye landmark indices for MediaPipe Face Mesh
        self.LEFT_EYE_LANDMARKS = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
        self.RIGHT_EYE_LANDMARKS = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
        
        # Specific landmarks for EAR calculation
        self.LEFT_EYE_EAR_LANDMARKS = [33, 160, 158, 133, 153, 144]  # [outer, top, bottom, inner, top, bottom]
        self.RIGHT_EYE_EAR_LANDMARKS = [362, 385, 387, 263, 373, 380]  # [outer, top, bottom, inner, top, bottom]
        
        # Thresholds
        self.EAR_THRESHOLD = 0.25  # Eye aspect ratio threshold for blink detection
        self.BLINK_FRAMES_THRESHOLD = 2  # Minimum frames for a valid blink
        self.MIN_FACE_SIZE = 100  # Minimum face size in pixels
        self.MAX_HEAD_ROTATION = 30  # Maximum head rotation in degrees
        
    def calculate_ear(self, eye_landmarks: List[Tuple[float, float]]) -> float:
        """Calculate Eye Aspect Ratio (EAR) for blink detection"""
        if len(eye_landmarks) < 6:
            return 0.0
            
        # Vertical eye landmarks
        A = self._euclidean_distance(eye_landmarks[1], eye_landmarks[5])  # Top to bottom
        B = self._euclidean_distance(eye_landmarks[2], eye_landmarks[4])  # Top to bottom
        
        # Horizontal eye landmark
        C = self._euclidean_distance(eye_landmarks[0], eye_landmarks[3])  # Left to right
        
        # Calculate EAR
        if C == 0:
            return 0.0
        ear = (A + B) / (2.0 * C)
        return ear
    
    def _euclidean_distance(self, point1: Tuple[float, float], point2: Tuple[float, float]) -> float:
        """Calculate Euclidean distance between two points"""
        return math.sqrt((point1[0] - point2[0])**2 + (point1[1] - point2[1])**2)
    
    def extract_eye_landmarks(self, landmarks, eye_indices: List[int], image_shape: Tuple[int, int]) -> List[Tuple[float, float]]:
        """Extract eye landmarks from MediaPipe face landmarks"""
        height, width = image_shape[:2]
        eye_points = []
        
        for idx in eye_indices:
            if idx < len(landmarks.landmark):
                landmark = landmarks.landmark[idx]
                x = int(landmark.x * width)
                y = int(landmark.y * height)
                eye_points.append((x, y))
        
        return eye_points
    
    def detect_face_pose(self, landmarks, image_shape: Tuple[int, int]) -> Dict[str, float]:
        """Detect head pose angles"""
        height, width = image_shape[:2]
        
        # Key facial landmarks for pose estimation
        nose_tip = landmarks.landmark[1]  # Nose tip
        chin = landmarks.landmark[18]     # Chin
        left_eye_corner = landmarks.landmark[33]   # Left eye outer corner
        right_eye_corner = landmarks.landmark[362] # Right eye outer corner
        
        # Convert to pixel coordinates
        nose_tip_2d = (int(nose_tip.x * width), int(nose_tip.y * height))
        chin_2d = (int(chin.x * width), int(chin.y * height))
        left_eye_2d = (int(left_eye_corner.x * width), int(left_eye_corner.y * height))
        right_eye_2d = (int(right_eye_corner.x * width), int(right_eye_corner.y * height))
        
        # Calculate angles
        # Yaw (left-right rotation)
        eye_center_x = (left_eye_2d[0] + right_eye_2d[0]) / 2
        face_center_x = width / 2
        yaw_angle = math.degrees(math.atan2(eye_center_x - face_center_x, width / 2))
        
        # Pitch (up-down rotation)
        nose_chin_distance = self._euclidean_distance(nose_tip_2d, chin_2d)
        expected_distance = height * 0.15  # Expected nose-chin distance
        pitch_angle = math.degrees(math.atan2(nose_chin_distance - expected_distance, expected_distance))
        
        # Roll (tilt rotation)
        eye_angle = math.degrees(math.atan2(right_eye_2d[1] - left_eye_2d[1], right_eye_2d[0] - left_eye_2d[0]))
        
        return {
            'yaw': abs(yaw_angle),
            'pitch': abs(pitch_angle),
            'roll': abs(eye_angle)
        }
    
    def analyze_image_quality(self, image: np.ndarray) -> Dict[str, float]:
        """Analyze image quality metrics"""
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY) if len(image.shape) == 3 else image
        
        # Blur detection using Laplacian variance
        blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # Brightness analysis
        brightness = np.mean(gray)
        
        # Contrast analysis
        contrast = np.std(gray)
        
        return {
            'blur_score': blur_score,
            'brightness': brightness,
            'contrast': contrast
        }
    
    def comprehensive_liveness_check(self, image: np.ndarray) -> Dict[str, any]:
        """
        Comprehensive liveness detection combining multiple techniques
        Returns detailed analysis results
        """
        results = {
            'is_live': False,
            'confidence': 0.0,
            'checks': {
                'face_detected': False,
                'face_size_ok': False,
                'image_quality_ok': False,
                'head_pose_ok': False,
                'eyes_detected': False,
                'ear_values': {'left': 0.0, 'right': 0.0}
            },
            'message': 'Liveness check failed'
        }
        
        try:
            # Convert BGR to RGB if needed
            if len(image.shape) == 3 and image.shape[2] == 3:
                rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            else:
                rgb_image = image
            
            # Detect face landmarks
            face_results = self.face_mesh.process(rgb_image)
            
            if not face_results.multi_face_landmarks:
                results['message'] = 'No face detected'
                return results
            
            results['checks']['face_detected'] = True
            landmarks = face_results.multi_face_landmarks[0]
            
            # Check face size
            height, width = image.shape[:2]
            face_bbox = self._get_face_bbox(landmarks, (height, width))
            face_size = min(face_bbox[2] - face_bbox[0], face_bbox[3] - face_bbox[1])
            
            if face_size < self.MIN_FACE_SIZE:
                results['message'] = 'Face too small. Please move closer to the camera'
                return results
            
            results['checks']['face_size_ok'] = True
            
            # Analyze image quality
            quality_metrics = self.analyze_image_quality(image)
            
            if quality_metrics['blur_score'] < 20:  # Very lenient blur threshold
                results['message'] = 'Image too blurry. Please ensure good lighting and steady camera'
                return results
            
            if quality_metrics['brightness'] < 50 or quality_metrics['brightness'] > 200:
                results['message'] = 'Poor lighting conditions. Please adjust lighting'
                return results
            
            if quality_metrics['contrast'] < 20:
                results['message'] = 'Low image contrast. Please improve lighting'
                return results
            
            results['checks']['image_quality_ok'] = True
            
            # Check head pose
            pose_angles = self.detect_face_pose(landmarks, image.shape)
            
            if (pose_angles['yaw'] > self.MAX_HEAD_ROTATION or 
                pose_angles['pitch'] > self.MAX_HEAD_ROTATION or 
                pose_angles['roll'] > self.MAX_HEAD_ROTATION):
                results['message'] = 'Please face the camera directly'
                return results
            
            results['checks']['head_pose_ok'] = True
            
            # Extract eye landmarks and calculate EAR
            left_eye_points = self.extract_eye_landmarks(landmarks, self.LEFT_EYE_EAR_LANDMARKS, image.shape)
            right_eye_points = self.extract_eye_landmarks(landmarks, self.RIGHT_EYE_EAR_LANDMARKS, image.shape)
            
            if len(left_eye_points) < 6 or len(right_eye_points) < 6:
                results['message'] = 'Eyes not clearly detected'
                return results
            
            results['checks']['eyes_detected'] = True
            
            # Calculate EAR for both eyes
            left_ear = self.calculate_ear(left_eye_points)
            right_ear = self.calculate_ear(right_eye_points)
            avg_ear = (left_ear + right_ear) / 2.0
            
            results['checks']['ear_values'] = {'left': left_ear, 'right': right_ear, 'average': avg_ear}
            
            # Final liveness assessment
            confidence_score = 0.0
            
            # Base confidence from successful checks
            confidence_score += 0.3  # Face detected and sized properly
            confidence_score += 0.2  # Image quality good
            confidence_score += 0.2  # Head pose acceptable
            confidence_score += 0.1  # Eyes detected
            
            # EAR-based confidence (eyes should be reasonably open for enrollment)
            if 0.2 <= avg_ear <= 0.4:  # Normal open eyes range
                confidence_score += 0.2
                results['is_live'] = True
                results['message'] = 'Liveness check passed'
            else:
                results['message'] = 'Please keep your eyes naturally open and look at the camera'
            
            results['confidence'] = min(confidence_score, 1.0)
            
        except Exception as e:
            results['message'] = f'Liveness detection error: {str(e)}'
        
        return results
    
    def _get_face_bbox(self, landmarks, image_shape: Tuple[int, int]) -> Tuple[int, int, int, int]:
        """Get bounding box of the face"""
        height, width = image_shape[:2]
        
        x_coords = [landmark.x * width for landmark in landmarks.landmark]
        y_coords = [landmark.y * height for landmark in landmarks.landmark]
        
        x_min, x_max = int(min(x_coords)), int(max(x_coords))
        y_min, y_max = int(min(y_coords)), int(max(y_coords))
        
        return (x_min, y_min, x_max, y_max)
