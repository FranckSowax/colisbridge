
# Twinsk Parcel - Enhanced Project Plan (English Version)

## 1. Project Overview

**Twinsk Parcel** is a comprehensive solution for receiving and billing parcels, designed to facilitate the tracking and management of shipments from our agency to various destinations including **Gabon**, **Togo**, **Côte d’Ivoire**, **France**, and **Dubai**. The application relies on **Supabase** for real-time data handling (parcels, clients, rates, countries, disputes, employees).

The platform includes:
- A **dashboard** displaying key parcel statistics.
- A **parcel management** module (creation, tracking, billing, disputes).
- A **client management** module.
- An **invoicing** module for generating and downloading invoices in PDF format.
- A **statistics** module for monthly and country-based performance tracking.
- A **settings** module for configuring country-based rates, roles, permissions, language preferences (French, English, Chinese), and employee management.
- A **notification system** (WhatsApp and in-app) triggered by specific parcel status changes.

This solution automates the process of receiving, tracking, and billing parcels, while centralizing all data in a single database.

---

## 2. Core Features

### 2.1. Dashboard
- **Purpose**: Provide a high-level overview of all parcel activities.
- **Features**:
  - Total number of parcels.
  - Breakdown by status: **Réceptionné** (Parcel Received), **Expédié** (Shipped), **Reçu** (Delivered), **Litige** (In Dispute), **Terminé** (Completed).
  - Quick actions to create new parcels.
- **Dynamic Data**: Automatically updated in real time via Supabase.

### 2.2. Parcel Management
- **Purpose**: Manage the entire lifecycle of parcels.
- **Parcel Table**:
  - Main columns: Creation Date, Tracking Number, Recipient, Destination Country, Shipping Type, Weight/Volume, Shipping Date, Status.
  - Status updates are synced to Supabase (e.g., changing status to “Litige” automatically creates a dispute record).
- **Parcel Details**:
  - Detailed view: recipient information, weight/dimensions, shipping type, photos.
  - **Built-in Billing**: generate invoices based on weight/volume, country-specific rates, and shipping type (Standard, Express, Maritime).
  - **Photo Upload**: add reference images to each parcel.

### 2.3. Client Management
- **Purpose**: Maintain a dynamic registry of clients.
- **Client Table**:
  - Columns: Name, Phone, Email, Number of Parcels, Date Added.
  - View parcel history per client.
  - New clients automatically added upon receiving their first parcel.

### 2.4. Billing and Invoicing
- **Purpose**: Generate and manage invoices linked to each parcel.
- **Features**:
  - Pricing calculated based on:
    - **Destination Country** (e.g., Gabon, Togo, France, etc.).
    - **Shipping Type** (Standard, Express, Maritime).
    - **Weight or Volume** (using a configurable rate table).
  - **Invoice**:
    - Recipient and parcel details (weight, shipping type, destination).
    - Cost breakdown and total charges.
    - Downloadable as a **PDF** via a pop-up window.
  - **Supabase Integration**: Each generated invoice is linked to its corresponding parcel record.

### 2.5. Dispute Management
- **Purpose**: Handle parcels flagged as “Litige” (In Dispute).
- **Dispute Table**:
  - Columns: Parcel, Priority, Status, Description, Creation Date.
  - Records are automatically created when a parcel’s status changes to “Litige.”

### 2.6. Statistics
- **Purpose**: Track business performance and shipping volume trends.
- **Monthly Overview**:
  - Total parcels processed.
  - Revenue generated.
  - Ongoing disputes.
  - New clients added.
- **Country-Based Performance**:
  - Number of parcels shipped to each destination.
  - Revenue breakdown per country.
  - Growth percentages.

### 2.7. Settings
- **Purpose**: Provide customizable platform configurations.
- **Pricing Table**:
  - Set shipping rates for each country and shipping type.
  - Define pricing per kilogram or volume, along with estimated delivery times.
- **Employee Management**:
  - Add, edit, or remove users (employees).
  - Assign roles and permissions (Administrator, Agent, Manager).
- **Language Management**:
  - Add translations for key UI elements in **French**, **English**, and **Chinese**.
- **Roles and Permissions**:
  - Grant or restrict access to various modules (Dashboard, Statistics, Parcels, Clients, Disputes, Settings) based on user role.

### 2.8. Notification System (WhatsApp & In-App)
- **Purpose**: Keep both clients and agents informed about crucial parcel events.
- **WhatsApp Notifications**:
  - **Integration**: Utilizes a webhook and **ManyChat API** to send automated messages.
  - **Triggers**:
    - When a parcel is **received** (“Réceptionné”), the client receives a WhatsApp message confirming arrival at the warehouse.
    - When a parcel is **delivered** (“Reçu”), a WhatsApp notification is sent to the client to inform them of final delivery.
  - **Customization**: Messages can be tailored to include parcel details (tracking number, expected delivery timeframe, etc.).
- **In-App Notifications**:
  - **Bell Icon**: An interactive bell icon is shown on the agent’s interface.
  - **Real-Time Alerts**: Agents receive notifications for significant parcel events (e.g., new parcel arrivals, dispute creation, completed deliveries).
  - **Visibility**: Clicking on the bell icon shows a drop-down list of recent notifications, allowing quick access to relevant parcel details.

---

## 3. Parcel Statuses

To ensure clear tracking and lifecycle management, parcels in **Twinsk Parcel** can have one of the following statuses (original French terms in parentheses):

1. **Received** (Réceptionné): The parcel has been received at the warehouse.
2. **Shipped** (Expédié): The parcel has left the warehouse and is in transit.
3. **Delivered** (Reçu): The parcel has arrived at its destination and is received by the client.
4. **In Dispute** (Litige): The parcel is flagged for dispute due to an issue or irregularity.
5. **Completed** (Terminé): The parcel’s process is fully completed (e.g., billing settled, no outstanding disputes).

---

## 4. Supabase Synchronization
- **Database Tables**:
  1. **Parcels**: Stores parcel details, statuses, photos, invoices.
  2. **Clients**: Stores client data, automatically updated when new parcels are received.
  3. **Pricing**: Contains shipping rates by country and type.
  4. **Users**: Manages employees, roles, and permissions.
  5. **Disputes**: Logs disputes for parcels set to “In Dispute.”
- **Real-Time Updates**:
  - Any change (e.g., parcel status, new client creation, invoice generation) is instantly synchronized with Supabase.

---

## 5. Technical Requirements
- **Frontend**: Built with React.js (or a compatible framework).
- **Backend**: Supabase (Postgres database, authentication, storage, realtime).
- **Deployment**: Platforms such as Vercel or Netlify.
- **Environment Variables**:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`

---

## 6. Project Goals
1. Deliver an efficient parcel management solution for international shipping needs.
2. Automate billing and dispute handling processes.
3. Enhance user experience with real-time data sync and multilingual support.
4. Provide robust administration with role-based access control.
5. Keep stakeholders informed with **intelligent, real-time notifications** (WhatsApp & in-app).

---

## 7. Development Milestones

| Milestone               | Features                                               | Status       |
|-------------------------|--------------------------------------------------------|-------------|
| **Dashboard**           | Parcel and client statistics                           | ✅ Completed |
| **Parcel Management**   | Parcel table, details, photos, billing integration     | ✅ Completed |
| **Client Management**   | Auto-generated client list, parcel history             | ✅ Completed |
| **Billing**             | Dynamic rates, invoice generation (PDF)                | ✅ Completed |
| **Dispute Management**  | Automatic dispute creation when status is “In Dispute” | ✅ Completed |
| **Statistics**          | Monthly and country-specific performance metrics       | ✅ Completed |
| **Settings**            | Rates, roles, translations, employee management        | ✅ Completed |
| **Supabase Integration**| Real-time sync across all features                     | ✅ Completed |
| **Notification System** | WhatsApp & in-app notifications via ManyChat & webhooks| 🚧 In Progress |

---

## 8. Future Enhancements
1. **Advanced Analytics**: Predictive shipping trends and more detailed revenue dashboards.
2. **Multi-Currency Support**: Select the invoice currency based on the destination country.
3. **Mobile App**: Streamline parcel management for on-the-go agents.
4. **Audit Logs**: Track all critical actions (status changes, invoicing, dispute creation) for improved traceability.

---

## 9. Final Notes

Twinsk Parcel provides a robust and scalable environment for international parcel management. By leveraging Supabase for real-time data synchronization, the platform ensures immediate updates, a customizable rate structure, flexible role management, multilingual support, and **intelligent notifications** via WhatsApp and in-app alerts. Future developments will focus on richer analytics, notifications, and enhanced user communication features.
