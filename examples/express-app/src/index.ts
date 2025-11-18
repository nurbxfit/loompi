import express from 'express';
import { Request, Response, NextFunction } from 'express';
import usersRouter from './api/users';

const app = express();

const logger = (req: Request, res: Response, next: NextFunction) => {
    console.log(`-> ${new Date().toISOString()} | ${req.method} ${req.url} `)
    next();
}

app.use(logger);

app.get('/', (req, res, next) => {
    return res.send({
        message: 'loompi Example - Express',
        version: '1.0.0'
    })
})

app.use('/api', usersRouter);


app.listen(3000, () => {
    console.log('Server listening on http://localhost:3000/')
})