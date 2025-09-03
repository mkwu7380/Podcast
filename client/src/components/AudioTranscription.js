import React, { useState } from 'react';

/**
 * Modern Audio Transcription Component
 * Features enhanced file upload UI, improved transcript display, and better UX
 */
const AudioTranscription = ({ 
  onTranscribe, 
  onRealTimeTranscribe, 
  transcript, 
  rtTranscript, 
  error,
  audioRef 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    if (audioRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      audioRef.current.files = dt.files;
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find(file => file.type.startsWith('audio/'));
    if (audioFile) {
      handleFileSelect(audioFile);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (selectedFile && !isTranscribing) {
      setIsTranscribing(true);
      try {
        await onTranscribe(e);
      } finally {
        setIsTranscribing(false);
      }
    }
  };

  const handleRealTimeTranscribe = async () => {
    if (!isRealTimeActive) {
      setIsRealTimeActive(true);
      try {
        await onRealTimeTranscribe();
      } finally {
        setIsRealTimeActive(false);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileDuration = (file) => {
    return new Promise((resolve) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        resolve(Math.round(audio.duration));
      };
      audio.onerror = () => resolve(0);
      audio.src = URL.createObjectURL(file);
    });
  };

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="transcription-container fade-in">
      {/* Introduction */}
      <div className="transcription-intro" style={{
        background: 'var(--bg-secondary)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{
          color: 'var(--text-primary)',
          fontSize: '1.2rem',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{ marginRight: '0.5rem' }}>🎤</span>
          Audio Transcription Service
        </h3>
        <p style={{
          color: 'var(--text-secondary)',
          margin: 0,
          lineHeight: '1.6'
        }}>
          Upload your podcast audio files to get accurate AI-powered transcriptions. 
          Supports MP3, WAV, M4A, and other common audio formats. 
          Get both standard and real-time transcription options.
        </p>
      </div>

      {/* File Upload Section */}
      <div className="upload-section" style={{
        marginBottom: '2rem'
      }}>
        <form onSubmit={handleFormSubmit}>
          <div 
            className={`file-drop-zone ${isDragOver ? 'drag-over' : ''}`}
            style={{
              border: `2px dashed ${isDragOver ? '#667eea' : 'var(--border-color)'}`,
              borderRadius: '12px',
              padding: '3rem 2rem',
              textAlign: 'center',
              background: isDragOver ? 'var(--bg-secondary)' : 'var(--bg-primary)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              position: 'relative'
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => audioRef.current?.click()}
          >
            <input 
              type="file" 
              accept="audio/*" 
              ref={audioRef} 
              required 
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) handleFileSelect(file);
              }}
            />
            
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              color: isDragOver ? '#667eea' : 'var(--text-tertiary)'
            }}>
              {selectedFile ? '🎧' : '📁'}
            </div>
            
            {selectedFile ? (
              <div className="selected-file-info">
                <h4 style={{
                  color: '#2d3748',
                  marginBottom: '0.5rem',
                  fontSize: '1.1rem'
                }}>
                  {selectedFile.name}
                </h4>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '2rem',
                  marginBottom: '1rem',
                  color: '#718096',
                  fontSize: '0.9rem'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '0.25rem' }}>📄</span>
                    {formatFileSize(selectedFile.size)}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '0.25rem' }}>📊</span>
                    {selectedFile.type}
                  </span>
                </div>
                <p style={{
                  margin: 0,
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem'
                }}>
                  File ready for transcription. Click "Transcribe" below to start.
                </p>
              </div>
            ) : (
              <div>
                <h4 style={{
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem',
                  fontSize: '1.1rem'
                }}>
                  {isDragOver ? 'Drop your audio file here' : 'Drop audio file or click to browse'}
                </h4>
                <p style={{
                  margin: 0,
                  color: 'var(--text-tertiary)',
                  fontSize: '0.9rem'
                }}>
                  Supports MP3, WAV, M4A, FLAC, and more
                </p>
              </div>
            )}
          </div>
          
          {selectedFile && (
            <div className="transcription-actions" style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '1.5rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button 
                type="submit" 
                className={`btn btn-primary ${isTranscribing ? 'btn-loading' : ''}`}
                disabled={isTranscribing || !selectedFile}
                style={{
                  minWidth: '160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {isTranscribing ? (
                  <>
                    <div className="spinner" style={{ width: '1rem', height: '1rem' }}></div>
                    Transcribing...
                  </>
                ) : (
                  <>
                    <span>📝</span>
                    Transcribe Audio
                  </>
                )}
              </button>
              
              <button 
                type="button" 
                onClick={handleRealTimeTranscribe}
                className={`btn btn-outline ${isRealTimeActive ? 'btn-loading' : ''}`}
                disabled={isRealTimeActive || !selectedFile}
                style={{
                  minWidth: '160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {isRealTimeActive ? (
                  <>
                    <div className="spinner" style={{ width: '1rem', height: '1rem' }}></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    Real-Time Mode
                  </>
                )}
              </button>
              
              <button 
                type="button" 
                onClick={() => {
                  setSelectedFile(null);
                  if (audioRef.current) audioRef.current.value = '';
                }}
                className="btn btn-secondary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>✕</span>
                Clear
              </button>
            </div>
          )}
        </form>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="error fade-in" style={{
          marginBottom: '2rem',
          padding: '1rem 1.5rem',
          background: 'var(--error-bg)',
          color: 'var(--error-text)',
          borderRadius: '10px',
          border: '1px solid var(--error-border)',
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{ marginRight: '0.75rem', fontSize: '1.1rem' }}>⚠️</span>
          <div>
            <strong>Transcription Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Transcription Results */}
      <div className="transcription-results">
        {/* Standard Transcript */}
        {transcript && (
          <div className="transcript-card fade-in" style={{
            background: 'var(--bg-primary)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: 'var(--shadow-medium)',
            border: '1px solid var(--border-color)'
          }}>
            <div className="transcript-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <h3 style={{
                color: 'var(--text-primary)',
                fontSize: '1.25rem',
                margin: 0,
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{ marginRight: '0.5rem' }}>📄</span>
                Audio Transcript
              </h3>
              
              <div style={{
                display: 'flex',
                gap: '0.5rem'
              }}>
                <button 
                  onClick={() => navigator.clipboard.writeText(transcript)}
                  className="btn btn-sm btn-outline"
                  title="Copy transcript to clipboard"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>📋</span>
                  Copy
                </button>
                
                <button 
                  onClick={() => {
                    const blob = new Blob([transcript], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'transcript.txt';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="btn btn-sm btn-outline"
                  title="Download transcript as text file"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>💾</span>
                  Download
                </button>
              </div>
            </div>
            
            <div className="transcript-content" style={{
              background: 'var(--bg-secondary)',
              borderRadius: '8px',
              padding: '1.5rem',
              maxHeight: '400px',
              overflowY: 'auto',
              border: '1px solid var(--border-color)'
            }}>
              <pre style={{
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                lineHeight: '1.6',
                margin: 0,
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                color: '#2d3748'
              }}>
                {transcript}
              </pre>
            </div>
            
            <div className="transcript-stats" style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'var(--bg-secondary)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)'
            }}>
              <span>📊 Words: {transcript.split(' ').length}</span>
              <span>🕰️ Characters: {transcript.length}</span>
              <span>📅 Generated: {new Date().toLocaleString()}</span>
            </div>
          </div>
        )}
        
        {/* Real-Time Transcript */}
        {rtTranscript && (
          <div className="transcript-card realtime fade-in" style={{
            background: 'var(--bg-primary)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            border: '2px solid var(--border-color)',
            position: 'relative'
          }}>
            <div className="realtime-indicator" style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: '#48bb78',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                background: 'white',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }}></div>
              LIVE
            </div>
            
            <div className="transcript-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <h3 style={{
                color: 'var(--text-primary)',
                fontSize: '1.25rem',
                margin: 0,
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{ marginRight: '0.5rem' }}>⚡</span>
                Real-Time Transcript
              </h3>
              
              <button 
                onClick={() => navigator.clipboard.writeText(rtTranscript)}
                className="btn btn-sm btn-primary"
                title="Copy real-time transcript"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>📋</span>
                Copy Live
              </button>
            </div>
            
            <div className="transcript-content" style={{
              background: 'var(--bg-secondary)',
              borderRadius: '8px',
              padding: '1.5rem',
              maxHeight: '400px',
              overflowY: 'auto',
              border: '1px solid var(--border-color)'
            }}>
              <pre style={{
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                lineHeight: '1.6',
                margin: 0,
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                color: '#2d3748'
              }}>
                {rtTranscript}
              </pre>
            </div>
          </div>
        )}
        
        {/* Usage Tips */}
        {!transcript && !rtTranscript && (
          <div className="tips-section" style={{
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              color: 'var(--text-secondary)',
              fontSize: '1.1rem',
              marginBottom: '1rem'
            }}>
              💡 Transcription Tips
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                background: 'var(--bg-primary)',
                padding: '1.5rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎧</div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Audio Quality</h4>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', margin: 0 }}>
                  Clear audio with minimal background noise produces the best transcription results.
                </p>
              </div>
              
              <div style={{
                background: 'var(--bg-primary)',
                padding: '1.5rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏱️</div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>File Length</h4>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', margin: 0 }}>
                  Shorter files (under 10 minutes) typically process faster and more accurately.
                </p>
              </div>
              
              <div style={{
                background: 'var(--bg-primary)',
                padding: '1.5rem',
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Real-Time Mode</h4>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem', margin: 0 }}>
                  Use real-time transcription for live audio streams or ongoing recordings.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AudioTranscription;
