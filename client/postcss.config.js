module.exports = {
  plugins: [
    require('postcss-preset-env')({
      stage: 3,
      features: {
        'nesting-rules': true,
        'custom-media-queries': true,
        'media-query-ranges': true,
        'custom-properties': true,
        'color-mod-function': true,
        'color-functional-notation': true,
        'custom-selectors': true,
        'color-hex-alpha': true,
        'color-rebeccapurple': true,
      },
      autoprefixer: {
        flexbox: 'no-2009',
      },
    }),
  ],
};

// This configuration enables modern CSS features while maintaining cross-browser compatibility.
