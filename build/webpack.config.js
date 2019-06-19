const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: {framework: './src/js/main.js'},
    output: {
        path: path.join(__dirname, '../dist'),
        filename: '[name]-[hash].min.js',
        chunkFilename: '[id]-[hash].min.js'
    },
    module: {
        rules: [
            {
                test: /\.styl$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            publicPath: path.join(__dirname, '../dist')
                        }
                    },
                    'css-loader',
                    'postcss-loader',
                    'stylus-loader'
                ]
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name]-[hash].min.css',
            chunkFilename: '[id]-[hash].min.css'
        }),
        new OptimizeCSSAssetsPlugin({
            assetNameRegExp: /\.css$/g,
            cssProcessor: require('cssnano'),
            cssProcessorOptions: {
                preset: [
                    'default', {
                        discardComments: {removeAll: true},
                        normalizeUnicode: false
                    }
                ],
                map: {
                    inline: false,      // 不生成内联映射,这样配置就会生成一个source-map文件
                    annotation: true    // 向css文件添加source-map路径注释
                }
            }
        })
    ],
    optimization: {
        minimize: true
    }
};