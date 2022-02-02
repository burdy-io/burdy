// eslint-disable-next-line import/no-extraneous-dependencies
import sharp, { AvailableFormatInfo, FitEnum, FormatEnum } from 'sharp';
import express from 'express';
import asyncMiddleware from '@server/middleware/async.middleware';
import { getEnhancedRepository } from '@server/common/orm-helpers';
import Asset from '@server/models/asset.model';
import NotFoundError from '@server/errors/not-found-error';
import BadRequestError from '@server/errors/bad-request-error';
import queryString from 'query-string';

const imageController = express();

type ImageFormat = keyof FormatEnum | AvailableFormatInfo;

interface ImageOptions {
  // General
  animated?: boolean;
  progressive?: boolean;
  format?: ImageFormat | 'auto';
  quality?: number;
  // Resizing
  width?: number;
  height?: number;
  fit?: keyof FitEnum;
  gravity?: string;
}

const isMimeSupported = (mimeType: string) => /^image\//i.test(mimeType);

const resolveFormat = (accepts: string, mimeType: string): ImageFormat => {
  switch (true) {
    case accepts.includes('image/avif'):
      return 'avif';
    case accepts.includes('image/webp'):
      return 'webp';
    case !['image/jpeg', 'image/jpg'].includes(mimeType):
      return 'png';
    default:
      return 'jpg';
  }
}

imageController.get(
  '/image/*',
  asyncMiddleware(async (req, res) => {
    const npath = req.params[0];
    const query = queryString.parseUrl(req.url, {
      parseBooleans: true,
      parseNumbers: true
    }).query as ImageOptions;

    const accepts = req.header('Accept') || '';

    const {
      animated = false,
      progressive = true,
      quality = 90,
      fit = 'cover',
      gravity = 'center',
      width,
      height,
      format: defaultFormat = 'auto'
    } = query

    const assetRepository = getEnhancedRepository(Asset);
    const asset = await assetRepository.findOne({ where: { npath } });

    if (!asset) {
      throw new NotFoundError('asset_not_found');
    }

    if (!isMimeSupported(asset.mimeType)) {
      throw new BadRequestError('type_not_supported', {
        mimeType: asset.mimeType
      });
    }

    let format: ImageFormat;

    if (!defaultFormat || defaultFormat === 'auto') {
      format = resolveFormat(accepts, asset.mimeType);
    } else {
      format = undefined;
    }

    let imageProcessor = sharp({ animated });

    imageProcessor = imageProcessor.toFormat(format, {
      progressive,
      quality
    });

    if (width || height) {
      imageProcessor = imageProcessor.resize({
        withoutEnlargement: true,
        fit,
        position: gravity,
        width,
        height,
      });
    }

    const assetReadStream = asset.readStream();

    res.writeHead(200, {
      'Content-Type': `image/${format}`,
      'Cache-Control': process.env.ASSETS_CACHE_CONTROL || 'no-cache'
    });

    assetReadStream.pipe(imageProcessor).pipe(res);
  })
);

export default imageController;
