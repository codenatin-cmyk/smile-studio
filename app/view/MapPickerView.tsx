import React, { useState, useRef, useEffect } from "react";
import {
  Platform,
  Text,
  useWindowDimensions,
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import MapboxGL from "@rnmapbox/maps"; // Native Mapbox

// You may need to add this CSS import to your project's index.js or a similar file
// import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoiZG91YmxlajEyNiIsImEiOiJjbWZhb3RpczMwZ2l3Mmpwb2FodGdpanh3In0.-h87gulMpAPDy9aScbl3uA";


interface MapPickerViewType {
  pinLongitude?: number;
  pinLatitude?: number;
  allowEdit : boolean,
  onSave? : (longitude : number, latitude : number) => void,
  pins? : any[]
};

const styles = StyleSheet.create({
  mapContainer: {
    height: 300,
    width: "100%",
  },
  container: {
    flex: 1,
    width: "100%",
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
    writingDirection: "ltr",
  },
  calloutText: {
    textAlign: "left",
    writingDirection: "ltr",
    includeFontPadding: false, // 👈 helps Android layout
    textAlignVertical: "center", // 👈 prevents weird stacking
  },
});
 

export default function MapPickerView(props: MapPickerViewType) {
  const { width } = useWindowDimensions();
  const [longitude, setLongitude] = useState(props.pinLongitude);
  const [latitude, setLatitude] = useState(props.pinLatitude);
  const [mapboxgl, setMapBoxgl] = useState(null);



  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const defaultCoords = {
    latitude: props.pinLatitude || 14.8058552317373,
    longitude: props.pinLongitude || 121.047323237295,
  };

  function wrapText(text: string, limit: number) {
    const words = text.split(" ");
    let lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
      if ((currentLine + word).length <= limit) {
        currentLine += (currentLine ? " " : "") + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    });

    if (currentLine) lines.push(currentLine);
    return lines.join("\n");
  }

  useEffect(() => {
    MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);
    // Ensures that MapboxGL is only loaded when on Web platform
    if (Platform.OS === "web") {
      setMapBoxgl(() => {
        let content = require("mapbox-gl");
        content.accessToken = MAPBOX_ACCESS_TOKEN;
        return content;
      });
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === "web" && !!mapboxgl && mapContainerRef.current) {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [defaultCoords.longitude, defaultCoords.latitude],
        zoom: 12,
      });
      mapRef.current = map;

      // Web Onclick listener on map
      map.on("click", (e) => {
        if (!props.allowEdit) return;
        setLatitude(e.lngLat.lat);
        setLongitude(e.lngLat.lng);
      });

      return () => map.remove();
    }
  }, [mapboxgl]);

  // Unified effect for adding pins on web
  useEffect(() => {
    if (Platform.OS === "web" && mapRef.current && mapboxgl) {
      // Clear existing markers before re-rendering
      if (markerRef.current) {
        markerRef.current.remove();
      }
      
      // Add the editable pin if it exists
      if (longitude && latitude) {
        // Remove the old marker
        if (markerRef.current) {
          markerRef.current.remove();
        }

        // Add a new marker
        markerRef.current = new mapboxgl.Marker({ color: "red" })
          .setLngLat([longitude, latitude])
          .addTo(mapRef.current);
      }
      // Loop through all provided pins and create markers for them
      props.pins?.forEach(pin => {
        // Check if both longitude and latitude are valid numbers
        if (pin.longitude && pin.latitude) {
          var popup = new mapboxgl.Popup({ offset: 25 })
          .setHTML(`<h3>${pin.clinic_name}</h3>
            // <br>
            <p>Address: ${pin.address}</p>
            <p>Mobile Number:${pin.mobile_number}</p>
            `);
          new mapboxgl.Marker({ color: 'red' }) // Use a different color for static pins
            .setLngLat([pin.longitude, pin.latitude])
            .addTo(mapRef.current)
            .setPopup(popup);
        }
      });
    }
  }, [mapboxgl, longitude, latitude, props.pins]);

  const onMapClickNative = (e: any) => {
    if (!props.allowEdit) return;
    const coords = e.geometry.coordinates;
    setLatitude(coords[1]);
    setLongitude(coords[0]);
  };

  const renderNativeMap = () => {
    const [selectedPin, setSelectedPin] = useState<[number, number]>()

    // Ensure MapboxGL is initialized before rendering
    if (!MapboxGL) {
      return <Text>Loading Map...</Text>;
    }
    return (
      <MapboxGL.MapView
        style={styles.mapContainer}
        styleURL={MapboxGL.StyleURL.Street}
        onPress={onMapClickNative}
      >
        <MapboxGL.Camera
          zoomLevel={12}
          centerCoordinate={[defaultCoords.longitude, defaultCoords.latitude]}
        />
        {/* Render single pin only if no props.pins is passed */}
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

        {/* Render multiple pins if props.pins exists */}
        {props.pins?.map((pin, index) => (
          (pin.longitude && pin.latitude) && (
            <MapboxGL.PointAnnotation
              key={`pinKey-${index}`}
              id={`pin-${index}`}
              coordinate={[pin.longitude, pin.latitude]}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: "blue",
                  borderWidth: 2,
                  borderColor: "white",
                }}
              />
            {Platform.OS === "android" ? (
              // ✅ Custom overlay for Android
              <View style={styles.callout}>
                <Text
                  style={{
                    ...styles.title,
                    color: "#ff0000ff",
                    textAlign: "center",
                    fontSize: 7,
                  }}
                >
                  {wrapText(pin.clinic_name, 15)}
                </Text>
              </View>
            ) : (
              // ✅ Native Callout for iOS/Web
              <MapboxGL.Callout>
                <View style={styles.callout}>
                  <Text style={styles.title}>{pin.clinic_name}</Text>
                  <Text style={styles.calloutText}>Address: {pin.address}</Text>
                  <Text style={styles.calloutText}>Mobile: {pin.mobile_number}</Text>
                </View>
              </MapboxGL.Callout>
            )}

            </MapboxGL.PointAnnotation>
          )
        ))}

      </MapboxGL.MapView>
    );
  };

  return (
    <View
      style={{
        width: "100%",
        backgroundColor: "white",
        padding: 0,
        ...(width > 720
          ? {
              minWidth: 580,
              minHeight: 580,
            }
          : {
              minHeight: 0,
            }),
      }}
    >
      {
        (latitude && longitude)
        &&
        <Text>{`Selected location at x:${longitude} y:${latitude}`}</Text>
      }
      {Platform.OS === "web" ? (
        <div 
          ref={mapContainerRef} 
          style={{ 
            width: "100%", 
            height: width > 720 ? "100%" : 300,  // or a fixed height like 300 for mobile
            minHeight: 300 
          }} 
        />
      ) : (
        renderNativeMap()
      )}
      {
        (!!longitude && !!latitude && props.allowEdit)
        &&

          <Text
            style={{
              color: "#003f30ff",
              fontWeight: "bold",
              textAlign: "center",
              margin: 20,
              marginTop: 10,
              ...(width > 720
              ? {
                  
                }
              : {
                  
                }),
            }}
          onPress={()=>{
            props?.onSave(longitude, latitude);
          }}
          >Confirm Clinic Location</Text>
      }

    </View>
  );
}

