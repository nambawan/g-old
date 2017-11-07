/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import {
  GraphQLSchema as Schema,
  GraphQLObjectType as ObjectType,
} from 'graphql';

import intl from './queries/intl';
import proposal from './queries/proposal';
import proposals from './queries/proposals';
import votes from './queries/votes';
import users from './queries/users';
import createStatement from './mutations/createStatement';
import deleteStatement from './mutations/deleteStatement';
import updateStatement from './mutations/updateStatement';
import createStatementLike from './mutations/createStatementLike';
import deleteStatementLike from './mutations/deleteStatementLike';
import proposalDL from './queries/proposalDL';
import proposalsDL from './queries/proposalsDL';
import createVote from './mutations/createVote';
import updateVote from './mutations/updateVote';
import deleteVote from './mutations/deleteVote';
import createProposal from './mutations/createProposal';
import updateProposal from './mutations/updateProposal';
// import createUser from './mutations/createUser';
import updateUser from './mutations/updateUser';
import deleteUser from './mutations/deleteUser';
import uploadAvatar from './mutations/uploadAvatar';
import searchUser from './queries/search';
import user from './queries/user';
import tags from './queries/tags';
import flaggedStatements from './queries/flaggedStatements';
import flag from './mutations/createFlaggedStatement';
import solveFlag from './mutations/updateFlaggedStatement';
import feed from './queries/feed';
import pollingModes from './queries/pollingModes';
import proposalConnection from './queries/proposalConnection';
import flagConnection from './queries/flagConnection';
import createPushSub from './mutations/createPushSub';
import deletePushSub from './mutations/deletePushSub';
import notify from './mutations/sendNotification';
import activities from './subscriptions/activities';
import createWorkTeam from './mutations/createWorkTeam';
import joinWorkTeam from './mutations/joinWorkTeam';
import leaveWorkTeam from './mutations/leaveWorkTeam';
import workTeams from './queries/workTeams';
import workTeam from './queries/workTeam';
import createProposalSub from './mutations/createProposalSub';
import deleteProposalSub from './mutations/deleteProposalSub';
import logs from './queries/logs';
import statistics from './queries/statistics';
import userConnection from './queries/userConnection';
import createComment from './mutations/createComment';
import createDiscussion from './mutations/createDiscussion';

const schema = new Schema({
  query: new ObjectType({
    name: 'Query',
    fields: {
      intl,
      proposal,
      proposals,
      proposalDL,
      proposalsDL,
      users,
      userConnection,
      votes,
      searchUser,
      user,
      tags,
      flaggedStatements,
      feed,
      pollingModes,
      proposalConnection,
      flagConnection,
      workTeams,
      workTeam,
      logs,
      statistics,
    },
  }),
  mutation: new ObjectType({
    name: 'Mutations',
    fields: {
      createStatement,
      updateStatement,
      deleteStatement,
      createStatementLike,
      deleteStatementLike,
      createVote,
      updateVote,
      deleteVote,
      createProposal,
      updateProposal,
      //  createUser,
      updateUser,
      deleteUser,
      uploadAvatar,
      flag,
      solveFlag,
      createPushSub,
      deletePushSub,
      notify,
      createWorkTeam,
      joinWorkTeam,
      leaveWorkTeam,
      createProposalSub,
      deleteProposalSub,
      createComment,
      createDiscussion,
    },
  }),
  subscription: new ObjectType({
    name: 'Subscriptions',
    fields: {
      activities,
    },
  }),
});

export default schema;
