/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import path from 'path';
import chokidar from 'chokidar';
import { writeFile, copyFile, makeDir, copyDir, cleanDir } from './lib/fs';
import pkg from '../package.json';
import { format } from './run';

/**
 * Copies static files such as robots.txt, favicon.ico to the
 * output (build) folder.
 */
async function copy() {
  await makeDir('build');
  await makeDir('build/avatars');
  await makeDir('build/emails');
  await copyDir('public', 'build/public');

  await Promise.all([
    writeFile(
      'build/package.json',
      JSON.stringify(
        {
          private: true,
          engines: pkg.engines,
          dependencies: pkg.dependencies,
          scripts: {
            start: 'node server.js',
          },
        },
        null,
        2,
      ),
    ),
    copyFile('LICENSE.txt', 'build/LICENSE.txt'),
    copyFile('yarn.lock', 'build/yarn.lock'),
    copyDir('src/messages', 'build/messages'),

    copyDir('src/data/db', 'build/db'),
    copyFile('.env.defaults', 'build/.env.defaults'),
    copyFile('src/core/serviceworker.js', 'build/public/serviceworker.js'),
  ]);

  await copyFile('src/config.js', 'build/db/config.js');
  await copyFile('src/knexfile.js', 'build/db/knexfile.js');
  await copyFile(
    'src/emails/translations.json',
    'build/emails/translations.json',
  );

  if (process.argv.includes('--watch')) {
    const watcher = chokidar.watch(['src/messages/**/*', 'public/**/*'], {
      ignoreInitial: true,
    });

    watcher.on('all', async (event, filePath) => {
      const start = new Date();
      const src = path.relative('./', filePath);
      const dist = path.join(
        'build/',
        src.startsWith('src') ? path.relative('src', src) : src,
      );
      switch (event) {
        case 'add':
        case 'change':
          await makeDir(path.dirname(dist));
          await copyFile(filePath, dist);
          break;
        case 'unlink':
        case 'unlinkDir':
          cleanDir(dist, { nosort: true, dot: true });
          break;
        default:
          return;
      }
      const end = new Date();
      const time = end.getTime() - start.getTime();
      console.info(`[${format(end)}] ${event} '${dist}' after ${time} ms`);
    });
  }
}

export default copy;
