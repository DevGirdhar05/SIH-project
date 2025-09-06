export class GeolocationService {
  private mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
  private googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      // Try Mapbox first if token is available
      if (this.mapboxToken) {
        return await this.reverseGeocodeMapbox(lat, lng);
      }
      
      // Fallback to Google Maps if API key is available
      if (this.googleMapsApiKey) {
        return await this.reverseGeocodeGoogle(lat, lng);
      }

      // Return formatted coordinates if no geocoding service is available
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error("Geocoding error:", error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }

  private async reverseGeocodeMapbox(lat: number, lng: number): Promise<string> {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${this.mapboxToken}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }

    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  private async reverseGeocodeGoogle(lat: number, lng: number): Promise<string> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.googleMapsApiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }

    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  async detectWard(lat: number, lng: number): Promise<string | null> {
    // This would typically query PostGIS to find which ward polygon contains the point
    // For now, we'll return a mock implementation
    try {
      const { storage } = await import("../storage");
      const wards = await storage.getWards();
      
      // In a real implementation, this would use PostGIS ST_Contains function
      // to find the ward polygon that contains the point
      // For now, return the first ward as a placeholder
      return wards[0]?.id || null;
    } catch (error) {
      console.error("Ward detection error:", error);
      return null;
    }
  }
}

export const geolocationService = new GeolocationService();
