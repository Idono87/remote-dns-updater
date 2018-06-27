const gulp = require('gulp');
const ts = require('gulp-typescript');
const yargs = require('yargs').argv;
const sourceMaps = require('gulp-sourcemaps');
const stripCode = require('gulp-strip-code');
const del = require('del');
const mocha = require('gulp-mocha');
const gulpif = require('gulp-if');
const gulpSeq = require('run-sequence');


if (yargs.production)
{
    process.env.NODE_ENV = 'production';
}



/**
* TS Compile
*/
const compileconfig = {
    productionConfig: 'prod.tsconfig.json',
    devConfig: 'tsconfig.json',
    stripTags:{
        start_comment: 'debug',
        end_comment: 'debug-end'
    },
    src: [
        './src/**/*',
        './bin_src/**/*'
    ],
    dest: [
        './lib/',
        './bin/'
    ]
}

//Build the project.
gulp.task('build', [ 'clean' ], function (done)
{   
    compileconfig.src.forEach(function(val, index)
    {
        const tsProject = ts.createProject((process.env.NODE_ENV === 'production') ? compileconfig.productionConfig : compileconfig.devConfig);

        gulp.src(val) //Get the source files with the TS-Compiler plugin.
        .pipe(gulpif(process.env.NODE_ENV === "production", stripCode(compileconfig.stripTags)))//If in production strip the tags.
        .pipe(sourceMaps.init()) //Sourcemap init
        .pipe(tsProject()) //Compile the TS code
        .pipe(gulpif(process.env.NODE_ENV === 'production', sourceMaps.write(), sourceMaps.write('./'))) //Write the sourcefiles.
        .pipe(gulp.dest(compileconfig.dest[index])); //Write the compiled files.
    });
});

//Builds the production version.
gulp.task('build-prod', function(){
    process.env.NODE_ENV = 'production';
    gulpSeq('build');
});


/**
* Pre-Compile.
*/

gulp.task('clean', function ()
{
    return del(compileconfig.dest);
});


/**
* Post-Compile 
*/

gulp.task('test', [ 'build' ], function ()
{
    return gulp.src('test/**/*.js')
    .pipe(mocha());
});

gulp.task('default', [ 'build' ]);
