import React from 'react';

// Define the License component
const License = () => {
  const licenseText = `MIT License

Copyright (c) 2025 Podcast App Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

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
