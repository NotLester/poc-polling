// components/poll/QRCode.tsx
"use client";

import { QrCode } from 'lucide-react';
import { useEffect, useState } from 'react';
import QRCodeReact from 'react-qr-code';

import { Button } from '../ui/button';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from '../ui/dialog';

type QRCodeProps = {
  pollId: string;
};

const QRCode = ({pollId}: QRCodeProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pollUrl, setPollUrl] = useState<string>("");

  useEffect(() => {
    // Set the poll URL when the component mounts
    // This ensures we have the correct origin for the QR code
    const fullPollUrl = `${window.location.origin}/poll/${pollId}`;
    setPollUrl(fullPollUrl);
  }, [pollId]);

  // Function to save QR code as SVG
  const downloadQRCode = () => {
    const svg = document.getElementById("poll-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      // Download the image
      const downloadLink = document.createElement("a");
      downloadLink.download = `poll-${pollId}-qrcode.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="w-4 h-4 mr-2" /> QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share via QR Code</DialogTitle>
          <DialogDescription>
            Scan this QR code to access the poll directly
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center p-4">
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-white rounded-md">
              <QRCodeReact
                id="poll-qr-code"
                value={pollUrl}
                size={250}
                level="H"
                fgColor="#000000"
                bgColor="#FFFFFF"
              />
            </div>
            <p className="text-xs text-muted-foreground break-all text-center">
              {pollUrl}
            </p>
            <Button onClick={downloadQRCode}>Download QR Code</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCode;
