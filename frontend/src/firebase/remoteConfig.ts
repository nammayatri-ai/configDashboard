import { 
  getValue, 
  getAll, 
  fetchAndActivate
} from 'firebase/remote-config';
import { remoteConfig } from './config';

export interface RemoteConfigData {
  [key: string]: any;
}

export class RemoteConfigService {
  // Fetch and activate remote config
  static async fetchAndActivateConfig(): Promise<void> {
    try {
      console.log('Fetching remote config...');
      const activated = await fetchAndActivate(remoteConfig);
      console.log('Remote config activated:', activated);
    } catch (error) {
      console.error('Error fetching remote config:', error);
      throw error;
    }
  }

  // Get a specific config value
  static getConfigValue(key: string): any {
    return getValue(remoteConfig, key);
  }

  // Get all remote config values as JSON
  static getAllConfigAsJSON(): RemoteConfigData {
    const allValues = getAll(remoteConfig);
    const configData: RemoteConfigData = {} as RemoteConfigData;

    // Convert all values to JSON dynamically
    Object.entries(allValues).forEach(([key, value]) => {
      try {
        // Try to parse as JSON first
        const parsedValue = JSON.parse(value.asString());
        configData[key] = parsedValue;
      } catch {
        // If not JSON, store as string
        configData[key] = value.asString();
      }
    });

    return configData;
  }

  // Get dashboard configuration specifically
  static getDashboardConfig(): any {
    try {
      const dashboardConfigValue = getValue(remoteConfig, 'dashboard_config');
      return JSON.parse(dashboardConfigValue.asString());
    } catch (error) {
      console.error('Error parsing dashboard config:', error);
      return {};
    }
  }

  // Get feature flags
  static getFeatureFlags(): any {
    try {
      const featureFlagsValue = getValue(remoteConfig, 'feature_flags');
      return JSON.parse(featureFlagsValue.asString());
    } catch (error) {
      console.error('Error parsing feature flags:', error);
      return {};
    }
  }

  // Check if maintenance mode is enabled
  static isMaintenanceMode(): boolean {
    try {
      const maintenanceValue = getValue(remoteConfig, 'maintenance_mode');
      return maintenanceValue.asString() === 'true';
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
      return false;
    }
  }

  // Get app version from remote config
  static getAppVersion(): string {
    try {
      const versionValue = getValue(remoteConfig, 'app_version');
      return versionValue.asString();
    } catch (error) {
      console.error('Error getting app version:', error);
      return '2.0.0';
    }
  }

  // Initialize remote config (call this on app startup)
  static async initialize(): Promise<void> {
    try {
      console.log('Initializing remote config...');
      await this.fetchAndActivateConfig();
      console.log('Remote config initialized successfully');
    } catch (error) {
      console.error('Failed to initialize remote config:', error);
      // Continue with default values
    }
  }

  // Get config as formatted JSON string for display
  static getConfigAsFormattedJSON(): string {
    const configData = this.getAllConfigAsJSON();
    return JSON.stringify(configData, null, 2);
  }

  // Check if a specific feature is enabled
  static isFeatureEnabled(featureName: string): boolean {
    try {
      const featureFlags = this.getFeatureFlags();
      return featureFlags[featureName] === true;
    } catch (error) {
      console.error(`Error checking feature ${featureName}:`, error);
      return false;
    }
  }

  // Get API endpoints from remote config
  static getApiEndpoints(): { staging: string; production: string } {
    try {
      const dashboardConfig = this.getDashboardConfig();
      return dashboardConfig.api_endpoints || {
        staging: 'https://dashboard.integ.moving.tech/api/dev/bap',
        production: 'https://dashboard.moving.tech/api/dev/bap'
      };
    } catch (error) {
      console.error('Error getting API endpoints:', error);
      return {
        staging: 'https://dashboard.integ.moving.tech/api/dev/bap',
        production: 'https://dashboard.moving.tech/api/dev/bap'
      };
    }
  }
}
