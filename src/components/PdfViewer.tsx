import React from 'react';

interface PdfViewerProps {
  filename: string;
}

export default function PdfViewer({ filename }: PdfViewerProps) {
  // Use the APP_URL or relative path to serve the PDF
  const pdfUrl = `/uploads/${filename}`;

  return (
    <div className="flex-1 w-full h-full bg-gray-100">
      <iframe
        src={`${pdfUrl}#toolbar=0`}
        className="w-full h-full border-none"
        title="PDF Viewer"
      />
    </div>
  );
}
