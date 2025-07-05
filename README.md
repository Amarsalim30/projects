# Online Selling System V2 🛍️

A comprehensive business management system built with Spring Boot and modern web technologies. This system helps businesses manage their customers, orders, products, payments, and scheduling all in one place.

## 🌟 Features

### 1. Customer Management 👥
- Create and manage customer profiles
- Search customers by name
- View customer history and details
- Track customer interactions

### 2. Order Management 🛒
- Create new orders with multiple products
- Track order status (Pending, Processing, Completed, Cancelled)
- Search orders by customer name or date
- Real-time order updates
- Calculate subtotals and total amounts

### 3. Product Management 📦
- Add and manage product inventory
- Track product availability
- Set and update product prices
- Product search functionality

### 4. Payment System 💳
- Integrated M-Pesa payment system
- Track paid and remaining amounts
- Payment history tracking
- Automatic payment updates via SMS
- Generate payment references

### 5. Scheduling System 📅
- Calendar-based event management
- Schedule tracking and planning
- Navigate between months
- Event date tracking for orders

### 6. User Interface Features 🎨
- Responsive modern design
- Interactive dashboard
- Real-time notifications
- User profile management
- Easy navigation system
- Search functionality across all modules

## 🚀 Technology Stack

- **Backend:**
  - Spring Boot
  - Java
  - Spring MVC
  - JPA/Hibernate

- **Frontend:**
  - HTML5
  - CSS3
  - JavaScript
  - jQuery
  - Bootstrap 5
  - Font Awesome
  - Select2
  - FullCalendar.js
  - Moment.js

## 💻 Getting Started

### Prerequisites
- Java JDK 11 or higher
- Maven
- MySQL/PostgreSQL database

### Installation

1. Clone the repository
```bash
git clone https://github.com/Amarsalim30/projects.git
cd online-selling-system_v2
```

2. Configure database
- Update `application.properties` with your database credentials

3. Build the project
```bash
mvn clean install
```

4. Run the application
```bash
mvn spring-boot:run
```

The application will be available at `http://localhost:8080`

## 🔧 Configuration

The application can be configured through the following files:
- `application.properties`: Database and server configurations
- `apiConstants.js`: API endpoint configurations
- `static/css`: Custom styling configurations

## 🛡️ Security

- User authentication and authorization
- Secure payment processing
- Input validation and sanitization
- CSRF protection
- Secure session management

## 📱 Responsive Design

The system is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and queries, please create an issue in the GitHub repository.

---

Made with ❤️ by [Amarsalim30](https://github.com/Amarsalim30)
