// Response helper middleware để standardize API responses
function responseHelpers(req, res, next) {
  // Success response helper
  res.success = (data = null, message = 'Thành công', statusCode = 200) => {
    const response = {
      success: true,
      message,
      timestamp: new Date().toISOString()
    };
    
    if (data !== null) {
      if (Array.isArray(data)) {
        response.data = data;
        response.count = data.length;
      } else {
        response.data = data;
      }
    }
    
    return res.status(statusCode).json(response);
  };

  // Error response helper
  res.error = (message = 'Có lỗi xảy ra', statusCode = 500, errors = null) => {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };
    
    if (errors) {
      response.errors = errors;
    }
    
    return res.status(statusCode).json(response);
  };

  // Paginated response helper
  res.paginated = (data, total, page = 1, limit = 10, message = 'Thành công') => {
    const totalPages = Math.ceil(total / limit);
    
    return res.success({
      items: data,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_items: total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    }, message);
  };

  // Not found response helper
  res.notFound = (message = 'Không tìm thấy dữ liệu') => {
    return res.error(message, 404);
  };

  // Validation error response helper
  res.validationError = (errors, message = 'Dữ liệu không hợp lệ') => {
    return res.error(message, 400, errors);
  };

  // Unauthorized response helper
  res.unauthorized = (message = 'Không có quyền truy cập') => {
    return res.error(message, 401);
  };

  // Forbidden response helper
  res.forbidden = (message = 'Bị cấm truy cập') => {
    return res.error(message, 403);
  };

  // Conflict response helper
  res.conflict = (message = 'Dữ liệu xung đột') => {
    return res.error(message, 409);
  };

  next();
}

module.exports = responseHelpers;
