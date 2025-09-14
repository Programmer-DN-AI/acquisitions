import logger from '#config/logger.js';
import { eq } from 'drizzle-orm';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';
import { hashPassword } from './auth.service.js';

export const getAllUsers = async () => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at
      })
      .from(users);

    logger.info(`Retrieved ${allUsers.length} users`);
    return allUsers;
  } catch (e) {
    logger.error(`Error fetching all users: ${e}`);
    throw new Error('Error fetching users');
  }
};

export const getUserById = async (id) => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    logger.info(`Retrieved user: ${user.email}`);
    return user;
  } catch (e) {
    logger.error(`Error fetching user by id ${id}: ${e}`);
    throw e;
  }
};

export const updateUser = async (id, updates) => {
  try {
    // First check if user exists
    const [existingUser] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Prepare updates object
    const updateData = { ...updates };
    
    // If password is being updated, hash it
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }

    // Add updated timestamp
    updateData.updated_at = new Date();

    // Perform the update
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at
      });

    logger.info(`User ${existingUser.email} updated successfully`);
    return updatedUser;
  } catch (e) {
    logger.error(`Error updating user with id ${id}: ${e}`);
    throw e;
  }
};

export const deleteUser = async (id) => {
  try {
    // First check if user exists
    const [existingUser] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Delete the user
    await db.delete(users).where(eq(users.id, id));

    logger.info(`User ${existingUser.email} deleted successfully`);
    return { message: 'User deleted successfully' };
  } catch (e) {
    logger.error(`Error deleting user with id ${id}: ${e}`);
    throw e;
  }
};