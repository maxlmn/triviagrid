# TriviaGrid

TriviaGrid is a daily trivia challenge game where speed and knowledge combine. Test your knowledge across 6 categories: Geography, Entertainment, History, Art & Literature, Science, and Sports.

## How to Play

1.  **Daily Challenge**: A new set of 6 questions is generated every day based on the date.
2.  **The Grid**: For each question, you are presented with a grid of 16 tiles (1 answer + 15 distractors).
3.  **Beat the Clock**:
    *   **0-3 Seconds**: All tiles are visible. Answering now gives you the maximum **15 points**.
    *   **3+ Seconds**: Distractor tiles start disappearing one by one every second.
    *   **Score Drop**: You lose 1 potential point for every second that passes after the initial 3 seconds.
    *   **Game Over**: If you wait until only the answer remains, you score **0 points**.
4.  **Max Score**: The perfect score is **90 points** (6 questions x 15 points).

## Sharing

After completing the daily challenge, you can share your results with friends. The share feature generates a visual summary of your performance:

```
TriviaGrid 11/26
Score: 45/90

🟦🟦🟦⬜⬜⬜
🟪🟪⬜⬜⬜⬜
🟨🟨🟨🟨⬜⬜
🟧🟧⬜⬜⬜⬜
🟩🟩🟩🟩🟩⬜
🟥🟥🟥⬜⬜⬜
```

*   Each line represents a category.
*   The number of colored blocks corresponds to your score in that category (scaled to 6 blocks).


## Tech Stack

*   **Framework**: [React](https://react.dev/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)

## Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    cd trivia-game
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
4.  Open `http://localhost:5173` in your browser.

## Project Structure

*   `src/App.jsx`: Main game logic, timer, and UI.
*   `src/questions.json`: The database of trivia questions.
*   `src/index.css`: Tailwind directives and global styles.
