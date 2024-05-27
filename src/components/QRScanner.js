import React, { useState, useRef } from 'react';
import QrReader from 'react-qr-scanner';

const QRScanner = () => {
  const [result, setResult] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // Default to rear camera
  const qrRef = useRef(null);

  const handleScan = (data) => {
    if (data) {
      setResult(data.text);
      // Open the scanned URL in a new tab
      window.open(data.text, '_blank');
    }
  };

  const handleError = (error) => {
    console.error(error);
  };

  const toggleFacingMode = () => {
    setFacingMode((prevFacingMode) =>
      prevFacingMode === 'environment' ? 'user' : 'environment'
    );
  };

  return (
    <div>
      <QrReader
        ref={qrRef}
        delay={300}
        onError={handleError}
        onScan={handleScan}
        facingMode={facingMode}
        style={{ width: '50%' }}
      />
      <p>{result}</p>
      <button onClick={toggleFacingMode}>Toggle Camera</button>
    </div>
  );
};

export default QRScanner;
