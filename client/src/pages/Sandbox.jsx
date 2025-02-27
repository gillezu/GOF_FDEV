import React, { useState, useEffect } from "react";
import "../App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faSpinner } from "@fortawesome/free-solid-svg-icons";
import ResetButton from "../components/controllers/ResetButton";
import StartPauseButton from "../components/controllers/StartPauseButton";
import "../styles/animations/pulse.css";
import "../styles/animations/moveGradient.css";
import "../styles/components/gameHeader.css";
import axios from "axios";
import { socket } from "../utils/socketioSetup";
import InitializeRandomButton from "../components/controllers/InitializeRandomButton";
import SaveToLibraryButton from "../components/controllers/SaveToLibraryButton";
import GridCanvas from "../components/GridCanvas";
import "../styles/components/slider.css";

function Sandbox({ onOpenSaveModal, anyModalOpened, isRunning, setIsRunning, level }) {
  const [data, setData] = useState({
    cell_age: [[]],
    cell_size: 5,
    cells: [[]],
    height: 10,
    width: 10,
  });

  const [loading, setLoading] = useState(true);
  const [generation, setGeneration] = useState(0);

  const resetGeneration = () => setGeneration(-1);

  const [fps, setFPS] = useState(17);

  const [headerZoom, setHeaderZoom] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setHeaderZoom(true);
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  const handleFPSChange = (event) => {
    const newFPS = event.target.value;
    setFPS(newFPS);
  };

  useEffect(() => {
    socket.on("getGrid", (response) => {
      setData(response);
      setGeneration((prevCount) => prevCount + 0.5); // Keine Ahnung warum 0.5, Funktion wird anscheinend 2x ausgeführt
    });
  }, []);

  useEffect(() => {
    const fetchInitialGrid = async () => {
      try {
        const response = await axios.get("/initialize_grid");
        setData(response.data);
        setLoading(false);
      } catch (error) {
        console.log(error);
      }
    };
    fetchInitialGrid();
  }, []);

  useEffect(() => {}, [data]);

  if (loading) {
    return (
      <h1 className="text-white text-3xl flex items-center justify-center h-screen">
        Loading{" "}
        <FontAwesomeIcon icon={faSpinner} className="ml-2 animate-spin" />
      </h1>
    );
  }
  return (
    <div className="flex flex-col items-center justify-start h-[80vh] w-full">
      <div
        className={`flex items-center justify-center h-screen transition-transform duration-[1500ms] ease-in-out ${
          headerZoom
            ? "scale-100 translate-y-0 opacity-100"
            : "scale-150 opacity-0"
        }`}
      >
        <h1
          className="text-7xl text-transparent bg-gradient-to-r from-blue-500 
          via-purple-500 to-red-500 bg-clip-text move-gradient-text "
        >
          Sandbox
        </h1>
      </div>
      <div className="w-full flex flex-col items-center">
        <div
          className="flex justify-between mb-6"
          style={{ width: `${data.width * data.cell_size}px` }}
        >
          <InitializeRandomButton
            socket={socket}
            resetGeneration={resetGeneration}
          />
          <StartPauseButton
            socket={socket}
            FPS={fps}
            isRunning={isRunning}
            setIsRunning={setIsRunning}
          />
          <ResetButton socket={socket} resetGeneration={resetGeneration} />
          <SaveToLibraryButton onOpenSaveModal={onOpenSaveModal} />
        </div>
        <div className="my-2">
          <GridCanvas
            anyModalOpened={anyModalOpened}
            grid={
              data.cells || Array(data.height).fill(Array(data.width).fill(0))
            }
            cellSize={data.cell_size}
            width={data.width} // Übergebe die Breite des Canvas
            height={data.height} // Übergebe die Höhe des Canvas
            cellAges={
              data.cell_age ||
              Array(data.height).fill(Array(data.width).fill(0))
            }
            cellfreezed={data.freezed}
            onCellClick={async (i, j) => {
              socket.emit("mouseCoords", { i, j });
              resetGeneration();
            }}
            onKeyPress={async (key, i, j) => {
              socket.emit("keyPress", { key, i, j });
            }}
            level={level}
          />
        </div>
        <div
          className="my-4 flex justify-between items-center w-full"
          style={{ width: `${data.width * data.cell_size}px` }}
        >
          <h1 className="text-2xl text-white">Generation: {generation}</h1>
          <h1 className="text-2xl text-white">FPS: {fps}</h1>
          <input
            className="custom-slider"
            type="range"
            min="1"
            max="45"
            value={fps}
            onChange={handleFPSChange}
          />
        </div>
      </div>
    </div>
  );
}

export default Sandbox;
