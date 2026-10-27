const bcrypt = require('bcrypt');
const db = require('../config/db');

const SALT_ROUNDS = 12;

const authService = {
  async hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
  },

  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  },

  async findUserByUsername(username) {
    const query = 'SELECT * FROM dmi_users WHERE username = $1';
    const result = await db.query(query, [username]);
    return result.rows[0];
  },

  async findUserById(id) {
    const query = 'SELECT id, username, email, full_name, role, is_active, created_at FROM dmi_users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  async createUser({ username, email, password, fullName, role }) {
    const passwordHash = await this.hashPassword(password);
    const query = `
      INSERT INTO dmi_users (username, email, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, full_name, role, is_active, created_at
    `;
    const values = [username, email, passwordHash, fullName, role];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  async updateStaffUser(id, { email, fullName, role, isActive }) {
    const query = `
      UPDATE dmi_users
      SET email = COALESCE($1, email),
          full_name = COALESCE($2, full_name),
          role = COALESCE($3, role),
          is_active = COALESCE($4, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, username, email, full_name, role, is_active, updated_at
    `;
    const values = [email, fullName, role, isActive, id];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  async getAllUsers() {
    const query = 'SELECT id, username, email, full_name, role, is_active, created_at FROM dmi_users ORDER BY id ASC';
    const result = await db.query(query);
    return result.rows;
  },

  async countAdmins() {
    const query = "SELECT COUNT(*) FROM dmi_users WHERE role = 'ADMIN'";
    const result = await db.query(query);
    return parseInt(result.rows[0].count, 10);
  },
};

module.exports = authService;