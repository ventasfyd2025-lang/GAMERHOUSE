#!/bin/bash

# Variables a agregar
declare -A vars=(
    ["NEXT_PUBLIC_FIREBASE_API_KEY"]="AIzaSyB-azg5UZl5y-4jyRFpbpBlGcyo1hibLpM"
    ["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"]="importadora-fyd.firebaseapp.com"
    ["NEXT_PUBLIC_FIREBASE_PROJECT_ID"]="importadora-fyd"
    ["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"]="importadora-fyd.firebasestorage.app"
    ["NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"]="790742066847"
    ["NEXT_PUBLIC_FIREBASE_APP_ID"]="1:790742066847:web:f7ae71cb04c9345185e4aa"
    ["FIREBASE_ADMIN_CLIENT_EMAIL"]="firebase-adminsdk-fbsvc@importadora-fyd.iam.gserviceaccount.com"
    ["FIREBASE_ADMIN_PROJECT_ID"]="importadora-fyd"
    ["MERCADOPAGO_ACCESS_TOKEN"]="APP_USR-5287307946030683-100211-90e6fc1fa421b655b4edc4def8696659-2704213885"
    ["NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY"]="APP_USR-c0245993-ab9c-4977-a3ab-7aabaa927f83"
    ["RESEND_API_KEY"]="re_XpMoa3YK_NtrVQcZHZUu3J4kuUpRMueMN"
    ["EMAIL_API_SECRET"]="2e739ce4e374ae7d5278eb414924a2a01694bc1bd8e7ad124acab51685374939"
    ["BASE_URL"]="https://gamerhouse-6lpdq9g3s-import-fyds-projects.vercel.app"
    ["NEXT_PUBLIC_BASE_URL"]="https://gamerhouse-6lpdq9g3s-import-fyds-projects.vercel.app"
)

for key in "${!vars[@]}"; do
    echo "production" | vercel env add "$key" "${vars[$key]}" 2>&1 | grep -v "^$"
done

echo "✅ Variables agregadas a Vercel"
