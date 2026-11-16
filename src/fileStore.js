function openStore() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('firmly-document-library', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Document storage is unavailable in this browser.'));
  });
}

export async function storeFile(file) {
  const db = await openStore();
  const id = crypto.randomUUID();
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite');
      transaction.objectStore('files').put(file, id);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(new Error('Could not save the original file. Browser storage may be full.'));
      transaction.onabort = () => reject(new Error('Document save was interrupted.'));
    });
    return id;
  } finally { db.close(); }
}

export async function loadFile(id) {
  const db = await openStore();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('files', 'readonly').objectStore('files').get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Could not read the saved file.'));
    });
  } finally { db.close(); }
}

export function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
