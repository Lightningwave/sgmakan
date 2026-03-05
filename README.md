# SGMAKAN 🇸🇬🍴

**SGMAKAN** is a curated cafe discovery web application designed to help users navigate Singapore's vibrant food scene without the stress of decision fatigue. 

**Live Demo:** [https://sgmakan.vercel.app/](https://sgmakan.vercel.app/)

---

##  Overview

In a city with thousands of dining options, finding the perfect brunch spot often leads to information overload. SGMAKAN simplifies this journey through a minimalist interface, curated recommendations, and AI-powered discovery.

### The Problem
* **Decision Fatigue:** Too many options make choosing a cafe stressful.
* **Information Overload:** Existing platforms provide excessive, unorganized data.
* **Social Media Dependency:** Over 50% of Singaporeans rely on social media for discovery, which lacks structured tracking.

### Our Solution
* **Curated Discovery:** A handpicked list of trendy cafes to reduce search time.
* **Personalized Tracking:** Tools to save "Want to Go," "Visited," and "Favorite" spots.
* **Minimalist Design:** A clean UI focused on neighborhood-based browsing and essential details.
* **AI Integration:** An AI-powered "food influencer" to help identify and pipeline new trendy spots.

---

##  Target Audience
* **Students & Young Professionals** in Singapore.
* **Cafe Enthusiasts** looking for the best brunch and coffee spots.
* **Explorers** who want a quick, curated way to track their food journey.

---

##  Features

### For Visitors
* **Curated Listings:** View a refined list of trendy food spots.
* **Neighborhood Filtering:** Find cafes by specific areas (e.g., Joo Chiat, Tiong Bahru, Lavender).
* **Advanced Search:** Search by name or specific tags (e.g., "Chill," "Aesthetic").
* **Detailed Insights:** Access cafe information including ratings, vibes, and price points.

### For Members
* **Personal Library:** Mark cafes as *Want to Go*, *Visited*, or *Favorite*.
* **User Accounts:** Secure email sign-up and login to persist data across sessions.
* **Dual View Modes:** Toggle between a visual **Gallery Mode** and a data-rich **Tabular Mode**.

### For Admins
* **Management Dashboard:** View platform statistics (total cafes, users, and AI runs).
* **Content Moderation:** Edit or remove cafe listings to maintain quality.
* **AI Pipeline:** Approve or reject new cafes discovered by the AI engine.

---

## 🛠 Project Structure & Milestones

### Milestone 1: Foundation
* Database schema design and implementation.
* User authentication flow (Sign up/Login).
* Basic Admin Dashboard access.

### Milestone 2: Advanced Features
* Deployment of the **AI Cafe Discovery Pipeline**.
* Enhanced Cafe Management tools.
* Detailed Dashboard analytics and AI logs.

---

##  AI Discovery Pipeline

A core feature of SGMAKAN is its automated discovery engine, which acts as a digital "food influencer" to keep the platform updated with the latest trends.

### Stage 1: DISCOVER (Search)
The system uses **Serper** to scan trusted food blogs and recent lifestyle articles for new cafe openings and trending brunch spots in Singapore.

### Stage 2: EXTRACT (Identify)
Raw data from blog snippets is processed by AI to isolate specific cafe names, stripping away noise and irrelevant content.

### Stage 3: VERIFY (Validate)
To ensure data integrity, the system performs:
* **Cross-checking:** Validates against Google Places API to confirm the location is active.
* **Deduplication:** Fuzzy matching against the existing database to prevent double entries.
* **AI-Judging:** An AI agent determines if the establishment truly fits the "cafe" criteria and is currently operational.

### Stage 4: ENRICH (Finalize)
The system performs a final high-context AI call to:
* **Generate Metadata:** Creates descriptions, identifies "vibes" (e.g., Minimalist, Industrial), assigns tags, and identifies the nearest MRT and neighborhood.
* **Media Sourcing:** Finds a valid representative image.
* **Promotion Logic:** * **Auto-Promote:** Complete profiles with high confidence are moved directly to the live `cafes` database.
* **Review Queue:** Incomplete profiles (missing images or low confidence) are sent to `pending_cafes` for manual Admin approval.

---

##  Visual Design

The platform emphasizes a clean, minimalist aesthetic to ensure the focus remains on the food and the experience.

| View | Description |
| :--- | :--- |
| **Gallery Mode** | Visual-first grid focusing on cafe aesthetics and locations. |
| **Tabular Mode** | Detailed list view featuring MRT proximity, ratings, vibes, and price tags. |

---

##  Code Guidelines
The project follows strict coding standards to ensure maintainability and scalability, including:
* Standardized naming conventions.
* Modular component structure.
* Documented AI pipeline logic.

---

##  License
This project is developed for educational and community discovery purposes. Please refer to the `Terms of Use` and `Privacy Policy` on the live site for more details.