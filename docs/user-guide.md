# BuildbotAI User Guide

## System overview

BuildbotAI helps people explore PC parts, plan a custom PC, view ready-made PCs, and ask for help. A regular User, called a Customer in this guide, can save a build, ask AI for advice, and reserve available parts or a complete PC. Store staff use separate pages to manage products, stock, reservations, and customer messages. What a person can open depends on whether they are a guest, Customer, Manager, or Super Admin.

| Role | What they can do |
| --- | --- |
| Guest | Read public pages, browse products, search the FAQ, and send a Contact form message. |
| User (Customer) | Use the Builder and Build Advisor, save builds, reserve available products, and view their Profile, reservations, messages, and alerts. |
| Manager | Use staff pages to manage parts, ready-made PCs, stock, reservations, and customer inquiries. |
| Super Admin | Do Manager work and use extra tools for sales, staff access, AI settings, and system controls. |

The app uses Firebase for sign-in and saved records. AI tools can suggest a PC, review a build, or help staff prepare product details. A real reservation saves an order and lowers available stock. The experimental storefront checkout, when turned on, is a sample and does not take a real payment.

This guide describes the pages and actions found in the code on 29 October 2026. The buttons you see may change with your role, stock, and system settings. The guide does not confirm that outside services are working right now.

## Find your way around

The Home page introduces the main tools. Use the top menu to open **Builder**, **Build Advisor**, **Prebuilts**, or **Catalog** when those links are available to your role. On a small screen, open the menu button to see the page links. The public menu also links to information pages such as **About**, **FAQ**, and **Contact**. Use your account menu to open **Profile**, **Contact Inbox**, or **Sign Out** when signed in. Staff see **Dashboard** and **Prebuilt Builder** links instead of the customer work links.

The **Catalog** lists individual PC parts. **Prebuilts** lists complete PCs. **Builder** is where a customer chooses parts for a custom PC. **Build Advisor** is where a customer asks AI to suggest a build or review one they already made.

### If you are visiting without an account

1. Open **Catalog** or **Prebuilts** to browse products. Use search, filters, and sorting to narrow the list. Open a product to read its details and see its images.
2. Open **FAQ** to search common questions. Open **About** or **Team** for more information.
3. Open **Contact** to send a message. Enter your name, email, subject, and message, then submit the form. The page shows a reference number when the message is accepted.

A guest can send a Contact message, but cannot follow the conversation inside Profile. To have an in-app conversation with staff, sign in and send an inquiry from your account. A signed-in customer account is also needed for customer-only actions such as saving a build or making a reservation.

## User (Customer) guide

### Sign up or sign in

1. To make an account, open **Create Account**. Enter your name, email, and password, and accept the terms shown on the page. You can also use the Google sign-up option if it is available.
2. To return to an account, open **Sign In**. Enter your email and password, or choose Google sign-in. **Remember this browser session** controls whether the sign-in stays after the browser session ends.
3. If you forgot your password, open **Forgot Password**, enter your email, and send a reset request.

After a successful customer sign-in, the app opens the Builder or the customer page you first tried to visit. Staff accounts use **System Access** instead of the customer sign-in page.

### Find a part or ready-made PC

1. Open **Catalog** for parts or **Prebuilts** for complete PCs.
2. Search or use the filters and sorting choices. Open a product to check its price, parts or specifications, images, and stock information.
3. On a ready-made PC, choose **Customize** if you want to move its parts into the Builder. Choose the available reservation action if you want to ask the store to hold it.

Product stock can change. The app checks the current saved product and stock again when you confirm a real reservation. A product QR code, when available, can open the linked product page.

### Make a custom PC in the Builder

1. Open **Builder**. Search or filter the parts list, then open a part to read more about it.
2. Add the parts you want. The build panel shows your choices, total price, and feedback about how the parts work together. On a small screen, open the build panel from its floating button.
3. Remove a part to change your choice. Use **Clear All Parts** if you want to start over; the app asks you to confirm first.
4. Use **Save Current Build** and give it a name if you want to keep it under your account. You can later open **Profile → Saved Favourites** to load, rename, or delete it.
5. When the needed parts are selected, use **Download Your Build** to get a PDF, or use **Reserve Build** to review and confirm a reservation.

An unfinished build is kept in the browser on that device. A saved favorite is kept under your account. Downloading a PDF or saving a favorite does not make a reservation. A confirmed reservation creates a saved order and lowers stock if the checks pass.

### Ask AI for help

Open **Build Advisor** and choose one of its two tabs:

- **Review Current Build** checks the parts you have chosen and shows strengths, problems, and suggestions.
- **Create New Build** asks about your goal and budget, then suggests a PC build.

You can also open the floating chat in the Builder, type a question, and read the reply. The chat can use details from your current build. Review any suggested parts before adding them. An AI answer does not save a favorite or place a reservation by itself. If an AI request fails, use the retry choice when the page offers one.

### Check reservations, favorites, and messages

1. Open **Profile** from your account menu. Use **Profile** or **Settings** to review and edit the fields the page allows.
2. Open **Reservations** to see saved orders and their current status. If you want to ask about cancelling a reservation, open its cancellation choice and select **Contact Staff**. That choice opens the Contact page; it does not cancel the order by itself.
3. Open **Saved Favourites** to load a build into the Builder, rename it, or delete it.
4. Open **Contact Inbox** to start an inquiry, read staff replies, or send a follow-up. Deleting a conversation removes its saved messages after confirmation.
5. Open your alerts to read updates. You can filter, mark, or delete customer alerts where the controls are offered.

Use **Sign Out** from the account menu when you are done. The app asks you to confirm sign-out.

## Manager guide

### Enter the staff area

1. Open **System Access**. Choose the **Manager** role.
2. Sign in with the staff account and enter the Manager role key. The page also offers Google sign-in with a role key.
3. After the account and key are accepted, open **Dashboard**. If you need a Manager account, use the Manager sign-up page and the required key. If you need a replacement key, use the key request option on System Access.

The staff session is checked before protected staff pages open. If the session is idle, the app may ask whether you want to stay signed in.

### Use the Dashboard

The Dashboard side menu groups staff work. Choose **Manage Stock** for individual parts, **Manage Prebuilts** for complete PCs, and **Prebuilt Builder** to assemble a new ready-made PC. Use **Reservations** for customer orders, **Archive** for hidden records, and **Audit Logs** to review staff activity. The **Storefront** section opens the public Catalog or Prebuilts view from the staff menu.

To manage parts, open **Manage Stock**. Search or filter the list, then add or edit a part, change its stock, or archive it. To manage complete PCs, open **Manage Prebuilts** and add, edit, or archive a system. The forms ask for product details and can include images. Read each confirmation before saving or archiving. Managers can restore archived products; permanent delete controls are reserved for the Super Admin.

To make a complete PC from parts, open **Prebuilt Builder**. Choose compatible parts, review the build, enter a name, and save the system. The staff Builder also has AI chat and optional help with product details. Check the generated text before saving it as a store product.

### Handle reservations and support

Open **Reservations** to search or filter orders and read their details. Choose a new status from the choices offered by the page. The app checks whether the change is allowed, then saves the new status and sends alerts. Use the **Archive** section to restore an archived reservation when that action is available. An action that changes or removes a reservation can require confirmation.

Open **Profile → Contact Inbox** to read customer inquiries. Select a conversation, mark it resolved or reopen it, and reply when the page allows a reply. Guest inquiries can be read by staff, but guests cannot see replies inside BuildbotAI. Staff alerts and **Audit Logs** help you see recent work. Product QR tools can show a linked item or its QR status where those controls appear.

Use **Sign Out** when finished with the staff account.

## Super Admin guide

A Super Admin signs in through **System Access** with the **Super Admin** role and the matching role key. They can use the Manager tools above and the extra sections below. The side menu shows the extra sections after the account passes the staff checks.

### Sales, staff access, and AI settings

- Open **Sales & Analytics → Performance & Revenue** to read sales charts or export a report. **Popularity Matrix** shows product popularity. Reset and sample-data actions ask for confirmation because they change saved data.
- Open **Management → Management Portal** to manage the Manager key, review key requests, and reset a Manager's key. Choose **Approve** or **Reject** for a request after reviewing it. Keep newly shown keys private.
- Open **Models & AI → Model Intelligence** to choose or test AI model settings. Open **System Prompts** to edit, save, or reset the instructions used by AI features. Save only the changes you intend to use.
- Super Admins can use the permanent **Delete** controls for eligible parts, ready-made PCs, and reservations. Read the confirmation before completing a deletion.

### System Safeguards

Open **Profile → System Safeguards**. The regular switches are **Maintenance Mode**, **Chaos Mode (Storage)**, and **AI Kill Switch**. The page asks for confirmation before a switch change. These controls can limit public access, affect images, or stop AI features, so check the current state before leaving the page.

The same area has two switches marked **Preview**. **Live Builder Recommendations** highlights suggested catalog parts in the customer and staff builders. **E-Commerce Storefront Mode** shows a sample cart and checkout. Its checkout does not take a real payment or create a real reservation. These are experimental options and may be off. The Super Admin may also see contact email controls in the staff Contact Inbox when that feature is enabled.

## If something does not work

| What you see | What to check |
| --- | --- |
| Sign-in or access error | Check that you used the correct customer or staff sign-in page. Staff must choose the right role and enter its role key. |
| Product cannot be reserved | Reopen the product and check its current stock. The app checks stock again when you confirm. |
| Builder action is unavailable | Check whether the needed parts have been selected and whether the page shows a part or stock warning. |
| AI tool is unavailable | Try again later. A Super Admin may have turned off AI in System Safeguards. |
| Guest cannot read a support reply | Sign in and send a new inquiry from the account to use the in-app Contact Inbox. |

## Source notes

This guide was checked against the current routes and controls in `src/app/`, including `src/app/signin/page.tsx`, `src/app/system-access/page.tsx`, `src/app/builder/builder-page.tsx`, `src/app/ai-build-advisor/page.tsx`, `src/app/profile/page.tsx`, `src/app/admin/page.tsx`, `src/app/admin/components/admin-sidebar.tsx`, and `src/app/profile/components/profile-sidebar.tsx`. The main saved actions are in `src/app/checkout-actions.ts`, `src/app/public-product-actions.ts`, `src/app/prebuilt-reservation-actions.ts`, and the contact API routes under `src/app/api/contact/`. The full page list is in [Page audit and purpose](pages.md).
