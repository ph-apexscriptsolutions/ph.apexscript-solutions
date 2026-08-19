import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Loader2, Save, X, Download } from 'lucide-react';

// Helper to generate a simple UUID
const uuidv4 = () => crypto.randomUUID();

/**
 * TranscriptEditor
 *
 * Props:
 *  - role: 'admin' | 'worker' – determines where the transcript is saved.
 *  - userId: string – current user identifier (from auth).
 *
 * Features:
 *  - Paste a raw transcript.
 *  - Find & replace (case‑sensitive).
 *  - Text styling: font (Calibri, Times New Roman, Bahnschrift, Cambria),
 *    font size, color, bold, italic.
 *  - Minimize / maximize panel.
 *  - Save edited transcript to Supabase storage (single file per user/role).
 *    On new save, confirms deletion of previous version.
 *  - Workers can download the transcript as a .txt file.
 */
export default function TranscriptEditor({ role, userId }: { role: 'admin' | 'worker'; userId: string }) {
  const [raw, setRaw] = useState(''); // original pasted transcript
  const [edited, setEdited] = useState(''); // current edited content (HTML)
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [font, setFont] = useState('Calibri');
  const [fontSize, setFontSize] = useState(14);
  const [color, setColor] = useState('#000000');
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  // Apply styling whenever editing parameters change
  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.style.fontFamily = font;
    editorRef.current.style.fontSize = `${fontSize}px`;
    editorRef.current.style.color = color;
    editorRef.current.style.fontWeight = bold ? 'bold' : 'normal';
    editorRef.current.style.fontStyle = italic ? 'italic' : 'normal';
  }, [font, fontSize, color, bold, italic]);

  // Load previously saved transcript (if any) on mount
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .storage
        .from('transcripts')
        .download(`${role}/${userId}.txt`);
      if (error) {
        // No previous file – that's fine.
        return;
      }
      const text = await data?.text();
      if (text) {
        setRaw(text);
        setEdited(text);
      }
    };
    load();
  }, [role, userId]);

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const txt = e.clipboardData.getData('text');
    if (raw) {
      // eslint-disable-next-line no-restricted-globals
      const confirm = window.confirm('A transcript is already loaded. Pasting will replace it and delete the previous saved version. Continue?');
      if (!confirm) return;
    }
    setRaw(txt);
    setEdited(txt);
  };

  const performFindReplace = () => {
    if (!find) return;
    const escapedFind = find.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'); // escape regex chars
    const regex = new RegExp(escapedFind, 'g'); // case‑sensitive as requested
    const newContent = edited.replace(regex, replace);
    setEdited(newContent);
    setMessage('Find & replace applied');
  };

  const handleSave = async () => {
    setSaving(true);
    const filePath = `${role}/${userId}.txt`;
    // Check existence
    const { data: list, error: listErr } = await supabase.storage.from('transcripts').list(`${role}`);
    const exists = list?.some(f => f.name === `${userId}.txt`);
    if (exists) {
      // eslint-disable-next-line no-restricted-globals
      const confirm = window.confirm('A transcript is already saved for this role. Saving will replace it. Continue?');
      if (!confirm) {
        setSaving(false);
        return;
      }
    }
    const blob = new Blob([edited], { type: 'text/plain' });
    const { error } = await supabase.storage.from('transcripts').upload(filePath, blob, { upsert: true });
    if (error) {
      setMessage(`Save failed: ${error.message}`);
    } else {
      setMessage('Transcript saved successfully');
      if (role === 'worker') {
        // Trigger local download as .txt
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${userId}_transcript.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
    setSaving(false);
  };

  return (
    <div className={`border rounded-md shadow-sm ${collapsed ? 'w-64' : 'w-full'} transition-all`}>
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-100 p-2 border-b">
        <h3 className="text-sm font-medium">Transcript Editor ({role})</h3>
        <div className="flex items-center space-x-2">
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded hover:bg-gray-200" title={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? '+' : '-'}
          </button>
          <button onClick={handleSave} disabled={saving} className="p-1 rounded hover:bg-gray-200" title="Save">
            {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-2 space-y-3">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <select value={font} onChange={e => setFont(e.target.value)} className="border rounded px-1 py-0.5 text-sm">
              <option>Calibri</option>
              <option>Times New Roman</option>
              <option>Bahnschrift</option>
              <option>Cambria</option>
            </select>
            <input type="number" min={8} max={48} value={fontSize} onChange={e => setFontSize(parseInt(e.target.value) || 14)} className="w-16 border rounded px-1 py-0.5 text-sm" />
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-6 w-6 p-0 border rounded" />
            <button onClick={() => setBold(!bold)} className={`${bold ? 'bg-blue-200' : ''} p-1 rounded hover:bg-gray-200`} title="Bold"><b>B</b></button>
            <button onClick={() => setItalic(!italic)} className={`${italic ? 'bg-blue-200' : ''} p-1 rounded hover:bg-gray-200`} title="Italic"><i>I</i></button>
          </div>

          {/* Find & Replace */}
          <div className="flex items-center gap-2">
            <input placeholder="Find" value={find} onChange={e => setFind(e.target.value)} className="border rounded px-2 py-1 text-sm flex-1" />
            <input placeholder="Replace" value={replace} onChange={e => setReplace(e.target.value)} className="border rounded px-2 py-1 text-sm flex-1" />
            <button onClick={performFindReplace} className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm">Replace</button>
          </div>

          {/* Editable area */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onPaste={handlePaste}
            onInput={e => setEdited(e.currentTarget.textContent || '')}
            className="border rounded p-2 min-h-[150px] max-h-80 overflow-y-auto whitespace-pre-wrap outline-none"
          >
            {edited || 'Paste your transcript here...'}
          </div>

          {message && <div className="text-sm text-green-600">{message}</div>}
        </div>
      )}
    </div>
  );
}
