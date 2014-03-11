var osmium = require('osmium');

if (process.argv.length < 3) {
    console.log('Usage: node cli-tosqlite.js <data.[osm|pbf]>')
    process.exit(-1);
}
var inFile = process.argv[2];
var outFile = process.argv[3];

var file = new osmium.File(inFile);
var reader = new osmium.Reader(file);
var handler = new osmium.Handler();
var nodes = 0;

var print = function(type) {
    return function(elem) {
        if (!elem.id) {
            console.error('No id for %s', type);
            return;
        }
        if (!elem.uid) {
            console.error('No uid for %s', type);
            return;
        }
        if (!elem.timestamp) {
            console.error('No timestamp for %s', type);
            return;
        }
        var day = new Date(elem.timestamp * 1000).toISOString().substring(0, 10);
        var timestampday = new Date(day).getTime() / 1000;
        process.stdout.write(type + ',' +
            elem.id + ',' +
            elem.uid + ',' +
            elem.timestamp + ',' +
            timestampday +'\n');
    };
};

process.stdout.write('type,id,uid,timestamp,timestampday\n');
handler.on('relation', print('relation'));
handler.on('way', print('way'));
handler.on('node', print('node'));
reader.apply(handler);
