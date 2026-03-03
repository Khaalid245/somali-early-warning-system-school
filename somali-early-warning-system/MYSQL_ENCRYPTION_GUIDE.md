# MySQL Encryption at Rest Configuration

## For Production Deployment

### Option 1: MySQL Enterprise Transparent Data Encryption (TDE)

Add to MySQL configuration file (`my.cnf`):

```ini
[mysqld]
# Enable encryption
early-plugin-load=keyring_file.so
keyring_file_data=/var/lib/mysql-keyring/keyring

# Encrypt all new tables by default
default_table_encryption=ON

# Encrypt binary logs
binlog_encryption=ON

# Encrypt redo logs
innodb_redo_log_encrypt=ON

# Encrypt undo logs
innodb_undo_log_encrypt=ON
```

### Option 2: AWS RDS Encryption (Recommended for Production)

When creating RDS instance:
```bash
aws rds create-db-instance \
  --db-instance-identifier school-support-db \
  --db-instance-class db.t3.medium \
  --engine mysql \
  --master-username admin \
  --master-user-password <strong-password> \
  --allocated-storage 100 \
  --storage-encrypted \
  --kms-key-id <your-kms-key-id> \
  --backup-retention-period 7 \
  --multi-az
```

### Option 3: Azure Database for MySQL

Enable encryption in Azure Portal:
- Navigate to Azure Database for MySQL
- Select "Data encryption"
- Enable "Customer-managed key"
- Select Key Vault and encryption key

### Option 4: Docker with Encrypted Volume

For docker-compose (development with encryption):

```yaml
services:
  db:
    image: mysql:8.0
    volumes:
      - encrypted_data:/var/lib/mysql
    environment:
      - MYSQL_ENCRYPTION=ON

volumes:
  encrypted_data:
    driver: local
    driver_opts:
      type: "nfs"
      o: "addr=10.0.0.1,rw,encryption=aes256"
      device: ":/path/to/encrypted/storage"
```

## Verification

Check if encryption is enabled:

```sql
-- Check table encryption
SELECT 
    TABLE_SCHEMA,
    TABLE_NAME,
    CREATE_OPTIONS
FROM information_schema.TABLES
WHERE CREATE_OPTIONS LIKE '%ENCRYPTION%';

-- Check encryption status
SHOW VARIABLES LIKE '%encrypt%';
```

## Current Status

- **Development:** No encryption (acceptable for local testing)
- **Production:** MUST enable encryption before deploying

## Implementation Steps for Production

1. Choose encryption method (AWS RDS recommended)
2. Generate/configure encryption keys
3. Enable encryption on database instance
4. Verify encryption is active
5. Test backup/restore with encryption
6. Document encryption keys securely (use AWS Secrets Manager or Azure Key Vault)
