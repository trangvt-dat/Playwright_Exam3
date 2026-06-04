import { test, expect } from '@playwright/test';

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

test('TC05 - User Browsing Flow', async ({ request }) => {

  let productId: number;
  let userId: number;

  await test.step(
    'Bước 1 : Lấy sản phẩm theo category electronics',
    async () => {

      // Lấy danh sách sản phẩm thuộc category electronics
      const res = await request.get(
        '/products/category/electronics'
      );

      // API phải trả về thành công
      expect(res.status()).toBe(200);

      const body = await res.json();

      // Response phải là mảng và có dữ liệu
      expect(Array.isArray(body)).toBeTruthy();
      expect(body.length).toBeGreaterThan(0);

      // Verify tất cả sản phẩm đều thuộc electronics
      for (const product of body) {
        expect(product.category).toBe('electronics');
      }

      // Lưu productId để dùng cho các bước tiếp theo
      productId = body[0].id;

      expect(typeof productId).toBe('number');
    }
  );

  await test.step(
    'Bước 2 : Xem chi tiết sản phẩm',
    async () => {

      // Lấy thông tin chi tiết sản phẩm vừa chọn
      const res = await request.get(
        `/products/${productId}`
      );

      expect(res.status()).toBe(200);

      const body = await res.json();

      // Verify đúng sản phẩm đã chọn ở bước trước
      expect(body.id).toBe(productId);

      // Verify category vẫn là electronics
      expect(body.category).toBe('electronics');

      // Verify dữ liệu cơ bản của sản phẩm
      expect(isPositiveNumber(body.price)).toBeTruthy();
      expect(isNonEmptyString(body.title)).toBeTruthy();
    }
  );

  await test.step(
    'Bước 3 : Lấy thông tin người dùng',
    async () => {

      // Lấy thông tin user để chuẩn bị tạo cart
      const res = await request.get('/users/1');

      expect(res.status()).toBe(200);

      const body = await res.json();

      // Verify đúng user được yêu cầu
      expect(body.id).toBe(1);

      // Verify email đúng định dạng cơ bản
      expect(body.email).toContain('@');

      // Verify firstname và lastname không rỗng
      expect(
        isNonEmptyString(body.name.firstname)
      ).toBeTruthy();

      expect(
        isNonEmptyString(body.name.lastname)
      ).toBeTruthy();

      // Lưu userId để dùng khi tạo cart
      userId = body.id;
    }
  );

  await test.step(
    'Bước 4 : Tạo giỏ hàng',
    async () => {

      // Tạo cart chứa sản phẩm đã chọn
      const res = await request.post('/carts', {
        data: {
          userId,
          date: '2026-06-04',
          products: [
            {
              productId,
              quantity: 2
            }
          ]
        }
      });

      expect([200, 201]).toContain(res.status());

      const body = await res.json();

      // Verify cart được tạo thành công
      expect(typeof body.id).toBe('number');

      // Verify cart thuộc đúng user
      expect(body.userId).toBe(userId);

      // Verify cart có đúng 1 sản phẩm
      expect(body.products.length).toBe(1);

      // Verify productId được thêm đúng
      expect(
        body.products[0].productId
      ).toBe(productId);

      // Verify số lượng sản phẩm
      expect(
        body.products[0].quantity
      ).toBe(2);
    }
  );
});

test('TC06 - Product CRUD Flow', async ({ request }) => {

  let createdId: number;

  const payload = {
    title: 'Playwright Product',
    price: 100,
    description: 'Description',
    image: 'image.jpg',
    category: 'electronics'
  };

  await test.step(
    'Bước 1 : Tạo sản phẩm',
    async () => {

      // Tạo sản phẩm mới
      const res = await request.post('/products', {
        data: payload
      });

      expect([200, 201]).toContain(res.status());

      const body = await res.json();

      // Lưu ID để sử dụng cho các bước tiếp theo
      createdId = body.id;

      // Verify dữ liệu tạo mới đúng với request
      expect(body.title).toBe(payload.title);
      expect(body.price).toBe(payload.price);
      expect(body.description).toBe(payload.description);
      expect(body.image).toBe(payload.image);
      expect(body.category).toBe(payload.category);
    }
  );

  await test.step(
    'Bước 2 : PUT cập nhật sản phẩm',
    async () => {

      // PUT dùng để cập nhật toàn bộ resource
      const res = await request.put(
        `/products/${createdId}`,
        {
          data: {
            ...payload,
            price: 500,
            description: 'Updated Description'
          }
        }
      );

      expect(res.status()).toBe(200);

      const body = await res.json();

      // Verify ID không thay đổi sau update
      expect(body.id).toBe(createdId);

      // Verify dữ liệu mới được cập nhật thành công
      expect(body.price).toBe(500);

      expect(body.description)
        .toBe('Updated Description');
    }
  );

  await test.step(
    'Bước 3 : PATCH title',
    async () => {

      // PATCH chỉ cập nhật một phần dữ liệu
      const res = await request.patch(
        `/products/${createdId}`,
        {
          data: {
            title: 'New Title'
          }
        }
      );

      expect(res.status()).toBe(200);

      const body = await res.json();

      // Verify ID vẫn giữ nguyên
      expect(body.id).toBe(createdId);

      // Verify title mới được cập nhật
      expect(body.title).toBe('New Title');
    }
  );

  await test.step(
    'Bước 4 : Xóa sản phẩm',
    async () => {

      // Xóa sản phẩm vừa tạo
      const res = await request.delete(
        `/products/${createdId}`
      );

      expect(res.status()).toBe(200);

      const text = await res.text();

      //verify ID trả về.

      if (text.trim().startsWith('{')) {
        const body = JSON.parse(text);

        expect(body).not.toBeNull();

        // Verify đúng sản phẩm vừa xóa
        expect(body.id).toBe(createdId);
      }
    }
  );
});
