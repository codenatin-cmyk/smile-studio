/* eslint-disable react-native/no-inline-styles */
import BanubaSdkManager, { EffectPlayerView } from '@banuba/react-native';
import React, { Component } from 'react';
import { Alert, NativeEventEmitter, PermissionsAndroid, Platform, View } from 'react-native';
import * as RNFS from 'react-native-fs';

export default class App extends Component {
  ep: any;
  eventEmitter: NativeEventEmitter;
  recording = false;
  state = {
    recodButtonTitle: 'Tap to record',
    cameraReady: false,
  };

  constructor(props: {} | Readonly<{}>) {
    super(props);
    
    this.ep = React.createRef<typeof EffectPlayerView>();

    // Initialize Banuba SDK (returns void, not a Promise)
    try {
      BanubaSdkManager.initialize([], 'Qk5CIBnRhN6L0rxvmT1A6Ql5g/jP8M0TPrgGMdWP4Dl79/6bfyZ9BbjzFuMVF+SayE9Gu+wQjnJtAi1qIqrbTGi5nSiUYKCBqGEPBj0npTDFsjJ/nkcDE4FiErWd96cgsYAlDnFPE0F9r4md98z9+p1SX+vfbYN+50C3GeSsAOJnHel400nczbccS7cHajrpgHhjqoV7utklhhSlbrRup0hyZlHU+I+nAd34lLZNyiMaSk7SHah0OiglRKrJTc/rx8kr/BdeqNEO1DP/au2spfeSBqVYPOObQINAn2DVuur0xWGr4doSl40MeQN4KVtfr7lzAR8YQmQEC2NJ0J7pVvdf8pZvA9CzHLPt1K9ig5BghojgVrz6bpcqLyHl6X5bDAiMjmeQN+ObF+vJtRf0my777Ll6HVXdHWhNSBrOJLAwEBOQDlTGH5u1Hw3IFT1gwhG56RlVp6ZouZJ73lC5K3jC3+aFP8spXds6SKYjAosp2r34Nq3l8918+zOy0RvLFZk1FPEjtQW24veoPFyyVBxtMCo8gLqXmnACawqyPHsdTUyfNvkVRFgnFCQSLWginx0bNvPubegu1Fcn/y3xuf83kwVnCeZgXCeIQYENwq9wfnEvlNErvhu6tMhBPHE6tdJ2DFlmMGBETB7717DQPGcW');
      console.log('Banuba SDK initialized successfully');
    } catch (error: unknown) {
      console.error('Banuba initialization failed:', error);
    }

    this.eventEmitter = new NativeEventEmitter(BanubaSdkManager);
    this.eventEmitter.addListener('onVideoRecordingStatus', (started) => {
      console.log('onVideoRecordingStatus', started);
    });
    this.eventEmitter.addListener('onVideoRecordingFinished', (success) => {
      console.log('onVideoRecordingFinished', success);
    });
    this.eventEmitter.addListener('onScreenshotReady', (success) => {
      console.log('onScreenshotReady', success);
    });
  }

  render(): React.ReactNode {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <EffectPlayerView 
          style={{ flex: 1, width: '100%', height: '100%' }} 
          ref={this.ep} 
        />
        <View
          style={{
            position: 'absolute',
            bottom: 32,
            left: 0,
            right: 0,
            paddingHorizontal: 16,
          }}
        >
          {/* <Button
            onPress={this.onPressVideoRecording}
            title={this.state.recodButtonTitle}
          /> */}
        </View>
      </View>
    );
  }

  async componentDidMount(): Promise<void> {
    try {
      // Request permissions for Android
      if (Platform.OS === 'android') {
        const hasPermissions = await this.requestPermissions();
        if (!hasPermissions) {
          Alert.alert('Permissions Required', 'Camera and microphone permissions are required');
          return;
        }
      }

      // Initialize camera with proper sequencing
      this.initializeCamera();
    } catch (error: unknown) {
      console.error('Error in componentDidMount:', error);
    }
  }

  initializeCamera = () => {
    // Use multiple timeouts to ensure proper initialization order
    setTimeout(() => {
      try {
        console.log('Step 1: Attaching view...');
        const viewTag = this.ep.current?._nativeTag;
        console.log('View tag:', viewTag);
        
        if (viewTag) {
          BanubaSdkManager.attachView(viewTag);
          console.log('View attached successfully');
          
          // Start player first
          setTimeout(() => {
            console.log('Step 2: Starting player...');
            BanubaSdkManager.startPlayer();
            
            // Then open camera
            setTimeout(() => {
              console.log('Step 3: Opening camera...');
              BanubaSdkManager.openCamera();
              
              // Load effect last (optional - commented out for testing)
              setTimeout(() => {
                // console.log('Step 4: Loading effect...');
                // try {
                //   BanubaSdkManager.loadEffect('effects/TrollGrandma');
                // } catch (err: unknown) {
                //   console.log('Effect load failed (this is optional):', err);
                // }
                console.log('Camera initialization complete');
                this.setState({ cameraReady: true });
              }, 500);
            }, 300);
          }, 300);
        } else {
          console.error('View tag is null or undefined');
        }
      } catch (error: unknown) {
        console.error('Error in initializeCamera:', error);
      }
    }, 500);
  };

  requestPermissions = async (): Promise<boolean> => {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ]);

      const cameraGranted = granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
      const audioGranted = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
      
      console.log('Camera permission:', cameraGranted);
      console.log('Audio permission:', audioGranted);

      return cameraGranted && audioGranted;
    } catch (err: unknown) {
      console.warn('Permission request error:', err);
      return false;
    }
  };

  componentWillUnmount(): void {
    try {
      BanubaSdkManager.stopPlayer();
      // Also try to close camera
      if (BanubaSdkManager.closeCamera) {
        BanubaSdkManager.closeCamera();
      }
    } catch (error: unknown) {
      console.error('Error in cleanup:', error);
    }
  }

  onPressVideoRecording = () => {
    if (!this.state.cameraReady) {
      Alert.alert('Please wait', 'Camera is still initializing');
      return;
    }

    if (!this.recording) {
      try {
        BanubaSdkManager.startVideoRecording(
          RNFS.DocumentDirectoryPath + '/video.mp4',
          false
        );
        this.setState({ recodButtonTitle: 'Stop recording' });
        console.log('Started recording');
      } catch (error: unknown) {
        console.error('Failed to start recording:', error);
      }
    } else {
      try {
        BanubaSdkManager.stopVideoRecording();
        this.setState({ recodButtonTitle: 'Tap to record' });
        console.log('Stopped recording');
      } catch (error: unknown) {
        console.error('Failed to stop recording:', error);
      }
    }
    this.recording = !this.recording;
  };
}