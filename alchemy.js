var cheatURL = 'https://littlealchemy.com/cheats/',
    getURLFromElementName = function (elementName) {
        return cheatURL + '?element=' + elementName;
    },
    knownElements = {
        'air': [],
        'earth': [],
        'water': [],
        'fire': []
    },
    unknownElements = [];