# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Setup and Running
- Install dependencies: `npm install`
- Start development server: `npx expo start`
- Run on iOS: `npm run ios`
- Run on Android: `npm run android`
- Run on web: `npm run web`

### Code Quality
- Lint code: `npm run lint`

### Project Management
- Reset project to blank state: `npm run reset-project` (moves starter code to app-example/)

## Architecture Overview

This is an Expo React Native application using TypeScript and file-based routing via Expo Router.

### Core Technologies
- **Expo SDK 53** - React Native framework with managed workflow
- **TypeScript** - Strict mode enabled with path alias `@/*` for imports
- **Expo Router** - File-based routing in the `app/` directory
- **React Navigation** - Tab-based navigation structure

### Project Structure
- `app/` - Main application screens using Expo Router conventions
  - `(tabs)/` - Tab navigation screens
  - `_layout.tsx` files define navigation structure
- `components/` - Reusable React components
  - `ui/` - UI-specific components
- `constants/` - App constants including theme colors
- `hooks/` - Custom React hooks for theme and color scheme
- `assets/` - Static assets (fonts, images)

### Key Configuration Files
- `app.json` - Expo configuration with typed routes enabled
- `tsconfig.json` - TypeScript configuration with strict mode
- `eslint.config.js` - ESLint flat config using eslint-config-expo

### Important Notes
- No test framework is currently configured
- The project uses Expo's New Architecture (Fabric) enabled
- Web output is static via Metro bundler
- The app is configured for portrait orientation only

## App Planning: 75 Hard Challenge Tracker

### Overview
A mobile app to track and complete the 75 Hard mental toughness challenge, with social features to connect with friends and share progress.

### Core Features

#### 1. Daily Task Tracking
- **Two 45-minute workouts** (one must be outdoors)
  - Workout type selection
  - Timer functionality
  - Indoor/outdoor designation
- **Follow a diet** (no cheat meals/alcohol)
  - Simple yes/no tracking
  - Optional meal logging
- **Drink 1 gallon of water**
  - Progress tracker with visual indicator
  - Reminder notifications
- **Read 10 pages** of non-fiction/self-help
  - Book title logging
  - Page count tracker
- **Take a progress photo**
  - Daily photo capture
  - Private photo storage
  - Photo comparison view

#### 2. Progress & Streaks
- **Calendar view** showing completed days
- **Current streak** counter (resets to 0 if any task missed)
- **Visual progress** indicators (e.g., 45/75 days)
- **Day summary** view showing all completed tasks
- **Achievement milestones** (25%, 50%, 75%, complete)

#### 3. Social Features
- **Friends system**
  - Add friends via username/QR code
  - Friend requests and approvals
  - Friends list management
- **Social feed**
  - See friends' daily check-ins
  - View friends' current streaks
  - Celebrate milestones together
- **Accountability features**
  - Daily completion status visibility
  - Encouraging notifications when friends complete tasks
  - Optional group challenges

#### 4. Reminders & Notifications
- Customizable task reminders
- Water intake reminders
- End-of-day check-in reminder
- Friend activity notifications

### Technical Implementation Plan

#### Data Models
- **User** - Profile, settings, authentication
- **DailyLog** - Track completion of all 5 tasks per day
- **Workout** - Type, duration, indoor/outdoor
- **WaterIntake** - Progress throughout the day
- **Reading** - Book title, pages read
- **Photo** - Secure storage reference, date
- **Friendship** - User connections, status
- **Streak** - Current and best streak tracking

#### Navigation Structure
- **Home (Dashboard)** - Today's tasks and progress
- **Calendar** - Monthly view of completed days
- **Friends** - Social feed and friend management
- **Profile** - Personal stats, settings, streak info
- **Camera** - Progress photo capture

#### State Management
- Consider using React Context or Zustand for:
  - User authentication state
  - Daily task completion state
  - Friends and social data
  - App settings and preferences

#### Backend: Convex
- **Database**: Convex for all data storage and real-time sync
- **Authentication**: Convex Auth (supports OAuth providers)
- **File Storage**: Convex file storage for progress photos
- **Real-time**: Built-in reactive queries for social features
- **Push Notifications**: Integrate with Expo Notifications + Convex actions

#### Convex Schema Design
```typescript
// users table
export const users = defineTable({
  email: v.string(),
  username: v.string(),
  name: v.string(),
  profilePhoto: v.optional(v.string()),
  currentStreak: v.number(),
  longestStreak: v.number(),
  startDate: v.string(),
}).index("by_username", ["username"]);

// dailyLogs table
export const dailyLogs = defineTable({
  userId: v.id("users"),
  date: v.string(), // YYYY-MM-DD format
  workout1: v.optional(v.object({
    completed: v.boolean(),
    type: v.string(),
    isOutdoor: v.boolean(),
  })),
  workout2: v.optional(v.object({
    completed: v.boolean(),
    type: v.string(),
    isOutdoor: v.boolean(),
  })),
  dietFollowed: v.boolean(),
  waterCompleted: v.boolean(),
  readingCompleted: v.boolean(),
  bookTitle: v.optional(v.string()),
  progressPhotoId: v.optional(v.id("_storage")),
  completedAt: v.optional(v.string()),
}).index("by_user_date", ["userId", "date"]);

// friendships table
export const friendships = defineTable({
  requesterId: v.id("users"),
  receiverId: v.id("users"),
  status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
  createdAt: v.string(),
}).index("by_requester", ["requesterId"])
  .index("by_receiver", ["receiverId"]);
```

#### Key Libraries to Consider
- `convex` - Backend SDK for React Native
- `expo-camera` - Progress photos
- `expo-notifications` - Reminders
- `expo-image-picker` - Alternative to camera
- `react-native-calendars` - Calendar view
- `date-fns` - Date handling
- Push notification service (Expo Push Notifications)