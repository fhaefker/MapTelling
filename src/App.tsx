import "./App.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { getTheme } from "@mapcomponents/react-maplibre";
import { ThemeProvider, Box, AppBar, Toolbar, Typography, Button } from "@mui/material";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import { StoryViewer } from "./components/viewer/StoryViewer";
import { StoryEditor } from "./components/editor/StoryEditor";
import { WHEREGROUP_COLORS } from "./lib/constants";

/**
 * MapTelling App
 * 
 * ✅ MapComponents Compliant:
 * - Theme Integration via getTheme()
 * - Single ThemeProvider wrapper
 * 
 * ✅ WhereGroup Principles:
 * - WhereGroup WMS als Basemap
 * - Configuration over Code
 * - Privacy by Design (local storage)
 * - Router for multi-page navigation
 * 
 * ✅ Architecture:
 * - Error Boundary for global error handling
 * - React Router for /viewer and /editor routes
 * 
 * @version 4.0
 */
function App() {
  // ✅ MapComponents Theme Integration
  const theme = getTheme('light');
  
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <BrowserRouter basename="/MapTelling">
          <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Navigation Bar */}
            <AppBar position="static" sx={{ bgcolor: WHEREGROUP_COLORS.blue.primary }}>
              <Toolbar>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  MapTelling
                </Typography>
                <Button color="inherit" component={Link} to="/">
                  Viewer
                </Button>
                <Button color="inherit" component={Link} to="/editor">
                  Editor
                </Button>
              </Toolbar>
            </AppBar>

            {/* Routes */}
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <Routes>
                <Route path="/" element={<StoryViewer />} />
                <Route path="/editor" element={<StoryEditor />} />
              </Routes>
            </Box>
          </Box>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
