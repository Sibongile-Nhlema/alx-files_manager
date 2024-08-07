import express from 'express';

const injectMidware = (api) => {
  api.use(express.json({ limit: '200mb' }));
};

export default injectMidware;