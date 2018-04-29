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
import GroupsPage from '../../containers/GroupsPage';
import { getSessionUser } from '../../reducers';
import { canAccess } from '../../organization';
import { loadGroups } from '../../actions/group';

const title = 'Admin';

async function action({ store }) {
  const state = await store.getState();
  const user = getSessionUser(state);

  if (user) {
    if (!canAccess(user, title)) {
      return { redirect: '/admin' };
    }
  }
  await store.dispatch(loadGroups());
  const links = [{ to: 'groups/add', name: 'ADD NEW GROUP' }];
  return {
    chunks: ['admin'],
    title,
    component: (
      <AdminPage menuLinks={links}>
        <GroupsPage />
      </AdminPage>
    ),
  };
}

export default action;