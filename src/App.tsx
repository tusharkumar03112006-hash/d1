/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import PdfViewer from './components/PdfViewer';
import Chat from './components/Chat';

export interface Document {
  _id: string;
  filename: string;
  originalName: string;
  uploadDate: string;
}

export default function App() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(data);
      if (data.length > 0 && !selectedDoc) {
        setSelectedDoc(data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch documents', error);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      <Sidebar 
        documents={documents} 
        selectedDoc={selectedDoc} 
        onSelect={setSelectedDoc} 
        onUploadSuccess={fetchDocuments} 
      />
      
      <main className="flex-1 flex overflow-hidden">
        {selectedDoc ? (
          <>
            <div className="w-1/2 border-r border-gray-200 bg-white flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50 font-medium text-sm text-gray-600 flex justify-between items-center">
                <span>{selectedDoc.originalName}</span>
              </div>
              <PdfViewer filename={selectedDoc.filename} />
            </div>
            <div className="w-1/2 bg-white flex flex-col">
              <Chat documentId={selectedDoc._id} documentName={selectedDoc.originalName} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 flex-col gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-lg font-medium">No document selected</p>
            <p className="text-sm">Upload a PDF to start chatting</p>
          </div>
        )}
      </main>
    </div>
  );
}
