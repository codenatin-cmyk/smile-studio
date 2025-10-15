import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { BanubaSDK } = NativeModules;

export interface BanubaSDKInterface {
  initialize: (token: string) => Promise<string>;
  loadEffect: (effectName: string) => Promise<string>;
  clearEffect: () => Promise<string>;
  processImage: (imageUri: string) => Promise<string>;
  getAvailableEffects: () => Promise<string[]>;
}

class BanubaService {
  private sdkModule: BanubaSDKInterface | null = null;
  private eventEmitter: NativeEventEmitter | null = null;
  private isInitialized: boolean = false;

  constructor() {
    if (Platform.OS === 'android' && BanubaSDK) {
      this.sdkModule = BanubaSDK;
      this.eventEmitter = new NativeEventEmitter(BanubaSDK);
    }
  }

  async initialize(token: string): Promise<boolean> {
    if (!this.sdkModule) {
      throw new Error('Banuba SDK is only available on Android');
    }

    try {
      const result = await this.sdkModule.initialize(token);
      this.isInitialized = true;
      console.log('Banuba SDK:', result);
      return true;
    } catch (error) {
      console.error('Failed to initialize Banuba SDK:', error);
      throw error;
    }
  }

  async loadEffect(effectName: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }
    await this.sdkModule!.loadEffect(effectName);
  }

  async clearEffect(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }
    await this.sdkModule!.clearEffect();
  }

  async processImage(imageUri: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }
    return await this.sdkModule!.processImage(imageUri);
  }

  async getAvailableEffects(): Promise<string[]> {
    if (!this.isInitialized) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }
    return await this.sdkModule!.getAvailableEffects();
  }

  isAvailable(): boolean {
    return Platform.OS === 'android' && this.sdkModule !== null;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

export default new BanubaService();