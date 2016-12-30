var cluster = require('cluster'),
    http = require('http'),
    numCPUs = require("os").cpus().length,
    express = require("express"),
    app     = express(),
    compression = require("compression");

app.use(compression({filter : compression.filter}));
app.use(express.static("./"));

if (cluster.isMaster) {
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
} else {
    http.createServer(app).listen(80);
    console.log("Worker %s is listening on port 80", process.pid);
}
