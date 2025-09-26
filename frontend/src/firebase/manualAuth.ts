export interface ServiceAccountKey {
  private_key: string;
  client_email: string;
  project_id: string;
  [key: string]: any;
}

/**
 * Generate FCM token manually using service account JSON
 */
export const generateFCMToken = async (serviceAccount: ServiceAccountKey): Promise<string> => {
  try {
    // Validate service account
    if (!serviceAccount.client_email || typeof serviceAccount.client_email !== 'string') {
      throw new Error('Invalid service account: client_email is required and must be a string');
    }

    if (!serviceAccount.private_key || typeof serviceAccount.private_key !== 'string') {
      throw new Error('Invalid service account: private_key is required and must be a string');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(serviceAccount.client_email)) {
      throw new Error('Invalid service account: client_email must be a valid email address');
    }

    // Validate private key format
    if (!serviceAccount.private_key.includes('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('Invalid service account: private_key must be in the correct PEM format');
    }

    // Generate JWT token
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 60 * 60; // 1 hour
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: serviceAccount.client_email,
      sub: serviceAccount.client_email,
      aud: 'https://oauth2.googleapis.com/token',
      scope: 'https://www.googleapis.com/auth/firebase.remoteconfig',
      iat,
      exp,
    };

    // Helper functions
    function base64url(source: string) {
      return btoa(source)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }

    function encode(obj: any) {
      return base64url(JSON.stringify(obj));
    }

    function str2ab(str: string) {
      const buf = new ArrayBuffer(str.length);
      const bufView = new Uint8Array(buf);
      for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
      }
      return buf;
    }

    function arrayBufferToBase64Url(buffer: ArrayBuffer) {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return base64url(binary);
    }

    // Sign JWT
    async function signJwt(header: any, payload: any, privateKey: string) {
      const enc = new TextEncoder();
      const key = await window.crypto.subtle.importKey(
        'pkcs8',
        str2ab(atob(privateKey.replace(/-----[^-]+-----/g, '').replace(/\n/g, ''))),
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const unsigned = `${encode(header)}.${encode(payload)}`;
      const signature = await window.crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        key,
        enc.encode(unsigned)
      );
      return `${unsigned}.${arrayBufferToBase64Url(signature)}`;
    }

    const jwt = await signJwt(header, payload, serviceAccount.private_key);
    
    // Exchange JWT for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });

    const tokenData = await tokenRes.json();
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token: ' + (tokenData.error || 'Unknown error'));
    }

    return tokenData.access_token;
  } catch (error: any) {
    console.error('Error generating FCM token:', error);
    throw new Error(`Failed to generate FCM token: ${error.message}`);
  }
};

/**
 * Parse the service account JSON file uploaded by the user
 */
export const parseServiceAccountFile = async (file: File): Promise<ServiceAccountKey> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') {
          reject(new Error('Failed to read file as text'));
          return;
        }
        
        const serviceAccount = JSON.parse(result) as ServiceAccountKey;
        
        // Validate the service account JSON
        if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
          reject(new Error('Invalid service account JSON: Missing required fields (private_key, client_email, project_id)'));
          return;
        }
        
        resolve(serviceAccount);
      } catch (error) {
        reject(new Error('Invalid JSON format'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Fetch Remote Config using manual token
 */
export const fetchRemoteConfigManual = async (projectId: string, accessToken: string): Promise<any> => {
  try {
    const url = `https://firebaseremoteconfig.googleapis.com/v1/projects/${projectId}/remoteConfig`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch remote config: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const configData = await response.json();
    console.log('Raw Firebase response:', configData);
    
    // Extract the parameters from the Firebase response
    if (configData.parameters) {
      console.log('Parameters found:', configData.parameters);
      const extractedConfig: { [key: string]: any } = {};
      
      Object.entries(configData.parameters).forEach(([key, param]: [string, any]) => {
        console.log(`Processing key: ${key}`, param);
        // Get the default value
        if (param.defaultValue) {
          try {
            // Try to parse as JSON first
            extractedConfig[key] = JSON.parse(param.defaultValue.value);
          } catch {
            // If not JSON, store as string
            extractedConfig[key] = param.defaultValue.value;
          }
        }
      });
      
      console.log('Extracted config:', extractedConfig);
      return extractedConfig;
    }
    
    console.log('No parameters found, returning raw data');
    return configData;
  } catch (error: any) {
    console.error('Error fetching remote config:', error);
    throw new Error(`Failed to fetch remote config: ${error.message}`);
  }
};
