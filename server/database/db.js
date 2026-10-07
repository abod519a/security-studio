const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.NODE_ENV === 'production' 
  ? '/tmp/dev.db' 
  : path.join(__dirname, '../../dev.db');

const db = new sqlite3.Database(dbPath);

// تهيئة الجداول تلقائياً عند التشغيل
const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema, (err) => {
    if (err) console.error('Error initializing schema:', err);
    else console.log('Database initialized successfully.');
  });
}

module.exports = db;