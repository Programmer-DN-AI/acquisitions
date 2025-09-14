import logger from '#config/logger.js';
import {
  userIdSchema,
  updateUserSchema,
} from '#validations/users.validation.js';
import { formatValidationError } from '#utils/format.js';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from '#services/users.service.js';

export const fetchAllUsers = async (req, res, next) => {
  try {
    // Only admins can fetch all users
    if (req.user.role !== 'admin') {
      logger.warn(
        `Access denied for user ${req.user.email} trying to fetch all users`
      );
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only administrators can view all users',
      });
    }

    const users = await getAllUsers();

    logger.info(`All users fetched by admin: ${req.user.email}`);
    res.status(200).json({
      message: 'Users retrieved successfully',
      users,
    });
  } catch (e) {
    logger.error('Fetch all users error', e);
    next(e);
  }
};

export const fetchUserById = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    // Users can only fetch their own profile unless they are admin
    if (req.user.role !== 'admin' && req.user.id !== id) {
      logger.warn(
        `Access denied for user ${req.user.email} trying to fetch user ${id}`
      );
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only view your own profile',
      });
    }

    const user = await getUserById(id);

    logger.info(`User ${id} fetched by ${req.user.email}`);
    res.status(200).json({
      message: 'User retrieved successfully',
      user,
    });
  } catch (e) {
    logger.error('Fetch user by ID error', e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};

export const updateUserById = async (req, res, next) => {
  try {
    const idValidationResult = userIdSchema.safeParse(req.params);

    if (!idValidationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(idValidationResult.error),
      });
    }

    const bodyValidationResult = updateUserSchema.safeParse(req.body);

    if (!bodyValidationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyValidationResult.error),
      });
    }

    const { id } = idValidationResult.data;
    const updates = bodyValidationResult.data;

    // Users can only update their own profile unless they are admin
    if (req.user.role !== 'admin' && req.user.id !== id) {
      logger.warn(
        `Access denied for user ${req.user.email} trying to update user ${id}`
      );
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only update your own profile',
      });
    }

    // Only admins can change user roles
    if (updates.role && req.user.role !== 'admin') {
      logger.warn(
        `Access denied for user ${req.user.email} trying to change role`
      );
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only administrators can change user roles',
      });
    }

    const updatedUser = await updateUser(id, updates);

    logger.info(`User ${id} updated by ${req.user.email}`);
    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (e) {
    logger.error('Update user error', e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    if (e.message === 'User with this email already exists') {
      return res.status(409).json({ error: 'Email already exists' });
    }

    next(e);
  }
};

export const deleteUserById = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    // Users cannot delete themselves, only admin can delete users
    if (req.user.id === id) {
      logger.warn(`User ${req.user.email} trying to delete themselves`);
      return res.status(400).json({
        error: 'Invalid operation',
        message: 'You cannot delete your own account',
      });
    }

    await deleteUser(id);

    logger.info(`User ${id} deleted by admin: ${req.user.email}`);
    res.status(200).json({
      message: 'User deleted successfully',
    });
  } catch (e) {
    logger.error('Delete user error', e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};
