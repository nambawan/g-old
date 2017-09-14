import knex from '../knex';
import User from './User';

// eslint-disable-next-line no-unused-vars
function checkCanSee(viewer, data) {
  // TODO change data returned based on permissions
  return true;
}
// eslint-disable-next-line no-unused-vars
function canMutate(viewer, data) {
  return viewer.role.type === 'admin';
}

async function validateCoordinator(viewer, id, loaders) {
  const coordinator = await User.gen(viewer, id, loaders);
  return coordinator; // TODO val rules
}

function canJoin(viewer, memberId) {
  // eslint-disable-next-line eqeqeq
  if (viewer.id == memberId) {
    return true; // TODO specify rules;
  }
  return false;
}

class WorkTeam {
  constructor(data) {
    this.id = data.id;
    this.coordinatorId = data.coordinator_id;
    this.name = data.name;
  }
  canNotify(viewer) {
    // eslint-disable-next-line eqeqeq
    return viewer.id == this.coordinatorId || viewer.role.type === 'admin';
  }
  async join(viewer, memberId, loaders) {
    // viewer is already checked
    if (!canJoin(viewer, memberId)) return null;
    let wtId = await knex.transaction(async trx =>
      trx
        .insert({ user_id: memberId, work_team_id: this.id })
        .into('user_work_teams')
        .returning('id'),
    );
    wtId = wtId[0];
    return wtId ? User.gen(viewer, memberId, loaders) : null;
  }

  async leave(viewer, memberId, loaders) {
    // viewer is already checked
    if (!canJoin(viewer, memberId)) return null;
    let wtId = await knex.transaction(async trx =>
      trx
        .where({ user_id: memberId, work_team_id: this.id })
        .into('user_work_teams')
        .del()
        .returning('id'),
    );
    wtId = wtId[0];
    return wtId ? User.gen(viewer, memberId, loaders) : null;
  }

  async circularFeedNotification(viewer, activity, pushFn) {
    if (!this.canNotify(viewer)) return null;

    const teamIds = await knex('user_work_teams')
      .where({ work_team_id: this.id })
      .pluck('user_id');
    const promises = teamIds.map(id => pushFn(id, activity.id));

    return Promise.all(promises);
  }

  static async gen(viewer, id) {
    if (!id) return null;
    let data = await knex('work_teams').where({ id }).select();
    data = data[0];
    if (!data) return null;
    const canSee = checkCanSee(viewer, data);
    if (!canSee) return null;
    return new WorkTeam(data);
  }

  static async create(viewer, data, loaders) {
    if (!canMutate(viewer)) return null;
    if (!data) return null;
    if (!data.name) return null;
    const newData = {};
    newData.name = data.name;
    if (data.coordinatorId) {
      if (!validateCoordinator(viewer, data.coordinatorId, loaders))
        return null;
      newData.coordinator_id = data.coordinatorId;
    }
    newData.created_at = new Date();
    let wtId = await knex.transaction(async trx =>
      trx.insert(newData).into('work_teams').returning('id'),
    );
    wtId = wtId[0];
    return wtId ? WorkTeam.gen(viewer, wtId, loaders) : null;
  }

  static async update(viewer, data, loaders) {
    if (!canMutate(viewer)) return null;
    if (!data) return null;
    if (!data.id) return null;
    const newData = {};
    if (data.name) {
      newData.name = data.name;
    }
    if (data.coordinatorId) {
      if (!validateCoordinator(viewer, data.coordinatorId, loaders))
        return null;
      newData.coordinator_id = data.coordinatorId;
    }
    newData.updated_at = new Date();
    let wtId = await knex.transaction(async trx =>
      // eslint-disable-next-line newline-per-chained-call
      knex('work_teams')
        .transacting(trx)
        .forUpdate()
        .update(newData)
        .returning('id'),
    );
    wtId = wtId[0];
    return wtId ? WorkTeam.gen(viewer, wtId, loaders) : null;
  }
}

export default WorkTeam;