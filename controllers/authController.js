import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Generate 30-day JWT signed token containing user profile information
 */
export const generateToken = (user) => {
  const secret =
    process.env.JWT_SECRET || 'zaraz_super_secret_jwt_key_2026_green_black';
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      phone: user.phone || '',
      address: user.address || '',
      role: user.role || 'customer',
      provider: user.provider || 'credentials',
    },
    secret,
    { expiresIn: '30d' }
  );
};

/**
 * @desc    Register a new customer/seller and store record in zaraz_auth_db
 * @route   POST /auth/register
 * @access  Public
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, address, image, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    // Password validation rules: uppercase, lowercase, 6+ characters
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasMinLength = password.length >= 6;

    if (!hasUpperCase || !hasLowerCase || !hasMinLength) {
      return res.status(400).json({
        success: false,
        message:
          'Password must contain at least 1 uppercase letter, 1 lowercase letter, and be at least 6 characters long.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists in Zaraz database. Please sign in.',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: phone?.trim() || '',
      address: address?.trim() || '',
      image:
        image?.trim() ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      role: role && ['customer', 'seller', 'admin', 'user'].includes(role) ? role : 'customer',
      provider: 'credentials',
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! Saved to MongoDB Atlas zaraz_auth_db.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        image: user.image,
        role: user.role,
        provider: user.provider,
        database: 'zaraz_auth_db',
      },
    });
  } catch (error) {
    console.error('[registerUser Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Registration failed in MongoDB zaraz_auth_db.',
      error: error.message,
    });
  }
};

export const register = registerUser;

/**
 * @desc    Authenticate user credentials against MongoDB zaraz_auth_db
 * @route   POST /auth/login
 * @access  Public
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email in Zaraz database.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password does not match.',
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful! Welcome back to Zaraz.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        image: user.image,
        role: user.role,
        provider: user.provider,
        database: 'zaraz_auth_db',
      },
    });
  } catch (error) {
    console.error('[loginUser Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.',
      error: error.message,
    });
  }
};

export const login = loginUser;

/**
 * @desc    Social OAuth sync (Google & GitHub) saving user in zaraz_auth_db
 * @route   POST /auth/social
 * @access  Public
 */
export const socialAuth = async (req, res) => {
  try {
    const { email, name, image, provider } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required from OAuth provider.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = await User.create({
        name: name || 'Zaraz Member',
        email: normalizedEmail,
        image:
          image ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        provider: provider || 'google',
        role: 'customer',
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: `Social login successful via ${provider || 'OAuth'}! User synced with zaraz_auth_db.`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        provider: user.provider,
        database: 'zaraz_auth_db',
      },
    });
  } catch (error) {
    console.error('[socialAuth Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Social authentication failed.',
      error: error.message,
    });
  }
};

/**
 * @desc    Issue signed JWT token for validated session payload
 * @route   POST /jwt and POST /auth/jwt
 * @access  Public
 */
export const issueJwt = (req, res) => {
  const user = req.body;
  if (!user || !user.email) {
    return res.status(400).json({
      success: false,
      message: 'User payload required for JWT issuance (must include email).',
    });
  }

  const token = generateToken(user);
  return res.status(200).json({
    success: true,
    token,
    issuedAt: new Date().toISOString(),
    expiresIn: '30d',
  });
};

export const issueJwtToken = issueJwt;

/**
 * @desc    Get current authenticated user profile
 * @route   GET /auth/me or GET /auth/profile
 * @access  Private (JWT Bearer Protected)
 */
export const getCurrentUser = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
      database: 'zaraz_auth_db',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile.',
      error: error.message,
    });
  }
};

export const getProfile = getCurrentUser;

/**
 * @desc    Update user profile details
 * @route   PUT /auth/profile
 * @access  Private (JWT Bearer Protected)
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, image } = req.body;
    const user = await User.findById(req.user._id || req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found in zaraz_auth_db.',
      });
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (address !== undefined) user.address = address.trim();
    if (image) user.image = image.trim();

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully in zaraz_auth_db.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        image: user.image,
        role: user.role,
        provider: user.provider,
        database: 'zaraz_auth_db',
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Profile update failed.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get all users in zaraz_auth_db (Admin access)
 * @route   GET /auth/users
 * @access  Private (Admin only)
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: users.length,
      users,
      database: 'zaraz_auth_db',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users list.',
      error: error.message,
    });
  }
};

/**
 * @desc    Get user registration statistics
 * @route   GET /auth/stats
 * @access  Public
 */
export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const customers = await User.countDocuments({ role: { $in: ['customer', 'user'] } });
    const sellers = await User.countDocuments({ role: 'seller' });
    const admins = await User.countDocuments({ role: 'admin' });

    return res.status(200).json({
      success: true,
      database: 'zaraz_auth_db',
      stats: {
        totalUsers,
        customers,
        sellers,
        admins,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve auth stats.',
      error: error.message,
    });
  }
};


/**
 * @desc    Permanently delete a storefront user from MongoDB Atlas zaraz_auth_db
 * @route   DELETE /auth/users/:id
 * @access  Private (Strictly ADMIN Operator only)
 */
export const deleteUser = async (req, res) => {
  try {
    const operator = req.serverAccount;
    const operatorType = (operator?.type || '').toUpperCase();

    if (operatorType !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Only ADMIN operators can delete users. Your current type is ${operatorType || 'UNAUTHENTICATED'}.`,
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID parameter is required.',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found in zaraz_auth_db.',
      });
    }

    await User.findByIdAndDelete(id);

    // Clean up mirrored user record in zaraz_db if present
    try {
      const mongooseModule = await import('mongoose');
      const catalogDb = mongooseModule.default.connection.useDb('zaraz_db');
      await catalogDb.collection('users').deleteOne({ _id: user._id }).catch(() => {});
    } catch (_) {}

    return res.status(200).json({
      success: true,
      message: `User "${user.name}" (${user.email}) permanently deleted from zaraz_auth_db.`,
      deletedId: String(id),
      deletedBy: operator.name || operator.id,
    });
  } catch (error) {
    console.error('[deleteUser Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user.',
      error: error.message,
    });
  }
};

/**
 * @desc    Auth Component Overview & Interactive Auth Console
 * @route   GET /auth
 * @access  Public (Web dashboard behind SERVER_ACC)
 */
export const getAuthOverview = async (req, res) => {
  try {
    const [totalUsers, customers, sellers, admins, users] = await Promise.all([
      User.countDocuments().catch(() => 0),
      User.countDocuments({ role: { $in: ['customer', 'user'] } }).catch(() => 0),
      User.countDocuments({ role: 'seller' }).catch(() => 0),
      User.countDocuments({ role: 'admin' }).catch(() => 0),
      User.find({}).sort({ createdAt: -1 }).limit(100).catch(() => []),
    ]);

    const { renderBaseLayout, isHtmlRequest } = await import('../utils/viewRenderer.js');
    const wantsHtml = isHtmlRequest(req);

    if (wantsHtml) {
      const operator = req.serverAccount;
      const operatorType = (operator?.type || 'ADMIN').toUpperCase();
      const isAdmin = operatorType === 'ADMIN';

      const escapeSafe = (val = '') =>
        String(val)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');

      const usersRows = users.map((u) => {
        const roleColors = {
          admin: 'background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3);',
          seller: 'background: rgba(251, 146, 60, 0.15); color: #fb923c; border: 1px solid rgba(251, 146, 60, 0.3);',
          customer: 'background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);',
        };
        const roleStyle = roleColors[u.role] || roleColors.customer;
        const safeName = escapeSafe(u.name);
        const safeEmail = escapeSafe(u.email);

        return `
        <tr id="user-row-${u._id}">
          <td>
            <div style="font-weight: 700; color: #fff;">${safeName}</div>
            <div style="font-size: 0.72rem; color: var(--muted); font-family: 'JetBrains Mono', monospace;">id: ${u._id}</div>
          </td>
          <td>
            <span style="color: #cbd5e1; font-weight: 500;">${safeEmail}</span>
          </td>
          <td>
            <span class="badge-pill" style="${roleStyle} text-transform: uppercase;">
              ${u.role || 'customer'}
            </span>
          </td>
          <td>
            <span class="badge-pill" style="background: rgba(255, 255, 255, 0.06); color: #94a3b8; text-transform: uppercase;">
              ${u.provider || 'credentials'}
            </span>
          </td>
          <td>
            <div style="font-size: 0.8rem; color: #cbd5e1;">${escapeSafe(u.phone) || '—'}</div>
            <div style="font-size: 0.72rem; color: var(--muted); max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeSafe(u.address) || ''}</div>
          </td>
          <td style="font-size: 0.75rem; color: var(--muted);">
            ${new Date(u.createdAt).toLocaleDateString()}
          </td>
          <td style="text-align: right; white-space: nowrap;">
            ${
              isAdmin
                ? `<button
                    type="button"
                    class="btn btn-danger btn-sm"
                    onclick="handleDeleteUser('${u._id}', '${safeName.replace(/'/g, "\\'")}', '${safeEmail.replace(/'/g, "\\'")}')"
                    title="Delete User from zaraz_auth_db (Admin Only)"
                  >
                    🗑️ Delete
                  </button>`
                : `<span class="badge-pill" style="background: rgba(148, 163, 184, 0.1); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.2);">
                    🔒 Admin Only
                  </span>`
            }
          </td>
        </tr>`;
      }).join('');

      const roleBadgeMap = {
        ADMIN: 'background: rgba(239, 68, 68, 0.18); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4);',
        EDITOR: 'background: rgba(56, 189, 248, 0.18); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4);',
        MODERATOR: 'background: rgba(192, 132, 252, 0.18); color: #c084fc; border: 1px solid rgba(192, 132, 252, 0.4);',
        WORKER: 'background: rgba(251, 191, 36, 0.18); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.4);',
        VIEWER: 'background: rgba(148, 163, 184, 0.18); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.4);',
      };

      const htmlContent = `
        <div class="page-header">
          <div class="page-title">
            <h2>🔐 Authentication &amp; Users Component</h2>
            <p>Isolated User &amp; Credential Storage in MongoDB Atlas (<code>zaraz_auth_db</code>)</p>
          </div>
          <div style="display: flex; gap: 0.6rem; align-items: center;">
            <span class="badge-api">zaraz_auth_db</span>
            <a href="/auth/stats?format=json" target="_blank" class="btn btn-secondary btn-sm">JSON Stats</a>
          </div>
        </div>

        <!-- Metrics Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
          <div class="card" style="padding: 1.25rem;">
            <div style="font-size: 0.72rem; font-weight: 700; color: var(--muted); text-transform: uppercase;">Total Users</div>
            <div style="font-size: 1.75rem; font-weight: 800; color: #fff; margin-top: 0.25rem;">${totalUsers}</div>
            <div style="font-size: 0.72rem; color: #34d399; margin-top: 0.2rem;">In zaraz_auth_db</div>
          </div>
          <div class="card" style="padding: 1.25rem;">
            <div style="font-size: 0.72rem; font-weight: 700; color: var(--muted); text-transform: uppercase;">Customers</div>
            <div style="font-size: 1.75rem; font-weight: 800; color: #38bdf8; margin-top: 0.25rem;">${customers}</div>
            <div style="font-size: 0.72rem; color: var(--muted); margin-top: 0.2rem;">Shoppers &amp; Buyers</div>
          </div>
          <div class="card" style="padding: 1.25rem;">
            <div style="font-size: 0.72rem; font-weight: 700; color: var(--muted); text-transform: uppercase;">Sellers</div>
            <div style="font-size: 1.75rem; font-weight: 800; color: #fb923c; margin-top: 0.25rem;">${sellers}</div>
            <div style="font-size: 0.72rem; color: var(--muted); margin-top: 0.2rem;">Mall Merchants</div>
          </div>
          <div class="card" style="padding: 1.25rem;">
            <div style="font-size: 0.72rem; font-weight: 700; color: var(--muted); text-transform: uppercase;">Administrators</div>
            <div style="font-size: 1.75rem; font-weight: 800; color: #f87171; margin-top: 0.25rem;">${admins}</div>
            <div style="font-size: 0.72rem; color: var(--muted); margin-top: 0.2rem;">Full Privileges</div>
          </div>
        </div>

        <!-- Role & Permissions Matrix Card -->
        <div class="card" style="margin-bottom: 2rem; border-color: rgba(16, 185, 129, 0.35);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
            <div>
              <h3 style="font-size: 1.05rem; font-weight: 800; color: #fff; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.5rem;">
                🛡️ Operator Role &amp; Permissions Matrix (<code>SERVER_ACC</code>)
                <span class="badge-pill" style="${roleBadgeMap[operatorType] || roleBadgeMap.ADMIN}">
                  Active: ${operatorType}
                </span>
              </h3>
              <p style="font-size: 0.8rem; color: var(--muted);">
                Active session operator: <strong style="color: #34d399;">${escapeSafe(operator?.name || operator?.id || 'Authenticated')}</strong>.
                Storefront user deletion is strictly restricted to <strong>ADMIN</strong> operators.
              </p>
            </div>
            ${isAdmin ? `<a href="/server-logs" class="btn btn-emerald btn-sm">🛡️ Open Login Audit Logs</a>` : ''}
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 0.85rem;">
            <div style="background: rgba(0,0,0,0.3); border: 1px solid ${operatorType === 'ADMIN' ? 'rgba(239, 68, 68, 0.6)' : 'var(--border-card)'}; border-radius: 12px; padding: 0.85rem; ${operatorType === 'ADMIN' ? 'box-shadow: 0 0 15px rgba(239,68,68,0.15);' : ''}">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                <span class="badge-pill" style="${roleBadgeMap.ADMIN}">ADMIN</span>
                <span style="font-size: 0.68rem; color: #34d399; font-weight: 700;">Full Access</span>
              </div>
              <div style="font-size: 0.75rem; color: var(--text-body); line-height: 1.4;">
                • <strong>Delete Users:</strong> <span style="color: #34d399;">Allowed ✓</span><br/>
                • <strong>Audit Logs:</strong> <span style="color: #34d399;">Allowed ✓</span><br/>
                • <strong>Catalog &amp; Orders:</strong> Full Control
              </div>
            </div>

            <div style="background: rgba(0,0,0,0.3); border: 1px solid ${operatorType === 'EDITOR' ? 'rgba(56, 189, 248, 0.6)' : 'var(--border-card)'}; border-radius: 12px; padding: 0.85rem; ${operatorType === 'EDITOR' ? 'box-shadow: 0 0 15px rgba(56,189,248,0.15);' : ''}">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                <span class="badge-pill" style="${roleBadgeMap.EDITOR}">EDITOR</span>
                <span style="font-size: 0.68rem; color: #38bdf8; font-weight: 700;">Catalog Master</span>
              </div>
              <div style="font-size: 0.75rem; color: var(--text-body); line-height: 1.4;">
                • <strong>Delete Users:</strong> <span style="color: #f87171;">Denied 🔒</span><br/>
                • <strong>Audit Logs:</strong> <span style="color: #f87171;">Denied 🔒</span><br/>
                • <strong>Catalog &amp; Orders:</strong> Manage &amp; Edit
              </div>
            </div>

            <div style="background: rgba(0,0,0,0.3); border: 1px solid ${operatorType === 'MODERATOR' ? 'rgba(192, 132, 252, 0.6)' : 'var(--border-card)'}; border-radius: 12px; padding: 0.85rem; ${operatorType === 'MODERATOR' ? 'box-shadow: 0 0 15px rgba(192,132,252,0.15);' : ''}">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                <span class="badge-pill" style="${roleBadgeMap.MODERATOR}">MODERATOR</span>
                <span style="font-size: 0.68rem; color: #c084fc; font-weight: 700;">Order Review</span>
              </div>
              <div style="font-size: 0.75rem; color: var(--text-body); line-height: 1.4;">
                • <strong>Delete Users:</strong> <span style="color: #f87171;">Denied 🔒</span><br/>
                • <strong>Audit Logs:</strong> <span style="color: #f87171;">Denied 🔒</span><br/>
                • <strong>Orders:</strong> Status Updates
              </div>
            </div>

            <div style="background: rgba(0,0,0,0.3); border: 1px solid ${operatorType === 'WORKER' ? 'rgba(251, 191, 36, 0.6)' : 'var(--border-card)'}; border-radius: 12px; padding: 0.85rem; ${operatorType === 'WORKER' ? 'box-shadow: 0 0 15px rgba(251,191,36,0.15);' : ''}">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                <span class="badge-pill" style="${roleBadgeMap.WORKER}">WORKER</span>
                <span style="font-size: 0.68rem; color: #fbbf24; font-weight: 700;">Logistics</span>
              </div>
              <div style="font-size: 0.75rem; color: var(--text-body); line-height: 1.4;">
                • <strong>Delete Users:</strong> <span style="color: #f87171;">Denied 🔒</span><br/>
                • <strong>Audit Logs:</strong> <span style="color: #f87171;">Denied 🔒</span><br/>
                • <strong>Orders:</strong> Delivery Handling
              </div>
            </div>

            <div style="background: rgba(0,0,0,0.3); border: 1px solid ${operatorType === 'VIEWER' ? 'rgba(148, 163, 184, 0.6)' : 'var(--border-card)'}; border-radius: 12px; padding: 0.85rem; ${operatorType === 'VIEWER' ? 'box-shadow: 0 0 15px rgba(148,163,184,0.15);' : ''}">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                <span class="badge-pill" style="${roleBadgeMap.VIEWER}">VIEWER</span>
                <span style="font-size: 0.68rem; color: #94a3b8; font-weight: 700;">Read-Only</span>
              </div>
              <div style="font-size: 0.75rem; color: var(--text-body); line-height: 1.4;">
                • <strong>Delete Users:</strong> <span style="color: #f87171;">Denied 🔒</span><br/>
                • <strong>Audit Logs:</strong> <span style="color: #f87171;">Denied 🔒</span><br/>
                • <strong>Mutations:</strong> Disabled (View Only)
              </div>
            </div>
          </div>
        </div>

        <!-- Users Table Card Component -->
        <div class="section-title" style="margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-size: 1.15rem; font-weight: 800; color: #fff;">
            Storefront Users Directory (MongoDB Atlas: <code>zaraz_auth_db.users</code>)
          </h3>
          <span style="font-size: 0.75rem; color: var(--muted);">
            ${isAdmin ? '🗑️ Admin Delete Action Enabled' : '🔒 Read-Only Directory View'}
          </span>
        </div>
        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>Name &amp; User ID</th>
                <th>Email Address</th>
                <th>Assigned Role</th>
                <th>Auth Provider</th>
                <th>Phone &amp; Delivery Address</th>
                <th>Registered Date</th>
                <th style="text-align: right;">${isAdmin ? 'Actions' : 'Clearance'}</th>
              </tr>
            </thead>
            <tbody>
              ${usersRows}
            </tbody>
          </table>
        </div>
      `;

      const extraScripts = `
        <script>
          async function handleDeleteUser(userId, userName, userEmail) {
            if (!confirm('⚠️ PERMANENT USER DELETION\\n\\nAre you sure you want to delete user "' + userName + '" (' + userEmail + ') from zaraz_auth_db?\\n\\nThis action cannot be undone.')) {
              return;
            }

            try {
              var res = await fetch('/auth/users/' + encodeURIComponent(userId), {
                method: 'DELETE',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                }
              });

              var data = await res.json();
              if (res.ok && data.success) {
                showToast('✓ ' + (data.message || 'User deleted successfully'), 'success');
                var row = document.getElementById('user-row-' + userId);
                if (row) {
                  row.style.transition = 'all 0.3s ease';
                  row.style.opacity = '0';
                  row.style.transform = 'translateX(20px)';
                  setTimeout(function() { row.remove(); }, 350);
                } else {
                  setTimeout(function() { window.location.reload(); }, 600);
                }
              } else {
                showToast('❌ ' + (data.message || 'Failed to delete user'), 'error');
              }
            } catch (err) {
              showToast('❌ Network error: ' + err.message, 'error');
            }
          }
        </script>
      `;

      return res.status(200).send(renderBaseLayout({
        title: 'Auth & Users Component',
        activeNav: 'auth',
        content: htmlContent,
        jsonUrl: '/auth/stats?format=json',
        extraScripts,
      }));
    }

    res.status(200).json({
      success: true,
      service: 'Zaraz Authentication Engine',
      database: 'zaraz_auth_db',
      stats: { totalUsers, customers, sellers, admins },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch auth overview',
      error: error.message,
    });
  }
};
