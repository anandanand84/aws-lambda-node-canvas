var through     = require('through2');
var vinyl       = require('vinyl-fs');
var gutil       = require('gulp-util');
var PluginError = gutil.PluginError;
var path        = require('path');
var gulp        = require('gulp');
const fs        = require('fs');
const unzip     = require('gulp-unzip');
var  GITHUB_URL = 'https://cdn.rawgit.com/WebSeed/node-canvas-aws-lambda-example/master/dist/lamdba.zip';
const dependencyDirectory = path.resolve(__dirname, 'dependencies');
var DEPENDENCY_LOCATION = path.resolve(dependencyDirectory, 'lambda-node-canvas-dependency');
var https         = require('https');
const DOWNLOAD_ZIP_LOCATION = dependencyDirectory+path.sep+'lambda-node-canvas-dependency.zip';
//ami-60b6c60a
module.exports =  function (opts) {
    opts = opts || {};
    if(!opts.runtime) {
        console.error(new PluginError('aws-lambda-node-canvas',  'runtime is mandatory'));
        return;
    }

    if(opts.runtime !== 'nodejs' && opts.runtime!=='nodejs4.3'){
        console.error(new PluginError('aws-lambda-node-canvas',  'runtime should either be nodejs or nodejs4.3'));
        return;
    }

    if(opts.runtime !== 'nodejs') {
        DEPENDENCY_LOCATION = path.resolve(dependencyDirectory, 'lambda-node-canvas-dependency-4.3');
    }

    var addNodeCanvasDependencyPath = function(originalStream, endCallback) {
        console.log(DEPENDENCY_LOCATION);
        gulp.src(DEPENDENCY_LOCATION + path.sep+'**'+path.sep+'*', { dot : true})
            .pipe(through.obj(function(file, encoding, cb){
                originalStream.push(file);
                cb();
            }))
            .on('finish', function() {
                console.log('finish')
                endCallback();
            });
    };

    var pass = through.obj(function(file, encoding, callback) {
        callback(null, file);
    },function(callback) {
        var self = this;
        if((!fs.existsSync(DEPENDENCY_LOCATION))){
            var fileStream = fs.createWriteStream(DOWNLOAD_ZIP_LOCATION);
            console.log('Dependency not available, Downloading dependency file '+GITHUB_URL);
            https.get(GITHUB_URL, function(response) {
                response.pipe(fileStream)
                fileStream.on('finish', function() {
                    console.log('Download Complete');
                    gulp.src(DOWNLOAD_ZIP_LOCATION , { dot : true })
                        .pipe(unzip({ keepEmpty : true }))
                        .pipe(gulp.dest(DEPENDENCY_LOCATION))
                        .on('finish', function() {
                            addNodeCanvasDependencyPath(self, callback);
                        })
                })
            });
        }else {
            addNodeCanvasDependencyPath(self, callback);
        }
    });

    return pass;
};