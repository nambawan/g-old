const faker = require('faker');
/* eslint comma-dangle: ["error", {"functions": "never"}]*/

exports.seed = function (knex, Promise) {
  // Deletes ALL existing entries
  const users = [];
  let user;
  let time;
  const admin = knex('users').insert({ name: 'admin', surname: 'admin', email: 'admin@example.com', role_id: 1, email_validated: false });
  users.push(admin);
  for (let i = 0; i < 10; i += 1) {
    time = new Date();
    user = knex('users').insert({
      name: faker.name.firstName(),
      surname: faker.name.lastName(),
      email: faker.internet.email(),
      created_at: time,
      updated_at: time,
      role_id: 4,
      email_validated: false });
    users.push(user);
  }
  return knex
  .raw('ALTER TABLE users DISABLE TRIGGER ALL;')
  .then(() => knex.raw('ALTER SEQUENCE users_id_seq RESTART WITH 1;'))
  .then(() => knex('users').del())
  .then(() => knex.raw('ALTER TABLE users ENABLE TRIGGER ALL;')) // mysql :SET foreign_key_checks = 1;
  .then(() =>
       Promise.all(users)
    );
};