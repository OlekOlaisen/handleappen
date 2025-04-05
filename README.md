# Handleappen

## Project Description
Handleappen is a project written as a Progressive Web Application (PWA) designed to help users search for norwegian products, plan their meals and find the best grocery prices across different stores in Norway. This hobby project aims to simplify meal planning and grocery shopping while helping users save money through price comparisons.

## Features
The application includes the following features:

- **Product Search**: Search and compare prices across different grocery stores with the [Kassalapp](https://kassal.app/) API. 
- **Shopping Cart**: Add products, meals and week plans to the cart and find the cheapest stores
- **Meal Planning**: Create and manage weekly meal plans
- **Price Optimization**: Automatically finds the best store combination for your shopping list
- **Store comparison**: Automatically finds the four cheapest stores based on price and availability
- **Find Missing Products**: Automatically finds the product in the second best store if not available in the first cheapest store 
- **Store availability counters**: Counters for how many products in the cart the store has
- **Shopping Cart Sharing**: Share your shopping cart with another user
- **Shopping Cart Download**: Download the shopping cart to your device and view it later
- **Product details**: View product details such as price comparisons, description, nutrition and allergies
- **PWA Support**: Install app through browser and use the app on any device
- **Light/dark mode**: The user can choose between light mode, dark mode or system mode in the settings.
- **User Authentication**: Secure login with email/password or Google authentication
- **Responsive Design**: Fully responsive interface that works on all devices

## Technologies Used

- **Next.js 13**: React framework with App Router for server-side rendering and routing
- **TypeScript**: For type-safe code and better developer experience
- **Supabase**: Backend as a Service for authentication and database
- **Tailwind CSS**: For responsive and maintainable styling
- **shadcn/ui**: High-quality React components built with Radix UI and Tailwind
- **PWA**: Progressive Web App capabilities
- **Vercel**: For hosting and deployment

## Minimum Viable Product (MVP)
The MVP for this project is a web application that allows users to:
1. Search for products and compare prices across stores
2. Create and manage shopping lists
3. Plan meals for the week
4. Optimize shopping cart based on best store prices

## Installation

To install the application, follow these steps:

1. Clone the repository:
```bash
git clone https://github.com/username/handleappen.git
```

2. Install dependencies:
```bash
cd app
npm install
```

3. Run the development server:
```bash
npm run dev
```

## Demo
You can see a live demo of the application at: [Handleappen Demo](https://handleappen.vercel.app)

## Contributing
This is a hobby project by Ole Kristian Heian Olaisen. Feel free to reach out on [LinkedIn](https://www.linkedin.com/in/okho/) for any questions or suggestions.

## License
This project is licensed under the MIT License - see the LICENSE file for details.
