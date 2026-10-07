const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// تحديد مسار قاعدة البيانات الآمن في بيئة Render
const dbPath = process.env.NODE_ENV === 'production' 
  ? '/tmp/dev.db' 
  : path.join(__dirname, '../../dev.db');

const db = new DatabaseSync(dbPath);

// قراءة وإنشاء الجداول من schema.sql
const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  console.log('Database initialized successfully using native Node.js SQLite.');
}

module.exports = db;