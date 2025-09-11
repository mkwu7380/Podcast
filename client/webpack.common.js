const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'js/[name].[contenthash].bundle.js' : 'js/[name].bundle.js',
      publicPath: '/',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader'
          }
        },
        {
          test: /\.(sa|sc|c)ss$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'postcss-loader',
            'sass-loader'
          ]
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'postcss-loader'
          ]
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/images/[name].[hash][ext][query]'
          }
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/fonts/[name].[hash][ext][query]'
          }
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        filename: 'index.html',
        favicon: './public/favicon.ico',
        minify: isProduction ? {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true
        } : false
      }),
      new CopyWebpackPlugin({
        patterns: [
          { 
            from: 'public',
            to: '',
            globOptions: {
              ignore: ['**/index.html']
            }
          }
        ]
      }),
      new Dotenv({
        path: isProduction ? './.env.production' : './.env.development',
        systemvars: true
      }),
      ...(process.env.ANALYZE ? [new BundleAnalyzerPlugin()] : [])
    ].filter(Boolean),
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src/')
      }
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
              return `vendor.${packageName.replace('@', '')}`;
            },
          },
        },
      },
      runtimeChunk: 'single',
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    devServer: {
      historyApiFallback: true,
      static: {
        directory: path.join(__dirname, 'public')
      },
      compress: true,
      port: 3000,
      hot: true,
      proxy: {
        '/api': {
          target: `http://localhost:${process.env.API_PORT || 3001}`,
          changeOrigin: true,
          secure: false
        },
        '/ws': {
          target: `ws://localhost:${process.env.API_PORT || 3001}`,
          ws: true
        }
      },
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
      },
    },
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
  };
};
