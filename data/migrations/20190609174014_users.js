
exports.up = async function(knex, Promise) {
  await knex.schema.createTable('users', (tbl) => {
    tbl.increments();

    tbl
      .string('username', 128)
      .notNullable()
      .unique();
    
    tbl
      .string('password')
      .notNullable();
  });
  
};

exports.down = function(knex, Promise) {
  return knex.schema
    .dropTableIfExists('users')
};
