/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import UserLayout from '../../containers/UserLayout';
import { getSessionUser } from '../../reducers';
import { canAccess } from '../../organization';
import { loadGroups } from '../../actions/group';

const title = 'Admin';

async function action({ store }, { id }) {
  const state = await store.getState();
  const user = getSessionUser(state);

  if (user) {
    if (!canAccess(user, title)) {
      return { redirect: '/admin' };
    }
  }
  await store.dispatch(loadGroups());
  const links = [
    { to: 'password/', name: 'PASSWORD' },
    { to: 'notifications', name: 'NOTIFICATIONS' },
  ];
  return {
    chunks: ['admin'],
    title,
    component: (
      <UserLayout id={id} menuLinks={links}>
        {'Hm, what to show as Settings?'}
      </UserLayout>
    ),
  };
}

export default action;