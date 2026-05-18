import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { randomUUID } from 'crypto';

const firebaseConfig = {
  projectId: "gen-lang-client-0278932616",
  appId: "1:726844332488:web:ebb5997d317a81512248fd",
  apiKey: "AIzaSyAMLTtLvj63mqK6NJEUO5Qklx8eTk5Nm5s",
  authDomain: "gen-lang-client-0278932616.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-846c7243-98bd-497d-8607-abdd25f234ad",
};

const ID_TOKEN = process.argv[2];
const UID = process.argv[3];

if (!ID_TOKEN || !UID) { console.error('Потрібно: node import-tasks.mjs ID_TOKEN UID'); process.exit(1); }

// Використовуємо ID token напряму через REST Firestore API
const PROJECT = firebaseConfig.projectId;
const DB = firebaseConfig.firestoreDatabaseId;
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/${DB}/documents/users/${UID}/tasks`;

const lines = [];
const rl = createInterface({ input: createReadStream('omniplan_tasks.csv') });
for await (const line of rl) lines.push(line);

const tasks = lines.slice(1).filter(l => l.trim());
let count = 0;

for (const line of tasks) {
  const cols = line.match(/(".*?"|[^,\n]+)/g) || [];
  const title = (cols[0] || '').replace(/^"|"$/g, '').trim();
  const project = (cols[1] || '').replace(/^"|"$/g, '').trim();
  const dateStr = (cols[2] || '').replace(/^"|"$/g, '').trim();
  const status = (cols[3] || 'todo').replace(/^"|"$/g, '').trim();

  if (!title || !dateStr) continue;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) continue;

  const id = randomUUID();
  const body = {
    fields: {
      id: { stringValue: id },
      title: { stringValue: title },
      project: { stringValue: project },
      status: { stringValue: status === 'done' ? 'done' : 'todo' },
      priority: { stringValue: 'low' },
      date: { timestampValue: date.toISOString() },
      createdAt: { timestampValue: new Date().toISOString() },
      notes: { stringValue: '' },
      repeat: { booleanValue: false },
      subtasks: { arrayValue: { values: [] } },
    }
  };

  const res = await fetch(`${BASE}/${id}?updateMask.fieldPaths=id&updateMask.fieldPaths=title&updateMask.fieldPaths=project&updateMask.fieldPaths=status&updateMask.fieldPaths=priority&updateMask.fieldPaths=date&updateMask.fieldPaths=createdAt&updateMask.fieldPaths=notes&updateMask.fieldPaths=repeat&updateMask.fieldPaths=subtasks`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${ID_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Помилка:', err);
    process.exit(1);
  }

  count++;
  if (count % 50 === 0) console.log(`Імпортовано: ${count}/${tasks.length}`);
}

console.log(`✅ Готово! Імпортовано ${count} задач.`);
process.exit(0);
