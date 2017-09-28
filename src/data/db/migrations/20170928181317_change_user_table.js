exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('users', table => {
      table.timestamp('canVoteSince');
      table.dropForeign('role_id');
      table.dropColumn('role_id');
      table
        .integer('groups')
        .unsigned()
        .defaultsTo(0);
      table.dropColumn('privilege');
    }),
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('users', table => {
      table.dropColumn('canVoteSince');
      table.dropColumn('groups');
      table.integer('role_id').unsigned();
      table.foreign('role_id').references('roles');
      table.integer('privilege').defaultTo(1);
    }),
  ]);
};
