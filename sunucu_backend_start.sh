#!/bin/bash

echo "=== Starting Backend Application ==="

# Navigate to backend directory
cd /root/BACKEND_NEW/site

# Check if JAR file exists
if [ ! -f "target/site-backend-1.0.0.jar" ]; then
    echo "ERROR: JAR file not found at target/site-backend-1.0.0.jar"
    exit 1
fi

# Check if MariaDB is running
if ! systemctl is-active --quiet mariadb; then
    echo "ERROR: MariaDB is not running! Please run the setup script first."
    exit 1
fi

# Test database connection
echo "Testing database connection..."
mysql -u siteuser -pHilton5252. -e "USE smart_site_management; SELECT COUNT(*) FROM users;" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "ERROR: Cannot connect to database! Please run the setup script first."
    exit 1
fi

echo "Database connection OK!"

# Open firewall port for backend (if ufw is available)
if command -v ufw &> /dev/null; then
    echo "Opening port 8080 in firewall..."
    ufw allow 8080/tcp
fi

# Start the backend application
echo "Starting backend application on port 8080..."
echo "Backend will be available at: http://172.29.1.55:8080"
echo "Press Ctrl+C to stop the application"
echo ""

java -jar target/site-backend-1.0.0.jar \
    --server.port=8080 \
    --spring.datasource.url=jdbc:mysql://localhost:3306/smart_site_management?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true \
    --spring.datasource.username=siteuser \
    --spring.datasource.password=Hilton5252.