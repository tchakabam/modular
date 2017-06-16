// This imports all files in this folder to serve as a "wildcard" entry point
// which will allow for the Factory to have eventual nodules registered
var req = require.context('./', true, /.+\.js$/);
req.keys().forEach(req);