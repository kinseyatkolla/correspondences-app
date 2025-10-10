import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from "react-native";
import { apiService } from "../services/api";
import { overlayStyles } from "../styles/overlayStyles";

interface WikipediaData {
  title: string;
  extract: string;
  url: string;
  thumbnail?: string;
}

interface WikipediaSectionProps {
  searchTerm: string;
  wikiName?: string;
}

export default function WikipediaSection({
  searchTerm,
  wikiName,
}: WikipediaSectionProps) {
  const [wikipediaData, setWikipediaData] = useState<WikipediaData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchTerm || wikiName) {
      fetchWikipediaData();
    }
  }, [searchTerm, wikiName]);

  const fetchWikipediaData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use wikiName if available, otherwise use searchTerm
      const query = wikiName || searchTerm;

      const response = await apiService.getWikipediaSummary(query);

      if (response.success) {
        setWikipediaData(response.data);
      } else {
        setError("Wikipedia article not found");
      }
    } catch (err) {
      console.error("Error fetching Wikipedia data:", err);
      setError("Failed to load Wikipedia data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWikipedia = () => {
    if (wikipediaData?.url) {
      Linking.openURL(wikipediaData.url);
    }
  };

  if (loading) {
    return (
      <View style={overlayStyles.section}>
        <Text style={overlayStyles.sectionTitle}>Wikipedia</Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 10,
          }}
        >
          <ActivityIndicator size="small" color="#b19cd9" />
          <Text style={[overlayStyles.sectionText, { marginLeft: 10 }]}>
            Loading Wikipedia data...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !wikipediaData) {
    return null; // Don't show anything if there's an error or no data
  }

  return (
    <View style={overlayStyles.section}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <Text style={overlayStyles.sectionTitle}>Wikipedia</Text>
        <TouchableOpacity
          style={{
            backgroundColor: "#b19cd9",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 15,
          }}
          onPress={handleOpenWikipedia}
        >
          <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>
            Open Article
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={overlayStyles.sectionText}>{wikipediaData.extract}</Text>

      <Text
        style={[
          overlayStyles.sectionText,
          {
            fontSize: 12,
            color: "#8a8a8a",
            fontStyle: "italic",
            marginTop: 8,
          },
        ]}
      >
        Source: {wikipediaData.title} on Wikipedia
      </Text>
    </View>
  );
}
