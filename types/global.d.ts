// Global type declarations for Google Maps
declare global {
  interface Window {
    google?: any;
    initMap?: () => void;
    initGoogleMaps?: () => void;
  }
}

export {};