import express from 'express';
import PathUtil from '@scripts/util/path.util';

const app = express();

app.use('/', express.static(PathUtil.processRoot('/public')));

export default app;
