import express from 'express';

/**
 * Adds middlewares to the given express application.
 * @param {express.Express} api The express application.
 */
const injectMidware = (api) => {
  api.use(express.json({ limit: '200mb' }));
};

export default injectMidware;