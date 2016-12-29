var cluster = require('cluster'),
    http = require('http'),
    numCPUs = require("os").cpus().length,
    express = require("express"),
    app     = express();

app.use(function(req, res, next) {
    console.log("request", req.Url);
    next();
});
app.use(express.static("./"));

if (cluster.isMaster) {
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
} else {
    http.createServer(app).listen(80);
    console.log("Worker %s is listening on port 80", process.pid);
}
