"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Undo, 
  Redo, 
  Heading1,
  Heading2
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TipTapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TipTapEditor({ value, onChange, placeholder }: TipTapEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "prose max-w-none focus:outline-none min-h-[150px] p-3 text-sm",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync value from parent if it changes and is different from current editor content
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!mounted || !editor) {
    return (
      <div className="border rounded-md min-h-[200px] bg-muted/10 animate-pulse flex items-center justify-center text-muted-foreground text-sm">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="border rounded-md flex flex-col focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-muted/40 border-b border-muted">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`h-8 w-8 p-0 ${editor.isActive("bold") ? "bg-muted text-foreground" : "text-muted-foreground"}`}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`h-8 w-8 p-0 ${editor.isActive("italic") ? "bg-muted text-foreground" : "text-muted-foreground"}`}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="h-4 w-[1px] bg-muted-foreground/20 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`h-8 w-8 p-0 ${editor.isActive("heading", { level: 1 }) ? "bg-muted text-foreground" : "text-muted-foreground"}`}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`h-8 w-8 p-0 ${editor.isActive("heading", { level: 2 }) ? "bg-muted text-foreground" : "text-muted-foreground"}`}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <div className="h-4 w-[1px] bg-muted-foreground/20 mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`h-8 w-8 p-0 ${editor.isActive("bulletList") ? "bg-muted text-foreground" : "text-muted-foreground"}`}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`h-8 w-8 p-0 ${editor.isActive("orderedList") ? "bg-muted text-foreground" : "text-muted-foreground"}`}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`h-8 w-8 p-0 ${editor.isActive("blockquote") ? "bg-muted text-foreground" : "text-muted-foreground"}`}
          title="Blockquote"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`h-8 w-8 p-0 ${editor.isActive("codeBlock") ? "bg-muted text-foreground" : "text-muted-foreground"}`}
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </Button>
        <div className="h-4 w-[1px] bg-muted-foreground/20 mx-1 flex-1 lg:flex-none" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto min-h-[180px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
