import React, { useState, useRef } from 'react';
import { Document } from '../App';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface SidebarProps {
  documents: Document[];
  selectedDoc: Document | null;
  onSelect: (doc: Document) => void;
  onUploadSuccess: () => void;
}

export default function Sidebar({ documents, selectedDoc, onSelect, onUploadSuccess }: SidebarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    setIsUploading(true);
    setUploadStatus('Parsing PDF...');
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      // 1. Upload and parse PDF
      const parseRes = await fetch('/api/upload-parse', {
        method: 'POST',
        body: formData,
      });

      if (!parseRes.ok) {
        throw new Error('Failed to parse PDF');
      }

      const { filename, originalName, chunks } = await parseRes.json();

      // 2. Get embeddings using Gemini API
      setUploadStatus('Generating embeddings...');
      // @ts-ignore
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });
      
      const chunkData = [];
      for (let i = 0; i < chunks.length; i += 100) {
        const batch = chunks.slice(i, i + 100);
        const embeddingsResult = await ai.models.embedContent({
          model: 'gemini-embedding-2-preview',
          contents: batch,
        });
        
        batch.forEach((chunk: string, index: number) => {
          chunkData.push({
            text: chunk,
            embedding: embeddingsResult.embeddings[index].values,
          });
        });
      }

      // 3. Save to database
      setUploadStatus('Saving to database...');
      const saveRes = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename,
          originalName,
          chunks: chunkData,
        }),
      });

      if (!saveRes.ok) {
        throw new Error('Failed to save document');
      }

      onUploadSuccess();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload and process PDF');
    } finally {
      setIsUploading(false);
      setUploadStatus('');
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          RAG Chat
        </h1>
      </div>

      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {isUploading ? 'Processing...' : 'Upload PDF'}
        </button>
        {isUploading && (
          <p className="text-xs text-center text-gray-500 mt-2">{uploadStatus}</p>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          accept="application/pdf"
          className="hidden"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2 mt-2">
          Your Documents
        </h2>
        {documents.length === 0 ? (
          <p className="text-sm text-gray-500 px-2 italic">No documents uploaded yet.</p>
        ) : (
          <ul className="space-y-1">
            {documents.map((doc) => (
              <li key={doc._id}>
                <button
                  onClick={() => onSelect(doc)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm truncate transition-colors ${
                    selectedDoc?._id === doc._id
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={doc.originalName}
                >
                  {doc.originalName}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
