const fs = require('fs-extra')
const path = require('path')
const webpack = require('webpack')

const AssetsPlugin = require('assets-webpack-plugin')
const CleanPlugin = require('clean-webpack-plugin')
const FriendlyErrorsPlugin = require('razzle-dev-utils/FriendlyErrorsPlugin')
const nodeExternals = require('webpack-node-externals')
const StartServerPlugin = require('start-server-webpack-plugin')
const StatsPlugin = require('stats-webpack-plugin')

const { env, helpers } = require('./env')
const paths = require('./paths')

module.exports = (target = 'node') => {
  const { IS_DEV, NODE_DEV, NODE_PROD, WEB_DEV, WEB_PROD } = helpers(target)

  let config = {
    devtool: IS_DEV ? 'cheap-module-source-map' : false,
    mode: IS_DEV ? 'development' : 'production',
    resolve: {
      modules: [paths.appNodeModules, paths.ownNodeModules],
      extensions: ['.js', '.json', '.jsx', '.mjs'],
      alias: {
        // This is required so symlinks work during development.
        'webpack/hot/poll': require.resolve('webpack/hot/poll'),
        'tapestry.config.js': paths.appTapestryConfig
      }
    },
    resolveLoader: {
      modules: [paths.appNodeModules, paths.ownNodeModules]
    },
    module: {
      strictExportPresence: true,
      rules: [
        // Transform ES6 with Babel
        {
          test: /\.(js|jsx|mjs)$/,
          loader: require.resolve('babel-loader'),
          exclude: /node_modules(?!\/tapestry-lite)/,
          options: {
            babelrc: true,
            cacheDirectory: true,
            presets: [require('babel-preset-razzle')],
            plugins: [
              process.env.CSS_PLUGIN === 'emotion' &&
                require('babel-plugin-emotion'),
              WEB_DEV && require('react-hot-loader/babel')
            ].filter(Boolean)
          }
        },
        {
          test: /\.(css|jpe?g|png|svg|ico|woff(2)?)$/,
          loader: require.resolve('file-loader'),
          options: {
            publicPath: IS_DEV ? 'http://localhost:4001' : '/_assets',
            emitFile: WEB_DEV || WEB_PROD
          }
        }
      ]
    },
    plugins: []
  }

  if (NODE_DEV) {
    Object.assign(config, {
      entry: ['webpack/hot/poll?1000', paths.ownDevServer],
      output: {
        path: paths.appBuild,
        filename: 'server.js'
      },
      plugins: [
        new StartServerPlugin({
          name: 'server.js',
          signal: false
        }),
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new FriendlyErrorsPlugin({
          target: 'node',
          onSuccessMessage: 'Tapestry Lite is Running',
          verbose: process.env.NODE_ENV === 'test'
        })
      ],
      externals: [
        nodeExternals({
          modulesDirs: [paths.appNodeModules],
          whitelist: ['webpack/hot/poll?1000']
        })
      ].filter(Boolean),
      watch: true
    })
  }

  if (NODE_PROD) {
    Object.assign(config, {
      entry: [paths.ownProdServer],
      output: {
        path: paths.appBuild,
        filename: 'server.production.js',
        libraryTarget: 'commonjs2'
      }
    })
  }

  if (WEB_DEV) {
    Object.assign(config, {
      entry: {
        client: [
          'webpack-dev-server/client?http://localhost:4001/',
          'webpack/hot/only-dev-server',
          paths.ownClientIndex
        ]
      },
      output: {
        path: paths.appBuildPublic,
        publicPath: 'http://localhost:4001/',
        pathinfo: true,
        filename: 'static/js/bundle.js',
        chunkFilename: 'static/js/[name].chunk.js',
        devtoolModuleFilenameTemplate: info =>
          path.resolve(info.resourcePath).replace(/\\/g, '/')
      },
      plugins: [
        new StatsPlugin('../stats.json'),
        new AssetsPlugin({
          path: paths.appBuild,
          filename: 'assets.json'
        })
      ],
      devServer: {
        disableHostCheck: true,
        clientLogLevel: 'none',
        // Enable gzip compression of generated files.
        compress: true,
        // watchContentBase: true,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        host: 'localhost',
        hot: true,
        noInfo: true,
        overlay: false,
        port: 8080,
        quiet: true,
        // By default files from `contentBase` will not trigger a page reload.
        // Reportedly, this avoids CPU overload on some systems.
        // https://github.com/facebookincubator/create-react-app/issues/293
        watchOptions: {
          ignored: /node_modules/
        }
      }
    })
  }

  if (WEB_PROD) {
    Object.assign(config, {
      entry: {
        client: [paths.ownClientIndex]
      },
      output: {
        path: paths.appBuildPublic,
        sourceMapFilename: '[name].[chunkhash].map',
        filename: '[name].[chunkhash].js',
        publicPath: '/_assets/'
      },
      plugins: [
        new StatsPlugin('../stats.json'),
        new AssetsPlugin({
          path: paths.appBuild,
          filename: 'assets.json'
        })
      ],
      optimization: {
        runtimeChunk: true,
        splitChunks: {
          chunks: 'all'
        }
      }
    })
  }

  config.plugins.push(
    new CleanPlugin(['.tapestry'], {
      root: process.cwd(),
      verbose: false
    }),
    new webpack.DefinePlugin(env(target))
  )

  // use custom webpack config
  if (fs.existsSync(paths.appWebpackConfig)) {
    config = require(paths.appWebpackConfig)(config, {}, webpack)
  }

  console.log(JSON.stringify(config, null, 2))

  return config
}
