#!/bin/bash

echo "=== Complete Backend Deployment Script ==="
echo "This script will:"
echo "1. Extract the backend files"
echo "2. Set up MariaDB database"
echo "3. Import database schema"
echo "4. Start the backend application"
echo ""

# Check if we're running as root
if [ "$EUID" -ne 0 ]; then
    echo "ERROR: This script must be run as root"
    exit 1
fi

# Extract backend files if not already extracted
if [ ! -d "/root/BACKEND_NEW" ]; then
    echo "Extracting BACKEND_NEW.rar..."
    cd /root
    if [ -f "BACKEND_NEW.rar" ]; then
        unrar-free -x BACKEND_NEW.rar
        if [ $? -ne 0 ]; then
            echo "ERROR: Failed to extract BACKEND_NEW.rar"
            exit 1
        fi
    else
        echo "ERROR: BACKEND_NEW.rar not found in /root/"
        exit 1
    fi
fi

# Start MariaDB service
echo "Starting MariaDB service..."
systemctl start mariadb
systemctl enable mariadb

# Wait for MariaDB to be ready
sleep 5

# Check if MariaDB is running
if ! systemctl is-active --quiet mariadb; then
    echo "ERROR: MariaDB is not running!"
    exit 1
fi

echo "MariaDB is running successfully!"

# Create database and user
echo "Creating database and user..."
mysql -u root << 'EOF'
CREATE DATABASE IF NOT EXISTS smart_site_management;
CREATE USER IF NOT EXISTS 'siteuser'@'localhost' IDENTIFIED BY 'Hilton5252.';
GRANT ALL PRIVILEGES ON smart_site_management.* TO 'siteuser'@'localhost';
FLUSH PRIVILEGES;
EOF

if [ $? -eq 0 ]; then
    echo "Database and user created successfully!"
else
    echo "ERROR: Failed to create database and user!"
    exit 1
fi

# Import database schema
echo "Importing database schema..."
if [ -f "/root/smart_site_management.sql" ]; then
    mysql -u siteuser -pHilton5252. smart_site_management < /root/smart_site_management.sql
    if [ $? -eq 0 ]; then
        echo "Database schema imported successfully!"
    else
        echo "ERROR: Failed to import database schema!"
        exit 1
    fi
else
    echo "ERROR: smart_site_management.sql not found in /root/"
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

# Navigate to backend directory
cd /root/BACKEND_NEW/site

# Check if JAR file exists
if [ ! -f "target/site-backend-1.0.0.jar" ]; then
    echo "ERROR: JAR file not found at target/site-backend-1.0.0.jar"
    exit 1
fi

# Open firewall port for backend (if ufw is available)
if command -v ufw &> /dev/null; then
    echo "Opening port 8080 in firewall..."
    ufw allow 8080/tcp
fi

echo ""
echo "=== Setup completed successfully! ==="
echo ""
echo "Starting backend application on port 8080..."
echo "Backend will be available at: http://172.29.1.55:8080"
echo "Press Ctrl+C to stop the application"
echo ""

# Start the backend application
java -jar target/site-backend-1.0.0.jar \
    --server.port=8080 \
    --spring.datasource.url=jdbc:mysql://localhost:3306/smart_site_management?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true \
    --spring.datasource.username=siteuser \
    --spring.datasource.password=Hilton5252.