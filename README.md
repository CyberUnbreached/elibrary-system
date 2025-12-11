# 📚 E-Library System – Team Codex

*A full-stack Spring Boot + PostgreSQL application for managing digital library operations.*

## 🚀 Overview

The **E-Library System** is a web-based platform designed to streamline library operations for both **customers** and **staff**.
It supports **user registration, login, browsing books, purchases, borrowing management, staff administration tools**, and more.

The system was built as the semester-long Software Engineering Project for **UTSA CS 3733** by **Team Codex**.

---

## ✨ Key Features

### 👤 Customer Features

* User registration & login
* Browse books with search & sorting
* View detailed book info (image, availability, description)
* Add books to cart & complete purchases
* Apply discount codes
* View purchase history grouped by transaction
* Borrow books and track due dates

### 🛠️ Staff Features

* Add, edit, or delete books
* Manage inventory quantities
* View customer order histories
* Review borrowing records
* Apply system-wide discounts & configurations

### 🔐 Authentication & Security

* Role-based routes (`CUSTOMER`, `STAFF`)
* Secure password storage (hashed)
* Input validation on both frontend & backend

---

## 🏗️ Tech Stack

### Backend

* **Spring Boot (Java 17)**
* **PostgreSQL** (Hosted on Render)
* **Spring Data JPA**
* **RESTful API endpoints**
* **Jackson** for JSON serialization

### Frontend

* **HTML / CSS / Bootstrap**
* **JavaScript (Vanilla)**
* **AJAX/Fetch API**
* **Dynamic modals for book details and checkout**

### Deployment

* Backend: **Render Web Service**
* Database: **Render PostgreSQL Instance**

---

## 📁 Project Structure

```
/src
 ├── main/java/edu/utsa/teamcodex/elibrary
 │    ├── controller/   → REST controllers
 │    ├── model/        → Entity classes (User, Book, Purchase, DiscountCode, etc.)
 │    ├── repository/   → JPA repositories
 │    └── service/      → Business logic (optional, if used)
 └── resources/
      ├── application.properties
      └── schema.sql / data.sql (if applicable)

frontend/
 ├── html pages (home, login, staff dashboard, etc.)
 ├── js/ (home.js, purchase.js, login.js, etc.)
 └── css/
```

---

## 🔌 API Endpoints (Summary)

### **Users**

| Method | Endpoint       | Description                   |
| ------ | -------------- | ----------------------------- |
| POST   | `/users`       | Register new user             |
| POST   | `/users/login` | Authenticate user             |
| GET    | `/users`       | Get list of all users (staff) |

### **Books**

| Method | Endpoint      | Description            |
| ------ | ------------- | ---------------------- |
| GET    | `/books`      | Get all books          |
| POST   | `/books`      | Add a new book (staff) |
| PUT    | `/books/{id}` | Update book info       |
| DELETE | `/books/{id}` | Remove a book          |

### **Purchases**

| Method | Endpoint               | Description                 |
| ------ | ---------------------- | --------------------------- |
| POST   | `/purchases`           | Create purchase             |
| GET    | `/purchases/user/{id}` | Get user's purchase history |

### **Borrowing**

| Method | Endpoint            | Description         |
| ------ | ------------------- | ------------------- |
| POST   | `/borrow`           | Borrow a book       |
| GET    | `/borrow/user/{id}` | View borrowed books |

### **Discount Codes**

| Method | Endpoint            | Description   |
| ------ | ------------------- | ------------- |
| POST   | `/discounts`        | Create code   |
| GET    | `/discounts/{code}` | Validate code |

---

## 🧩 Notable Implementations

### ✔️ Transaction Grouping

All purchases sharing a `transactionId` are grouped into a single order (`TX-ABC123` format).

### ✔️ Fault-tolerant Backwards Compatibility

Legacy purchases without transaction IDs are automatically grouped using fallback IDs.

### ✔️ Staff Dashboard

Central hub where staff can:

* view order history
* manage catalog
* adjust quantities
* upload/edit book data

### ✔️ Dynamic Modals

Frontend automatically loads book details into Bootstrap modals using AJAX.

---

## 🧪 Testing

* Manual testing of all endpoints via **Postman**
* Browser-side testing for customer and staff flows
* Session handling validated through localStorage roles

---

## 📦 Installation & Setup

### 1️⃣ Clone the Repository

```
git clone https://github.com/<repo>/elibrary-system.git
cd elibrary-system
```

### 2️⃣ Configure Database

Update `application.properties` with your database URL, username, and password.

### 3️⃣ Run the Backend

```
mvn spring-boot:run
```

### 4️⃣ Open the Frontend

Open any `.html` file in `/frontend/` via local server or VS Code Live Server.

---

## 🧑‍💻 Team Codex Members

* **Ian Rohan** – Lead developer (Backend & customer features)
* **Dazza** – Customer UI & purchasing flow
* **Acorn / Bliss / Epohi** – Staff dashboard, book editing, borrowing, and UI improvements
  *(Adjust names as needed)*

---

## 📝 License

This project was created for academic purposes for **UTSA** and is not licensed for commercial use.

---

## 🙌 Acknowledgments

* Render cloud hosting platform
* Spring Boot & PostgreSQL documentation
