#!/usr/bin/env bash

set -e

# Database connection details from docker-compose.yml
db_host="localhost"
db_port="5432"
db_user="postgres"
db_pass="postgres"
db_name="newsfeed"

# Wait for Postgres to be ready
echo "Waiting for PostgreSQL to be ready..."
until PGPASSWORD=$db_pass psql -h $db_host -U $db_user -p $db_port -d $db_name -c '\q' 2>/dev/null; do
  sleep 1
done
echo "PostgreSQL is ready. Running migrations..."

PGPASSWORD=$db_pass psql -h $db_host -U $db_user -p $db_port -d $db_name <<'EOSQL'
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  image TEXT
);

CREATE TABLE IF NOT EXISTS preferences (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category TEXT,
  value TEXT,
  PRIMARY KEY (user_id, category)
);
EOSQL

echo "Database migration completed successfully." 