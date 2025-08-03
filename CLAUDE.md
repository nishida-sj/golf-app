# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack (runs on http://localhost:3000)
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

### Package Management
- `npm install` - Install dependencies

## Project Architecture

This is a Next.js 15.4.5 application using the App Router architecture with TypeScript and Tailwind CSS v4.

### Tech Stack
- **Framework**: Next.js 15.4.5 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4 with PostCSS
- **Linting**: ESLint 9 with Next.js extensions
- **Fonts**: Geist Sans and Geist Mono via next/font/google

### Directory Structure
- `src/app/` - App Router pages and layouts
  - `layout.tsx` - Root layout with font configuration and global metadata
  - `page.tsx` - Home page component
  - `globals.css` - Global styles with Tailwind import and theme variables
  - `favicon.ico` - Application favicon
- `public/` - Static assets (SVG icons)

### Key Configuration Files
- `tsconfig.json` - TypeScript configuration with `@/*` path alias mapping to `./src/*`
- `next.config.ts` - Next.js configuration (currently minimal)
- `eslint.config.mjs` - ESLint configuration extending Next.js rules
- `postcss.config.mjs` - PostCSS configuration for Tailwind CSS v4

### Import Alias
The project uses `@/*` as an alias for `./src/*` - use this for all imports from the src directory.

### Styling System
- Uses Tailwind CSS v4 with custom CSS variables for theming
- Dark mode support via `prefers-color-scheme: dark`
- Custom theme variables defined in `globals.css`:
  - `--color-background` and `--color-foreground` for theme colors
  - `--font-sans` and `--font-mono` for typography 
  - ## Application Overview

This project is a membership and event management app for a golf society. It is used by organizers to manage member records, yearly dues, finances, tournaments (competitions), and milestone celebrations.

Login authentication is not used—certain pages like event attendance can be accessed and submitted by anyone who knows the URL.

## Functional Modules

### 1. Fiscal Year Management
- Each fiscal year starts in July and ends in June of the following year.
- Only one year can be active at a time (`is_active = true`).
- Stored in the `years` table.

### 2. Member Management
- Each member has a name, birth date, and a type: `会員`, `旧会員`, `配偶者`, or `ゲスト`.
- Members can be active or inactive.
- Stored in the `members` table.

### 3. Fee Management
- Fees are either 5000 yen or 2000 yen depending on member type.
- `fee_settings` defines the expected fee amount per member type per year.
- `fee_payments` records actual payments with date and amount.

### 4. Competition Management
- Admins can create a competition with name, course, start time, description, fee, and up to 3 optional fields.
- If a celebration event follows, additional info (venue, time, fee) can be added.
- Group assignments (max 4 per group) are manually defined.

### 5. Attendance Submission
- For each competition, a public attendance page is auto-generated.
- Anyone with the link can mark attendance (`〇`, `×`, or `△`) and add comments per member.
- If a celebration is included, additional attendance/comment section appears.

### 6. Celebration Milestone Tracking
- Members are celebrated at ages 60, 70, 77, and 80.
- Current age is auto-calculated from `birth_date`.
- Admins can toggle checkmarks to indicate if the celebration was completed.

## Database Schema (PostgreSQL via Supabase)

### years
```sql
CREATE TABLE years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(20) NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  birth_date DATE NOT NULL,
  member_type VARCHAR(20) NOT NULL CHECK (member_type IN ('会員', '旧会員', '配偶者', 'ゲスト')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE fee_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_id UUID REFERENCES years(id) ON DELETE CASCADE,
  member_type VARCHAR(20) NOT NULL,
  amount INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(year_id, member_type)
);

CREATE TABLE fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_id UUID REFERENCES years(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  payment_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(year_id, member_id)
);

CREATE TABLE competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_id UUID REFERENCES years(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  golf_course VARCHAR(100) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  title VARCHAR(200) NOT NULL,
  rules TEXT NOT NULL,
  fee INTEGER NOT NULL,
  custom_field_1 VARCHAR(100),
  custom_field_2 VARCHAR(100),
  custom_field_3 VARCHAR(100),
  has_celebration BOOLEAN DEFAULT false,
  celebration_venue VARCHAR(100),
  celebration_start_time TIMESTAMP,
  celebration_fee INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

## Environment Setup

### Supabase Configuration
1. Create a Supabase project at https://supabase.com
2. Run the SQL script in `supabase-setup.sql` to create all necessary tables
3. Copy your project URL and keys to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```
4. See `README-Supabase.md` for detailed setup instructions

### Development Commands
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run lint` - Run ESLint checks

### Database Tables
- `years` - Fiscal year management
- `members` - Member information
- `fee_settings` - Fee configuration per member type per year
- `fee_payments` - Payment records
- `competitions` - Competition/tournament management

