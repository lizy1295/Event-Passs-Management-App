import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QrScanner({ onScanSuccess, onScanError }) {
  const scannerRef = useRef(null);

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
        // Debounce or handle success 
        // html5-qrcode scans very fast. The parent should handle debouncing
        // so we don't spam the database with the same scan.
        if (onScanSuccess) {
           onScanSuccess(decodedText, decodedResult);
        }
      },
      (errorMessage) => {
        if (onScanError) {
           onScanError(errorMessage);
        }
      }
    );

    // Cleanup when component unmounts
    return () => {
      html5QrcodeScanner.clear().catch(error => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div className="w-full max-w-sm mx-auto overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm relative">
      <div id="qr-reader" className="w-full border-none"></div>
    </div>
  );
}
