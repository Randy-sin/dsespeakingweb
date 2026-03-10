export type Speaking2026Paper = {
  id: string;
  paperNumber: string;
  date: string;
  time: string;
  topic: string;
  partADiscussionPoints: string[];
  partBQuestions: string[];
};

export const speaking2026Papers: Speaking2026Paper[] = [
  {
    id: "2026-1-1",
    paperNumber: "1.1",
    date: "3.10 (TUE)",
    time: "17:00",
    topic: "Two-Dish Rice meals",
    partADiscussionPoints: [
      "Why it is popular in Hong Kong",
      "Advantages and disadvantages of eating such meals",
      "How to promote it to tourists",
      "Anything else you think is important",
    ],
    partBQuestions: [
      'Have you ever eaten "Two-Dish Rice" meals?',
      "What do you prefer to have at lunch time?",
      "What do you eat for a meal if you are in a hurry?",
      "Is food quality or price more important?",
      'How can "Two-Dish Rice" eateries improve and expand their services?',
      'How do social media influencers promote "Two-Dish Rice" meals?',
      'Do you agree that "Two-Dish Rice" will become a culture in HK?',
      "Do you think economic conditions will change food culture?",
    ],
  },
  {
    id: "2026-1-2",
    paperNumber: "1.2",
    date: "3.10 (TUE)",
    time: "18:00",
    topic: "Financial Literacy",
    partADiscussionPoints: [
      "Importance of being financially literate",
      "Strategies for students to adopt to save money",
      "How to promote financial education at school",
      "Anything else you think is important",
    ],
    partBQuestions: [
      "Why do people think managing money is difficult?",
      "If you were given a thousand dollars, how much will you save?",
      "Why don't people nowadays have a habit of money saving?",
      "Do you think you buy more things than you need?",
      "Why is it difficult for some people to save money?",
      "How does peer pressure influence teenagers in financial decisions?",
      "Is having an emergency fund important for you and your family?",
      "Why there are some people with weaker financial concepts?",
    ],
  },
  {
    id: "2026-1-3",
    paperNumber: "1.3",
    date: "3.10 (TUE)",
    time: "19:00",
    topic: "Online Dishonesty",
    partADiscussionPoints: [
      "Why people are dishonest online",
      "What you would think if your friends lied online",
      "How to protect people from lies online",
      "Anything else you think is important",
    ],
    partBQuestions: [
      "Do you often use social media?",
      "Is it important to be honest online?",
      "Would you like to add photo to your posts on social media?",
      "Have you ever seen people being dishonest online?",
      "Do you agree with people posting edited photos?",
      "Is it common for people to exaggerate their achievements online?",
      "Is it dishonest to post text online that is written by AI?",
      "How do you make sure the information online is true?",
    ],
  },
];
