var fs = require("fs"),
    fileFinder = require("fs-finder"),
    path = require("path"),
    sprintf = require("sprintf-js").sprintf,
    mkdirp = require('mkdirp'),
    moment = require('moment'),
    Args = require('arg-parser'), args,
    UglifyJS = require("uglify-js"),
    sqwish = require('sqwish');

args = new Args('web-compressor', '0.0.1', 'minify html, js and css');

args.add({ name: 'input', desc: 'input dir to compress', switches: [ '-i', '--input-dir'], required: true});
args.add({ name: 'output', desc: 'output dir', switches: [ '-o', '--output-dir'], required: true });
args.add({ name: 'debug', desc: 'debug mode', switches: [ '-d', '--debug'] });

if (!args.parse()) throw "args parse failed.";

const config = JSON.parse(fs.readFileSync("./config.json"));

if (typeof args.params.input != "string" || !fs.existsSync(args.params.input)) {
    console.error("input dir invalid or not exists.");
    process.exit(0);
}

if (!fs.existsSync(args.params.output)) {
    mkdirp.sync(path.basename(args.params.output), 0777);
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};
/**
 * compress javascript files
 * @type {*}
 */
var jsFiles = fileFinder.from(args.params.input).exclude('tools').size('>', 0).findFiles("*.js");
while(jsFile = jsFiles.pop()) {
    console.log(sprintf("compress javascript. file:'%s'", jsFile));
    var jsFile = path.normalize(jsFile),
        outputFilename = path.normalize(args.params.output + path.sep + path.relative(args.params.input, jsFile));

    if (!fs.existsSync(path.dirname(outputFilename))) {
        mkdirp.sync(path.dirname(outputFilename), 0777);
    }

    var javascript = fs.readFileSync(jsFile, {"encoding" : "utf8"});
    for (var key in config.variables) {
        var find = key.toString();
        javascript = javascript.replaceAll(find, config.variables[key]);
    }

    var mini = UglifyJS.minify(javascript, {"fromString" : true});
    fs.writeFileSync(outputFilename, mini.code, {"encoding" : "utf8", "mode" : 0666, "flag" : "a"});
}

/**
 * compress css files
 * @type {*}
 */
var cssFiles = fileFinder.from(args.params.input).exclude('tools').size('>', 0).findFiles("*.css");
while(cssFile = cssFiles.pop()) {
    console.log(sprintf("compress cascading style sheets(css). file:'%s'", cssFile));
    var cssFile = path.normalize(cssFile),
        outputFilename = path.normalize(args.params.output + path.sep + path.relative(args.params.input, cssFile));

    if (!fs.existsSync(path.dirname(outputFilename))) {
        mkdirp.sync(path.dirname(outputFilename), 0777);
    }

    var css = fs.readFileSync(cssFile, {"encoding" : "utf8"});
    for (var key in config.variables) {
        var find = key.toString();
        css = css.replaceAll(find, config.variables[key]);
    }

    var mini = sqwish.minify(css);
    fs.writeFileSync(outputFilename, mini, {"encoding" : "utf8", "mode" : 0666, "flag" : "a"});
}

var htmlFiles = fileFinder.from(args.params.input).exclude('tools').size('>', 0).findFiles("*.html");
while(htmlFile = htmlFiles.pop()) {
    console.log(sprintf("process html. file:'%s'", htmlFile));
    var htmlFile = path.normalize(htmlFile),
        outputFilename = path.normalize(args.params.output + path.sep + path.relative(args.params.input, htmlFile));

    if (!fs.existsSync(path.dirname(outputFilename))) {
        mkdirp.sync(path.dirname(outputFilename), 0777);
    }

    var html = fs.readFileSync(htmlFile, {"encoding" : "utf8"});
    html = html.replace(/<!--([\s\S]*?)-->/mig, '$1');

    for (var key in config.variables) {
        var find = key.toString();
        html = html.replaceAll(find, config.variables[key]);
    }

    fs.writeFileSync(outputFilename, html, {"encoding" : "utf8", "mode" : 0666, "flag" : "a"});
}
