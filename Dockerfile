# Production Dockerfile for PHP + Apache Backend on Render
FROM php:8.2-apache

# Install MySQLi extension for MySQL database connections
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Enable Apache mod_rewrite for REST routing
RUN a2enmod rewrite headers

# Configure Apache port dynamically for Render (Render passes $PORT, default 80/8080)
RUN sed -i 's/80/${PORT}/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf

# Copy backend files into Apache document root
COPY backend/ /var/www/html/

# Permissions
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80 8080 10000

CMD ["apache2-foreground"]
