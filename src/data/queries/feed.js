import { GraphQLList, GraphQLID } from 'graphql';

import ActivityType from '../types/ActivityType';
import Feed from '../models/Feed';

const feed = {
  type: new GraphQLList(ActivityType),
  args: {
    userId: {
      type: GraphQLID,
      description: 'Id to fetch activity log from',
    },
  },

  resolve: (parent, { userId }, { viewer, loaders }) => Feed.gen(viewer, userId, loaders),
};

export default feed;
