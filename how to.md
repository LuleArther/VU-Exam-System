# How to Install and Run VClass System on a Windows PC

Welcome to the VClass Exam System! This guide is written specifically for beginners. It will walk you step-by-step through setting up the system locally on your Windows PC, starting from the moment you download the project as a `.zip` file.

---

## 🛠️ Prerequisites

Before you start, make sure you have the following software installed on your Windows PC. If you don't have them, click the links to download and install them (you can just click "Next" on all the default settings during installation).

1. **[Visual Studio Code (VS Code)](https://code.visualstudio.com/)**: The code editor we will use.
2. **[Python (version 3.10 or higher)](https://www.python.org/downloads/)**: Required for the backend.
   > **⚠️ CRITICAL STEP DURING PYTHON INSTALLATION:** On the very first screen of the Python installer, look at the bottom and **CHECK THE BOX** that says `"Add Python.exe to PATH"`. If you forget to check this box, the commands below will not work!
3. **[Node.js (version 18 or higher)](https://nodejs.org/en/download/)**: Required for the frontend. (Download the "LTS" version).

---

## 📦 Step 1: Extract the Project and Open in VS Code

1. Download the complete system as a `.zip` file.
2. Find the downloaded `.zip` file (usually in your `Downloads` folder).
3. **Right-click** the file and select **"Extract All..."**. Choose a location (like your Desktop or Documents folder) and click Extract.
4. Open **VS Code**.
5. At the top left of VS Code, click **File** > **Open Folder...**
6. Find the extracted folder (e.g., `vu-exam-system`) and click **Select Folder**.
   - *Note: If a pop-up asks "Do you trust the authors of the files in this folder?", check the box and click **"Yes, I trust the authors"**.*

---

## 💻 Step 2: Open the Terminal in VS Code

We need to type some commands to install the system dependencies. 
1. In VS Code, look at the very top menu bar and click **Terminal** > **New Terminal**.
2. A small window will pop up at the bottom of your screen. This is where you will type the commands.

---

## ⚙️ Step 3: Set Up and Start the Backend (Django)

The backend handles the database, student verification, and saving exams. 

In the terminal at the bottom of VS Code, type the following commands **one by one**, pressing **Enter** after each one:

1. **Move into the backend folder:**
   ```cmd
   cd backend
   ```

2. **Create a virtual environment (this creates an isolated space for Python):**
   ```cmd
   python -m venv venv
   ```
   *(Wait a few seconds for this to finish)*

3. **Activate the virtual environment:**
   ```cmd
   venv\Scripts\activate
   ```
   *(You should now see `(venv)` appear on the left side of your terminal line)*

4. **Install the required Python packages:**
   ```cmd
   pip install -r requirements.txt
   ```
   *(This might take a minute or two as it downloads the deepface models and Django packages)*

5. **Set up the database:**
   ```cmd
   python manage.py migrate
   ```

6. **Start the backend server:**
   ```cmd
   python manage.py runserver
   ```
   If it worked, you will see a message saying `Starting development server at http://127.0.0.1:8000/`. 
   **Leave this terminal running! Do not close it.**

---

## 🎨 Step 4: Set Up and Start the Frontend (Astro/React)

The frontend is the visual website that users interact with. We need to start it in a *new* terminal window.

1. In VS Code, look at the top right of your terminal panel and click the **`+` (Plus icon)** to open a second, new terminal window.
2. Ensure this new terminal is in the main project folder (it shouldn't say `backend`). If you are unsure, just skip this, VS Code usually opens new terminals in the root folder automatically.

Type the following commands **one by one**, pressing **Enter** after each one:

1. **Install the Node.js packages:**
   ```cmd
   npm install
   ```
   *(This will take a minute or two to download)*

2. **Start the frontend server:**
   ```cmd
   npm run dev
   ```
   If it worked, you will see a message saying something like `Local: http://localhost:4321/`.

---

## 🎉 Step 5: Open the System!

You're all done! Both your backend and frontend servers are now running.

1. Open your web browser (Google Chrome, Edge, etc.).
2. In the address bar at the top, type: **`http://localhost:4321`** and press Enter.

You should now see the VClass System running perfectly on your Windows PC!

---

### 🛑 How to Stop the System
When you are done testing and want to shut the system down:
1. Go back to VS Code.
2. Click inside the terminal.
3. Press **`Ctrl + C`** on your keyboard to stop the server. You can do this for both the frontend terminal and the backend terminal.

### 🔄 How to Start It Again Next Time
If you restart your computer or close VS Code, you don't have to install everything again. Just do this:
1. Open the folder in VS Code.
2. Open a terminal and run the backend: `cd backend` -> `venv\Scripts\activate` -> `python manage.py runserver`
3. Open a second terminal and run the frontend: `npm run dev`
