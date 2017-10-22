import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
} from 'graphql';
import UserType from '../types/UserType';
import UserInput from '../types/UserInputType';
import User from '../models/User';

const deleteUser = {
  type: new GraphQLNonNull(
    new GraphQLObjectType({
      name: 'DeleteUserResult',
      fields: {
        errors: { type: new GraphQLNonNull(new GraphQLList(GraphQLString)) },
        user: { type: UserType },
      },
    }),
  ),
  args: {
    user: {
      // TODO Use UserInputType -solve problem with accessControl
      // (check num args and recognize that the operation is delete)
      type: UserInput,
    },
  },
  resolve: async (data, { user }, { viewer, loaders }) => {
    const deletedUser = await User.delete(viewer, user, loaders);
    // TODO insert into activities
    return deletedUser;
  },
};

export default deleteUser;
