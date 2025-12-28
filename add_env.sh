#!/bin/bash

# Variables a agregar

if [ -z "$NEXT_PUBLIC_FIREBASE_API_KEY" ]; then
    echo "❌ Debes exportar NEXT_PUBLIC_FIREBASE_API_KEY antes de ejecutar este script." >&2
    echo "   (Genera la clave en GCP y mantenla fuera del repositorio)" >&2
    exit 1
fi

declare -A vars=(
    ["NEXT_PUBLIC_FIREBASE_API_KEY"]="$NEXT_PUBLIC_FIREBASE_API_KEY"
    ["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"]="gamer-house-779ae.firebaseapp.com"
    ["NEXT_PUBLIC_FIREBASE_PROJECT_ID"]="gamer-house-779ae"
    ["NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"]="gamer-house-779ae.firebasestorage.app"
    ["NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"]="833020610004"
    ["NEXT_PUBLIC_FIREBASE_APP_ID"]="1:833020610004:web:1d9399c5c7b1eb5f9c8241"
    ["FIREBASE_ADMIN_CLIENT_EMAIL"]="firebase-adminsdk-fbsvc@gamer-house-779ae.iam.gserviceaccount.com"
    ["FIREBASE_ADMIN_PROJECT_ID"]="gamer-house-779ae"
    ["MERCADOPAGO_ACCESS_TOKEN"]="APP_USR-5287307946030683-100211-90e6fc1fa421b655b4edc4def8696659-2704213885"
    ["NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY"]="APP_USR-c0245993-ab9c-4977-a3ab-7aabaa927f83"
    ["RESEND_API_KEY"]="re_XpMoa3YK_NtrVQcZHZUu3J4kuUpRMueMN"
    ["EMAIL_API_SECRET"]="2e739ce4e374ae7d5278eb414924a2a01694bc1bd8e7ad124acab51685374939"
    ["BASE_URL"]="https://www.gamer-house.cl"
    ["NEXT_PUBLIC_BASE_URL"]="https://www.gamer-house.cl"
    ["NOTIFICATIONS_FROM_EMAIL"]="Gamer House <onboarding@resend.dev>"
    ["NOTIFICATIONS_REPLY_TO"]="contacto@gamer-house.cl"
    ["NOTIFICATIONS_DEFAULT_RECIPIENTS"]="ventas.fyd2025@gmail.com"
    ["STORE_NAME"]="Gamer House"
)

for key in "${!vars[@]}"; do
    echo "production" | vercel env add "$key" "${vars[$key]}" 2>&1 | grep -v "^$"
done

echo "✅ Variables agregadas a Vercel"
