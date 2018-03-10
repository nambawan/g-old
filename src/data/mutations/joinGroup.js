import { GraphQLNonNull } from 'graphql';
import GroupInputType from '../types/GroupInputType';
import Group from '../models/Group';
import GroupType from '../types/GroupType';

const joinGroup = {
  type: new GraphQLNonNull(GroupType),
  args: {
    group: {
      type: GroupInputType,
    },
  },
  resolve: async (data, { group }, { viewer, loaders }) => {
    const team = await Group.gen(viewer, group.id, loaders);
    if (team) {
      return team.join(viewer, group.memberId, loaders);
    }
    return null;
  },
};

export default joinGroup;
