'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const gzipSize = require('gzip-size');

const stylus = require('stylus');
const postcss = require('postcss');
const cssstats = require('cssstats');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano')({
    preset: [
        'default', {
            // 删除所有注释
            discardComments: {removeAll: true},
            normalizeUnicode: false
        }
    ]
});

/**
 * 根据css内容生成16进制hash字符串
 * @param {string} str css字符串
 * @returns {string} 16进制hash字符串
 */
function hash(str) {
    const hash = crypto.createHash('md5');
    return hash.update(str).digest('hex');
}

const encoding = 'utf8';
const inPath = path.join(__dirname, '../src/css/index.styl');
const outPath = hash => path.join(__dirname, `../dist/framework-${hash}.min.css`);
const outSourcemapPath = hash => path.join(__dirname, `../dist/framework-${hash}.min.css.map`);
const statsPath = hash => path.join(__dirname, `../dist/framework-${hash}.stats.json`);

const content = fs.readFileSync(inPath, encoding);
const style = stylus(content)
    .set('filename', inPath)
    // http://stylus-lang.com/docs/sourcemaps.html#options
    .set('sourcemap', {comment: true, inline: true});

const commentRegExp = new RegExp('\n*/\\*# sourceMappingURL=data:application/json;base64([\\s\\S]*)\\*/');

style.render((err, css) => {
    if (err) throw err;

    // 删除stylus生成的json;base64 sourcemap url
    css = css.replace(commentRegExp, '');

    const hashhex = hash(css)
        , minPath = outPath(hashhex)
        , processOption = {
        from: inPath,
        to: minPath,
        map: {
            // 使用stylus生成的sourcemap文件
            inline: false,
            prev: style.sourcemap,
            // sourcemap sourcesContent设置stylus源文件
            sourcesContent: true,
            // 生成sourcemap url
            annotation: true
        }
    };
    postcss([autoprefixer, cssnano])
        .use(cssstats())
        .process(css, processOption)
        .then(value => {
            if (fs.existsSync(minPath)) {
                fs.unlinkSync(minPath);
            }
            fs.writeFileSync(minPath, value.css, encoding);
            const minSize = fs.statSync(minPath).size / 1000;
            const minGZipSize = gzipSize.fileSync(minPath) / 1000;

            const sourcemapPath = outSourcemapPath(hashhex);
            if (fs.existsSync(sourcemapPath)) {
                fs.unlinkSync(sourcemapPath);
            }
            fs.writeFileSync(sourcemapPath, value.map, encoding);
            const sourcemapSize = fs.statSync(sourcemapPath).size / 1000;
            const sourcemapGZipSize = gzipSize.fileSync(sourcemapPath) / 1000;

            const cssstatsPath = statsPath(hashhex);
            if (fs.existsSync(cssstatsPath)) {
                fs.unlinkSync(cssstatsPath);
            }
            let cssstatsSize = undefined;
            let cssstatsGZipSize = undefined;
            const stats = value.messages.find(value => value.type === 'cssstats');
            if (stats) {
                fs.writeFileSync(cssstatsPath, JSON.stringify(stats, null, '\t'), encoding);
                cssstatsSize = fs.statSync(cssstatsPath).size / 1000;
                cssstatsGZipSize = gzipSize.fileSync(cssstatsPath) / 1000;
            }

            const tables = {};
            tables[`framework-${hashhex}.min.css`] = {
                Size: `${minSize} KB`,
                GZipSize: `${minGZipSize} KB`
            };
            tables[`framework-${hashhex}.min.css.map`] = {
                Size: `${sourcemapSize} KB`,
                GZipSize: `${sourcemapGZipSize} KB`
            };
            if (stats) {
                tables[`framework-${hashhex}.stats.json`] = {
                    Size: `${cssstatsSize} KB`,
                    GZipSize: `${cssstatsGZipSize} KB`
                };
            }
            console.table(tables);
        });
});
