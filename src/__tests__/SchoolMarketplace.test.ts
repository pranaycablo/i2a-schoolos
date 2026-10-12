import { describe, it, expect } from 'vitest';
import { MarketplaceStoreService } from '../services/MarketplaceStoreService';
import { TenantSecurityException, type UserSession } from '../services/TenantSecurityService';

describe('FOV-07: School Marketplace Multi-Tenant Implementation & Integrity', () => {
  const store = MarketplaceStoreService.getInstance();

  const schoolAId = 'I2A-SCH-000001';
  const schoolBId = 'I2A-SCH-000002';

  const adminSessionA: UserSession = {
    id: 'admin-sch-1',
    email: 'admin@school1.edu',
    tenantId: schoolAId,
    role: 'ADMIN',
    status: 'ACTIVE'
  };

  const parentSessionA: UserSession = {
    id: 'parent-001',
    email: 'parent@home.com',
    tenantId: schoolAId,
    role: 'PARENT',
    status: 'ACTIVE',
    childrenIds: ['std-101']
  };

  const otherParentSessionA: UserSession = {
    id: 'parent-002',
    email: 'otherparent@home.com',
    tenantId: schoolAId,
    role: 'PARENT',
    status: 'ACTIVE',
    childrenIds: ['std-102']
  };

  // Test 1: Tenant Isolation - Products are isolated by School ID
  it('1. Verifies catalog isolation between School A and School B', () => {
    const productsA = store.getProducts(schoolAId);
    const productsB = store.getProducts(schoolBId);

    expect(productsA.length).toBeGreaterThan(0);
    expect(productsB.length).toBeGreaterThan(0);

    // Ensure all products for School A strictly have schoolAId
    productsA.forEach((p) => {
      expect(p.schoolId).toBe(schoolAId);
    });

    // Ensure all products for School B strictly have schoolBId
    productsB.forEach((p) => {
      expect(p.schoolId).toBe(schoolBId);
    });

    // School B product ID should not exist in School A catalog
    const schoolBProductIds = productsB.map((p) => p.id);
    productsA.forEach((p) => {
      expect(schoolBProductIds).not.toContain(p.id);
    });
  });

  // Test 2: Cross-tenant product mutation prevention
  it('2. Prevents Admin of School A from mutating School B product or adding to School B', () => {
    const schoolBProducts = store.getProducts(schoolBId);
    const targetProduct = schoolBProducts[0];

    // Admin A trying to update School B's product
    expect(() => {
      store.updateProduct(schoolBId, targetProduct.id, { priceInPaise: 99900 }, adminSessionA);
    }).toThrowError(TenantSecurityException);

    // Admin A trying to add product to School B
    expect(() => {
      store.createProduct(
        {
          schoolId: schoolBId,
          name: 'Hacked Item',
          description: 'Hacked',
          category: 'UNIFORM',
          targetAudience: 'STUDENT',
          applicableClasses: ['Class I'],
          sku: 'HACK-01',
          priceInPaise: 50000,
          stockQuantity: 10,
          isMandatory: false,
          isActive: true,
          sellerType: 'SCHOOL_DIRECT'
        },
        adminSessionA
      );
    }).toThrowError(TenantSecurityException);
  });

  // Test 3: Parent order isolation - Parent sees only own family orders
  it('3. Ensures Parents can only view their own orders and not other parents orders', () => {
    const productsA = store.getProducts(schoolAId);
    const activeProduct = productsA[0];

    // Parent 1 places an order
    const order1 = store.placeOrder(
      {
        schoolId: schoolAId,
        userId: parentSessionA.id,
        userName: 'Aarav Parent',
        userRole: 'PARENT',
        studentName: 'Aarav Sharma',
        items: [
          {
            productId: activeProduct.id,
            quantity: 1
          }
        ],
        paymentMode: 'SCHOOL_COUNTER'
      },
      parentSessionA
    );

    expect(order1).toBeDefined();

    // Parent 1 fetches orders
    const parent1Orders = store.getOrders(schoolAId, parentSessionA);
    expect(parent1Orders.some((o) => o.id === order1.id)).toBe(true);

    // Parent 2 fetches orders - must NOT see Parent 1 order
    const parent2Orders = store.getOrders(schoolAId, otherParentSessionA);
    expect(parent2Orders.some((o) => o.id === order1.id)).toBe(false);

    // Admin can see all orders for School A
    const adminOrders = store.getOrders(schoolAId, adminSessionA);
    expect(adminOrders.some((o) => o.id === order1.id)).toBe(true);
  });

  // Test 4: Inactive product cannot be ordered
  it('4. Rejects order placement for inactive products', () => {
    // Admin creates an inactive product
    const inactiveProd = store.createProduct(
      {
        schoolId: schoolAId,
        name: 'Discontinued Blazer',
        description: 'No longer approved',
        category: 'UNIFORM',
        targetAudience: 'STUDENT',
        applicableClasses: ['Class X'],
        sku: 'DISC-BLAZER-01',
        priceInPaise: 180000,
        stockQuantity: 25,
        isMandatory: false,
        isActive: false, // INACTIVE
        sellerType: 'SCHOOL_DIRECT'
      },
      adminSessionA
    );

    expect(() => {
      store.placeOrder(
        {
          schoolId: schoolAId,
          userId: parentSessionA.id,
          userName: 'Parent',
          userRole: 'PARENT',
          items: [
            {
              productId: inactiveProd.id,
              quantity: 1
            }
          ],
          paymentMode: 'SCHOOL_COUNTER'
        },
        parentSessionA
      );
    }).toThrowError(/PRODUCT_INACTIVE/i);
  });

  // Test 5: Insufficient stock rejection
  it('5. Rejects order placement when requested quantity exceeds available stock', () => {
    const limitedProd = store.createProduct(
      {
        schoolId: schoolAId,
        name: 'Special Geometry Kit',
        description: 'Limited edition',
        category: 'STATIONERY',
        targetAudience: 'STUDENT',
        applicableClasses: ['ALL'],
        sku: 'GEO-LTD-01',
        priceInPaise: 35000,
        stockQuantity: 3, // Only 3 in stock
        isMandatory: false,
        isActive: true,
        sellerType: 'SCHOOL_DIRECT'
      },
      adminSessionA
    );

    expect(() => {
      store.placeOrder(
        {
          schoolId: schoolAId,
          userId: parentSessionA.id,
          userName: 'Parent',
          userRole: 'PARENT',
          items: [
            {
              productId: limitedProd.id,
              quantity: 5 // Exceeds stock (5 > 3)
            }
          ],
          paymentMode: 'SCHOOL_COUNTER'
        },
        parentSessionA
      );
    }).toThrowError(/OUT_OF_STOCK/i);
  });

  // Test 6: Kit Bundle creation and price/component integrity
  it('6. Verifies Kit Bundle creation with component items and integer paise pricing', () => {
    const productsA = store.getProducts(schoolAId);
    const item1 = productsA[0];
    const item2 = productsA[1];

    const kitBundle = store.createKitBundle(
      {
        schoolId: schoolAId,
        name: 'Class 6 - Complete Academic Starter Kit',
        description: 'Uniform + Notebook bundle for Class 6',
        targetClass: 'Class VI',
        bundlePriceInPaise: 250000, // ₹2,500
        componentProductIds: [
          { productId: item1.id, quantity: 2 },
          { productId: item2.id, quantity: 4 }
        ]
      },
      adminSessionA
    );

    expect(kitBundle.isKitBundle).toBe(true);
    expect(kitBundle.category).toBe('KIT_BUNDLE');
    expect(kitBundle.priceInPaise).toBe(666000); // Sum of individual component items
    expect(kitBundle.salePriceInPaise).toBe(250000); // Bundle discounted package price
    expect(kitBundle.kitComponents).toHaveLength(2);
    expect(kitBundle.kitComponents![0].quantity).toBe(2);
    expect(kitBundle.applicableClasses).toContain('Class VI');
  });

  // Test 7: Size variant stock decrement
  it('7. Decrements stock for specific size variant upon successful order', () => {
    const shoesProd = store.createProduct(
      {
        schoolId: schoolAId,
        name: 'Action School Sports Shoes',
        description: 'White sports shoes',
        category: 'FOOTWEAR',
        targetAudience: 'STUDENT',
        applicableClasses: ['ALL'],
        sku: 'SHOE-ACT-01',
        priceInPaise: 85000,
        stockQuantity: 20,
        sizeVariants: [
          { size: '6', stockQuantity: 10 },
          { size: '7', stockQuantity: 10 }
        ],
        isMandatory: true,
        isActive: true,
        sellerType: 'AUTHORIZED_VENDOR'
      },
      adminSessionA
    );

    const initialStock = shoesProd.stockQuantity;
    const initialSize6Stock = shoesProd.sizeVariants!.find((s) => s.size === '6')!.stockQuantity;

    store.placeOrder(
      {
        schoolId: schoolAId,
        userId: parentSessionA.id,
        userName: 'Parent',
        userRole: 'PARENT',
        items: [
          {
            productId: shoesProd.id,
            selectedSize: '6',
            quantity: 2
          }
        ],
        paymentMode: 'SCHOOL_COUNTER'
      },
      parentSessionA
    );

    // Verify stock decremented
    const updated = store.getProductById(shoesProd.id)!;
    expect(updated.stockQuantity).toBe(initialStock - 2);
    const updatedSize6 = updated.sizeVariants!.find((s) => s.size === '6')!;
    expect(updatedSize6.stockQuantity).toBe(initialSize6Stock - 2);
  });

  // Test 8: Order cancellation restores product stock
  it('8. Restores product inventory when an order is cancelled', () => {
    const prod = store.createProduct(
      {
        schoolId: schoolAId,
        name: 'Art & Craft Drawing Kit',
        description: 'Complete art kit',
        category: 'STATIONERY',
        targetAudience: 'STUDENT',
        applicableClasses: ['ALL'],
        sku: 'ART-CRAFT-01',
        priceInPaise: 45000,
        stockQuantity: 15,
        isMandatory: false,
        isActive: true,
        sellerType: 'SCHOOL_DIRECT'
      },
      adminSessionA
    );

    const order = store.placeOrder(
      {
        schoolId: schoolAId,
        userId: parentSessionA.id,
        userName: 'Parent',
        userRole: 'PARENT',
        items: [
          {
            productId: prod.id,
            quantity: 3
          }
        ],
        paymentMode: 'SCHOOL_COUNTER'
      },
      parentSessionA
    );

    expect(store.getProductById(prod.id)!.stockQuantity).toBe(12);

    // Cancel order
    store.cancelOrder(schoolAId, order.id, 'Wrong class selected', parentSessionA);

    // Verify stock is restored back to 15
    expect(store.getProductById(prod.id)!.stockQuantity).toBe(15);
  });

  // Test 9: Idempotency duplicate order prevention
  it('9. Prevents duplicate order placement when the same idempotency key is submitted', () => {
    const prod = store.getProducts(schoolAId)[0];
    const idempotencyKey = `idem-${Date.now()}-abc`;

    const payload = {
      schoolId: schoolAId,
      idempotencyKey,
      userId: parentSessionA.id,
      userName: 'Parent',
      userRole: 'PARENT' as const,
      items: [
        {
          productId: prod.id,
          quantity: 1
        }
      ],
      paymentMode: 'SCHOOL_COUNTER' as const
    };

    // First placement succeeds
    const order1 = store.placeOrder(payload, parentSessionA);
    expect(order1).toBeDefined();

    // Second placement with identical idempotency key returns existing or throws error
    expect(() => {
      // In the implementation: placeOrder throws or returns existing
      // Let's verify that placeOrder handles idempotency
      const dup = store.placeOrder(payload, parentSessionA);
      expect(dup.id).toBe(order1.id);
    }).not.toThrow();
  });

  // Test 10: Unauthorized role cannot perform admin operations
  it('10. Blocks non-administrative roles (e.g. Parent, Student) from modifying products or orders', () => {
    const prod = store.getProducts(schoolAId)[0];

    // Parent cannot update stock
    expect(() => {
      store.updateProduct(schoolAId, prod.id, { stockQuantity: 999 }, parentSessionA);
    }).toThrowError(TenantSecurityException);

    // Parent cannot create new product
    expect(() => {
      store.createProduct(
        {
          schoolId: schoolAId,
          name: 'Unauthorized Item',
          description: 'Hacked',
          category: 'UNIFORM',
          targetAudience: 'STUDENT',
          applicableClasses: ['ALL'],
          sku: 'UNAUTH-01',
          priceInPaise: 10000,
          stockQuantity: 50,
          isMandatory: false,
          isActive: true,
          sellerType: 'SCHOOL_DIRECT'
        },
        parentSessionA
      );
    }).toThrowError(TenantSecurityException);
  });
});
