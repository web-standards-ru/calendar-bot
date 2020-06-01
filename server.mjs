import express from "express";

import scanEvent from "./helpers/scan_event.mjs";

const {
    API_TOKEN,
    PORT = 3000
} = process.env;

if (!!!API_TOKEN) {
    throw new Error('Not set env API_TOKEN');
}


export default function () {
    const app = express();

    app.disable('x-powered-by');

    app.use((req, _, next) => {
        console.log(req.method, req.url, req.header('x-real-ip') || req.ip);
        next();
    });

    app.get('/', async (req, res, next) => {
        if (req.query.token !== API_TOKEN) {
            return res.status(400).end('Error token');
        }

        try {
        res.json(await scanEvent());
        }
        catch(exc) {
            next(exc);
        }
    });

    app.use(function (req, res) {
        console.warn('Page not found', req.url);
        return res.status(404).end('Page not found');
    });

    app.use(function (err, req, res) {
        console.error(err.stack);
        return res.status(500).end('Server error');
    });

    return {
        server: app.listen(PORT, () => {
            console.log(`App started and available at http://localhost:${PORT}`);
        }),
        app: app
    };
}