/**
 * Sample Model - User
 * Replace with real DB logic (e.g. Mongoose, Sequelize, Prisma)
 */
class User {
  static findAll() {
    // Placeholder: return mock data
    return [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Doe', email: 'jane@example.com' },
    ];
  }

  static findById(id) {
    const users = this.findAll();
    return users.find((u) => u.id === parseInt(id, 10)) || null;
  }
}

module.exports = User;
