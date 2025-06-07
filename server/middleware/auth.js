const jwt = require('jsonwebtoken');
const User = require('../models/User');
const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (roles = []) => {
   return async (req, res, next) => {
      const token = req.headers['authorization']?.split(' ')[1];
      if (!token) {
         return res.status(401).json({ error: 'Vui lòng cung cấp token.' });
      }
      try{
         const decoded = jwt.verify(token, JWT_SECRET);
         req.user = decoded;
         if (roles.length && !roles.includes(decoded.role)) {
            return res.status(403).json({ error: 'Bạn không có quyền truy cập.' });
         }
         next();
      }catch (err) {
         console.error('Error in authMiddleware:', err.message, err.stack);
         return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
      }
   };
};

module.exports = authMiddleware;