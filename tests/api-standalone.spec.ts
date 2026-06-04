import { test, expect } from '@playwright/test';
//Test data dùng chung cho các testcase tạo sản phẩm
const NEW_PRODUCT = {
  title: 'Test Product for Exam',
  price: 99.99,
  description: 'A product created by automated API test.',
  image: 'https://i.pravatar.cc',
  category: 'electronics',
};
//Helper kiểm tra chuỗi không rỗng
const isNonEmptyString = (
  value: unknown
): boolean =>
  typeof value === 'string' &&
  value.trim().length > 0;

//Helper kiểm tra số dương

const isPositiveNumber = (
  value: unknown
): boolean =>
  typeof value === 'number' &&
  value > 0;

test.describe('API Standalone Tests', () => {

  let validCategories: string[] = [];

  test.beforeAll(async ({ request }) => {

    //Lấy danh sách category một lần duy nhất để tái sử dụng cho toàn bộ test trong describe
    const response = await request.get(
      '/products/categories'
    );

    expect(response.status()).toBe(200);

    validCategories = await response.json();

    expect(
      Array.isArray(validCategories)
    ).toBe(true);

    expect(validCategories.length)
      .toBeGreaterThan(0);
  });

  test('TC01 - GET /products', async ({ request }) => {

    // Gọi API lấy danh sách sản phẩm
    const response = await request.get(
      '/products'
    );

    // Verify API trả về thành công
    expect(response.status()).toBe(200);

    const products = await response.json();

    // Verify response là array
    expect(
      Array.isArray(products)
    ).toBe(true);

    // Verify có dữ liệu
    expect(products.length)
      .toBeGreaterThan(0);

    //Dùng Set để kiểm tra ID không bị trùng
    const ids = new Set<number>();

    for (const product of products) {

      // Verify kiểu dữ liệu của id
      expect(typeof product.id)
        .toBe('number');

      // Verify title là non-empty string
      expect(
        isNonEmptyString(product.title)
      ).toBe(true);

      // Verify price là số dương
      expect(
        isPositiveNumber(product.price)
      ).toBe(true);

      // Verify category là non-empty string
      expect(
        isNonEmptyString(product.category)
      ).toBe(true);
      expect(
        ids.has(product.id)
      ).toBe(false);

      ids.add(product.id);
    }
  });

  test('TC02 - GET /products/1', async ({ request }) => {

    const response = await request.get(
      '/products/1'
    );

    expect(response.status()).toBe(200);

    const product = await response.json();

    // Verify đúng sản phẩm ID = 1
    expect(product.id).toBe(1);

    // Verify title hợp lệ
    expect(
      isNonEmptyString(product.title)
    ).toBe(true);

    // Verify category tồn tại trong danh sách category hợp lệ
    expect(validCategories)
      .toContain(product.category);

    // Verify rating.rate
    expect(typeof product.rating.rate)
      .toBe('number');

    expect(product.rating.rate)
      .toBeGreaterThan(0);

    expect(product.rating.rate)
      .toBeLessThanOrEqual(5);

    // Verify rating.count
    expect(typeof product.rating.count)
      .toBe('number');

    expect(product.rating.count)
      .toBeGreaterThanOrEqual(0);
  });

  test('TC03 - POST /products', async ({ request }) => {

    const response = await request.post(
      '/products',
      {
        data: NEW_PRODUCT,
      }
    );

    // API có thể trả về 200 hoặc 201
    expect([200, 201])
      .toContain(response.status());

    const product = await response.json();

    // Verify ID được tạo thành công
    expect(typeof product.id)
      .toBe('number');

    expect(product.id)
      .toBeGreaterThan(0);

    // Verify dữ liệu echo đúng
    expect(product.title)
      .toBe(NEW_PRODUCT.title);

    expect(product.price)
      .toBe(NEW_PRODUCT.price);

    expect(product.category)
      .toBe(NEW_PRODUCT.category);
  });

  test('TC04 - DELETE /products/6', async ({ request }) => {

    const response = await request.delete(
      '/products/6'
    );

    expect(response.status()).toBe(200);

    const product = await response.json();

    // Verify response không null
    expect(product).not.toBeNull();

    // Verify không phải array
    expect(
      Array.isArray(product)
    ).toBe(false);

    // Verify là object
    expect(typeof product)
      .toBe('object');

    // Verify đúng ID đã xóa
    expect(product.id).toBe(6);

    // Verify title tồn tại
    expect(
      isNonEmptyString(product.title)
    ).toBe(true);

    // Verify price là số dương
    expect(
      isPositiveNumber(product.price)
    ).toBe(true);
  });
});
