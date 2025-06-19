// This script loads the environment variables directly
(function() {
  if (typeof window !== 'undefined') {
    // Initialize with empty values if not already defined
    if (!window.ENV_CONFIG) {
      window.ENV_CONFIG = {
        NEXT_PUBLIC_CASDOOR_SERVER_URL: '',
        NEXT_PUBLIC_CASDOOR_CLIENT_ID: '',
        NEXT_PUBLIC_CASDOOR_CLIENT_SECRET: '',
        NEXT_PUBLIC_CASDOOR_APP_NAME: '',
        NEXT_PUBLIC_CASDOOR_ORG_NAME: '',
        NEXT_PUBLIC_CASDOOR_REDIRECT_URI: '',
        NEXT_PUBLIC_CONTACT_FORM_ACTION: ''
      };
    }
    
    // Function to fetch and load environment variables
    const loadEnvConfig = () => {
      // Fetch the environment variables from the server
      fetch('/env-config.js?nocache=' + new Date().getTime())
        .then(response => {
          if (!response.ok) {
            console.error(`Failed to load env-config.js: ${response.status} ${response.statusText}`);
            return response.text();
          }
          return response.text();
        })
        .then(text => {
          // Extract the values from the env-config.js file
          const envConfigMatch = text.match(/window\.ENV_CONFIG\s*=\s*(\{[\s\S]*?\});/);
          if (envConfigMatch && envConfigMatch[1]) {
            try {
              // Parse the environment variables
              const envConfig = new Function('return ' + envConfigMatch[1])();
              
              // Update the window.ENV_CONFIG object
              window.ENV_CONFIG = envConfig;
              
              // Dispatch an event to notify that the environment variables are loaded
              const event = new CustomEvent('env-config-loaded');
              window.dispatchEvent(event);
            } catch (error) {
              console.error('Failed to parse ENV_CONFIG:', error);
            }
          } else {
            console.error('Failed to extract ENV_CONFIG from env-config.js');
          }
        })
        .catch(error => {
          console.error('Error loading env-config.js:', error);
        });
    };
    
    // Load immediately
    loadEnvConfig();
    
    // Also try again when the window is fully loaded
    window.addEventListener('load', loadEnvConfig);
  }
})(); 