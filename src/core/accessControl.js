import {
  Permissions,
  Groups,
  AccessMasks,
  PrivilegesSchema,
  PermissionsSchema,
} from '../organization';
/* eslint-disable no-bitwise */
// TODO make object
export const Models = {
  USER: 1,
  PROPOSAL: 2,
  STATEMENT: 4,
  FLAG: 8,
  S_LIKE: 16,
  POLL: 32,
  VOTE: 64,
  NOTIFICATION: 128,
  WORKTEAM: 256,
  ACTIVITY: 512,
};

/* eslint-disable no-unused-vars */

function userWriteControl(viewer, data) {
  if (Object.keys(data).length < 2) {
    return false;
  }
  // own data can be changed
  if (
    viewer &&
    viewer.id == data.id // eslint-disable-line eqeqeq
  ) {
    if (!(viewer.permissions & Permissions.CHANGE_OWN_PROFILE)) {
      return false;
    }
    if (data.name || data.surname) {
      return viewer.groups === Groups.GUEST;
    }
    if (data.groups == null) {
      return true; // Nobody can change his own memberships
    }
  }
  if ((viewer.groups & Groups.SYSTEM) > 0) {
    // to set email as verified, reset password,
    if (data.email || data.password) {
      return true;
    }
  }
  if (viewer.permissions & Permissions.MUTATE_PROFILES) {
    if (data.dataUrl || data.name || data.surname) {
      return true;
    }
    if (data.groups != null) {
      if (
        viewer.privileges &
        (PrivilegesSchema[Groups.ADMIN] | PrivilegesSchema[Groups.SUPER_USER])
      ) {
        return true;
        // TODO further checks!
      }
    }
  }

  return false;
}

function userReadControl(viewer, data) {
  // eslint-disable-next-line eqeqeq
  return viewer.id == data.id || (viewer.permissions & AccessMasks.LEVEL_1) > 0;
}

function proposalReadControl(viewer, data) {
  if (viewer.permissions & Permissions.VIEW_PROPOSALS) {
    return true;
  }
  return false;
}

function proposalWriteControl(viewer, data) {
  if (viewer.permissions & PermissionsSchema[Groups.RELATOR]) {
    if (data.id && data.state) {
      // updates
      if (viewer.permissions & Permissions.MODIFY_PROPOSALS) {
        return true;
      }
      return false;
    }
    return true;
  } else if (data.state === 'survey') {
    if (viewer.permissions & Permissions.PUBLISH_SURVEYS) {
      return true;
    }
  }
  return false;
}

function statementReadControl(viewer, data) {
  if (viewer.permissions & Permissions.VIEW_STATEMENTS) {
    return true;
  }
  return false;
}

function statementWriteControl(viewer, data) {
  if (viewer.permissions & Permissions.MODIFY_OWN_STATEMENTS) {
    return true;
  }
  return false;
}

function flagReadControl(viewer, data) {
  if (viewer.permissions & Permissions.DELETE_STATEMENTS) {
    return true;
  }
  return false;
}

function flagWriteControl(viewer, data) {
  if (data.content) {
    // = flagging
    if (viewer.permissions & Permissions.FLAG_STATEMENTS) {
      return true;
    }
  } else if (viewer.permissions & Permissions.DELETE_STATEMENTS) {
    return true;
  }
  return false;
}

function stmtLikeReadControl(viewer, data) {
  if (viewer.permissions & AccessMasks.LEVEL_1) {
    return true;
  }
  return false;
}
function stmtLikeWriteControl(viewer, data) {
  if (viewer.permissions & Permissions.LIKE) {
    return true;
  }
  return false;
}

function pollReadControl(viewer, data) {
  if (viewer.permissions & AccessMasks.LEVEL_1) {
    return true;
  }
  return false;
}
function pollWriteControl(viewer, data) {
  if (viewer.permissions & PermissionsSchema[Groups.RELATOR]) {
    if (data.closedAt) {
      if (viewer.permissions & Permissions.CLOSE_POLLS) {
        return true;
      }
      return false;
    }
    return true;
  }
  return false;
}

function voteReadControl(viewer, data) {
  if (viewer.permissions & AccessMasks.LEVEL_1) {
    return true;
  }
  return false;
}
function voteWriteControl(viewer, data) {
  if (viewer.permissions & Permissions.VOTE) {
    return true;
  }
  return false;
}

function notificationReadControl(viewer, data) {
  if (viewer.permissions & AccessMasks.LEVEL_0) {
    return true;
  }
  return false;
}
function notificationWriteControl(viewer, data) {
  if (
    viewer.permissions &
    (Permissions.NOTIFY_GROUPS | Permissions.NOTIFY_ALL)
  ) {
    return true;
  }
  return false;
}

function activityReadControl(viewer, data) {
  if (viewer.permissions & AccessMasks.LEVEL_0) {
    return true;
  }
  return false;
}
function activityWriteControl(viewer, data) {
  if (
    (viewer.permissions & AccessMasks.LEVEL_0) > 0 ||
    (viewer.groups & Groups.SYSTEM) > 0
  ) {
    return true;
  }
  return false;
}

function workTeamReadControl(viewer, data) {
  if (viewer.permissions & AccessMasks.LEVEL_0) {
    return true;
  }
  return false;
}
function workTeamWriteControl(viewer, data) {
  if (viewer.permissions & Permissions.CREATE_WORKTEAMS) {
    if (data.coordinatorId || data.name) {
      if (viewer.permissions & Permissions.CREATE_WORKTEAMS) {
        return true;
      }
      return false;
    }
    return true;
  }
  return false;
}
/* eslint-enable no-unused-vars */

const ATypes = {
  WRITE: 1,
  READ: 2,
};
const accessFilter = {
  [Models.USER]: {
    [ATypes.WRITE]: userWriteControl,
    [ATypes.READ]: userReadControl,
  },
  [Models.PROPOSAL]: {
    [ATypes.WRITE]: proposalWriteControl,
    [ATypes.READ]: proposalReadControl,
  },
  [Models.STATEMENT]: {
    [ATypes.WRITE]: statementWriteControl,
    [ATypes.READ]: statementReadControl,
  },
  [Models.FLAG]: {
    [ATypes.WRITE]: flagWriteControl,
    [ATypes.READ]: flagReadControl,
  },
  [Models.S_LIKE]: {
    [ATypes.WRITE]: stmtLikeWriteControl,
    [ATypes.READ]: stmtLikeReadControl,
  },
  [Models.POLL]: {
    [ATypes.WRITE]: pollWriteControl,
    [ATypes.READ]: pollReadControl,
  },
  [Models.VOTE]: {
    [ATypes.WRITE]: voteWriteControl,
    [ATypes.READ]: voteReadControl,
  },
  [Models.NOTIFICATION]: {
    [ATypes.WRITE]: notificationWriteControl,
    [ATypes.READ]: notificationReadControl,
  },
  [Models.ACTIVITY]: {
    [ATypes.WRITE]: activityWriteControl,
    [ATypes.READ]: activityReadControl,
  },
  [Models.WORKTEAM]: {
    [ATypes.WRITE]: workTeamWriteControl,
    [ATypes.READ]: workTeamReadControl,
  },
};

export const canMutate = (viewer, data, model) =>
  accessFilter[model][ATypes.WRITE](viewer, data);

export const canSee = (viewer, data, model) =>
  accessFilter[model][ATypes.READ](viewer, data);