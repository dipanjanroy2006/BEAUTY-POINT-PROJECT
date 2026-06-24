# Beauty Point - Testing & Verification Guide

This guide outlines step-by-step instructions to verify the functionality of the Beauty Point application, including database connectivity, admin operations, and checkout order flows.

---

## 1. Verify Website Loading
1. Open your web browser and navigate to the frontend URL:
   `http://localhost:3000`
2. Ensure the storefront homepage loads:
   - Verify that the premium scrolling announcement bar appears at the top.
   - Verify that the hero banner, category filters (Skincare, Makeup, Haircare, Fragrance), and product cards are displayed correctly.

---

## 2. Verify Database Connection (Health Check)
1. Navigate to the health check endpoint:
   `http://localhost:3000/api/health`
2. You will receive a JSON response showing the status of the server and the MySQL database tables.
3. **If MySQL is connected and schema is successfully set up**, the output will be:
   ```json
   {
     "status": "success",
     "serverRunning": true,
     "databaseConnected": true,
     "productsTableFound": true,
     "customersTableFound": true,
     "ordersTableFound": true
   }
   ```
4. **If MySQL is not connected** (e.g. if the password is not yet configured in `.env`), the system falls back to the JSON database mode to stay runnable, and the output will display:
   ```json
   {
     "status": "warning",
     "serverRunning": true,
     "databaseConnected": false,
     "productsTableFound": false,
     "customersTableFound": false,
     "ordersTableFound": false
   }
   ```

---

## 3. Verify Admin Panel & Authentication
1. On the homepage (`http://localhost:3000`), click the **Admin Area** or **Login** link in the navigation header.
2. Enter the default administrator account credentials:
   - **Email:** `admin@beautypoint.com`
   - **Password:** `admin123`
3. Click **Login** and verify that you are redirected to the **Admin Command Hub** dashboard.
4. Verify that you can view the tabs:
   - **KPI Analytics** (showing total revenue, orders, customers, etc.)
   - **Inventory (Products)** (listing products)
   - **Departments (Categories)**
   - **Shipments (Orders)**
   - **Customers (Directory)**
   - **Moderation (Reviews)**
   - **Coupons (Promotional)**
   - **Store Theme Settings**

---

## 4. Verify Products CRUD (Catalog Management)
1. Go to the **Inventory (Products)** tab in the Admin Command Hub.
2. **Create:**
   - Click **Create Premium Product**.
   - Fill in details: Name, Brand, Price, Stock, Category (e.g., Skincare), and click **Create Product**.
   - Verify that the new product appears at the top of the table.
3. **Update:**
   - Click the **Edit** icon (pencil) next to the newly created product.
   - Change the price or stock quantity, then click **Commit changes**.
   - Verify that the updated values are reflected in the table.
4. **Delete:**
   - Click the **Delete** icon (trash can) next to the product and confirm the deletion.
   - Verify that the product is removed from the list.

---

## 5. Verify Customers CRUD (Directory Management)
1. Go to the **Customers (Directory)** tab in the Admin Command Hub.
2. **Read & Search:**
   - Inspect the customer list and search for demo users (e.g., "Aria Glow" or "bella@beautypoint.com").
   - **Verification:** As you type characters, the search input field must remain active and focused (without losing focus after a keystroke). A small loading spinner should briefly appear inside the search input box during the lookup.
3. **Update Profile:**
   - Click the **Edit** icon next to a customer (e.g., "Aria Glow").
   - Modify their phone number or email, then click **Commit Profile Changes**.
   - Verify the new details are saved.
4. **Block / Unblock:**
   - Click the **Block / Unblock** toggle icon (the "X" or "Check" icon) next to any customer.
   - Verify that their account status changes (e.g., from "Active" to "Blocked").
5. **View Detailed Customer Insights (Reward Coins & Referrals):**
   - Click the **View Profile** (eye icon) next to a customer.
   - Navigate through the sub-tabs:
     - **Order History:** View all orders placed by this customer.
     - **Reward Coins:** Verify their active loyalty balance and point transaction audits (signup bonuses, purchase earnings, etc.).
     - **Referrals:** Verify the invite track, referral codes, and points rewarded.

---

## 6. Verify Checkout & Orders Flow
1. Log out of the admin panel (or open a new incognito window) and log in as a customer:
   - **Email:** `aria@beautypoint.com`
   - **Password:** `customer123`
2. Add a product (e.g., "Peptide Glazing Fluid Serum") to your cart.
3. Open the shopping cart drawer and click **Proceed to Checkout**.
4. Enter shipping details and place the order.
5. Log back in as an administrator (`admin@beautypoint.com` / `admin123`) and navigate to the **Shipments (Orders)** tab.
6. Verify that the new order appears in the list.
7. Change the order status (e.g., from "Pending" to "Shipped" or "Completed") or payment status, and verify the changes save.

---

## 7. Verify Mobile Authentication & Optional Email
1. **Verification of Customer Signup constraints:**
   - Open the **Login** modal and click **Create an account**.
   - Attempt to register a user leaving the **Mobile Number** blank (should block submission).
   - Enter a Full Name, Mobile Number (e.g. `+919999999999`), and Password, but leave **Email Address** completely blank.
   - Click **Create Account** and verify signup succeeds and logs you in automatically.
2. **Verification of Login:**
   - Log out of your account.
   - Open the Login modal.
   - Enter your registered Mobile Number (`+919999999999`) and Password.
   - Click **Sign In** and verify authentication succeeds.
3. **Verification of Duplicate Mobile Check:**
   - Log out.
   - Open the Login modal and click **Create an account**.
   - Attempt to register a new account with the same Mobile Number (`+919999999999`).
   - Verify that registration fails with a clean error message: `An account with this mobile number already exists.`
4. **Verification of Admin Login:**
   - Verify that you can still log in as Admin using the email-based credential: `admin@beautypoint.com` / `admin123`.
