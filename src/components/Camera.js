// src/Camera.js
import React, { useRef, useEffect } from 'react';

const Camera = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [qrCodeData, setQrCodeData] = useState('');
  
    useEffect(() => {
      const startVideo = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1920 }, // Requesting 1920px width (Full HD resolution)
              height: { ideal: 1080 }, // Requesting 1080px height (Full HD resolution)
            }
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error('Error accessing the camera: ', err);
        }
      };
  
      startVideo();
  
      return () => {
        if (videoRef.current && videoRef.current.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
      };
    }, []);
  
    useEffect(() => {
      const scanQrCode = () => {
        if (videoRef.current && canvasRef.current) {
          const canvas = canvasRef.current;
          const video = videoRef.current;
          const context = canvas.getContext('2d');
  
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
  
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
  
          if (code) {
            setQrCodeData(code.data);
          } else {
            requestAnimationFrame(scanQrCode);
          }
        }
      };
  
      if (videoRef.current) {
        requestAnimationFrame(scanQrCode);
      }
    }, [videoRef.current]);
  
    return (
      <div>
        <video
          ref={videoRef}
          style={{ width: '100%', height: 'auto' }}
          autoPlay
          playsInline
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        {qrCodeData && <p>QR Code Data: {qrCodeData}</p>}
      </div>
    );
  };

export default Camera;
