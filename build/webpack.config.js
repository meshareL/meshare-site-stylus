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
                    {loader: MiniCssExtractPlugin.loader},
                    {loader: 'css-loader', options: {sourceMap: true}},
                    {loader: 'postcss-loader', options: {sourceMap: true}},
                    {loader: 'stylus-loader', options: {sourceMap: true}}
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
            cssProcessor: require('cssnano'),       // 引入cssnano配置压缩选项
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
            },
            canPrint: true              //是否将插件信息打印到控制台
        })
    ]
};