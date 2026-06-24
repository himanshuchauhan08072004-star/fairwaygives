#!/bin/bash
# Run this in an EMPTY folder. It creates the Next.js project + folder structure.
# Usage: bash setup.sh

set -e

echo "Creating Next.js app..."
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack

echo "Installing dependencies..."
npm install @supabase/supabase-js @supabase/ssr stripe @stripe/stripe-js zod date-fns lucide-react

echo "Creating folder structure..."
mkdir -p src/lib/supabase
mkdir -p src/app/(auth)/login
mkdir -p src/app/(auth)/signup
mkdir -p src/app/dashboard
mkdir -p src/app/dashboard/scores
mkdir -p src/app/dashboard/charity
mkdir -p src/app/dashboard/draws
mkdir -p src/app/admin
mkdir -p src/app/admin/users
mkdir -p src/app/admin/draws
mkdir -p src/app/admin/charities
mkdir -p src/app/admin/winners
mkdir -p src/app/charities
mkdir -p src/app/api/scores
mkdir -p src/app/api/draws
mkdir -p src/app/api/charity
mkdir -p src/app/api/stripe/checkout
mkdir -p src/app/api/stripe/webhook
mkdir -p src/app/api/winners
mkdir -p src/components/ui
mkdir -p supabase

echo ""
echo "Done. Folder structure created."
echo "Next: paste the .env.local values, then run the schema.sql in Supabase SQL editor."
