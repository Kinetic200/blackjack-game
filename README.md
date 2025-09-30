# 🃏 Blackjack Game

A full-stack blackjack game built with Next.js, featuring AI assistance, user authentication, and game history tracking.

**Developer:** Kinetic200
**Deployed Project:** _not yet deployed_

## 🎮 Features

- **Functionally Correct Blackjack Game**
  - Standard blackjack rules with dealer hitting on 16 and standing on 17
  - Proper card value calculation including Ace handling (1 or 11)
  - Blackjack detection and special payouts (3:2)
  - Push detection for ties

- **Modern UI/UX**
  - Responsive design optimized for mobile and desktop
  - Animated card dealing and transitions
  - Clean, intuitive interface with green felt theme
  - Real-time game state updates

- **Database Integration**
  - User authentication with Supabase
  - Persistent chip balance tracking
  - Complete game history storage
  - Automatic user creation with 500 starting chips

- **Game History & Statistics**
  - Detailed game history page
  - Win/loss statistics and win rate calculation
  - Net chip tracking
  - Hand-by-hand breakdown with visual card representation

- **AI Assistant Integration**
  - Gemini AI-powered blackjack strategy advice
  - Contextual recommendations based on current hand
  - Strategic explanations for learning players

- **Chip Management**
  - Real-time chip balance updates
  - Betting validation and limits
  - Option to purchase additional chips

## 🛠 Tech Stack

- **Frontend:** Next.js 15, React, TypeScript
- **Styling:** Tailwind CSS, ShadCN UI
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **AI:** Google Gemini API
- **Deployment:** Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd blackjack-game
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Add your API keys to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

4. Set up the database:

Run these SQL commands in your Supabase SQL editor:

```sql
-- Create users table
CREATE TABLE users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  chips INTEGER DEFAULT 500,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create game_history table
CREATE TABLE game_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  bet_amount INTEGER NOT NULL,
  player_hand TEXT NOT NULL,
  dealer_hand TEXT NOT NULL,
  player_score INTEGER NOT NULL,
  dealer_score INTEGER NOT NULL,
  result TEXT CHECK (result IN ('win', 'lose', 'push')) NOT NULL,
  chips_change INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own game history" ON game_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own game history" ON game_history FOR INSERT WITH CHECK (auth.uid() = user_id);
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play the game!

## 🎯 Game Rules

- **Objective:** Get a hand total closer to 21 than the dealer without going over (busting)
- **Card Values:**
  - Number cards (2-10): Face value
  - Face cards (J, Q, K): 10 points
  - Ace: 1 or 11 (automatically calculated for best hand)
- **Gameplay:**
  1. Place your bet (cannot exceed current chip balance)
  2. Receive two cards face-up; dealer gets one face-up, one face-down
  3. Choose to Hit (draw another card) or Stand (keep current hand)
  4. Dealer reveals hidden card and must hit on 16 or less, stand on 17 or more
  5. Compare final hands to determine winner
- **Winning:**
  - Beat dealer's hand without busting: Win (1:1 payout)
  - Blackjack (21 with first 2 cards): Win (3:2 payout)
  - Same total as dealer: Push (bet returned)
  - Bust (over 21): Lose

## 🤖 AI Assistant

The integrated AI assistant provides strategic advice based on:
- Your current hand value and cards
- Dealer's visible card
- Current bet amount and chip balance
- Basic blackjack strategy principles

Click "Get AI Advice" during your turn to receive personalized recommendations.

## 📊 Game History

Track your blackjack journey with detailed statistics:
- Total games played
- Win/loss/push counts
- Overall win rate percentage
- Net chip gains/losses
- Individual hand breakdowns with card details

## 🔐 Authentication

- **Sign Up:** Create account with email/password, receive 500 starting chips
- **Sign In:** Access your saved progress and chip balance
- **Session Persistence:** Stay logged in across browser sessions
- **Data Security:** All user data protected with Supabase Row Level Security

## 🎨 Design Assumptions

- **Infinite Deck:** Cards are drawn randomly with replacement (no deck tracking)
- **Available Actions:** Only Hit and Stand (no splitting, doubling, or insurance)
- **Client-Side Logic:** Game mechanics run in browser for smooth experience
- **Chip Purchases:** Players can buy additional chips when running low
- **Mobile-First:** Responsive design prioritizes mobile experience

## 📱 Mobile Optimization

- Touch-friendly button sizes and spacing
- Responsive card layouts for small screens
- Optimized typography and contrast
- Smooth animations and transitions

## 🚀 Deployment

This project is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Main page
├── components/            # React components
│   ├── ui/               # ShadCN UI components
│   ├── AuthForm.tsx      # Authentication form
│   ├── BlackjackGame.tsx # Main game component
│   ├── GameHistory.tsx   # History page
│   ├── Navigation.tsx    # Navigation bar
│   └── PlayingCard.tsx   # Animated card component
├── contexts/             # React contexts
│   └── AuthContext.tsx   # Authentication context
├── lib/                  # Utility libraries
│   ├── gameLogic.ts      # Blackjack game logic
│   ├── gemini.ts         # AI integration
│   ├── supabase.ts       # Database client
│   └── utils.ts          # Helper utilities
└── types/                # TypeScript definitions
    └── game.ts           # Game-related types
```

## 📄 License

This project is built for the MAC projects AC as part of a coding challenge.

## 🤝 Contributing

This is a take home project, but feedback and suggestions are welcome!

---

Built with ❤️ using Next.js, Supabase, and Gemini AI
