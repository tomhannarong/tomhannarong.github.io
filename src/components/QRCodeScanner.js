// src/QRCodeScanner.js
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';

const QRCodeScanner = () => {
  const [data, setData] = useState('No result');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' for back camera, 'user' for front camera
  const webcamRef = useRef(null);

  const handleCameraSwap = () => {
    setFacingMode((prevMode) => (prevMode === 'environment' ? 'user' : 'environment'));
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
            setData(code.data);
            // window.location.href = code.data
            console.log("data", code.data)
        }
      };
      img.src = imageSrc;
    }
  }, [webcamRef]);

  useEffect(() => {
  }, [data])
  
  useEffect(() => {
    const interval = setInterval(capture, 1000);
    return () => clearInterval(interval);
  }, [capture]);
  
  return (
    <div>
      <h1>QR Code Scanner</h1>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode }}
        style={{ width: '50%', height: '50%' }}
      />
      <p>{data}</p>
      <button onClick={handleCameraSwap}>
        {facingMode === 'environment' ? 'Switch to Front Camera' : 'Switch to Back Camera'}
      </button>
    </div>
  );
};

export default QRCodeScanner;
