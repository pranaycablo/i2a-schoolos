import React, { useState, useMemo } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { MarketplaceStoreService } from '../../services/MarketplaceStoreService';
import { PaymentGatewayService } from '../../services/payment/PaymentGatewayService';
import type { UserSession } from '../../services/TenantSecurityService';
import type {
  MarketplaceProduct,
  MarketplaceProductCategory,
  MarketplaceOrder,
  MarketplacePaymentMode,
  PaymentGatewayProvider,
  GatewayEnvironment,
  SchoolPaymentGatewayConfig,
  PaymentReconciliationRecord
} from '../../types';
import {
  ShoppingBag,
  Shirt,
  BookOpen,
  Footprints,
  Package,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Search,
  Filter,
  ShieldCheck,
  Clock,
  CreditCard,
  Printer,
  RotateCcw,
  Layers,
  Tag,
  Check,
  X,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  UserCheck,
  AlertCircle
} from 'lucide-react';

export const SchoolMarketplaceModule: React.FC = () => {
  const { branding, currentRole, students, logAction } = useSchool();
  const schoolId = branding?.id || 'I2A-SCH-000001';
  const storeService = MarketplaceStoreService.getInstance();

  const session: UserSession = {
    id: currentRole === 'PARENT' ? 'usr-parent-01' : 'user-active-principal',
    email: currentRole === 'PARENT' ? 'parent@school.com' : 'admin@school.com',
    tenantId: schoolId,
    role: currentRole,
    status: 'ACTIVE'
  };

  const isAdminOrStaff = ['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'STAFF'].includes(currentRole);
  const gatewayService = PaymentGatewayService.getInstance();

  const [activeTab, setActiveTab] = useState<'CATALOG' | 'CART' | 'MY_ORDERS' | 'ADMIN_DESK' | 'GATEWAY_SETTINGS'>('CATALOG');
  const [gatewayConfig, setGatewayConfig] = useState<SchoolPaymentGatewayConfig>(() =>
    gatewayService.getGatewayConfig(schoolId, session)
  );
  const [reconciliations, setReconciliations] = useState<PaymentReconciliationRecord[]>(() =>
    gatewayService.getReconciliationRecords(schoolId, session)
  );
  const [showLiveConfirmModal, setShowLiveConfirmModal] = useState(false);
  const [isTestingGateway, setIsTestingGateway] = useState(false);
  const [testGatewayResult, setTestGatewayResult] = useState<{ success: boolean; message: string } | null>(null);
  const [tempMerchantId, setTempMerchantId] = useState(gatewayConfig.merchantId);
  const [tempPublicKeyId, setTempPublicKeyId] = useState(gatewayConfig.publicKeyId);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<MarketplaceProductCategory | 'ALL'>('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [targetAudienceFilter, setTargetAudienceFilter] = useState<'ALL' | 'STUDENT' | 'TEACHER'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyMandatory, setOnlyMandatory] = useState(false);

  // Cart state
  const [cart, setCart] = useState<{
    productId: string;
    product: MarketplaceProduct;
    selectedSize?: string;
    quantity: number;
  }[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || 'std-101');
  const [paymentMode, setPaymentMode] = useState<MarketplacePaymentMode>('SCHOOL_COUNTER');
  const [checkoutSuccessOrder, setCheckoutSuccessOrder] = useState<MarketplaceOrder | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Selected sizes on catalog cards: productId -> size
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  // Products and Orders
  const [productsList, setProductsList] = useState<MarketplaceProduct[]>(() =>
    storeService.getProducts(schoolId, { activeOnly: !isAdminOrStaff })
  );
  const [ordersList, setOrdersList] = useState<MarketplaceOrder[]>(() =>
    storeService.getOrders(schoolId, session)
  );

  // Refresh helper
  const refreshStore = () => {
    setProductsList(storeService.getProducts(schoolId, { activeOnly: !isAdminOrStaff }));
    setOrdersList(storeService.getOrders(schoolId, session));
  };

  // Filtered catalog products
  const filteredProducts = useMemo(() => {
    return productsList.filter((p) => {
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
      if (targetAudienceFilter !== 'ALL' && p.targetAudience !== 'ALL' && p.targetAudience !== targetAudienceFilter) return false;
      if (selectedClassFilter !== 'ALL' && !p.applicableClasses.includes('ALL') && !p.applicableClasses.includes(selectedClassFilter)) return false;
      if (onlyMandatory && !p.isMandatory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchDesc) return false;
      }
      return true;
    });
  }, [productsList, selectedCategory, targetAudienceFilter, selectedClassFilter, onlyMandatory, searchQuery]);

  // Cart count & total
  const cartTotalInPaise = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = item.product.salePriceInPaise || item.product.priceInPaise;
      return sum + (price * item.quantity);
    }, 0);
  }, [cart]);

  const cartItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Cart Handlers
  const handleAddToCart = (product: MarketplaceProduct) => {
    setActionError(null);
    const chosenSize = selectedSizes[product.id] || product.sizeOptions?.[0];

    // Check stock
    const existingInCart = cart.find(
      (c) => c.productId === product.id && c.selectedSize === chosenSize
    );
    const currentCartQty = existingInCart ? existingInCart.quantity : 0;

    if (currentCartQty + 1 > product.stockQuantity) {
      setActionError(`Cannot add more: only ${product.stockQuantity} units in stock for ${product.name}!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find(
        (c) => c.productId === product.id && c.selectedSize === chosenSize
      );
      if (existing) {
        return prev.map((c) =>
          c === existing ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          product,
          selectedSize: chosenSize,
          quantity: 1
        }
      ];
    });

    setActionSuccess(`Added "${product.name}" to cart!`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleUpdateCartQuantity = (productId: string, size: string | undefined, delta: number) => {
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.productId === productId && c.selectedSize === size) {
            const newQty = c.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > c.product.stockQuantity) {
              alert(`Cannot exceed available stock of ${c.product.stockQuantity} units.`);
              return c;
            }
            return { ...c, quantity: newQty };
          }
          return c;
        })
        .filter(Boolean) as typeof prev;
    });
  };

  const handleRemoveFromCart = (productId: string, size: string | undefined) => {
    setCart((prev) => prev.filter((c) => !(c.productId === productId && c.selectedSize === size)));
  };

  // Place Order Handler
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (cart.length === 0) {
      setActionError('Cart is empty. Please add items before placing order.');
      return;
    }

    const targetStudent = students.find((s) => s.id === selectedStudentId);

    try {
      const idempotencyKey = `idem-${session.id}-${Date.now()}`;

      const order = storeService.placeOrder(
        {
          schoolId,
          idempotencyKey,
          userId: session.id,
          userName: session.role === 'PARENT' ? `Parent of ${targetStudent?.name || 'Student'}` : branding.principalName,
          userRole: session.role,
          studentName: targetStudent?.name,
          studentAdmissionNo: targetStudent?.admissionNo,
          studentClass: targetStudent?.className,
          items: cart.map((c) => ({
            productId: c.productId,
            selectedSize: c.selectedSize,
            quantity: c.quantity
          })),
          paymentMode
        },
        session
      );

      setCart([]);
      setCheckoutSuccessOrder(order);
      refreshStore();
      logAction(
        'MARKETPLACE_ORDER_PLACED',
        'MARKETPLACE',
        `Placed order ${order.orderNo} for ₹${(order.totalAmountInPaise / 100).toLocaleString('en-IN')}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(msg);
    }
  };

  // Cancel Order Handler
  const handleCancelOrder = (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order? Stock will be restored to store inventory.')) return;
    try {
      const cancelled = storeService.cancelOrder(schoolId, orderId, 'Cancelled by user', session);
      refreshStore();
      setActionSuccess(`Order ${cancelled.orderNo} was cancelled and product stock was restored.`);
      setTimeout(() => setActionSuccess(null), 4000);
      logAction('MARKETPLACE_ORDER_CANCELLED', 'MARKETPLACE', `Cancelled order ${cancelled.orderNo}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(msg);
    }
  };

  // Admin Order Status Update
  const handleUpdateOrderStatus = (orderId: string, status: MarketplaceOrder['orderStatus']) => {
    try {
      const updated = storeService.updateOrderStatus(schoolId, orderId, status, session);
      refreshStore();
      setActionSuccess(`Order ${updated.orderNo} updated to ${status}`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(msg);
    }
  };

  // Payment Gateway Handlers (FOV-07A)
  const handleUpdateGatewayProvider = (prov: PaymentGatewayProvider) => {
    try {
      const updated = gatewayService.updateGatewayConfig(schoolId, { provider: prov }, session);
      setGatewayConfig(updated);
      setActionSuccess(`Switched payment gateway to ${prov}. Webhook endpoint updated.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(msg);
    }
  };

  const handleToggleGatewayEnv = (env: GatewayEnvironment) => {
    if (env === 'LIVE' && !gatewayConfig.isLiveConfirmed) {
      setShowLiveConfirmModal(true);
      return;
    }
    try {
      const updated = gatewayService.updateGatewayConfig(schoolId, { environment: env }, session);
      setGatewayConfig(updated);
      setActionSuccess(`Gateway environment switched to ${env} Mode.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(msg);
    }
  };

  const handleConfirmLiveMode = () => {
    try {
      const updated = gatewayService.updateGatewayConfig(
        schoolId,
        { environment: 'LIVE', isLiveConfirmed: true },
        session
      );
      setGatewayConfig(updated);
      setShowLiveConfirmModal(false);
      setActionSuccess('LIVE Payments Mode activated. Ensure server KMS has production API secrets.');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(msg);
    }
  };

  const handleTestGatewayConnection = async () => {
    setIsTestingGateway(true);
    setTestGatewayResult(null);
    try {
      const res = await gatewayService.testGatewayConnection(schoolId, session);
      setTestGatewayResult(res);
      setGatewayConfig(gatewayService.getGatewayConfig(schoolId, session));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestGatewayResult({ success: false, message: msg });
    } finally {
      setIsTestingGateway(false);
    }
  };

  const handleSaveCredentials = (merchantId: string, publicKeyId: string) => {
    try {
      const updated = gatewayService.updateGatewayConfig(
        schoolId,
        { merchantId, publicKeyId },
        session
      );
      setGatewayConfig(updated);
      setActionSuccess('Merchant credentials updated. Secret keys remain strictly secured in server vault.');
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(msg);
    }
  };

  // Helper: Format paise to Rupees
  const formatRupees = (paise: number) => {
    return `₹${(paise / 100).toLocaleString('en-IN')}`;
  };

  // Sales report for admin desk
  const salesReport = useMemo(() => {
    return storeService.getSalesReport(schoolId);
  }, [ordersList, schoolId]);

  const lowStockAlerts = useMemo(() => {
    return storeService.getLowStockAlerts(schoolId, 15);
  }, [productsList, schoolId]);

  return (
    <div className="space-y-6 animate-fade-in pb-16 text-xs">
      {/* Multi-Tenant Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {branding.name} Official Marketplace
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-bold">
                  {schoolId}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[10px] font-bold">
                  Session {branding.academicSession}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                School-approved Uniforms, Books, Stationery, Footwear & Teacher Attire
              </p>
            </div>
          </div>

          {/* Navigation Pill Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => { setActiveTab('CATALOG'); setCheckoutSuccessOrder(null); }}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'CATALOG'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Shirt className="w-3.5 h-3.5" /> Catalog
            </button>

            <button
              onClick={() => { setActiveTab('CART'); setCheckoutSuccessOrder(null); }}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all relative flex items-center gap-1.5 ${
                activeTab === 'CART'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Cart
              {cartItemsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-extrabold animate-pulse">
                  {cartItemsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('MY_ORDERS'); setCheckoutSuccessOrder(null); }}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'MY_ORDERS'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" /> Orders ({ordersList.length})
            </button>

            {isAdminOrStaff && (
              <button
                onClick={() => { setActiveTab('ADMIN_DESK'); setCheckoutSuccessOrder(null); }}
                className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'ADMIN_DESK'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> Store Admin Desk
              </button>
            )}

            {isAdminOrStaff && (
              <button
                onClick={() => { setActiveTab('GATEWAY_SETTINGS'); setCheckoutSuccessOrder(null); }}
                className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'GATEWAY_SETTINGS'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> Payment Gateway
              </button>
            )}
          </div>
        </div>

        {/* Tenant Isolation & Gateway Notice Banner */}
        <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60 rounded-2xl flex items-start justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <b>Isolated School Store</b>: Products & orders are strictly tied to School ID <span className="font-mono font-bold">{schoolId}</span>. All monetary values computed in integer paise.
            </span>
          </div>
          <span className="text-slate-500 font-semibold hidden md:inline">
            Fulfillment: School Counter Pickup & Fee Bill Sync
          </span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center gap-2 font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {actionSuccess}
        </div>
      )}

      {actionError && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-2xl flex items-center gap-2 font-bold animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          {actionError}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: BROWSE CATALOG & UNIFORM / BOOK STORE              */}
      {/* ========================================================= */}
      {activeTab === 'CATALOG' && (
        <div className="space-y-6">
          {/* Promotional Store Showcase Banner */}
          <div className="relative rounded-3xl overflow-hidden border border-emerald-500/30 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-12 items-center">
              <div className="md:col-span-8 p-6 space-y-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  School Authorized Merchandise & Supplies
                </span>
                <h3 className="text-xl font-black text-white">
                  Official School Uniforms, Books & Annual Kit Store
                </h3>
                <p className="text-xs text-emerald-100/80 leading-relaxed max-w-xl">
                  Order tailored blazers, house t-shirts, CBSE NCERT book bundles, and laboratory kits directly online with zero delivery fees and direct classroom dispatch.
                </p>
              </div>
              <div className="md:col-span-4 p-4 flex justify-end">
                <img
                  src="./images/school-store-banner.png"
                  alt="School Store Showcase"
                  className="h-32 w-auto object-cover rounded-2xl shadow-lg border border-emerald-400/20"
                />
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[10px] mr-1">Categories:</span>
              {[
                { id: 'ALL', label: 'All Items', icon: ShoppingBag },
                { id: 'UNIFORM', label: 'Uniforms', icon: Shirt },
                { id: 'FOOTWEAR', label: 'Shoes & Socks', icon: Footprints },
                { id: 'BOOKS', label: 'Textbooks', icon: BookOpen },
                { id: 'KIT_BUNDLE', label: 'Annual Kits', icon: Layers },
                { id: 'STATIONERY', label: 'Stationery', icon: Package },
                { id: 'TEACHER_DRESS', label: 'Teacher Uniforms', icon: UserCheck },
                { id: 'ACCESSORIES', label: 'Bags & Acc', icon: Tag }
              ].map((cat) => {
                const Icon = cat.icon;
                const isSel = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id as MarketplaceProductCategory | 'ALL')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                      isSel
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Class & Search Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search uniforms, books, stationery..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value="ALL">Filter by Class (All Classes)</option>
                  <option value="Class VI">Class VI</option>
                  <option value="Class VII">Class VII</option>
                  <option value="Class VIII">Class VIII (Recommended for Aarav)</option>
                  <option value="Class IX">Class IX</option>
                  <option value="Class X">Class X (CBSE Board)</option>
                  <option value="Class XI">Class XI</option>
                  <option value="Class XII">Class XII</option>
                </select>
              </div>

              <div>
                <select
                  value={targetAudienceFilter}
                  onChange={(e) => setTargetAudienceFilter(e.target.value as 'ALL' | 'STUDENT' | 'TEACHER')}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                >
                  <option value="ALL">Audience: All Customers</option>
                  <option value="STUDENT">Student Supplies</option>
                  <option value="TEACHER">Teacher & Staff Attire</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={onlyMandatory}
                  onChange={(e) => setOnlyMandatory(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Mandatory Items Only</span>
              </label>
            </div>
          </div>

          {/* Product Cards Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">No items match your filter criteria</h3>
              <p className="text-slate-400">Try changing your search term or select "All Items".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((p) => {
                const isKit = p.isKitBundle;
                const hasSale = p.salePriceInPaise && p.salePriceInPaise < p.priceInPaise;
                const activePrice = p.salePriceInPaise || p.priceInPaise;
                const isOutOfStock = p.stockQuantity <= 0;
                const isLowStock = p.stockQuantity > 0 && p.stockQuantity <= 15;
                const selectedSize = selectedSizes[p.id] || p.sizeOptions?.[0];

                return (
                  <div
                    key={p.id}
                    className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                      p.isMandatory
                        ? 'border-indigo-300 dark:border-indigo-800/80 ring-1 ring-indigo-200 dark:ring-indigo-900/40'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="p-5 space-y-3">
                      {/* Top Badges */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            {p.sku}
                          </span>
                          {p.isMandatory && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold uppercase">
                              Mandatory
                            </span>
                          )}
                          {p.targetAudience === 'TEACHER' && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                              Faculty Uniform
                            </span>
                          )}
                        </div>

                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isOutOfStock
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                            : isLowStock
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        }`}>
                          {isOutOfStock ? 'Out of Stock' : isLowStock ? `Only ${p.stockQuantity} Left` : `${p.stockQuantity} In Stock`}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                          {p.name}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1 leading-relaxed line-clamp-2">
                          {p.description}
                        </p>
                      </div>

                      {/* Kit Bundle Expandable Summary */}
                      {isKit && p.kitComponents && (
                        <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/60 space-y-1.5">
                          <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1 text-[11px]">
                            <Layers className="w-3.5 h-3.5 text-amber-600" /> Kit Includes ({p.kitComponents.length} items):
                          </span>
                          <ul className="space-y-1 text-[10px] text-amber-800 dark:text-amber-400">
                            {p.kitComponents.map((kc, kidx) => (
                              <li key={kidx} className="flex justify-between">
                                <span>• {kc.productName} (x{kc.quantity})</span>
                                <span className="font-mono font-semibold">{formatRupees(kc.individualPriceInPaise)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Size Options Pills */}
                      {p.sizeOptions && p.sizeOptions.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Size / Fit:</span>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {p.sizeOptions.map((sz) => (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => setSelectedSizes((prev) => ({ ...prev, [p.id]: sz }))}
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                  selectedSize === sz
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Pricing & Add to Cart Action */}
                    <div className="p-5 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-black text-slate-900 dark:text-white">
                            {formatRupees(activePrice)}
                          </span>
                          {hasSale && (
                            <span className="text-[11px] text-slate-400 line-through">
                              {formatRupees(p.priceInPaise)}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {p.sellerType === 'SCHOOL_DIRECT' ? 'Supplied by School Counter' : 'Authorized Vendor Partner'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleAddToCart(p)}
                        disabled={isOutOfStock}
                        className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                          isOutOfStock
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-95'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" /> Add to Cart
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: SHOPPING CART & ORDER PLACEMENT DESK               */}
      {/* ========================================================= */}
      {activeTab === 'CART' && (
        <div className="space-y-6">
          {checkoutSuccessOrder ? (
            /* Order Success View */
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-emerald-200 dark:border-emerald-800/80 shadow-md text-center space-y-4 max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Order Placed Successfully!
              </h3>
              <p className="text-slate-500 text-xs">
                Order Number: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">{checkoutSuccessOrder.orderNo}</span>
              </p>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2">
                <div className="flex justify-between font-bold border-b pb-2 border-slate-200 dark:border-slate-700">
                  <span>Student: {checkoutSuccessOrder.studentName || 'Self'} ({checkoutSuccessOrder.studentClass || 'Staff'})</span>
                  <span className="text-indigo-600 font-bold">{formatRupees(checkoutSuccessOrder.totalAmountInPaise)}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  <b>Pickup Counter</b>: {checkoutSuccessOrder.collectionSlot}
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  <b>Payment Mode</b>: {checkoutSuccessOrder.paymentMode} ({checkoutSuccessOrder.paymentStatus})
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('MY_ORDERS')}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  View in My Orders
                </button>
                <button
                  onClick={() => { setCheckoutSuccessOrder(null); setActiveTab('CATALOG'); }}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : cart.length === 0 ? (
            /* Empty Cart View */
            <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-base text-slate-800 dark:text-white">Your Marketplace Cart is Empty</h3>
              <p className="text-slate-500 text-xs">
                Browse our catalog to select school uniforms, textbooks, or stationery.
              </p>
              <button
                onClick={() => setActiveTab('CATALOG')}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer mt-2"
              >
                Browse Store Catalog
              </button>
            </div>
          ) : (
            /* Cart Items & Checkout Form */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Items List */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-800">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Selected Items ({cartItemsCount})
                  </h3>
                  <button
                    onClick={() => setCart([])}
                    className="text-rose-600 dark:text-rose-400 font-semibold hover:underline cursor-pointer"
                  >
                    Clear Cart
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {cart.map((item, idx) => {
                    const price = item.product.salePriceInPaise || item.product.priceInPaise;
                    const lineTotal = price * item.quantity;

                    return (
                      <div key={idx} className="py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                        <div className="space-y-1">
                          <span className="font-mono text-[10px] text-slate-400 font-bold">{item.product.sku}</span>
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs">{item.product.name}</h4>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            {item.selectedSize && <span>Size: <b>{item.selectedSize}</b></span>}
                            <span>Price: <b>{formatRupees(price)}</b></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Quantity selector */}
                          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => handleUpdateCartQuantity(item.productId, item.selectedSize, -1)}
                              className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-white"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-bold font-mono">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateCartQuantity(item.productId, item.selectedSize, 1)}
                              className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-white"
                            >
                              +
                            </button>
                          </div>

                          <span className="font-black font-mono text-sm text-slate-900 dark:text-white min-w-[70px] text-right">
                            {formatRupees(lineTotal)}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item.productId, item.selectedSize)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Checkout Form */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white border-b pb-3 border-slate-100 dark:border-slate-800">
                  Order Summary & Collection
                </h3>

                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">
                      Assign to Student / Child
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.className} - {s.admissionNo})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">
                      Payment Clearance Mode
                    </label>
                    <div className="space-y-2">
                      {[
                        { id: 'SCHOOL_COUNTER', label: 'Pay at School Store Counter on Collection (Cash/Card)', desc: 'Clear payment at Uniform counter upon physical receipt' },
                        { id: 'UPI_ONLINE', label: 'Instant UPI Scan & Pay (Simulated Demo Clearance)', desc: 'Demo gateway authorization slip' },
                        { id: 'FEE_BILL_ADJUST', label: 'Add to Next Monthly Fee Invoice', desc: 'Charged to student finance ledger' }
                      ].map((pm) => (
                        <label
                          key={pm.id}
                          className={`p-3 rounded-2xl border block cursor-pointer transition-all ${
                            paymentMode === pm.id
                              ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="payMode"
                              checked={paymentMode === pm.id}
                              onChange={() => setPaymentMode(pm.id as MarketplacePaymentMode)}
                              className="text-indigo-600"
                            />
                            <span className="font-bold text-slate-900 dark:text-white text-xs">{pm.label}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 pl-5 mt-0.5">{pm.desc}</p>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Total Items Price</span>
                      <span>{formatRupees(cartTotalInPaise)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>School Counter Handling Fee</span>
                      <span className="text-emerald-600 font-bold">FREE (₹0.00)</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t">
                      <span>Grand Total</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{formatRupees(cartTotalInPaise)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-sm shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    Confirm Order & Get Collection Slip
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: MY ORDERS & COLLECTION SLIPS                       */}
      {/* ========================================================= */}
      {activeTab === 'MY_ORDERS' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" /> My Orders & Collection Slips
            </h3>

            {ordersList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Package className="w-8 h-8 mx-auto text-slate-300" />
                <p>No orders placed yet. Visit the catalog to order uniforms or books.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ordersList.map((ord) => {
                  const isDelivered = ord.orderStatus === 'DELIVERED';
                  const isCancelled = ord.orderStatus === 'CANCELLED';

                  return (
                    <div
                      key={ord.id}
                      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                    >
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b pb-3 border-slate-200 dark:border-slate-700">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">{ord.orderNo}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              ord.orderStatus === 'DELIVERED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : ord.orderStatus === 'READY_FOR_PICKUP'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : ord.orderStatus === 'CANCELLED'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                            }`}>
                              {ord.orderStatus}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Order Date: {ord.createdAt.split('T')[0]} • Customer: {ord.userName}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-black text-slate-900 dark:text-white">
                            {formatRupees(ord.totalAmountInPaise)}
                          </span>
                          <span className="block text-[10px] font-semibold text-slate-400">
                            {ord.paymentMode} ({ord.paymentStatus})
                          </span>
                        </div>
                      </div>

                      {/* Itemized Snapshot */}
                      <div className="space-y-1.5 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Order Items:</span>
                        {ord.items.map((it, itIdx) => (
                          <div key={itIdx} className="flex justify-between items-center text-[11px] p-2 bg-white dark:bg-slate-800 rounded-xl">
                            <div>
                              <span className="font-bold text-slate-800 dark:text-white">{it.productName}</span>
                              {it.selectedSize && <span className="text-slate-400 ml-2">(Size: {it.selectedSize})</span>}
                            </div>
                            <div className="font-mono">
                              {it.quantity} x {formatRupees(it.unitPriceInPaise)} = <b>{formatRupees(it.totalPriceInPaise)}</b>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Collection Point & Cancellation */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-[11px]">
                        <span className="text-slate-600 dark:text-slate-300">
                          📍 <b>Collection Counter</b>: {ord.collectionSlot || 'School Uniform Gate Counter'}
                        </span>

                        {!isDelivered && !isCancelled && (
                          <button
                            type="button"
                            onClick={() => handleCancelOrder(ord.id)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-xl font-bold cursor-pointer transition-all self-end"
                          >
                            Cancel Order & Restore Stock
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: STORE ADMIN & INVENTORY DESK                       */}
      {/* ========================================================= */}
      {activeTab === 'ADMIN_DESK' && isAdminOrStaff && (
        <div className="space-y-6">
          {/* Admin Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-slate-400 font-semibold text-[11px]">Total Store Revenue</span>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {formatRupees(salesReport.totalRevenueInPaise)}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-slate-400 font-semibold text-[11px]">Total Orders</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {salesReport.totalOrdersCount}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-slate-400 font-semibold text-[11px]">Fulfilled & Delivered</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {salesReport.completedOrdersCount}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-slate-400 font-semibold text-[11px]">Low Stock Warnings</span>
              <div className="text-2xl font-black text-amber-500 mt-1">
                {lowStockAlerts.length}
              </div>
            </div>
          </div>

          {/* Low Stock Alerts Banner */}
          {lowStockAlerts.length > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Low Stock Inventory Alerts (Under 15 Units)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                {lowStockAlerts.map((ls) => (
                  <div key={ls.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900/60 flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-800 dark:text-white truncate">{ls.name}</span>
                    <span className="font-mono font-bold text-amber-600 ml-2">{ls.stockQuantity} Left</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fulfillment Pipeline Desk */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" /> Store Orders Fulfillment Pipeline
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                    <th className="py-2.5 px-3">Order No</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Items Count</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Advance Lifecycle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ordersList.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {ord.orderNo}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 dark:text-white">
                        {ord.userName}
                      </td>
                      <td className="py-2.5 px-3 font-mono">{ord.items.length} items</td>
                      <td className="py-2.5 px-3 font-bold">{formatRupees(ord.totalAmountInPaise)}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ord.paymentStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1.5">
                        {ord.orderStatus === 'CONFIRMED' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'PACKED')}
                            className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-bold text-[10px]"
                          >
                            Mark Packed
                          </button>
                        )}
                        {ord.orderStatus === 'PACKED' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'READY_FOR_PICKUP')}
                            className="px-2.5 py-1 bg-amber-600 text-white rounded-lg font-bold text-[10px]"
                          >
                            Ready for Pickup
                          </button>
                        )}
                        {ord.orderStatus === 'READY_FOR_PICKUP' && (
                          <button
                            onClick={() => handleUpdateOrderStatus(ord.id, 'DELIVERED')}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[10px]"
                          >
                            Mark Delivered
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: SCHOOL PAYMENT GATEWAY SETTINGS (FOV-07A)                     */}
      {/* ==================================================================== */}
      {activeTab === 'GATEWAY_SETTINGS' && isAdminOrStaff && (
        <div className="space-y-6 animate-fade-in">
          {/* Header & Isolation Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    School-wise Independent Payment Gateway
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-bold">
                    Tenant: {schoolId}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                  Configure direct merchant payouts for {branding.name}. Payments deposit directly to school bank account.
                </p>
              </div>

              {/* Environment Switcher */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold px-2 text-slate-500">Mode:</span>
                <button
                  type="button"
                  onClick={() => handleToggleGatewayEnv('TEST')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                    gatewayConfig.environment === 'TEST'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  TEST / SANDBOX
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleGatewayEnv('LIVE')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                    gatewayConfig.environment === 'LIVE'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  LIVE PRODUCTION
                </button>
              </div>
            </div>

            {/* Zero-Secrets & Architecture Safety Card */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-indigo-950 dark:text-indigo-200">
                  Client Zero-Secrets Policy & Direct Merchant Payouts
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Secret keys (Razorpay Key Secret, PhonePe Salt Key, Paytm Merchant Key) and Webhook Signing Secrets are <b>NEVER</b> stored in browser localStorage or transmitted through this client. They must be stored in secure backend KMS/Vault.
                  Direct Settlement: Funds go straight to the school merchant account ({gatewayConfig.schoolBankAccountMasked}).
                </p>
              </div>
            </div>
          </div>

          {/* Provider Selection Cards (Provider Adapter Pattern) */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Supported Payment Gateway Providers
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Razorpay Card */}
              <div
                onClick={() => handleUpdateGatewayProvider('RAZORPAY')}
                className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                  gatewayConfig.provider === 'RAZORPAY'
                    ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500 shadow-md ring-2 ring-indigo-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-xs">
                      R
                    </span>
                    Razorpay
                  </div>
                  {gatewayConfig.provider === 'RAZORPAY' && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-[11px] mb-3">
                  Standard Checkout, UPI Intent, Netbanking (50+ banks), Debit/Credit Cards & EMI.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                    UPI AutoPay
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                    Direct Payout
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                    Smart Router
                  </span>
                </div>
              </div>

              {/* PhonePe Card */}
              <div
                onClick={() => handleUpdateGatewayProvider('PHONEPE')}
                className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                  gatewayConfig.provider === 'PHONEPE'
                    ? 'bg-purple-50/60 dark:bg-purple-950/40 border-purple-500 shadow-md ring-2 ring-purple-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-purple-700 text-white font-black flex items-center justify-center text-xs">
                      Pe
                    </span>
                    PhonePe PG
                  </div>
                  {gatewayConfig.provider === 'PHONEPE' && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-[11px] mb-3">
                  Zero MDR UPI transactions, Dynamic QR, Direct UPI Switch with high success rate.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                    UPI Express
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                    Dynamic QR
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                    S2S Callbacks
                  </span>
                </div>
              </div>

              {/* Paytm Card */}
              <div
                onClick={() => handleUpdateGatewayProvider('PAYTM')}
                className={`p-5 rounded-3xl border cursor-pointer transition-all ${
                  gatewayConfig.provider === 'PAYTM'
                    ? 'bg-cyan-50/60 dark:bg-cyan-950/40 border-cyan-500 shadow-md ring-2 ring-cyan-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-cyan-600 text-white font-black flex items-center justify-center text-xs">
                      P
                    </span>
                    Paytm PG
                  </div>
                  {gatewayConfig.provider === 'PAYTM' && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-600 text-white text-[10px] font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-[11px] mb-3">
                  Paytm Wallet, Fast UPI payments, All major debit/credit cards and netbanking.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                    Paytm Wallet
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                    TxnToken v2
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                    Instant Refund
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Form & Status Deck */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Merchant Credentials Form */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center justify-between">
                <span>Merchant Public Parameters</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Last updated: {new Date(gatewayConfig.updatedAt).toLocaleTimeString()}
                </span>
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Merchant ID (MID)
                  </label>
                  <input
                    type="text"
                    value={tempMerchantId}
                    onChange={(e) => setTempMerchantId(e.target.value)}
                    placeholder="e.g. MID_ABC_000001"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Unique merchant identifier provided by {gatewayConfig.provider}.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Public Key ID / App ID
                  </label>
                  <input
                    type="text"
                    value={tempPublicKeyId}
                    onChange={(e) => setTempPublicKeyId(e.target.value)}
                    placeholder="e.g. rzp_test_99214..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Publishable key for client SDK initialization only.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Server Webhook URL (Callback Endpoint)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={gatewayConfig.webhookEndpointUrl}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Configure this URL in your {gatewayConfig.provider} merchant dashboard webhooks.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Settlement Bank Account
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={gatewayConfig.schoolBankAccountMasked}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-not-allowed"
                  />
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                    Direct School Settlement: 100% of student fee/marketplace payments deposited directly into this account.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleSaveCredentials(tempMerchantId, tempPublicKeyId)}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md"
                  >
                    Save Gateway Credentials
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Connection Test & Onboarding Status */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                Gateway Health & Verification Status
              </h4>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs">Onboarding Status</div>
                    <div className="text-[10px] text-slate-400">KYC & Merchant verification at provider</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                    gatewayConfig.onboardingStatus === 'VERIFIED'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : gatewayConfig.onboardingStatus === 'PENDING_VERIFICATION'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}>
                    {gatewayConfig.onboardingStatus}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs">Connection State</div>
                    <div className="text-[10px] text-slate-400">Gateway API connectivity test</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                    gatewayConfig.connectionStatus === 'CONNECTED'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                  }`}>
                    {gatewayConfig.connectionStatus}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs">Settlement Model</div>
                    <div className="text-[10px] text-slate-400">Funds distribution policy</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                    DIRECT SCHOOL MERCHANT
                  </span>
                </div>

                {/* Connection Ping Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isTestingGateway}
                    onClick={handleTestGatewayConnection}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {isTestingGateway ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" /> Testing Provider Connectivity...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-400" /> Ping & Test Gateway Connection
                      </>
                    )}
                  </button>

                  {testGatewayResult && (
                    <div className={`mt-3 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      testGatewayResult.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                    }`}>
                      {testGatewayResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <span>{testGatewayResult.message}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Reconciliation & Settlement Log */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                  Direct Merchant Settlement & Reconciliation Ledger
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Transactions deposited directly to {branding.name}&apos;s verified bank account
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                i2A Platform Commission: ₹0 (Zero Deduction)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2.5">Order Ref</th>
                    <th className="py-2.5">Provider</th>
                    <th className="py-2.5">Gross Amount</th>
                    <th className="py-2.5">Platform Fee</th>
                    <th className="py-2.5">Net Settled to School</th>
                    <th className="py-2.5">Bank UTR Ref</th>
                    <th className="py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[11px]">
                  {reconciliations.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {rec.orderNo}
                      </td>
                      <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">
                        {rec.provider}
                      </td>
                      <td className="py-3 font-bold text-slate-900 dark:text-white">
                        {formatRupees(rec.amountInPaise)}
                      </td>
                      <td className="py-3 text-emerald-600 font-semibold">
                        ₹0.00
                      </td>
                      <td className="py-3 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatRupees(rec.netSettledToSchoolInPaise)}
                      </td>
                      <td className="py-3 font-mono text-[10px] text-slate-500">
                        {rec.bankRef}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'SETTLED'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {reconciliations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-400">
                        No settlements recorded yet for School {schoolId}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal: Live Mode Confirmation */}
          {showLiveConfirmModal && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scale-up">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      Confirm Switching to LIVE Mode
                    </h3>
                    <p className="text-slate-500 text-xs">
                      Live payments will process real transactions from parents.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                  <p className="font-bold">Important Architecture Notice:</p>
                  <ul className="list-disc list-inside space-y-1 text-[11px]">
                    <li>This client is a frontend web app. Real live payments require server-side secret management.</li>
                    <li>Ensure your school merchant account ({gatewayConfig.provider}) has been approved and KYC verified.</li>
                    <li>Live payment API triggers will be halted with <code>BLOCKED_NO_BACKEND</code> until server endpoints are active.</li>
                  </ul>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLiveConfirmModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmLiveMode}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md"
                  >
                    I Understand, Enable LIVE Mode
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

