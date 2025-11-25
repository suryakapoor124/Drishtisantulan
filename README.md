# DrishtiSantulan 🧘‍♂️✨

**Vision • Balance • Insight**

DrishtiSantulan is a modern, AI-powered student wellbeing platform designed to bridge the gap between students and university administration. It provides a safe, anonymous space for students to reflect on their mental health while offering universities aggregated, actionable insights to improve campus life.



https://github.com/user-attachments/assets/fe7e7637-9394-47b9-9d6e-1ca3ada5bfac




## 🚀 Features

### 🎓 For Students
*   **Anonymous Check-ins:** Log your daily mood, stress, energy, and sleep levels without fear of judgment.
*   **AI-Powered Insights:** Get personalized, instant feedback and coping strategies powered by Gemini AI.
*   **Interactive Wizard:** A gamified, smooth "one-by-one" question flow with beautiful animations.
*   **Private Journal:** A secure, local-first history of your reflections.
*   **Visual Stats:** Track your emotional trends over time with interactive charts.

### 🏛️ For University & Admins
*   **Campus Pulse:** View real-time, aggregated data on student wellbeing (completely anonymous).
*   **Crisis Alerts:** (Simulated) Detection of high-stress patterns to trigger intervention protocols.
*   **AI Weekly Reports:** Generate comprehensive summaries of campus mood trends, stressors, and suggested interventions.
*   **Biometric Security:** Secure login using Touch ID / Face ID (WebAuthn) for administrative access.
*   **Suggestion Engine:** Automated recommendations for campus activities based on the current "vibe" of the student body.

## 🛠️ Tech Stack

*   **Frontend:** React.js (Vite)
*   **Styling:** Tailwind CSS (Glassmorphism & Gradients)
*   **Icons:** Lucide React
*   **AI:** Google Gemini API (Generative Language)
*   **Authentication:** WebAuthn (Biometrics) + Mock Backend

## 💻 Getting Started

Follow these steps to get DrishtiSantulan running on your local machine.

### Prerequisites

*   **Node.js** (v16 or higher) installed on your computer.
*   A code editor like **VS Code**.

### Installation Guide

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/suryakapoor124/drishti-santulan.git
    cd drishti-santulan
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Run the Development Server**
    ```bash
    npm run dev
    ```

4.  **Open in Browser**
    Click the link shown in the terminal (usually `http://localhost:5173`) to view the app.

## 🔑 Login Credentials (Demo)

Since this is a demo application with a mock backend, use the following credentials to explore the different portals:

| Portal | ID | Password | Notes |
| :--- | :--- | :--- | :--- |
| **Student** | *Auto-Generated* | N/A | Click "Generate My Identity" to create a unique anonymous key. |
| **Admin** | `admin123` | `123` | Full access to system status and user management. |
| **University** | `uni123` | `123` | Access to campus trends and AI reports. |

> **Note:** You can also try the **Biometric Login** button on the Admin/University login screens! It uses your device's native Touch ID / Face ID.

## 🎨 Customization

*   **Theme:** The app uses a "Glass & Gradient" theme defined in `src/index.css` and `tailwind.config.js`.
*   **AI Prompts:** You can tweak the Gemini AI prompts in `src/App.jsx` under the `GeminiService` object.

## 🤝 Contributing

Feel free to fork this project and submit pull requests. Suggestions for new "Wellness Activities" or UI improvements are always welcome!

---

*Made with ❤️ for Student Mental Health.*
