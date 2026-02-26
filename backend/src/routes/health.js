const express = require('express');
const router = express.Router();
const { successResponse } = require('../utils/apiResponse');

const startTime = Date.now();

router.get('/', (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  successResponse(res, 200, 'Medoflow API is operational', {
    uptime,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
