'use strict';

console.log('loaded');

requirejs.config({
    baseUrl: '/lib',
    paths: {
        jquery: 'jquery-1.11.3.min',
        bootstrap: 'bootstrap/js/bootstrap.min',
        scripts: '../scripts'
    }
});

requirejs(['scripts/app']);
