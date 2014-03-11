var osmium = require('osmium');
var sqlite3 = require('sqlite3');
var fs = require('fs');

if (process.argv.length < 4) {
    console.log('Usage: node cli-tosqlite.js <data.[osm|pbf]> <out.sqlite>')
    process.exit(-1);
}
var inFile = process.argv[2];
var outFile = process.argv[3];

var file = new osmium.File(inFile);
var reader = new osmium.Reader(file);
var handler = new osmium.Handler();
var nodes = 0;

var store = function(type, db) {
    return function(elem) {
        if (!elem.timestamp) {
            console.error('No timestamp for ' + type);
            return;
        }
        if (!elem.uid) {
            console.error('No uid for ' + type);
            return;
        }
        var day = new Date(elem.timestamp * 1000).toISOString().substring(0, 10);
        var timestampday = new Date(day).getTime() / 1000;
        // Uses way too much mem. Why?
        db.run("INSERT INTO edits VALUES (?, ?, ?)", elem.timestamp, timestampday, elem.uid);
        // var stmt = db.prepare("INSERT INTO edits VALUES (?, ?, ?)", function() {
        //     stmt.run(elem.timestamp, timestampday, elem.uid, function() {
        //         stmt.finalize();
        //     });
        // });
    };
};

var db = new sqlite3.Database(outFile);
db.serialize(function() {
    db.run("PRAGMA synchronous=0");
    db.run("PRAGMA locking_mode=EXCLUSIVE");
    db.run("PRAGMA journal_mode=DELETE");
    db.run("DROP TABLE IF EXISTS edits");
    db.run("CREATE TABLE edits (timestamp UINT, timestampday UINT, user UINT)");
    
    db.parallelize(function() {
        handler.on('relation', store('relation', db));
        handler.on('way', store('way', db));
        handler.on('node', store('node', db));
        handler.on('done', function() {
            db.close();
        });
        reader.apply(handler);
    });
});

