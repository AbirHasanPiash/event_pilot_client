# 🎨 EventPilot Client

EventPilot Client is the **frontend application** for the [EventPilot Backend](https://github.com/your-username/eventpilot).  
Built with **Next.js 15**, **React 19**, and **Tailwind CSS 4**, it delivers a **modern, fast, and responsive UI** for managing and browsing events.

The client integrates with the EventPilot backend (Django Rest Framework + PostgreSQL) and provides role-based views for **Admins**, **Organizers**, and **Attendees**.

---

## 🚀 Live Demo

🔗 [EventPilot Client](https://eventpilot-pearl.vercel.app/)  

---

## ✨ Features

- **🔑 Authentication**
  - JWT-based login, registration, and email activation
  - Role-specific dashboards and access

- **📊 Dashboards**
  - Admin & Organizer dashboards with charts (**Recharts**)
  - Real-time analytics

- **📅 Event Management**
  - Browse upcoming events
  - React (attend, like, bookmark)
  - Organizers can **create, update, delete** events

- **🛠 User Experience**
  - Responsive UI (**Tailwind CSS 4**)
  - Smooth animations (**Framer Motion**)
  - Light/Dark theme toggle (**next-themes**)
  - Interactive components (**Radix UI**)

- **👨‍💻 Developer Experience**
  - Data fetching with **SWR**
  - Forms with **React Hook Form**
  - Notifications with **React Hot Toast**
  - Modular component system (inspired by **shadcn/ui**)

---

## 🛠 Tech Stack

| Category       | Technologies |
|----------------|--------------|
| **Framework**  | Next.js 15 (App Router, Turbopack) |
| **UI & Styling** | Tailwind CSS 4, Radix UI, Framer Motion |
| **Data & State** | SWR, React Hook Form, JWT |
| **Charts**     | Recharts |
| **Icons**      | Lucide React |
| **Utilities**  | clsx, tailwind-merge, class-variance-authority |

---

## ⚙️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/event_pilot_client.git
   cd event_pilot_client
Install dependencies

bash
Copy code
npm install
# or
yarn install
Set up environment variables
Create a .env.local file in the root directory:

## env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_APP_NAME=EventPilot


## 🔑 Authentication
JWT-based login & registration (via Djoser)

Tokens stored securely and attached to API requests

Role-based rendering for Admin, Organizer, and Attendee

## 📘 API Integration
This client consumes the EventPilot Backend REST API.

Key Integrations:

Auth: JWT endpoints from Djoser

Events: Browse & react, full CRUD for organizers/admins

Dashboards: Charts and analytics for admins/organizers

## 🤝 Contributing
Contributions are welcome! 🎉

Fork the repo

Create a feature branch

Submit a pull request 🚀

## 📜 License
This project is licensed under the MIT License.

## 📧 Contact
For support or inquiries, reach out:
📩 abirhasanpiash@gmail.com