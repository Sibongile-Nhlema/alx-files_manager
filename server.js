import express from 'express';
import beginServer from './libs/boot';
import inputRoutes from './routes';
import injectMidware from './libs/middlewares';

const server = express();

injectMidware(server);
inputRoutes(server);
beginServer(server);

export default server;