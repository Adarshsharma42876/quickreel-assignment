import { useRef, useEffect, useState } from "react";
import "./App.css";
import * as faceapi from "face-api.js";
import { fabric } from "fabric";

function App() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const fileInputRef = useRef();
  const [isPlaying, setIsPlaying] = useState(false);
  const [checkFile, setCheckFile] = useState("");
  const [showClearButton, setShowClearButton] = useState(false);

  const handlePlayPause = () => {
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      loadModels();
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const loadModels = async () => {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    ]);

    detectFaces();
  };

  const detectFaces = () => {
    faceapi.matchDimensions(canvasRef.current, {
      width: videoRef.current.width,
      height: videoRef.current.height,
    });

    videoRef.current.addEventListener("play", () => {
      const draw = async () => {
        const detections = await faceapi
          .detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceExpressions();

        const resized = faceapi.resizeResults(detections, {
          width: canvasRef.current.width,
          height: canvasRef.current.height,
        });

        canvasRef.current
          .getContext("2d")
          .clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        faceapi.draw.drawDetections(canvasRef.current, resized);
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
        faceapi.draw.drawFaceExpressions(canvasRef.current, resized);

        resized.forEach((detection) => {
          const { _box } = detection.detection;
          const rect = new fabric.Rect({
            left: _box._x,
            top: _box._y,
            width: _box._width,
            height: _box._height,
            fill: "transparent",
            stroke: "blue",
            strokeWidth: 2,
          });
        });

        requestAnimationFrame(draw);
      };

      draw();
    });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const videoURL = URL.createObjectURL(file);
      videoRef.current.src = videoURL;
      setCheckFile(videoURL);
      setShowClearButton(true);
      videoRef.current.load();
    }
  };

  const handleClearVideo = () => {
    videoRef.current.pause();
    videoRef.current.src = "";
    setCheckFile("");
    canvasRef.current
      .getContext("2d")
      .clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setShowClearButton(false);
  };

  return (
    <>
      <div className="controls">
        {!showClearButton && (
          <input
            type="file"
            accept="video/*"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        )}
        {checkFile !== "" && (
          <button onClick={handlePlayPause}>
            {isPlaying ? "Pause" : "Play"}
          </button>
        )}
        {showClearButton && (
          <button onClick={handleClearVideo}>Clear Video</button>
        )}
      </div>
      <div className="video-canva">
        <video
          style={{ position: "absolute" }}
          crossOrigin="anonymous"
          height={600}
          width={600}
          ref={videoRef}
        ></video>
        <canvas style={{ position: "absolute" }} ref={canvasRef} />
      </div>
    </>
  );
}

export default App;
