const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const { HotModuleReplacementPlugin } = require('webpack');
const path = require('path');

module.exports = (env, argv) => {
  return merge(common(env, argv), {
    mode: 'development',
    devtool: 'eval-source-map',
    output: {
      pathinfo: false,
      filename: 'js/[name].bundle.js',
      chunkFilename: 'js/[name].chunk.js',
      publicPath: '/',
    },
    optimization: {
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: false,
      runtimeChunk: true,
      emitOnErrors: true,
    },
    plugins: [
      new HotModuleReplacementPlugin(),
      new ReactRefreshWebpackPlugin({
        overlay: {
          sockIntegration: 'wds',
        },
      }),
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
        publicPath: '/',
      },
      compress: true,
      port: 3000,
      hot: true,
      open: true,
      historyApiFallback: true,
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
        progress: true,
      },
      proxy: {
        '/api': {
          target: `http://localhost:${process.env.API_PORT || 3001}`,
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: `ws://localhost:${process.env.API_PORT || 3001}`,
          ws: true,
        },
      },
    },
  });
};
