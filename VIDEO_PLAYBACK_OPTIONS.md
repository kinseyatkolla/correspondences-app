# Video Playback Options for React Native

## YouTube Video Integration Options

### 1. **WebView with YouTube Embed (Simplest)**

Uses React Native's built-in WebView to embed YouTube's iframe player.

**Pros:**

- No additional dependencies needed (uses `react-native-webview`)
- Works with YouTube's standard embed URLs
- Complies with YouTube's ToS

**Cons:**

- Less control over playback
- Opens in a web-like interface

**Implementation:**

```bash
npm install react-native-webview
```

```tsx
import { WebView } from "react-native-webview";

// Extract video ID from URL
const getYouTubeVideoId = (url: string) => {
  const match = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  return match ? match[1] : null;
};

// In your component:
<WebView
  source={{
    uri: `https://www.youtube.com/embed/${videoId}`,
  }}
  style={{ width: "100%", height: 300 }}
  allowsFullscreenVideo
/>;
```

---

### 2. **react-native-youtube-iframe (Recommended)**

A well-maintained library specifically for YouTube videos.

**Pros:**

- Better controls and customization
- Native-like experience
- Good API for playback control
- Active maintenance

**Cons:**

- Requires additional dependency
- Still uses iframe under the hood

**Installation:**

```bash
npm install react-native-youtube-iframe
npm install react-native-webview  # Required peer dependency
```

**Implementation:**

```tsx
import YoutubePlayer from "react-native-youtube-iframe";

<YoutubePlayer
  height={300}
  play={false}
  videoId={videoId}
  onChangeState={(state) => console.log(state)}
/>;
```

---

### 3. **Linking to YouTube App (Alternative)**

Simply open the video in the YouTube app or browser.

**Pros:**

- No dependencies
- Best viewing experience (native YouTube app)
- No compliance concerns

**Cons:**

- Takes user out of your app
- No in-app playback

**Implementation:**

```tsx
import { Linking } from "react-native";

const openYouTubeVideo = (url: string) => {
  Linking.openURL(url).catch((err) =>
    Alert.alert("Error", "Unable to open video")
  );
};

// Usage:
<TouchableOpacity onPress={() => openYouTubeVideo(item.sourceUrl)}>
  <Text>Watch Video</Text>
</TouchableOpacity>;
```

---

## Current Implementation in LibraryScreen

Currently, the LibraryScreen uses **Option 3** (Linking) for video links. When a user taps on a video resource, it opens the URL in the device's default browser or YouTube app.

This is the simplest and most user-friendly approach for now, as it:

- Requires no additional setup
- Provides the best viewing experience
- Complies with all YouTube ToS requirements

---

## Recommended Next Steps

If you want in-app video playback:

1. **For Quick Implementation:**

   ```bash
   cd frontend
   npm install react-native-webview
   ```

   Then modify the video section to use WebView.

2. **For Better Experience:**
   ```bash
   cd frontend
   npm install react-native-youtube-iframe react-native-webview
   ```
   Then implement the YoutubePlayer component.

---

## Example: Upgrading to WebView

If you want to add a modal for in-app video playback, here's a quick example:

```tsx
import { WebView } from "react-native-webview";
import { Modal } from "react-native";

// Add to state:
const [selectedVideo, setSelectedVideo] = useState<LibraryItem | null>(null);
const [videoModalVisible, setVideoModalVisible] = useState(false);

// Handler:
const handleVideoPress = (video: LibraryItem) => {
  setSelectedVideo(video);
  setVideoModalVisible(true);
};

// Modal component:
<Modal visible={videoModalVisible} animationType="slide">
  <View style={{ flex: 1 }}>
    <WebView
      source={{ uri: selectedVideo?.sourceUrl || "" }}
      style={{ flex: 1 }}
      allowsFullscreenVideo
    />
    <TouchableOpacity onPress={() => setVideoModalVisible(false)}>
      <Text>Close</Text>
    </TouchableOpacity>
  </View>
</Modal>;
```

---

## YouTube ToS Compliance

When embedding YouTube videos, ensure you:

- Display the YouTube logo/branding
- Don't modify the video content
- Respect user's YouTube settings
- Include proper attribution

Using official YouTube embed methods (iframe/WebView) automatically handles most of these requirements.
