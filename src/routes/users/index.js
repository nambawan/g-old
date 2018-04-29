/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import AdminPage from '../../containers/AdminPage';
import UsersPage from '../../containers/UsersPage';
import { getSessionUser } from '../../reducers';
import { canAccess } from '../../organization';

const title = 'Admin';

async function action({ store }) {
  const state = await store.getState();
  const user = getSessionUser(state);

  if (user) {
    if (!canAccess(user, title)) {
      return { redirect: '/admin' };
    }
  }

  return {
    chunks: ['admin'],
    title,
    component: (
      <AdminPage menuLinks={[]}>
        <UsersPage />
      </AdminPage>
    ),
  };
}

export default action;