import type { RequestHandler } from 'express';
import { AppError, ERROR_CODES } from '../core/errors/index.js';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(`Route ${req.method} ${req.path} not found`, 404, ERROR_CODES.ROUTE_NOT_FOUND));
};
