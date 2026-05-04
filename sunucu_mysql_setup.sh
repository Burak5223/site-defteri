#!/bin/bash

echo "=== MariaDB Database Setup ==="

# Start MariaDB service
echo "Starting MariaDB service..."
systemctl start mariadb
systemctl enable mariadb

# Check if MariaDB is running
if ! systemctl is-active --quiet mariadb; then
    echo "ERROR: MariaDB is not running!"
    exit 1
fi

echo "MariaDB is running successfully!"

# Connect to MySQL and create database and user
echo "Creating database and user..."
mysql -u root << 'EOF'
CREATE DATABASE IF NOT EXISTS smart_site_management;
CREATE USER IF NOT EXISTS 'siteuser'@'localhost' IDENTIFIED BY 'Hilton5252.';
GRANT ALL PRIVILEGES ON smart_site_management.* TO 'siteuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
EOF

if [ $? -eq 0 ]; then
    echo "Database and user created successfully!"
else
    echo "ERROR: Failed to create database and user!"
    exit 1
fi

# Import database schema
echo "Importing database schema..."
mysql -u siteuser -pHilton5252. smart_site_management < /root/smart_site_management.sql

if [ $? -eq 0 ]; then
    echo "Database schema imported successfully!"
else
    echo "ERROR: Failed to import database schema!"
    exit 1
fi

# Test database connection
echo "Testing database connection..."
mysql -u siteuser -pHilton5252. -e "USE smart_site_management; SHOW TABLES;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "Database connection test successful!"
else
    echo "ERROR: Database connection test failed!"
    exit 1
fi

echo "=== Database setup completed successfully! ==="