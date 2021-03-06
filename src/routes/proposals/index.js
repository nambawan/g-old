import React from 'react';
import Layout from '../../components/Layout';
import { loadProposalsList } from '../../actions/proposal';
import ProposalOverviewContainer from './ProposalsOverviewContainer';
import { getSessionUser } from '../../reducers';
import { canAccess } from '../../organization';

const title = 'Proposals';

async function action({ store, path }, { state }) {
  const user = getSessionUser(store.getState());
  if (!user) {
    return { redirect: `/?redirect=${path}` };
  } else if (!canAccess(user, title)) {
    return { redirect: '/' };
  }
  if (!process.env.BROWSER) {
    await store.dispatch(loadProposalsList({ state }));
  } else {
    store.dispatch(loadProposalsList({ state }));
  }

  return {
    chunks: ['proposals'],
    title,
    component: (
      <Layout>
        <ProposalOverviewContainer filter={state} />
      </Layout>
    ),
  };
}

export default action;
