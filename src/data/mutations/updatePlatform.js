import { GraphQLNonNull } from 'graphql';
import PlatformInput from '../types/PlatformInputType';
import PlatformType from '../types/PlatformType';
import Platform from '../models/Platform';

const updatePlatform = {
  type: new GraphQLNonNull(PlatformType),
  args: {
    platform: {
      type: PlatformInput,
      description: 'Update platform',
    },
  },
  resolve: async (data, { platform }, { viewer, loaders }) => {
    const newPlatform = await Platform.update(viewer, platform, loaders);
    return newPlatform;
  },
};

export default updatePlatform;
