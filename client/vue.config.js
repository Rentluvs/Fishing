const { defineConfig } = require('@vue/cli-service')
const path = require('path')
const fs = require('fs')

module.exports = defineConfig({
  transpileDependencies: true,
  
  // Development server configuration
  devServer: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        logLevel: 'debug'
      }
    },
    // Enable gzip compression in development
    compress: true,
    // Hot reload
    hot: true
  },

  // Production optimizations
  productionSourceMap: false, // Disable source maps in production for smaller bundle
  
  configureWebpack: config => {
    // Resolve aliases
    config.resolve.alias = {
      '@': path.resolve(__dirname, 'src'),
      'components': path.resolve(__dirname, 'src/components'),
      'views': path.resolve(__dirname, 'src/views'),
      'stores': path.resolve(__dirname, 'src/stores'),
      'composables': path.resolve(__dirname, 'src/composables'),
      'utils': path.resolve(__dirname, 'src/utils')
    }

    // Production optimizations
    if (process.env.NODE_ENV === 'production') {
      // Enable bundle analysis with --analyze flag
      if (process.env.ANALYZE) {
        const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
        config.plugins.push(new BundleAnalyzerPlugin())
      }
      
      // Optimization
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            elementPlus: {
              test: /[\\/]node_modules[\\/]element-plus[\\/]/,
              name: 'element-plus',
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true
            }
          }
        }
      }
    }
  },

  chainWebpack: config => {
    // HTML plugin configuration
    config.plugin('html').tap(args => {
      args[0].title = '🐟 Hệ thống quản lý cá cảnh'
      args[0].meta = {
        viewport: 'width=device-width,initial-scale=1.0',
        description: 'Hệ thống quản lý cá cảnh chuyên nghiệp'
      }
      return args
    })

    // Skip preload/prefetch configuration for now to avoid errors

    // Skip advanced optimizations for now to avoid errors
  },

  // CSS optimizations - simplified
  css: {
    extract: process.env.NODE_ENV === 'production',
    sourceMap: process.env.NODE_ENV === 'development'
  }
})
