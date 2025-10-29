import MapboxGL from "@rnmapbox/maps";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoiZG91YmxlajEyNiIsImEiOiJjbWZhb3RpczMwZ2l3Mmpwb2FodGdpanh3In0.-h87gulMpAPDy9aScbl3uA";

interface MapPickerViewType {
  pinLongitude?: number;
  pinLatitude?: number;
  allowEdit: boolean;
  onSave?: (longitude: number, latitude: number) => void;
  pins?: any[];
}

const styles = StyleSheet.create({
  mapContainer: {
    height: 300,
    width: "100%",
  },
  container: {
    flex: 1,
    width: "100%",
  },
  searchContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    zIndex: 999,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
  },
  searchResultBox: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginTop: 6,
    maxHeight: 160,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  searchResult: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  callout: {
    backgroundColor: "white",
    padding: 8,
    borderRadius: 6,
    flexDirection: "column",
    alignItems: "flex-start",
    maxWidth: 200,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "left",
  },
  calloutText: {
    textAlign: "left",
  },
});

export default function MapPickerView(props: MapPickerViewType) {
  const { width } = useWindowDimensions();
  const [longitude, setLongitude] = useState(props.pinLongitude);
  const [latitude, setLatitude] = useState(props.pinLatitude);
  const [mapboxgl, setMapBoxgl] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const mapContainerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const defaultCoords = {
    latitude: props.pinLatitude || 14.5995,
    longitude: props.pinLongitude || 120.9842, // Manila as default center
  };

  // Initialize Mapbox
  useEffect(() => {
    MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);
    if (Platform.OS === "web") {
      setMapBoxgl(() => {
        let content = require("mapbox-gl");
        content.accessToken = MAPBOX_ACCESS_TOKEN;
        return content;
      });
    }
  }, []);

  // Setup Map for Web
  useEffect(() => {
    if (Platform.OS === "web" && !!mapboxgl && mapContainerRef.current) {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [defaultCoords.longitude, defaultCoords.latitude],
        zoom: 12,
      });
      mapRef.current = map;

      // Click to pick location
      map.on("click", (e: any) => {
        if (!props.allowEdit) return;
        setLatitude(e.lngLat.lat);
        setLongitude(e.lngLat.lng);
      });

      return () => map.remove();
    }
  }, [mapboxgl]);

  // Add or update markers on Web
  useEffect(() => {
    if (Platform.OS === "web" && mapRef.current && mapboxgl) {
      if (markerRef.current) {
        markerRef.current.remove();
      }

      if (longitude && latitude) {
        markerRef.current = new mapboxgl.Marker({ color: "red" })
          .setLngLat([longitude, latitude])
          .addTo(mapRef.current);
      }

      props.pins?.forEach((pin) => {
        if (pin.longitude && pin.latitude) {
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <h3>${pin.clinic_name}</h3>
            <p>Address: ${pin.address}</p>
            <p>Mobile: ${pin.mobile_number}</p>
          `);
          new mapboxgl.Marker({ color: "red" })
            .setLngLat([pin.longitude, pin.latitude])
            .addTo(mapRef.current)
            .setPopup(popup);
        }
      });
    }
  }, [mapboxgl, longitude, latitude, props.pins]);

  // Native map click handler
  const onMapClickNative = (e: any) => {
    if (!props.allowEdit) return;
    const coords = e.geometry.coordinates;
    setLatitude(coords[1]);
    setLongitude(coords[0]);
  };

  // 🔍 Handle location search (PH only)
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?country=PH&access_token=${MAPBOX_ACCESS_TOKEN}&limit=5`
      );
      const data = await res.json();
      setSearchResults(data.features || []);
      setShowResults(true);
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

  // When user selects a search result
  const handleSelectLocation = (item: any) => {
    const [lng, lat] = item.center;
    setLongitude(lng);
    setLatitude(lat);
    setShowResults(false);
    setSearchQuery(item.place_name);

    if (Platform.OS === "web" && mapRef.current) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 14 });
    }
  };

  const renderNativeMap = () => (
    <MapboxGL.MapView
      style={styles.mapContainer}
      styleURL={MapboxGL.StyleURL.Street}
      onPress={onMapClickNative}
    >
      <MapboxGL.Camera
        zoomLevel={12}
        centerCoordinate={[longitude || defaultCoords.longitude, latitude || defaultCoords.latitude]}
      />

      {/* Selected pin */}
      {longitude && latitude && !props.pins && (
        <MapboxGL.PointAnnotation
          id="selected-location-pin"
          coordinate={[longitude, latitude]}
        >
          <View
            style={{
              width: 16,
              height: 16,
              borderRadius: 12,
              backgroundColor: "red",
              borderWidth: 2,
              borderColor: "white",
            }}
          />
        </MapboxGL.PointAnnotation>
      )}

      {/* Multiple pins */}
      {props.pins?.map((pin, index) =>
        pin.longitude && pin.latitude ? (
          <MapboxGL.PointAnnotation
            key={`pin-${index}`}
            id={`pin-${index}`}
            coordinate={[pin.longitude, pin.latitude]}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: "red",
                borderWidth: 2,
                borderColor: "white",
              }}
            />
            <MapboxGL.Callout>
              <View style={styles.callout}>
                <Text style={styles.title}>{pin.clinic_name}</Text>
                <Text style={styles.calloutText}>Address: {pin.address}</Text>
                <Text style={styles.calloutText}>Mobile: {pin.mobile_number}</Text>
              </View>
            </MapboxGL.Callout>
          </MapboxGL.PointAnnotation>
        ) : null
      )}
    </MapboxGL.MapView>
  );

  return (
    <View style={{ flex: 1, width: "100%", backgroundColor: "white" }}>
      {/* 🔍 Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search location in the Philippines..."
          style={styles.searchInput}
        />
        {showResults && searchResults.length > 0 && (
          <View style={styles.searchResultBox}>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectLocation(item)}
                  style={styles.searchResult}
                >
                  <Text>{item.place_name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      {/* 🗺 Map */}
      {Platform.OS === "web" ? (
        <div
          ref={mapContainerRef}
          style={{
            width: "100%",
            height: width > 720 ? "100%" : 300,
            minHeight: 300,
          }}
        />
      ) : (
        renderNativeMap()
      )}

      {/* ✅ Confirm Button */}
      {!!longitude && !!latitude && props.allowEdit && (
        <Text
          style={{
            color: "#b71c1c",
            fontWeight: "bold",
            textAlign: "center",
            margin: 20,
          }}
          onPress={() => props?.onSave(longitude, latitude)}
        >
          Confirm Clinic Location
        </Text>
      )}
    </View>
  );
}
