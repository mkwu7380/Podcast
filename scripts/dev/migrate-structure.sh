#!/bin/bash

# Create necessary directories
mkdir -p src/contexts
mkdir -p src/types
mkdir -p src/styles

# Move components to appropriate locations
mv src/components/common/* src/components/
rmdir src/components/common

# Organize public assets
mkdir -p public/assets/images
mv public/icons/* public/assets/images/
rmdir public/icons

# Create initial style files
touch src/styles/global.css
touch src/styles/theme.js

# Create context files
touch src/contexts/AuthContext.js
touch src/contexts/ThemeContext.js

# Create type definitions
touch src/types/index.d.ts

# Create basic theme configuration
echo "export const theme = {
  colors: {
    primary: '#0070f3',
    secondary: '#1a1a1a',
    // Add more theme variables
  },
  // Add more theme configurations
};" > src/styles/theme.js

echo "Migration completed. Please verify the new structure and update imports as needed."
