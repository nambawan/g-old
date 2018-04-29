import {
  GraphQLString,
  GraphQLObjectType as ObjectType,
  GraphQLNonNull as NonNull,
  GraphQLID as ID,
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
} from 'graphql';
import UserType from './UserType';
import DiscussionType from './DiscussionType';
import GroupStatusType from './GroupStatusType';
import PageType from './PageType';
import Group from '../models/Group';
import Request from '../models/Request';
import ProposalStatusType from '../types/ProposalStatusType';
import PollingModeType from './PollingModeType';
import PollingMode from '../models/PollingMode';
import PrivacyType from './PrivacyType';
import Discussion from '../models/Discussion';
import User from '../models/User';
import knex from '../knex';
import proposalConnection from '../queries/proposalConnection';
import requestConnection from '../queries/requestConnection';

const GroupType = new ObjectType({
  name: 'Group',
  fields: () => ({
    id: { type: new NonNull(ID) },
    coordinator: {
      type: UserType,
      resolve(data, args, { viewer, loaders }) {
        return User.gen(viewer, data.coordinatorId, loaders);
      },
    },
    parentGroup: {
      type: GroupType,
      resolve(data, args, { viewer, loaders }) {
        return data.parentGroupId
          ? Group.gen(viewer, data.parentGroupId, loaders)
          : null;
      },
    },
    names: {
      type: GraphQLString,
      resolve: parent => JSON.stringify(parent.names),
    },

    displayName: {
      type: GraphQLString,
      resolve(parent, args, params, { rootValue }) {
        const locale = rootValue.request.language;
        return parent.names[locale] || parent.names.default_name;
      },
    },

    members: {
      type: new GraphQLList(UserType),
      resolve(data, args, { viewer, loaders }) {
        if (viewer) {
          return knex('user_groups')
            .where({ group_id: data.id })
            .pluck('user_id')
            .then(ids => ids.map(id => User.gen(viewer, id, loaders)));
        }
        return null;
      },
    },
    restricted: {
      type: GraphQLBoolean,
    },
    mainTeam: {
      type: GraphQLBoolean,
    },
    picture: {
      type: GraphQLString,
    },
    cover: {
      type: GraphQLString,
    },
    ownStatus: {
      type: GroupStatusType,
      async resolve(parent, args, { viewer }) {
        if (viewer.wtMemberships.includes(parent.id)) {
          return { status: 1 };
        }
        const [membership = null] = await knex('user_groups')
          .where({ group_id: parent.id, user_id: viewer.id })
          .pluck('id');
        if (!membership) {
          const requests = await knex('requests')
            .where({ requester_id: viewer.id, type: 'joinWT' })
            .whereRaw("content->>'id' = ?", [parent.id])
            .select('*');
          if (requests.length) {
            const req = requests.find(r => r.denied_at);

            if (req) {
              return { status: 2, request: new Request(req) };
            }
            return { status: 2, request: new Request(requests[0]) };
          }
        }
        return { status: 0 };
      },
    },

    requestConnection,
    numMembers: {
      type: GraphQLInt,
    },
    numDiscussions: {
      type: GraphQLInt,
    },
    numProposals: {
      type: GraphQLInt,
    },
    goldMode: {
      type: GraphQLBoolean,
    },
    privacy: {
      type: PrivacyType,
    },
    discussions: {
      type: new GraphQLList(DiscussionType),
      resolve(data, args, { viewer, loaders }) {
        if (viewer && viewer.wtMemberships.includes(data.id)) {
          return knex('discussions')
            .where({ group_id: data.id })
            .orderBy('created_at', 'DESC')
            .pluck('id')
            .then(ids => ids.map(id => Discussion.gen(viewer, id, loaders)));
        }
        return null;
      },
    },
    pollingModes: {
      type: new GraphQLList(PollingModeType),
      resolve(data, args, { viewer, loaders }) {
        return knex('group_pollingmodes')
          .where({ group_id: data.id })
          .pluck('polling_mode_id')
          .then(pmIds =>
            pmIds.map(pmId => PollingMode.gen(viewer, pmId, loaders)),
          );
      },
    },
    subGroups: {
      type: new GraphQLList(GroupType),
      resolve(parent, args, { viewer, loaders }) {
        return knex('groups')
          .where({ parent_group_id: parent.id })
          .pluck('id')
          .then(ids => ids.map(id => Group.gen(viewer, id, loaders)));
      },
    },
    proposalConnection,

    // TODO see https://github.com/graphql/swapi-graphql/blob/master/src/schema/connections.js
    // make own query and link here
    linkedProposalConnection: {
      type: PageType(ProposalStatusType),
      args: {
        first: {
          type: GraphQLInt,
        },
        after: {
          type: GraphQLString,
        },
        state: {
          type: GraphQLString,
        },
      },
      async resolve(parent, { first = 10, after = '', state }) {
        const pagination = Buffer.from(after, 'base64').toString('ascii');
        // cursor = cursor ? new Date(cursor) : new Date();
        let [cursor = null, id = 0] = pagination ? pagination.split('$') : [];
        id = Number(id);
        let proposalStates = [];
        cursor = cursor ? new Date(cursor) : new Date(null);

        proposalStates = await knex('proposal_groups')
          .where({
            group_id: parent.id,
            group_type: 'WT',
          })
          .modify(queryBuilder => {
            if (state) {
              queryBuilder.where({ state });
            }
          })
          .whereRaw(
            '(proposal_groups.created_at, proposal_groups.id) > (?,?)',
            [cursor, id],
          )
          .limit(first)
          .orderBy('proposal_groups.created_at', 'asc')
          .orderBy('proposal_groups.id', 'asc')
          .select();

        const proposalsSet = proposalStates.reduce((acc, curr) => {
          acc[curr.id] = curr;
          return acc;
        }, {});
        const data = proposalStates;
        const edges = data.map(p => ({ node: p }));
        const endCursor =
          edges.length > 0
            ? Buffer.from(
                `${new Date(
                  proposalsSet[edges[edges.length - 1].node.id].time,
                ).toJSON()}$${edges[edges.length - 1].node.id}`,
              ).toString('base64')
            : null;

        const hasNextPage = edges.length === first;
        return {
          edges,
          pageInfo: {
            startCursor: null,
            endCursor,
            hasNextPage,
          },
        };
      },
    },
  }),
});
export default GroupType;