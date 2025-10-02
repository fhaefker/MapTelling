import "./App.css";
import { getTheme } from "@mapcomponents/react-maplibre";
import { ThemeProvider } from "@mui/material";
import { StoryViewer } from "./components/viewer/StoryViewer";

/**
 * MapTelling App
 * 
 * ✅ MapComponents Compliant:
 * - Theme Integration via getTheme()
 * - StoryViewer contains MapComponentsProvider
 * 
 * ✅ WhereGroup Principles:
 * - WhereGroup WMS als Basemap
 * - Configuration over Code
 * - Privacy by Design (local storage)
 * 
 * @version 3.0
 */
function App() {
  // ✅ MapComponents Theme Integration
  const theme = getTheme('light');
  
  return (
    <ThemeProvider theme={theme}>
      <StoryViewer />
    </ThemeProvider>
  );
}

export default App;