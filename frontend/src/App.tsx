import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./components/Home";
import Footer from "./components/Footer";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Exercise from "./components/exercise";
import VideoDetail from "./components/VideoDetail";
import VideoAnalyze from "./components/VideoAnalyze";
import VideoPurchase from "./components/VideoPurchase";
import "./App.css";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Header />
        <div>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/exercise" element={<Exercise />} />
            <Route path="/video/:videoId" element={<VideoDetail />} />
            <Route
              path="/video/:videoId/VideoAnalyze"
              element={<VideoAnalyze />}
            />
            <Route
              path="/video/:videoId/purchase"
              element={<VideoPurchase />}
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </div>
      </BrowserRouter>
      <Footer />
    </div>
  );
}

export default App;
