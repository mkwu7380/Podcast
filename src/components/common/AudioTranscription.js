/**
 * Modern Audio Transcription Component
 * Features drag-and-drop upload, real-time transcription, and improved UI
 */
import React, { useState, useRef, useEffect } from 'react';

function AudioTranscription() {
  const [file, setFile] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);
  
  useEffect(() => {
    // Listen for paste events to capture clipboard audio
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file' && items[i].type.startsWith('audio/')) {
          const file = items[i].getAsFile();
          handleFileSelection(file);
          e.preventDefault();
          break;
        }
      }
    };
    
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);
  
  // Handle file drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave' || e.type === 'drop') {
      setDragActive(false);
    }
  };
  
  // Handle dropped files
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelection(droppedFile);
    }
  };
  
  // Handle file selection from input or drop
  const handleFileSelection = (selectedFile) => {
    if (!selectedFile) return;
    
    // Check if file is audio
    if (!selectedFile.type.startsWith('audio/')) {
      setError('Please upload an audio file (MP3, WAV, etc.)');
      return;
    }
    
    // Check file size (max 100MB)
    const MAX_SIZE = 100 * 1024 * 1024; // 100MB
    if (selectedFile.size > MAX_SIZE) {
      setError('File is too large. Maximum size is 100MB.');
      return;
    }
    
    // Reset states
    setFile(selectedFile);
    setTranscription('');
    setError('');
    setProgress(0);
  };
  
  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };
  
  // Handle transcription process
  const handleTranscribe = async () => {
    if (!file) {
      setError('Please select an audio file first');
      return;
    }
    
    setLoading(true);
    setError('');
    setTranscription('');
    
    try {
      // Create FormData to send file
      const formData = new FormData();
      formData.append('audioFile', file);
      
      // Set up progress monitoring
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setProgress(percentComplete);
        }
      });
      
      // Create promise for XHR request
      const transcribeRequest = new Promise((resolve, reject) => {
        xhr.open('POST', '/api/transcribe');
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error('Invalid response from server'));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.error || 'Transcription failed'));
            } catch (e) {
              reject(new Error(`Server error: ${xhr.status}`));
            }
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error occurred'));
        };
        
        xhr.send(formData);
      });
      
      // Wait for transcription
      const response = await transcribeRequest;
      
      if (response.data && response.data.transcription) {
        setTranscription(response.data.transcription);
      } else {
        throw new Error('No transcription returned');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setError(err.message || 'Error during transcription');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };
  
  // Handle copy to clipboard
  const handleCopyToClipboard = () => {
    if (!transcription) return;
    
    navigator.clipboard.writeText(transcription)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };
  
  // Handle file removal
  const handleRemoveFile = () => {
    setFile(null);
    setTranscription('');
    setError('');
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="transcription-container">
      <div className="transcription-header">
        <h2>Audio Transcription</h2>
        <p className="transcription-intro">
          Upload an audio file to get a text transcription. Support for MP3, WAV, M4A, and more.
          Drag and drop your file or click to select.
        </p>
      </div>
      
      {/* File Drop Zone */}
      <div 
        ref={dropAreaRef}
        className={`drop-area ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        
        {file ? (
          <div className="selected-file">
            <div className="file-info">
              <span className="file-icon">🎵</span>
              <div className="file-details">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>
            <div className="file-actions">
              <button 
                className="btn btn-secondary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile();
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="drop-prompt">
            <div className="drop-icon">
              <span role="img" aria-label="upload">🎤</span>
            </div>
            <p className="drop-message">
              <strong>Drag & drop an audio file here</strong> or <span className="click-text">click to select</span>
            </p>
            <p className="drop-hint">
              Supports MP3, WAV, M4A files up to 100MB
            </p>
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
      )}
      
      {/* Transcribe Button */}
      <div className="transcribe-actions">
        <button 
          className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
          onClick={handleTranscribe}
          disabled={!file || loading}
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              Transcribing...
            </>
          ) : (
            <>
              <span role="img" aria-label="transcribe">🎧</span>
              Transcribe Audio
            </>
          )}
        </button>
        
        {/* Progress Bar */}
        {loading && progress > 0 && (
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ width: `${progress}%` }}
            ></div>
            <span className="progress-text">{progress}%</span>
          </div>
        )}
      </div>
      
      {/* Processing Info */}
      {loading && (
        <div className="processing-info">
          <div className="processing-steps">
            <div className={`processing-step ${progress < 30 ? 'active' : 'completed'}`}>
              <span className="step-number">1</span>
              <span className="step-name">Uploading</span>
            </div>
            <div className={`processing-step ${progress >= 30 && progress < 70 ? 'active' : (progress >= 70 ? 'completed' : '')}`}>
              <span className="step-number">2</span>
              <span className="step-name">Processing</span>
            </div>
            <div className={`processing-step ${progress >= 70 && progress < 100 ? 'active' : (progress >= 100 ? 'completed' : '')}`}>
              <span className="step-number">3</span>
              <span className="step-name">Transcribing</span>
            </div>
          </div>
          <p className="processing-note">
            This may take a few minutes depending on the file size and duration.
          </p>
        </div>
      )}
      
      {/* Transcription Results */}
      {transcription && (
        <div className="transcription-results">
          <div className="results-header">
            <h3>Transcription Results</h3>
            <div className="results-actions">
              <button 
                className={`btn btn-secondary btn-sm ${copied ? 'copied' : ''}`}
                onClick={handleCopyToClipboard}
              >
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
          </div>
          <div className="results-content">
            <pre>{transcription}</pre>
          </div>
        </div>
      )}
      
      {/* Tips */}
      <div className="transcription-tips">
        <h4>Tips for Better Transcriptions:</h4>
        <ul>
          <li>Use high-quality audio recordings with minimal background noise</li>
          <li>Shorter audio files (under 30 minutes) process faster</li>
          <li>Clear speech with moderate speaking pace works best</li>
          <li>Podcasts, interviews, and lectures are ideal for transcription</li>
        </ul>
      </div>
    </div>
  );
}

export default AudioTranscription;
