module.exports = {
  pages: {
    index: {
      entry: 'src/main.ts',
      title: 'Titan Control Center'
    }
  },

  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080'
      }
    }
  },

  pluginOptions: {
    'style-resources-loader': {
      preProcessor: 'scss',
      patterns: []
    }
  }
}
