// src/QRCodeScanner.js
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';

const QRCodeScanner = () => {
  const [data, setData] = useState('No result');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' for back camera, 'user' for front camera
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);

  const handleCameraSwap = () => {
    setFacingMode((prevMode) => (prevMode === 'environment' ? 'user' : 'environment'));
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          const context = canvas.getContext('2d', { willReadFrequently: true });

          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);

          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            setData(code.data);
          } else {
            setData('No QR code found');
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const capture = useCallback(() => {
    if (webcamRef.current && canvasRef.current && overlayCanvasRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        const canvas = canvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        const overlayContext = overlayCanvas.getContext('2d', { willReadFrequently: true });
        const img = new Image();
        img.onload = () => {
          const centerWidth = 160 // Adjusted to 30% width
          const centerHeight = 160; // Adjusted to 30% height
          const centerX = (img.width - centerWidth) / 2;
          const centerY = (img.height - centerHeight) / 2;

          canvas.width = centerWidth;
          canvas.height = centerHeight;
          context.drawImage(img, centerX, centerY, centerWidth, centerHeight, 0, 0, centerWidth, centerHeight);

          const imageData = context.getImageData(0, 0, centerWidth, centerHeight);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            setData(code.data);
          }

          // Clear the overlay canvas and draw the rectangular line in the center
          overlayCanvas.width = img.width;
          overlayCanvas.height = img.height;
          overlayContext.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
          overlayContext.strokeStyle = 'red';
          overlayContext.lineWidth = 7;
          const cornerLength = 20; // Length of the corner lines
          const cornerWidth = 4; // Width of the corner lines
          // Top-left corner
          overlayContext.beginPath();
          overlayContext.moveTo(centerX, centerY);
          overlayContext.lineTo(centerX + cornerLength, centerY);
          overlayContext.moveTo(centerX, centerY);
          overlayContext.lineTo(centerX, centerY + cornerLength);
          overlayContext.stroke();
          // Top-right corner
          overlayContext.beginPath();
          overlayContext.moveTo(centerX + centerWidth, centerY);
          overlayContext.lineTo(centerX + centerWidth - cornerLength, centerY);
          overlayContext.moveTo(centerX + centerWidth, centerY);
          overlayContext.lineTo(centerX + centerWidth, centerY + cornerLength);
          overlayContext.stroke();
          // Bottom-right corner
          overlayContext.beginPath();
          overlayContext.moveTo(centerX + centerWidth, centerY + centerHeight);
          overlayContext.lineTo(centerX + centerWidth - cornerLength, centerY + centerHeight);
          overlayContext.moveTo(centerX + centerWidth, centerY + centerHeight);
          overlayContext.lineTo(centerX + centerWidth, centerY + centerHeight - cornerLength);
          overlayContext.stroke();
          // Bottom-left corner
          overlayContext.beginPath();
          overlayContext.moveTo(centerX, centerY + centerHeight);
          overlayContext.lineTo(centerX + cornerLength, centerY + centerHeight);
          overlayContext.moveTo(centerX, centerY + centerHeight);
          overlayContext.lineTo(centerX, centerY + centerHeight - cornerLength);
          overlayContext.stroke();

          // Apply blur effect directly on the overlay canvas
          overlayContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
          overlayContext.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);
          overlayContext.clearRect(centerX, centerY, centerWidth, centerHeight);
        };
        img.src = imageSrc;
      }
    }
  }, [webcamRef, canvasRef, overlayCanvasRef]);

  useEffect(() => {
    const interval = setInterval(capture, 1000);
    return () => clearInterval(interval);
  }, [capture]);

  const videoConstraints = {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    facingMode: facingMode
  };

  return (
    <div>
      <h1>QR Code Scanner</h1>
      <div style={{ position: 'relative' }}>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          width='100%'
        />
        <canvas ref={overlayCanvasRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}></canvas>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      <p>{data}</p>
      <button onClick={handleCameraSwap}>
        {facingMode === 'environment' ? 'Switch to Front Camera' : 'Switch to Back Camera'}
      </button>
      <br /><br />
      <input type="file" accept="image/*" onChange={handleFileChange} />
    </div>
  );
};

export default QRCodeScanner;
