import uuid from 'uuid/v4';
import path from 'path';
import fs from 'fs';
import User from '../data/models/User';
import knex from '../data/knex';
import cloudinary from '../data/cloudinary';
import { canMutate, Models } from './accessControl';
import log from '../logger';

function deleteFile(filePath) {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line no-confusing-arrow
    fs.unlink(filePath, err => (err ? reject(err) : resolve()));
  });
}

function makeDir(fPath) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(fPath);
    fs.mkdir(dir, err => {
      if (err && err.code !== 'EEXIST') {
        reject(err);
      } else {
        resolve(fPath);
      }
    });
  });
}

function writeFile(filePath, content) {
  return makeDir(filePath).then(
    () =>
      new Promise((resolve, reject) => {
        // eslint-disable-next-line no-confusing-arrow
        fs.writeFile(filePath, content, err => (err ? reject(err) : resolve()));
      }),
  );
}

const deleteFileOnCloudinary = file =>
  new Promise(resolve => {
    cloudinary.uploader.destroy(file, data => resolve(data));
  });
const uploadToCloudinaryStream = (buffer, options) =>
  new Promise(resolve => {
    cloudinary.uploader
      .upload_stream(data => resolve(data), options)
      .end(buffer);
  });

const getPublicIdFromUrl = url => {
  const p = url.lastIndexOf('.');
  const del = url.lastIndexOf('/') + 1;
  if (del >= p) throw Error(`Wrong cloudinary url provided:${url}`);
  return url.slice(del, p);
};

// TODO Integrate with Usermodel!

const saveToCloudinary = async ({ viewer, data: { dataUrl, id }, loaders }) => {
  if (!canMutate(viewer, { dataUrl, id }, Models.USER)) return null;
  const userId = id || viewer.id;
  const user = await User.gen(viewer, userId, loaders);
  if (user.thumbnail) {
    /*  if (user.avatar.indexOf('cloudinary') !== -1) {
      throw new Error('Avatar already set');
      // TODO let avatars beeing changed, delete old file first!
    } */
  }
  const regex = /^data:.+\/(.+);base64,(.*)$/;
  const matches = dataUrl.match(regex);
  const img = matches[2];

  const buffer = new Buffer(img, 'base64');

  // update
  let response;
  await knex.transaction(async trx => {
    // utf8 encoding! Problem?
    // TODO delete old avatar if existing
    // TODO resizing serverside
    if (user.thumbnail.indexOf('http') !== -1) {
      const publicId = getPublicIdFromUrl(user.thumbnail);
      await deleteFileOnCloudinary(publicId).catch(e => {
        console.error(`Cloudinary delete error: ${JSON.stringify(e)}`);
      });
    }

    response = await uploadToCloudinaryStream(buffer, {
      eager: [
        {
          width: 32,
          height: 32,
          crop: 'scale',
        },
      ],
    }).catch(err => {
      log.error({ err }`Cloudinary upload error`);
    });

    if (!response || !response.url || !response.eager) {
      throw Error('Cloudinary failed');
    }
    try {
      await trx
        .where({
          id: userId,
        })
        .update({ thumbnail: response.eager[0].url, updated_at: new Date() })
        .into('users');
    } catch (error) {
      await deleteFileOnCloudinary(getPublicIdFromUrl(response.url));
      throw Error(error);
    }
  });
  // invalidate cache
  loaders.users.clear(userId);
  //
  const result = await knex('users')
    .where({ id: userId })
    .select('id', 'name', 'surname', 'email', 'thumbnail', 'groups'); // await User.gen(viewer, viewer.id, loaders);
  if (result[0]) {
    result[0].avatar = response.url;
  }
  return result[0] || null;
};

const saveLocal = async (
  { viewer, data: { dataUrl, id }, loaders },
  folder,
) => {
  // throw Error('TEST');
  if (!canMutate(viewer, { dataUrl, id }, Models.USER)) return null;
  const userId = id || viewer.id;
  const user = await User.gen(viewer, userId, loaders);
  if (user.thumbnail) {
    if (user.thumbnail.indexOf('cloudinary') !== -1) {
      //  throw new Error('Avatar already set');
      // TODO let avatars beeing changed, delete old file first!
    }
  }
  // eslint-disable-next-line
  const sharp = require("sharp");

  const regex = /^data:.+\/(.+);base64,(.*)$/;
  const matches = dataUrl.match(regex);
  const ext = matches[1];
  const img = matches[2];
  const name = `${uuid()}.${ext}`;
  const filepath = path.resolve(__dirname, folder, name);
  const thumbnailPath = path.resolve(
    __dirname,
    folder,
    `c_scale,w_32,h_32/`,
    name,
  );
  const buffer = new Buffer(img, 'base64');
  await sharp(buffer)
    .resize(32)
    .toBuffer()
    .then(rImg => writeFile(thumbnailPath, rImg));
  const avatarLocation = path.join('/', name);
  const thumbnailLocation = path.join('/c_scale,w_32,h_32/', name);
  // update
  await knex.transaction(async trx => {
    // utf8 encoding! Problem?
    // TODO delete old avatar if existing
    // TODO resizing serverside
    if (user.thumbnail.indexOf('https') === -1) {
      const pathToThumbnail = path.resolve(__dirname, folder, user.thumbnail);
      await deleteFile(pathToThumbnail).catch(err =>
        log.error({ err }, 'Deletion failed'),
      );
      const st = user.thumbnail.indexOf('c_scale');
      const pathToFile = path.resolve(
        __dirname,
        folder,
        user.thumbnail.slice(0, st) + user.thumbnail.substring(st + 18),
      );
      await deleteFile(pathToFile).catch(err =>
        log.error({ err }, 'Deletion failed'),
      );
    }
    await writeFile(filepath, buffer);

    try {
      await trx
        .where({
          id: userId,
        })
        .update({ thumbnail: thumbnailLocation, updated_at: new Date() })
        .into('users');
    } catch (error) {
      await deleteFile(filepath);
      throw Error(error);
    }
  });
  // invalidate cache
  loaders.users.clear(userId);
  //
  const result = await knex('users')
    .where({ id: userId })
    .select('id', 'name', 'surname', 'email', 'thumbnail', 'groups'); // await User.gen(viewer, viewer.id, loaders);

  if (result[0]) {
    result[0].avatar = avatarLocation;
  }
  return result[0] || null;
};

export const AvatarManager = ({ local }) => {
  if (local == null) throw Error('Please set local to true or false');
  return local ? { save: saveLocal } : { save: saveToCloudinary };
};

function FileStorage(manager) {
  return {
    save: manager.save,
  };
}

export default FileStorage;
