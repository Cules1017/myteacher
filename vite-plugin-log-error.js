export default function logErrorPlugin() {
  return {
    name: 'log-error-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/log-error' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk.toString());
          req.on('end', () => {
            const fs = require('fs');
            fs.appendFileSync('frontend-error.log', body + '\n\n');
            res.statusCode = 200;
            res.end();
          });
        } else {
          next();
        }
      });
    }
  }
}
