import { Routes, Route, Navigate } from "react-router-dom";
import AdminRoute from "./components/AdminRoute";

/* ===== LAYOUTS ===== */
import AdminLayout from "./layouts/adminlayout";
import StoreLayout from "./layouts/storelayout";

/* ===== PUBLIC STORE PAGES ===== */
import Home from "./pages/Home";
import Products from "./pages/products";
import ProductDetails from "./pages/productdetails";
import Cart from "./pages/cart";
import Checkout from "./pages/checkout";
import Success from "./pages/success";
import Contact from "./pages/Contact";
import Profiles from "./pages/profiles";
import Shop from "./pages/Shop";

/* ===== USER ACCOUNT PAGES ===== */
import Orders from "./pages/orders";
import MyWaitlist from "./pages/mywaitlist";
import Coupons from "./pages/coupons";
import Wallet from "./pages/wallet";

/* ===== AUTH PAGES ===== */
import Login from "./pages/login";
import Register from "./pages/register";

/* ===== POLICY PAGES ===== */
import ShippingPolicy from "./pages/policies/ShippingPolicy";
import PrivacyPolicy from "./pages/policies/PrivacyPolicy";
import TermsPolicy from "./pages/policies/TermsPolicy";
import ReturnRefundPolicy from "./pages/policies/ReturnRefundPolicy";

/* ===== ADMIN PAGES ===== */
import AdminLogin from "./pages/admin/login";
import Dashboard from "./pages/admin/Dashboard";
import HomepageEditor from "./pages/admin/HomepageEditor";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/adminorders";
import AdminWallet from "./pages/admin/AdminWallet";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminTeam from "./pages/admin/AdminTeam"; // ✅ ADDED

/* ===============================
   USER ROUTE PROTECTION
================================ */
function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>

      {/* ================= STORE ================= */}
      <Route path="/" element={<StoreLayout />}>

        <Route index element={<Home />} />

        <Route path="shop" element={<Shop />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:id" element={<ProductDetails />} />

        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        <Route
          path="orders"
          element={
            <PrivateRoute>
              <Orders />
            </PrivateRoute>
          }
        />

        <Route
          path="wishlist"
          element={
            <PrivateRoute>
              <MyWaitlist />
            </PrivateRoute>
          }
        />

        <Route
          path="coupons"
          element={
            <PrivateRoute>
              <Coupons />
            </PrivateRoute>
          }
        />

        <Route
          path="wallet"
          element={
            <PrivateRoute>
              <Wallet />
            </PrivateRoute>
          }
        />

        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="success" element={<Success />} />

        <Route path="contact" element={<Contact />} />
        <Route path="profiles" element={<Profiles />} />

        <Route path="shipping-policy" element={<ShippingPolicy />} />
        <Route path="refund-policy" element={<ReturnRefundPolicy />} />
        <Route path="privacy-policy" element={<PrivacyPolicy />} />
        <Route path="terms-and-conditions" element={<TermsPolicy />} />

      </Route>

      {/* ================= ADMIN LOGIN ================= */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* ================= ADMIN PANEL ================= */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="homepage" element={<HomepageEditor />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="wallet" element={<AdminWallet />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="team" element={<AdminTeam />} /> {/* ✅ FIXED */}
      </Route>

    </Routes>
  );
}