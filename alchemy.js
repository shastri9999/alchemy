var cheatURL = 'https://littlealchemy.com/cheats/',
    Promise = require('bluebird'),
    dom = require('jsdom'),
    jquery = require('jquery'),
    EventEmitter = require('events').EventEmitter,
    alchemy = new EventEmitter(),
    curl = require('node-curl'),
    querystring = require('querystring'),
    ProgressBar = require('progress'),
    totalElements = 100,
    bar = new ProgressBar('Found :current/:total elements. - :etas', {
        complete: '=',
        incomplete: ' ',
        width: 20,
        total: totalElements,
    }),
    knownElements = {
        'air': [],
        'earth': [],
        'water': [],
        'fire': []
    },
    unknownElements = [],
    getURLFromElementName = function(elementName) {
        return cheatURL + '?' + querystring.stringify({
            element: elementName
        });
    },
    getElementNameFromHref = function(href) {
        var re = /.*\?element=(.*)/;
        return re.exec(href)[1];
    },
    getNewRandomElement = function() {
        return new Promise(function(resolve, reject) {
            var curl_ = curl.create();
            curl_(cheatURL, function(error) {
                if (error || this.status != 200) {
                    reject(error);
                }
                dom.env(this.body, function(errors, window) {
                    var $ = jquery(window);
                    resolve(getElementNameFromHref($('a.randomButtonTop').attr('href')));
                });
            });
        });
    },
    getElementCombinationFromName = function(elementName) {
        return new Promise(function(resolve, reject) {
            var curl_ = curl.create();
            curl_(getURLFromElementName(elementName), function(error) {
                if (elementName in knownElements) {
                    resolve([]);
                }

                if (error || this.status != 200) {
                    reject(error);
                }

                knownElements[elementName] = [];
                dom.env(this.body, function(errors, window) {
                    var $ = jquery(window),
                        combinations = knownElements[elementName],
                        newElements = [];
                    $('.combination').each(function(index, combinationDiv) {
                        var $combination = $(combinationDiv),
                            combination = [];
                        $combination
                            .find('.elementBox>a')
                            .each(function(index, anchor) {
                                var combinationElementName = getElementNameFromHref(anchor.href);
                                newElements.push(combinationElementName);
                                combination.push(combinationElementName);
                            });
                        combinations.push(combination);
                        bar.tick();
                    });
                    resolve(newElements);
                });
            });
        });
    },
    mix = setInterval(function() {
        var unknownElement = unknownElements.pop();
        if (unknownElement) {
            alchemy.emit('mix', unknownElement);
        }
    }, 1500);

getNewRandomElement().then(function(element) {
    alchemy.emit('mix', element);
});

alchemy.on('mix', function(element) {
    getElementCombinationFromName(element)
        .then(function(elements) {

            if (Object.keys(knownElements).length >= totalElements) {
                alchemy.emit('finished');
                return;
            }

            if (elements.length == 0) {
                getNewRandomElement().then(function(element) {
                    alchemy.emit('mix', element);
                });
            }
            else {
                unknownElements = unknownElements.concat(elements.filter(function(element) {
                    return !(element in knownElements) && unknownElements.indexOf(element) == -1;
                }));
            }
        });
});

alchemy.on('finished', function() {
    clearInterval(mix);
});