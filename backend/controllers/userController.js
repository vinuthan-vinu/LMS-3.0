const User = require('../models/User');
const { asyncHandler } = require('../middleware/error');

const USER_SELECT = '-password -resetPasswordToken -resetPasswordExpire';
const ALLOWED_ADMIN_UPDATE_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'role', 'isActive', 'isVerified'];

const buildUserPayload = (body) => {
  const payload = {};

  ALLOWED_ADMIN_UPDATE_FIELDS.forEach((field) => {
    if (body[field] !== undefined) payload[field] = body[field];
  });

  if (typeof payload.email === 'string') {
    payload.email = payload.email.trim().toLowerCase();
  }
  if (typeof payload.firstName === 'string') payload.firstName = payload.firstName.trim();
  if (typeof payload.lastName === 'string') payload.lastName = payload.lastName.trim();
  if (typeof payload.phone === 'string') payload.phone = payload.phone.trim();

  return payload;
};

const ensureEditableUser = async (targetUserId, actingUserId, payload = {}) => {
  const targetUser = await User.findById(targetUserId);

  if (!targetUser) {
    return { error: { status: 404, message: 'User not found' } };
  }

  const isSelf = targetUser._id.toString() === actingUserId.toString();
  const isLastAdmin =
    targetUser.role === 'admin' && (await User.countDocuments({ role: 'admin', isActive: true })) <= 1;

  if (isSelf && payload.isActive === false) {
    return { error: { status: 400, message: 'You cannot deactivate your own admin account' } };
  }

  if (isLastAdmin && (payload.isActive === false || (payload.role && payload.role !== 'admin'))) {
    return { error: { status: 400, message: 'Cannot remove or deactivate the last active admin' } };
  }

  return { targetUser, isSelf, isLastAdmin };
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res) => {
  const { role, search, isActive } = req.query;
  const query = {};

  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(query).select(USER_SELECT).sort('-createdAt');
  res.status(200).json({ success: true, count: users.length, data: users });
});

// @desc    Get single user (Admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(USER_SELECT);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.status(200).json({ success: true, data: user });
});

// @desc    Create user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role = 'student', phone, isActive = true } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'First name, last name, email, and password are required',
    });
  }

  if (!['student', 'teacher', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(400).json({ success: false, message: 'User already exists with this email' });
  }

  const user = await User.create({
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
    email: normalizedEmail,
    password,
    role,
    phone,
    isActive,
  });

  const created = await User.findById(user._id).select(USER_SELECT);

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: created,
  });
});

// @desc    Update user role/status (Admin only)
// @route   PUT /api/users/:id/role
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res) => {
  const updateFields = buildUserPayload(req.body);

  if (updateFields.role && !['student', 'teacher', 'admin'].includes(updateFields.role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  if (updateFields.email) {
    const existing = await User.findOne({
      email: updateFields.email,
      _id: { $ne: req.params.id },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Another user already uses this email' });
    }
  }

  const { error } = await ensureEditableUser(req.params.id, req.user.id, updateFields);
  if (error) {
    return res.status(error.status).json({ success: false, message: error.message });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    updateFields,
    { new: true, runValidators: true }
  ).select(USER_SELECT);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.status(200).json({ success: true, data: user });
});

exports.updateUserRole = exports.updateUser;

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res) => {
  const { targetUser, error, isSelf, isLastAdmin } = await ensureEditableUser(req.params.id, req.user.id);
  if (error) {
    return res.status(error.status).json({ success: false, message: error.message });
  }

  if (isSelf) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
  }

  if (isLastAdmin) {
    return res.status(400).json({ success: false, message: 'Cannot delete the last active admin' });
  }

  await targetUser.deleteOne();
  res.status(200).json({ success: true, message: 'User deleted successfully', data: { _id: req.params.id } });
});

// @desc    Update user avatar (Self)
// @route   PUT /api/users/avatar
// @access  Private
exports.updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload an image file' });
  }

  // Ensure frontend can reach it via static route
  const avatarUrl = `/uploads/${req.file.filename}`;
  
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { avatar: avatarUrl },
    { new: true, runValidators: true }
  ).select(USER_SELECT);

  res.status(200).json({ success: true, data: user });
});
