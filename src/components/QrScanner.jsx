import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QrScanner({ onScanSuccess, onScanError }) {
  const onScanSuccessRef = useRef(onScanSuccess);
  const onScanErrorRef = useRef(onScanError);

  // Keep refs updated with the latest callbacks
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
    onScanErrorRef.current = onScanError;
  }, [onScanSuccess, onScanError]);

  useEffect(() => {
    // Create scanner config
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      supportedScanTypes: [0] // QR Code only
    };

    // Initialize scanner
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      config,
      /* verbose= */ false
    );

    html5QrcodeScanner.render(
      (decodedText, decodedResult) => {
        if (onScanSuccessRef.current) {
          onScanSuccessRef.current(decodedText, decodedResult);
        }
      },
      (errorMessage) => {
        if (onScanErrorRef.current) {
          onScanErrorRef.current(errorMessage);
        }
      }
    );

    // Cleanup when component unmounts
    return () => {
      html5QrcodeScanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, []); // Empty dependency array prevents restarting the camera stream

  return (
    <div className="w-full max-w-sm mx-auto overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm relative">
      <div id="qr-reader" className="w-full border-none"></div>
    </div>
  );
}
