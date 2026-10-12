import { TenantSecurityService, type UserSession, TenantSecurityException } from './TenantSecurityService';
import type {
  MarketplaceProduct,
  MarketplaceProductCategory,
  MarketplaceOrder,
  MarketplaceOrderItem,
  MarketplaceOrderStatus,
  MarketplacePaymentMode,
  KitBundleItemComponent
} from '../types';

export class MarketplaceStoreService {
  private static instance: MarketplaceStoreService;

  private products: Map<string, MarketplaceProduct> = new Map();
  private orders: Map<string, MarketplaceOrder> = new Map();
  private processedIdempotencyKeys: Set<string> = new Set();

  private constructor() {
    this.loadFromStorage();
    if (this.products.size === 0) {
      this.seedInitialProducts();
    }
  }

  public static getInstance(): MarketplaceStoreService {
    if (!MarketplaceStoreService.instance) {
      MarketplaceStoreService.instance = new MarketplaceStoreService();
    }
    return MarketplaceStoreService.instance;
  }

  private loadFromStorage() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;

      const prodData = localStorage.getItem('i2a_marketplace_products');
      if (prodData) {
        const arr: MarketplaceProduct[] = JSON.parse(prodData);
        arr.forEach((p) => this.products.set(p.id, p));
      }

      const ordData = localStorage.getItem('i2a_marketplace_orders');
      if (ordData) {
        const arr: MarketplaceOrder[] = JSON.parse(ordData);
        arr.forEach((o) => {
          this.orders.set(o.id, o);
          if (o.idempotencyKey) {
            this.processedIdempotencyKeys.add(o.idempotencyKey);
          }
        });
      }
    } catch {
      // In-memory fallback
    }
  }

  private syncToStorage() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;

      localStorage.setItem(
        'i2a_marketplace_products',
        JSON.stringify(Array.from(this.products.values()))
      );
      localStorage.setItem(
        'i2a_marketplace_orders',
        JSON.stringify(Array.from(this.orders.values()))
      );
    } catch {
      // In-memory fallback
    }
  }

  private seedInitialProducts() {
    const defaultSchoolId = 'I2A-SCH-000001';
    const schoolBId = 'I2A-SCH-000002';
    const now = new Date().toISOString();

    const initialCatalog: MarketplaceProduct[] = [
      // --- School A: ABC Public School Catalog ---
      // 1. Uniforms
      {
        id: 'prod-uni-01',
        schoolId: defaultSchoolId,
        sku: 'ABC-UNI-BS-01',
        name: 'Boys Summer Uniform Set (Shirt + Trousers + Tie + Belt)',
        category: 'UNIFORM',
        targetAudience: 'STUDENT',
        applicableClasses: ['Class VI', 'Class VII', 'Class VIII', 'Class IX', 'Class X'],
        priceInPaise: 125000, // ₹1,250.00
        salePriceInPaise: 115000, // ₹1,150.00
        stockQuantity: 45,
        sizeOptions: ['28', '30', '32', '34', '36', '38'],
        sizeVariants: [
          { size: '28', stockQuantity: 8, sku: 'ABC-UNI-BS-28' },
          { size: '30', stockQuantity: 10, sku: 'ABC-UNI-BS-30' },
          { size: '32', stockQuantity: 12, sku: 'ABC-UNI-BS-32' },
          { size: '34', stockQuantity: 8, sku: 'ABC-UNI-BS-34' },
          { size: '36', stockQuantity: 5, sku: 'ABC-UNI-BS-36' },
          { size: '38', stockQuantity: 2, sku: 'ABC-UNI-BS-38' }
        ],
        isMandatory: true,
        isActive: true,
        sellerType: 'SCHOOL_DIRECT',
        badge: 'Official Mandatory Uniform',
        description: 'Premium poly-cotton breathable fabric with embroidered school crest, navy trousers, tie and elasticated belt.',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prod-uni-02',
        schoolId: defaultSchoolId,
        sku: 'ABC-UNI-GS-02',
        name: 'Girls Summer Uniform Set (Shirt + Pleated Skirt + Tie)',
        category: 'UNIFORM',
        targetAudience: 'STUDENT',
        applicableClasses: ['Class VI', 'Class VII', 'Class VIII', 'Class IX', 'Class X'],
        priceInPaise: 119000, // ₹1,190.00
        salePriceInPaise: 109000,
        stockQuantity: 50,
        sizeOptions: ['28', '30', '32', '34', '36'],
        sizeVariants: [
          { size: '28', stockQuantity: 10, sku: 'ABC-UNI-GS-28' },
          { size: '30', stockQuantity: 12, sku: 'ABC-UNI-GS-30' },
          { size: '32', stockQuantity: 15, sku: 'ABC-UNI-GS-32' },
          { size: '34', stockQuantity: 8, sku: 'ABC-UNI-GS-34' },
          { size: '36', stockQuantity: 5, sku: 'ABC-UNI-GS-36' }
        ],
        isMandatory: true,
        isActive: true,
        sellerType: 'SCHOOL_DIRECT',
        badge: 'Official Mandatory Uniform',
        description: 'Wrinkle-resistant fabric with school crest, knife-pleated navy skirt and adjustable waist band.',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prod-uni-03',
        schoolId: defaultSchoolId,
        sku: 'ABC-UNI-WB-03',
        name: 'Winter Woolen Blazer with Embroidered Crest (Unisex)',
        category: 'UNIFORM',
        targetAudience: 'STUDENT',
        applicableClasses: ['Class VI', 'Class VII', 'Class VIII', 'Class IX', 'Class X', 'Class XI', 'Class XII'],
        priceInPaise: 185000, // ₹1,850.00
        stockQuantity: 30,
        sizeOptions: ['30', '32', '34', '36', '38', '40'],
        isMandatory: true,
        isActive: true,
        sellerType: 'SCHOOL_DIRECT',
        badge: 'Winter Mandatory',
        description: 'Heavy thermal wool blend blazer with brass buttons and golden embroidered school coat of arms.',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prod-uni-04',
        schoolId: defaultSchoolId,
        sku: 'ABC-UNI-SPT-04',
        name: 'House Sports T-Shirt & Tracksuit Set (Red/Blue/Green/Yellow)',
        category: 'UNIFORM',
        targetAudience: 'STUDENT',
        applicableClasses: ['ALL'],
        priceInPaise: 85000, // ₹850.00
        stockQuantity: 65,
        sizeOptions: ['S', 'M', 'L', 'XL'],
        isMandatory: true,
        isActive: true,
        sellerType: 'AUTHORIZED_VENDOR',
        badge: 'Wednesday/Saturday Sports Day',
        description: 'Dri-FIT moisture-wicking sports fabric for inter-house physical education and athletics.',
        createdAt: now,
        updatedAt: now
      },

      // 2. Footwear
      {
        id: 'prod-foot-01',
        schoolId: defaultSchoolId,
        sku: 'ABC-SHO-BL-01',
        name: 'Action / Bata Formal Black Leather School Shoes',
        category: 'FOOTWEAR',
        targetAudience: 'STUDENT',
        applicableClasses: ['ALL'],
        priceInPaise: 79900, // ₹799.00
        stockQuantity: 40,
        sizeOptions: ['3', '4', '5', '6', '7', '8', '9', '10'],
        isMandatory: true,
        isActive: true,
        sellerType: 'AUTHORIZED_VENDOR',
        badge: 'Daily Assembly Wear',
        description: 'Anti-skid cushioned sole with reinforced heel for morning assembly and classroom wear.',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prod-foot-02',
        schoolId: defaultSchoolId,
        sku: 'ABC-SHO-WH-02',
        name: 'PT White Sports Canvas Shoes (Washable)',
        category: 'FOOTWEAR',
        targetAudience: 'STUDENT',
        applicableClasses: ['ALL'],
        priceInPaise: 49900, // ₹499.00
        stockQuantity: 35,
        sizeOptions: ['3', '4', '5', '6', '7', '8', '9'],
        isMandatory: false,
        isActive: true,
        sellerType: 'AUTHORIZED_VENDOR',
        badge: 'Sports Gear',
        description: 'Flexible rubber sole with breathable white canvas fabric for sports drills.',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prod-foot-03',
        schoolId: defaultSchoolId,
        sku: 'ABC-SOC-03',
        name: 'School Crest Cotton Socks (Pack of 3 Pairs)',
        category: 'FOOTWEAR',
        targetAudience: 'STUDENT',
        applicableClasses: ['ALL'],
        priceInPaise: 19900, // ₹199.00
        stockQuantity: 80,
        sizeOptions: ['Free Size'],
        isMandatory: true,
        isActive: true,
        sellerType: 'SCHOOL_DIRECT',
        badge: 'Value Pack',
        description: '100% combed cotton with anti-odor weave and school crest double navy band.',
        createdAt: now,
        updatedAt: now
      },

      // 3. Books & Class-Wise Bundles
      {
        id: 'prod-book-01',
        schoolId: defaultSchoolId,
        sku: 'ABC-BK-CL8-01',
        name: 'Class VIII NCERT Complete Textbook Set (6 Books)',
        category: 'BOOKS',
        targetAudience: 'STUDENT',
        applicableClasses: ['Class VIII'],
        priceInPaise: 78000, // ₹780.00
        stockQuantity: 60,
        isMandatory: true,
        isActive: true,
        sellerType: 'SCHOOL_DIRECT',
        badge: 'CBSE / NCERT Prescribed',
        description: 'Complete NCERT set: Mathematics, Science, Our Pasts III, Honeycomb English, Vasant Hindi & Sanskrit.',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prod-book-02',
        schoolId: defaultSchoolId,
        sku: 'ABC-BK-CL10-02',
        name: 'Class X CBSE Board Complete Textbook & Exemplar Set',
        category: 'BOOKS',
        targetAudience: 'STUDENT',
        applicableClasses: ['Class X'],
        priceInPaise: 115000, // ₹1,150.00
        stockQuantity: 45,
        isMandatory: true,
        isActive: true,
        sellerType: 'SCHOOL_DIRECT',
        badge: 'Board Exam Kit',
        description: 'Official CBSE NCERT textbooks with latest 2026-27 rationalized syllabus and exemplar problem sets.',
        createdAt: now,
        updatedAt: now
      },

      // 4. Kit / Annual Bundles
      {
        id: 'prod-kit-01',
        schoolId: defaultSchoolId,
        sku: 'ABC-KIT-CL8-FULL',
        name: 'Class VIII — Complete Annual Book & Stationery Kit',
        category: 'KIT_BUNDLE',
        targetAudience: 'STUDENT',
        applicableClasses: ['Class VIII'],
        priceInPaise: 135000, // ₹1,350.00 (Bundle price - saves ₹80 vs separate)
        salePriceInPaise: 129000, // ₹1,290.00
        stockQuantity: 40,
        isMandatory: false,
        isActive: true,
        isKitBundle: true,
        sellerType: 'SCHOOL_DIRECT',
        badge: 'Save 15% on Full Bundle',
        description: '1-Click Annual Kit: Class 8 NCERT Textbooks + 10 School Registers + Geometry Box + Exam Pens set.',
        kitComponents: [
          {
            productId: 'prod-book-01',
            productName: 'Class VIII NCERT Complete Textbook Set (6 Books)',
            category: 'BOOKS',
            quantity: 1,
            individualPriceInPaise: 78000
          },
          {
            productId: 'prod-stat-01',
            productName: 'Classroom Notebook Register Bundle (10 Registers Pack)',
            category: 'STATIONERY',
            quantity: 1,
            individualPriceInPaise: 45000
          },
          {
            productId: 'prod-stat-02',
            productName: 'Student Geometry & Mathematical Instrument Box Set',
            category: 'STATIONERY',
            quantity: 1,
            individualPriceInPaise: 18000
          }
        ],
        createdAt: now,
        updatedAt: now
      },

      // 5. Stationery & Supplies
      {
        id: 'prod-stat-01',
        schoolId: defaultSchoolId,
        sku: 'ABC-ST-REG-01',
        name: 'Classroom Notebook Register Bundle (10 Registers Pack)',
        category: 'STATIONERY',
        targetAudience: 'STUDENT',
        applicableClasses: ['ALL'],
        priceInPaise: 45000, // ₹450.00
        stockQuantity: 75,
        sizeOptions: ['180 Pages (Single Line / Math Grid)'],
        isMandatory: true,
        isActive: true,
        sellerType: 'SCHOOL_DIRECT',
        badge: 'Official School Monogram Notebooks',
        description: '70 GSM high-opacity paper with school emblem hard cover and student bio index sheet.',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prod-stat-02',
        schoolId: defaultSchoolId,
        sku: 'ABC-ST-GEO-02',
        name: 'Student Geometry & Mathematical Instrument Box Set',
        category: 'STATIONERY',
        targetAudience: 'STUDENT',
        applicableClasses: ['Class VI', 'Class VII', 'Class VIII', 'Class IX', 'Class X'],
        priceInPaise: 18000, // ₹180.00
        stockQuantity: 50,
        isMandatory: false,
        isActive: true,
        sellerType: 'AUTHORIZED_VENDOR',
        badge: 'Camlin Precision',
        description: 'Rust-proof self-centering compass, divider, protractor, scales and 0.5mm lead pencil.',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prod-stat-03',
        schoolId: defaultSchoolId,
        sku: 'ABC-ST-PEN-03',
        name: 'School Examination Pens & Stationery Kit',
        category: 'STATIONERY',
        targetAudience: 'STUDENT',
        applicableClasses: ['ALL'],
        priceInPaise: 12000, // ₹120.00
        stockQuantity: 100,
        isMandatory: false,
        isActive: true,
        sellerType: 'AUTHORIZED_VENDOR',
        badge: 'Exam Ready',
        description: '5 Blue + 2 Black waterproof gel pens, sharpener, dust-free eraser and 15cm ruler.',
        createdAt: now,
        updatedAt: now
      },

      // 6. Teacher & Staff Dress
      {
        id: 'prod-tea-01',
        schoolId: defaultSchoolId,
        sku: 'ABC-TCH-BLZ-01',
        name: 'Faculty Official Formal Blazer with Monogram (Teacher Uniform)',
        category: 'TEACHER_DRESS',
        targetAudience: 'TEACHER',
        applicableClasses: ['ALL'],
        priceInPaise: 210000, // ₹2,100.00
        stockQuantity: 25,
        sizeOptions: ['36', '38', '40', '42', '44'],
        isMandatory: true,
        isActive: true,
        sellerType: 'SCHOOL_DIRECT',
        badge: 'Faculty Mandatory Wear',
        description: 'Tailored executive navy blazer for faculty members, teachers and academic coordinators.',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prod-tea-02',
        schoolId: defaultSchoolId,
        sku: 'ABC-TCH-SAR-02',
        name: 'Teacher Daily Formal Uniform Saree Set (Chanderi Cotton)',
        category: 'TEACHER_DRESS',
        targetAudience: 'TEACHER',
        applicableClasses: ['ALL'],
        priceInPaise: 135000, // ₹1,350.00
        stockQuantity: 30,
        sizeOptions: ['Free Size (Includes Blouse Piece)'],
        isMandatory: false,
        isActive: true,
        sellerType: 'SCHOOL_DIRECT',
        badge: 'Teacher Institutional Wear',
        description: 'Handloom formal cotton saree with institutional border pattern and school colour scheme.',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'prod-tea-03',
        schoolId: defaultSchoolId,
        sku: 'ABC-TCH-COAT-03',
        name: 'Science Teacher & Lab Instructor Coat (White Anti-Static)',
        category: 'TEACHER_DRESS',
        targetAudience: 'TEACHER',
        applicableClasses: ['ALL'],
        priceInPaise: 55000, // ₹550.00
        stockQuantity: 20,
        sizeOptions: ['M', 'L', 'XL'],
        isMandatory: true,
        isActive: true,
        sellerType: 'AUTHORIZED_VENDOR',
        badge: 'Lab Safety Gear',
        description: '100% thick cotton lab coat with 3 front utility pockets for physics and chemistry labs.',
        createdAt: now,
        updatedAt: now
      },

      // 7. Accessories
      {
        id: 'prod-acc-01',
        schoolId: defaultSchoolId,
        sku: 'ABC-ACC-BAG-01',
        name: 'Ergonomic Waterproof School Backpack with Crest',
        category: 'ACCESSORIES',
        targetAudience: 'STUDENT',
        applicableClasses: ['ALL'],
        priceInPaise: 89000, // ₹890.00
        stockQuantity: 35,
        sizeOptions: ['32 Litres (3 Compartments)'],
        isMandatory: false,
        isActive: true,
        sellerType: 'AUTHORIZED_VENDOR',
        badge: 'Spine-Friendly Ergonomics',
        description: 'Reinforced nylon backpack with padded shoulder straps and rain cover.',
        createdAt: now,
        updatedAt: now
      },

      // --- School B: XYZ Academy Isolated Seed Data ---
      {
        id: 'prod-schb-01',
        schoolId: schoolBId,
        sku: 'XYZ-UNI-01',
        name: 'XYZ Academy Maroon Blazer with Crest',
        category: 'UNIFORM',
        targetAudience: 'STUDENT',
        applicableClasses: ['ALL'],
        priceInPaise: 195000,
        stockQuantity: 20,
        isMandatory: true,
        isActive: true,
        sellerType: 'SCHOOL_DIRECT',
        description: 'Official XYZ Academy maroon winter blazer.',
        createdAt: now,
        updatedAt: now
      }
    ];

    initialCatalog.forEach((p) => this.products.set(p.id, p));

    // Seed Sample Order for School A
    const sampleOrder: MarketplaceOrder = {
      id: 'ord-init-001',
      orderNo: 'ORD-2026-0001',
      idempotencyKey: 'idem-sample-01',
      schoolId: defaultSchoolId,
      userId: 'usr-parent-01',
      userName: 'Sanjay Sharma (Parent)',
      userRole: 'PARENT',
      studentName: 'Aarav Sharma',
      studentAdmissionNo: 'ADM-2026-0101',
      studentClass: 'Class VIII',
      items: [
        {
          productId: 'prod-uni-01',
          productName: 'Boys Summer Uniform Set (Shirt + Trousers + Tie + Belt)',
          category: 'UNIFORM',
          sku: 'ABC-UNI-BS-01',
          selectedSize: '32',
          quantity: 1,
          unitPriceInPaise: 115000,
          totalPriceInPaise: 115000
        },
        {
          productId: 'prod-stat-01',
          productName: 'Classroom Notebook Register Bundle (10 Registers Pack)',
          category: 'STATIONERY',
          sku: 'ABC-ST-REG-01',
          quantity: 1,
          unitPriceInPaise: 45000,
          totalPriceInPaise: 45000
        }
      ],
      totalAmountInPaise: 160000, // ₹1,600.00
      paymentMode: 'SCHOOL_COUNTER',
      paymentStatus: 'PAID',
      orderStatus: 'READY_FOR_PICKUP',
      collectionSlot: 'School Store Counter #1 (Monday - Saturday 09:00 AM - 01:00 PM)',
      createdAt: now,
      updatedAt: now
    };

    this.orders.set(sampleOrder.id, sampleOrder);
    this.processedIdempotencyKeys.add(sampleOrder.idempotencyKey!);
    this.syncToStorage();
  }

  // ==========================================
  // Product Catalog Queries & Management
  // ==========================================

  public getProducts(
    schoolId: string,
    filters?: {
      category?: MarketplaceProductCategory;
      className?: string;
      targetAudience?: MarketplaceProduct['targetAudience'];
      isMandatory?: boolean;
      search?: string;
      activeOnly?: boolean;
    }
  ): MarketplaceProduct[] {
    return Array.from(this.products.values()).filter((p) => {
      // 1. Strict Tenant Boundary
      if (p.schoolId !== schoolId) return false;

      // 2. Active status filter (defaults to activeOnly: true unless false specified)
      if (filters?.activeOnly !== false && !p.isActive) {
        return false;
      }

      if (filters?.category && p.category !== filters.category) {
        return false;
      }

      if (filters?.targetAudience && filters.targetAudience !== 'ALL') {
        if (p.targetAudience !== 'ALL' && p.targetAudience !== filters.targetAudience) {
          return false;
        }
      }

      if (filters?.className && filters.className !== 'ALL') {
        const matchesClass =
          p.applicableClasses.includes('ALL') ||
          p.applicableClasses.includes(filters.className);
        if (!matchesClass) return false;
      }

      if (filters?.isMandatory !== undefined && p.isMandatory !== filters.isMandatory) {
        return false;
      }

      if (filters?.search && filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchSku) return false;
      }

      return true;
    });
  }

  public getProductById(productId: string): MarketplaceProduct | undefined {
    return this.products.get(productId);
  }

  public createProduct(
    productData: Omit<MarketplaceProduct, 'id' | 'createdAt' | 'updatedAt'>,
    session: UserSession
  ): MarketplaceProduct {
    TenantSecurityService.validateTenantAccess(session, productData.schoolId);

    if (!['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'STAFF'].includes(session.role)) {
      throw new TenantSecurityException('Only authorized school administrators can add marketplace products.', 403);
    }

    if (productData.priceInPaise < 0 || productData.stockQuantity < 0) {
      throw new Error('INVALID_DATA: Price and stock quantity cannot be negative.');
    }

    if (!productData.name.trim() || !productData.sku.trim()) {
      throw new Error('INVALID_DATA: Product name and SKU are mandatory.');
    }

    const now = new Date().toISOString();
    const newProd: MarketplaceProduct = {
      ...productData,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: now,
      updatedAt: now
    };

    this.products.set(newProd.id, newProd);
    this.syncToStorage();
    return newProd;
  }

  public updateProduct(
    schoolId: string,
    productId: string,
    updates: Partial<Omit<MarketplaceProduct, 'id' | 'schoolId' | 'createdAt'>>,
    session: UserSession
  ): MarketplaceProduct {
    TenantSecurityService.validateTenantAccess(session, schoolId);

    if (!['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'STAFF'].includes(session.role)) {
      throw new TenantSecurityException('Only authorized administrators can edit products.', 403);
    }

    const prod = this.products.get(productId);
    if (!prod || prod.schoolId !== schoolId) {
      throw new Error(`Product ${productId} not found in school ${schoolId}`);
    }

    if (updates.priceInPaise !== undefined && updates.priceInPaise < 0) {
      throw new Error('INVALID_DATA: Price cannot be negative.');
    }
    if (updates.stockQuantity !== undefined && updates.stockQuantity < 0) {
      throw new Error('INVALID_DATA: Stock quantity cannot be negative.');
    }

    const updated: MarketplaceProduct = {
      ...prod,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.products.set(productId, updated);
    this.syncToStorage();
    return updated;
  }

  public toggleProductStatus(
    schoolId: string,
    productId: string,
    session: UserSession
  ): MarketplaceProduct {
    TenantSecurityService.validateTenantAccess(session, schoolId);

    if (!['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'STAFF'].includes(session.role)) {
      throw new TenantSecurityException('Only administrators can toggle product status.', 403);
    }

    const prod = this.products.get(productId);
    if (!prod || prod.schoolId !== schoolId) {
      throw new Error(`Product ${productId} not found in school ${schoolId}`);
    }

    prod.isActive = !prod.isActive;
    prod.updatedAt = new Date().toISOString();

    this.products.set(productId, prod);
    this.syncToStorage();
    return prod;
  }

  // ==========================================
  // Kit / Bundle Builder Engine
  // ==========================================

  public createKitBundle(
    params: {
      schoolId: string;
      name: string;
      description: string;
      targetClass: string;
      bundlePriceInPaise: number;
      componentProductIds: { productId: string; quantity: number }[];
      badge?: string;
    },
    session: UserSession
  ): MarketplaceProduct {
    TenantSecurityService.validateTenantAccess(session, params.schoolId);

    if (!['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'STAFF'].includes(session.role)) {
      throw new TenantSecurityException('Only school store operators can build kit bundles.', 403);
    }

    if (params.componentProductIds.length === 0) {
      throw new Error('INVALID_KIT: A kit bundle must contain at least one component product.');
    }

    const kitComponents: KitBundleItemComponent[] = [];
    let minAvailableStock = Infinity;

    for (const item of params.componentProductIds) {
      const prod = this.products.get(item.productId);
      if (!prod || prod.schoolId !== params.schoolId) {
        throw new Error(`Component product ${item.productId} not found in school ${params.schoolId}`);
      }
      if (!prod.isActive) {
        throw new Error(`Cannot include inactive product "${prod.name}" in an active kit bundle.`);
      }

      kitComponents.push({
        productId: prod.id,
        productName: prod.name,
        category: prod.category,
        quantity: item.quantity,
        individualPriceInPaise: prod.salePriceInPaise || prod.priceInPaise
      });

      const possibleKits = Math.floor(prod.stockQuantity / item.quantity);
      if (possibleKits < minAvailableStock) {
        minAvailableStock = possibleKits;
      }
    }

    const now = new Date().toISOString();
    const kitProduct: MarketplaceProduct = {
      id: `prod-kit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      schoolId: params.schoolId,
      sku: `KIT-${params.targetClass.toUpperCase().replace(/\s+/g, '')}-${Date.now().toString().slice(-4)}`,
      name: params.name,
      description: params.description,
      category: 'KIT_BUNDLE',
      targetAudience: 'STUDENT',
      applicableClasses: [params.targetClass],
      priceInPaise: kitComponents.reduce((sum, c) => sum + (c.individualPriceInPaise * c.quantity), 0),
      salePriceInPaise: params.bundlePriceInPaise,
      stockQuantity: minAvailableStock === Infinity ? 0 : minAvailableStock,
      isMandatory: false,
      isActive: true,
      isKitBundle: true,
      kitComponents,
      sellerType: 'SCHOOL_DIRECT',
      badge: params.badge || 'Annual Curated Kit',
      createdAt: now,
      updatedAt: now
    };

    this.products.set(kitProduct.id, kitProduct);
    this.syncToStorage();
    return kitProduct;
  }

  // ==========================================
  // Order Placement, Stock Safety & Lifecycle
  // ==========================================

  public placeOrder(
    params: {
      schoolId: string;
      idempotencyKey?: string;
      userId: string;
      userName: string;
      userRole: UserSession['role'];
      studentName?: string;
      studentAdmissionNo?: string;
      studentClass?: string;
      items: {
        productId: string;
        selectedSize?: string;
        quantity: number;
      }[];
      paymentMode: MarketplacePaymentMode;
    },
    session: UserSession
  ): MarketplaceOrder {
    TenantSecurityService.validateTenantAccess(session, params.schoolId);

    // 1. Idempotency Check: Prevent duplicate order submission
    if (params.idempotencyKey && this.processedIdempotencyKeys.has(params.idempotencyKey)) {
      const existing = Array.from(this.orders.values()).find(
        (o) => o.idempotencyKey === params.idempotencyKey
      );
      if (existing) {
        return existing; // Idempotently return already processed order
      }
    }

    if (!params.items || params.items.length === 0) {
      throw new Error('CART_EMPTY: Cannot place an order with zero items.');
    }

    // 2. Validate all items & stock availability upfront
    const orderItems: MarketplaceOrderItem[] = [];
    let grandTotalInPaise = 0;

    for (const item of params.items) {
      if (item.quantity <= 0) {
        throw new Error('INVALID_QUANTITY: Quantity must be greater than zero.');
      }

      const product = this.products.get(item.productId);
      if (!product || product.schoolId !== params.schoolId) {
        throw new Error(`PRODUCT_NOT_FOUND: Product ${item.productId} does not belong to school.`);
      }

      if (!product.isActive) {
        throw new Error(`PRODUCT_INACTIVE: Cannot order inactive item "${product.name}".`);
      }

      // Check stock availability
      if (product.stockQuantity < item.quantity) {
        throw new Error(
          `OUT_OF_STOCK: Insufficient inventory for "${product.name}". Available: ${product.stockQuantity}, Requested: ${item.quantity}.`
        );
      }

      const unitPrice = product.salePriceInPaise || product.priceInPaise;
      const lineTotal = unitPrice * item.quantity;
      grandTotalInPaise += lineTotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        category: product.category,
        sku: product.sku,
        selectedSize: item.selectedSize || product.sizeOptions?.[0],
        quantity: item.quantity,
        unitPriceInPaise: unitPrice,
        totalPriceInPaise: lineTotal
      });
    }

    // 3. Atomically Decrement Stock
    for (const item of params.items) {
      const product = this.products.get(item.productId)!;
      product.stockQuantity -= item.quantity;

      // Also update size variant stock if specified
      if (item.selectedSize && product.sizeVariants) {
        const variant = product.sizeVariants.find((v) => v.size === item.selectedSize);
        if (variant) {
          variant.stockQuantity = Math.max(0, variant.stockQuantity - item.quantity);
        }
      }
      this.products.set(product.id, product);
    }

    // 4. Construct Order Record
    const now = new Date().toISOString();
    const orderSeq = this.orders.size + 1;
    const orderNo = `ORD-${new Date().getFullYear()}-${String(orderSeq).padStart(4, '0')}`;
    const orderId = `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newOrder: MarketplaceOrder = {
      id: orderId,
      orderNo,
      idempotencyKey: params.idempotencyKey,
      schoolId: params.schoolId,
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      studentName: params.studentName,
      studentAdmissionNo: params.studentAdmissionNo,
      studentClass: params.studentClass,
      items: orderItems,
      totalAmountInPaise: grandTotalInPaise,
      paymentMode: params.paymentMode,
      paymentStatus: params.paymentMode === 'UPI_ONLINE' ? 'PAID' : 'PENDING',
      orderStatus: 'CONFIRMED',
      collectionSlot: 'School Uniform Counter - Gate 1 (Monday to Friday 09:00 AM - 01:00 PM)',
      createdAt: now,
      updatedAt: now
    };

    this.orders.set(orderId, newOrder);
    if (params.idempotencyKey) {
      this.processedIdempotencyKeys.add(params.idempotencyKey);
    }
    this.syncToStorage();
    return newOrder;
  }

  public cancelOrder(
    schoolId: string,
    orderId: string,
    reason: string,
    session: UserSession
  ): MarketplaceOrder {
    TenantSecurityService.validateTenantAccess(session, schoolId);

    const order = this.orders.get(orderId);
    if (!order || order.schoolId !== schoolId) {
      throw new Error(`Order ${orderId} not found in school ${schoolId}`);
    }

    // Role check: Parents can only cancel their own orders; Admins can cancel any
    if (['PARENT', 'STUDENT'].includes(session.role) && order.userId !== session.id) {
      throw new TenantSecurityException('Unauthorized: You cannot cancel another user\'s order.', 403);
    }

    if (order.orderStatus === 'DELIVERED' || order.orderStatus === 'CANCELLED') {
      throw new Error(`CANNOT_CANCEL: Order is already ${order.orderStatus}.`);
    }

    // Stock Rollback: Restore quantities back to product inventory
    for (const item of order.items) {
      const product = this.products.get(item.productId);
      if (product) {
        product.stockQuantity += item.quantity;
        if (item.selectedSize && product.sizeVariants) {
          const variant = product.sizeVariants.find((v) => v.size === item.selectedSize);
          if (variant) {
            variant.stockQuantity += item.quantity;
          }
        }
        this.products.set(product.id, product);
      }
    }

    order.orderStatus = 'CANCELLED';
    order.cancellationReason = reason || 'Cancelled by user';
    if (order.paymentStatus === 'PAID') {
      order.paymentStatus = 'REFUNDED';
    }
    order.updatedAt = new Date().toISOString();

    this.orders.set(orderId, order);
    this.syncToStorage();
    return order;
  }

  public updateOrderStatus(
    schoolId: string,
    orderId: string,
    newStatus: MarketplaceOrderStatus,
    session: UserSession
  ): MarketplaceOrder {
    TenantSecurityService.validateTenantAccess(session, schoolId);

    if (!['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'STAFF'].includes(session.role)) {
      throw new TenantSecurityException('Only school store operators can update order status.', 403);
    }

    const order = this.orders.get(orderId);
    if (!order || order.schoolId !== schoolId) {
      throw new Error(`Order ${orderId} not found in school ${schoolId}`);
    }

    order.orderStatus = newStatus;
    if (newStatus === 'DELIVERED' && order.paymentStatus === 'PENDING') {
      order.paymentStatus = 'PAID'; // Paid at school counter on collection
    }
    order.updatedAt = new Date().toISOString();

    this.orders.set(orderId, order);
    this.syncToStorage();
    return order;
  }

  public getOrders(schoolId: string, session: UserSession): MarketplaceOrder[] {
    TenantSecurityService.validateTenantAccess(session, schoolId);

    const schoolOrders = Array.from(this.orders.values()).filter((o) => o.schoolId === schoolId);

    // Parent/Student data isolation: Only show orders belonging to current user session
    if (['PARENT', 'STUDENT'].includes(session.role)) {
      return schoolOrders.filter((o) => o.userId === session.id);
    }

    // Administrators/Staff see full school order stream
    return schoolOrders;
  }

  public getLowStockAlerts(schoolId: string, threshold = 15): MarketplaceProduct[] {
    return Array.from(this.products.values()).filter(
      (p) => p.schoolId === schoolId && p.stockQuantity <= threshold && p.isActive
    );
  }

  public getSalesReport(schoolId: string): {
    totalRevenueInPaise: number;
    totalOrdersCount: number;
    completedOrdersCount: number;
    categorySalesBreakdown: Record<string, number>;
  } {
    const schoolOrders = Array.from(this.orders.values()).filter(
      (o) => o.schoolId === schoolId && o.orderStatus !== 'CANCELLED'
    );

    let totalRevenue = 0;
    const breakdown: Record<string, number> = {};

    for (const order of schoolOrders) {
      totalRevenue += order.totalAmountInPaise;
      for (const item of order.items) {
        breakdown[item.category] = (breakdown[item.category] || 0) + item.totalPriceInPaise;
      }
    }

    return {
      totalRevenueInPaise: totalRevenue,
      totalOrdersCount: schoolOrders.length,
      completedOrdersCount: schoolOrders.filter((o) => o.orderStatus === 'DELIVERED').length,
      categorySalesBreakdown: breakdown
    };
  }
}
