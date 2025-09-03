import React, { useState, useEffect } from 'react';

// Define the License component
const License = () => {
  const [licenseText, setLicenseText] = useState('Loading license information...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLicense = async () => {
      try {
        // Use the correct path to the LICENSE file in the public directory
        const response = await fetch('/LICENSE', { 
          headers: { 'Cache-Control': 'no-cache' } 
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load license: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        setLicenseText(text);
      } catch (err) {
        console.error('Error loading license:', err);
        setError(`Failed to load license information: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchLicense();
  }, []);

  if (loading) {
    return (
      <div className="card fade-in">
        <div className="card-header">
          <h2 className="card-title">License</h2>
        </div>
        <div className="card-content" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading license information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card fade-in">
        <div className="card-header">
          <h2 className="card-title">License</h2>
        </div>
        <div className="card-content" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div className="error-message" style={{ color: '#e74c3c', marginBottom: '1rem' }}>
            <p>⚠️ {error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginTop: '1rem'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card fade-in">
      <div className="card-header" style={{ padding: '1rem' }}>
        <h2 className="card-title">MIT License</h2>
        <div className="card-badge">Legal</div>
      </div>
      <div className="card-content" style={{ 
        maxHeight: '70vh', 
        overflowY: 'auto'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          padding: '1rem',
          borderRadius: '4px',
          overflow: 'auto',
          flex: '1',
          margin: 0
        }}>
          <pre style={{
            whiteSpace: 'pre-wrap',
            fontFamily: 'Roboto Mono, monospace',
            lineHeight: '1.7',
            margin: 0,
            color: 'var(--text-primary)',
            fontSize: '0.9em',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}>
            {licenseText}
          </pre>
        </div>
        <div style={{
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          padding: '0.75rem 0 0',
          borderTop: '1px solid var(--border-color)',
          margin: 0
        }}>
          This project is licensed under the MIT License.
        </div>
      </div>
    </div>
  );
};

export default License;
