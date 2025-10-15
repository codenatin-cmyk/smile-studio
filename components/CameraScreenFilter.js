import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CameraScreenFilter() {
  const [facing, setFacing] = useState('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [isDetecting, setIsDetecting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  
  const cameraRef = useRef(null);

  // Detection results
  const [detectedTeeth, setDetectedTeeth] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showBracketModal, setShowBracketModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  
  // Processed image with brackets
  const [processedImage, setProcessedImage] = useState(null);

  const BACKEND_URL = 'https://machine-learning-braces-1.onrender.com'; // ⚠️ CHANGE THIS TO YOUR IP

  // Detect teeth function
  const detectTeeth = async () => {
    if (!cameraRef.current || isDetecting) return;

    setIsDetecting(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });

      setCapturedImage(photo.base64);

    const response = await fetch(`${BACKEND_URL}/detect-teeth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: photo.base64,
        }),
      });

      // Log response for debugging
      const responseText = await response.text();
      console.log('Backend response:', responseText.substring(0, 200));
      
      // Try to parse as JSON
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', responseText.substring(0, 500));
        throw new Error('Backend returned invalid response. Check if server is running.');
      }

     

      if (result.success && result.teeth_count > 0) {
        setDetectedTeeth(result);
        setShowBracketModal(true);
      } else {
        Alert.alert('No Teeth Detected', 'Please smile showing your teeth and try again!');
        setCapturedImage(null);
      }
    } catch (error) {
      console.error('Detection error:', error);
      Alert.alert('Error', 'Failed to detect teeth. Make sure backend is running...');
    } finally {
      setIsDetecting(false);
    }
  };

  // Handle bracket type selection
  const handleBracketTypeSelect = (bracketType) => {
    if (bracketType === 'metal') {
      // Show color selection modal for metal brackets
      setShowBracketModal(false);
      setShowColorModal(true);
    } else if (bracketType === 'ceramic') {
      // Apply ceramic directly (no color options)
      setShowBracketModal(false);
      applyBrackets('ceramic', null);
    }
  };

  // Apply brackets to detected teeth
  const applyBrackets = async (bracketType, bracketColor = null) => {
    if (!detectedTeeth || !capturedImage) return;

    setShowColorModal(false);
    setIsProcessing(true);

    try {
      const requestBody = {
        image: capturedImage,
        bracket_type: bracketType,
        teeth: detectedTeeth.teeth,
      };

      // Add bracket_color only for metal brackets
      if (bracketType === 'metal' && bracketColor) {
        requestBody.bracket_color = bracketColor;
      }

      const response = await fetch(`${BACKEND_URL}/apply-brackets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.success) {
        setProcessedImage(result.processed_image);
        const colorText = bracketColor ? ` (${bracketColor})` : '';
        Alert.alert(
          'Success!', 
          `Applied ${bracketType}${colorText} brackets to ${result.teeth_count} teeth!`
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to apply brackets');
      }
    } catch (error) {
      console.error('Processing error:', error);
      Alert.alert('Error', 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset to camera view
  const resetCamera = () => {
    setProcessedImage(null);
    setCapturedImage(null);
    setDetectedTeeth(null);
  };

  // Save processed image
 const saveImage = async () => {
    if (!processedImage) return;

    try {
      // Check media library permissions first
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant media library access to save images'
        );
        return;
      }

      // Create a proper file URI from base64
      const filename = `braces_${Date.now()}.jpg`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      
      // Write base64 to file
      await FileSystem.writeAsStringAsync(fileUri, processedImage, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.createAlbumAsync('Virtual Braces', asset, false);
      
      Alert.alert('Success! 🎉', 'Image saved to gallery!');
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert(
        'Error',
        `Failed to save image: ${error.message}\n\nTry taking a screenshot instead.`
      );
    }
  };

  // Cancel modals
  const cancelSelection = () => {
    setShowBracketModal(false);
    setShowColorModal(false);
    setCapturedImage(null);
    setDetectedTeeth(null);
  };

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>📸</Text>
          </View>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionMessage}>
            We need access to your camera to detect teeth and apply virtual braces
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!mediaPermission) return <View style={styles.container} />;
  if (!mediaPermission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>💾</Text>
          </View>
          <Text style={styles.permissionTitle}>Media Library Access</Text>
          <Text style={styles.permissionMessage}>
            Allow us to save your virtual braces photos to your gallery
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestMediaPermission}>
            <Text style={styles.permissionButtonText}>Grant Media Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Show processed image or camera */}
      {processedImage ? (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: `data:image/jpeg;base64,${processedImage}` }}
            style={styles.processedImage}
            resizeMode="contain"
          />
          
          <View style={styles.previewControls}>
            <TouchableOpacity style={styles.secondaryButton} onPress={resetCamera}>
              <Text style={styles.secondaryButtonIcon}>📷</Text>
              <Text style={styles.secondaryButtonText}>Retake</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.primaryButton} onPress={saveImage}>
              <Text style={styles.primaryButtonIcon}>💾</Text>
              <Text style={styles.primaryButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.cameraWrapper}>
          <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
          
          {/* Camera Frame Overlay */}
          <View style={styles.cameraOverlay}>
            <View style={styles.frameGuide}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>

          {/* Detection Overlay */}
          {isDetecting && (
            <View style={styles.detectionOverlay}>
              <View style={styles.detectionCard}>
                <View style={styles.loadingRing}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
                <Text style={styles.detectionTitle}>Analyzing Your Smile</Text>
                <Text style={styles.detectionSubtitle}>
                  Detecting teeth position...
                </Text>
              </View>
            </View>
          )}
          
          {/* Instructions Card */}
          {!isDetecting && showInstructions && (
            <View style={styles.instructionsCard}>
              <View style={styles.instructionsHeader}>
                <View style={styles.instructionsTitleWrapper}>
                  <Text style={styles.instructionsIcon}>💡</Text>
                  <Text style={styles.instructionsTitle}>Quick Tips</Text>
                </View>
                <TouchableOpacity 
                  style={styles.closeButtonWrapper}
                  onPress={() => setShowInstructions(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.instructionsList}>
                <View style={styles.instructionItem}>
                  <View style={styles.instructionDot} />
                  <Text style={styles.instructionText}>
                    Ensure good lighting
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <View style={styles.instructionDot} />
                  <Text style={styles.instructionText}>
                    Show your teeth clearly
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <View style={styles.instructionDot} />
                  <Text style={styles.instructionText}>
                    Center your face
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Capture Button */}
          {!isDetecting && (
            <View style={styles.captureContainer}>
              <Text style={styles.captureLabel}>Ready to see your new smile?</Text>
              <TouchableOpacity 
                style={styles.captureButton} 
                onPress={detectTeeth}
                activeOpacity={0.8}
              >
                <View style={styles.captureButtonOuter}>
                  <View style={styles.captureButtonInner}>
                    <Text style={styles.captureButtonIcon}>🦷</Text>
                  </View>
                </View>
              </TouchableOpacity>
              <Text style={styles.captureHint}>Tap to capture</Text>
            </View>
          )}

          {/* Processing Overlay */}
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <View style={styles.processingCard}>
                <View style={styles.processingRing}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
                <Text style={styles.processingTitle}>Applying Braces</Text>
                <Text style={styles.processingSubtitle}>Creating your perfect smile...</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Bracket Type Selection Modal */}
      <Modal
        visible={showBracketModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBracketModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <Text style={styles.modalTitle}>Choose Your Style</Text>
            <View style={styles.detectionBadge}>
              <Text style={styles.detectionBadgeText}>
                ✓ {detectedTeeth?.teeth_count} teeth detected
              </Text>
            </View>

            <View style={styles.bracketOptions}>
              <TouchableOpacity
                style={styles.bracketOption}
                onPress={() => handleBracketTypeSelect('metal')}
                activeOpacity={0.7}
              >
                <View style={styles.bracketIconWrapper}>
                  <Text style={styles.bracketIcon}>🔩</Text>
                </View>
                <Text style={styles.bracketLabel}>Metal Braces</Text>
                <Text style={styles.bracketDescription}>
                  Classic & customizable
                </Text>
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>POPULAR</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bracketOption}
                onPress={() => handleBracketTypeSelect('ceramic')}
                activeOpacity={0.7}
              >
                <View style={styles.bracketIconWrapper}>
                  <Text style={styles.bracketIcon}>◻️</Text>
                </View>
                <Text style={styles.bracketLabel}>Ceramic Braces</Text>
                <Text style={styles.bracketDescription}>
                  Discreet & elegant
                </Text>
                <View style={[styles.popularBadge, styles.subtleBadge]}>
                  <Text style={[styles.popularBadgeText, styles.subtleBadgeText]}>SUBTLE</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={cancelSelection}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Metal Bracket Color Selection Modal */}
      <Modal
        visible={showColorModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowColorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            
            <Text style={styles.modalTitle}>Choose Color</Text>
            <Text style={styles.modalSubtitle}>
              Select your metal bracket color
            </Text>

            <View style={styles.colorGrid}>
              <TouchableOpacity
                style={styles.colorOption}
                onPress={() => applyBrackets('metal', 'green')}
                activeOpacity={0.7}
              >
                <View style={styles.colorCircleWrapper}>
                  <View style={[styles.colorCircle, { backgroundColor: '#4CAF50' }]} />
                </View>
                <Text style={styles.colorLabel}>Green</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.colorOption}
                onPress={() => applyBrackets('metal', 'white')}
                activeOpacity={0.7}
              >
                <View style={styles.colorCircleWrapper}>
                  <View style={[styles.colorCircle, styles.whiteCircle]} />
                </View>
                <Text style={styles.colorLabel}>White</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.colorOption}
                onPress={() => applyBrackets('metal', 'brown')}
                activeOpacity={0.7}
              >
                <View style={styles.colorCircleWrapper}>
                  <View style={[styles.colorCircle, { backgroundColor: '#8B4513' }]} />
                </View>
                <Text style={styles.colorLabel}>Brown</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => {
                setShowColorModal(false);
                setShowBracketModal(true);
              }}
            >
              <Text style={styles.modalBackButtonText}>← Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000',
  },
  
  // Permission screens
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0A0E27',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 40,
    alignItems: 'center',
    maxWidth: 380,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconText: {
    fontSize: 48,
  },
  permissionTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 16,
    width: '100%',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // Camera view
  cameraWrapper: {
    flex: 1,
    position: 'relative',
  },
  camera: { 
    flex: 1,
    width: '100%',
  },
  
  // Camera Frame Overlay
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  frameGuide: {
    width: '80%',
    aspectRatio: 1,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  
  // Instructions card
  instructionsCard: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  instructionsTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructionsIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButtonWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#60A5FA',
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    color: '#E5E7EB',
    lineHeight: 22,
  },
  
  // Capture button
  captureContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  captureButton: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonIcon: {
    fontSize: 32,
  },
  captureHint: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  // Detection overlay
  detectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detectionCard: {
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  loadingRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(79, 70, 229, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  detectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  detectionSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Processing overlay
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  processingCard: {
    alignItems: 'center',
    maxWidth: 320,
    width: '90%',
  },
  processingRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  processingSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  
  // Preview processed image
  previewContainer: {
    flex: 1,
    backgroundColor: '#0A0E27',
    width: '100%',
  },
  processedImage: {
    flex: 1,
    width: '100%',
    backgroundColor: '#1A1A2E',
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    backgroundColor: '#FFFFFF',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  secondaryButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#D1D5DB',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#1A1A2E',
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 32,
  },
  detectionBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 32,
  },
  detectionBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  
  // Bracket options
  bracketOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  bracketOption: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  bracketIconWrapper: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bracketIcon: {
    fontSize: 40,
  },
  bracketLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 8,
    textAlign: 'center',
  },
  bracketDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  popularBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4F46E5',
    letterSpacing: 0.5,
  },
  subtleBadge: {
    backgroundColor: '#F3F4F6',
  },
  subtleBadgeText: {
    color: '#6B7280',
  },
  
  // Color selection
  colorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  colorOption: {
    alignItems: 'center',
  },
  colorCircleWrapper: {
    padding: 4,
    backgroundColor: '#F9FAFB',
    borderRadius: 50,
    marginBottom: 12,
  },
  colorCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  whiteCircle: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#E5E7EB',
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  
  // Modal buttons
  modalCancelButton: {
    padding: 18,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    marginTop: 8,
  },
  modalCancelButtonText: {
    color: '#6B7280',
    fontSize: 17,
    fontWeight: '600',
  },
  modalBackButton: {
    padding: 18,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    marginTop: 8,
  },
  modalBackButtonText: {
    color: '#4F46E5',
    fontSize: 17,
    fontWeight: '600',
  },
});