class ApiFeatures {
  // trong đó query là của mongosee còn queryString là của req từ URL
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((item) => delete queryObj[item]);

    // Advanced filtering( Lấy dữ liệu được gửi từ req và thay thế, thêm vào dấu '$' để phù hợp với query của mongoDB)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (math) => `$${math}`);

    this.query = this.query.find(JSON.parse(queryStr)); // Nên nhớ "Tour.find(req.queryObj)" trả về 1 query

    return this;
  }

  // Sorting
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' '); //Tách câu query do req gửi ngăn cách bỏi dấu ',' và join chúng lại
      this.query = this.query.sort(sortBy);
      // câu lệnh sắp xêp query của mongoose query.sort('price ratingsAverage);
    } else {
      this.query = this.query.sort('-createAt'); // dấu '-' trước cột là sắp xếp giảm
    }
    return this;
  }

  // Field limit( giới hạn các cột gửi về )
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); // dấu '-' trước cột là in ra tất cả trừ cái đó
    }
    return this;
  }

  // Pagination (Phân trang)
  paginate() {
    const page = this.queryString.page * 1 || 1; // ép kiểu sang number nêu có giá trị hoặc trả về 1
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit; // skip cũng được xem là số dữ liệu bỏ qua

    // vd: page=3&limit=10 sẽ là 1-10(page 1), 11-20(page 2), 21-30(page3)
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}
module.exports = ApiFeatures;
