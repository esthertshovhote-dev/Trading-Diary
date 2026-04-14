import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { 
  MousePointer2, 
  Minus, 
  Square, 
  Type, 
  Trash2, 
  Save, 
  X,
  Undo2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface AnnotationEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  initialData?: string;
  onSave: (data: string) => void;
}

export function AnnotationEditor({ 
  isOpen, 
  onClose, 
  imageUrl, 
  initialData, 
  onSave 
}: AnnotationEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<'select' | 'line' | 'rect' | 'text'>('select');

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const initCanvas = async () => {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 450,
        backgroundColor: '#000',
      });
      fabricCanvasRef.current = canvas;

      // Load background image
      try {
        const img = await fabric.FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' });
        
        // Scale image to fit canvas while maintaining aspect ratio
        const scale = Math.min(canvas.width! / img.width!, canvas.height! / img.height!);
        img.set({
          scaleX: scale,
          scaleY: scale,
          left: (canvas.width! - img.width! * scale) / 2,
          top: (canvas.height! - img.height! * scale) / 2,
          selectable: false,
          evented: false,
        });
        
        canvas.add(img);
        canvas.sendObjectToBack(img);

        // Load initial data if exists
        if (initialData) {
          await canvas.loadFromJSON(initialData);
          // Re-add image if it was lost in loadFromJSON or ensure it's at the back
          const objects = canvas.getObjects();
          const bgImg = objects.find(obj => obj instanceof fabric.FabricImage);
          if (bgImg) canvas.sendObjectToBack(bgImg);
        }

        canvas.renderAll();
      } catch (error) {
        console.error('Error loading image into canvas:', error);
      }
    };

    initCanvas();

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [isOpen, imageUrl, initialData]);

  const setTool = (tool: 'select' | 'line' | 'rect' | 'text') => {
    setActiveTool(tool);
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;
    canvas.selection = tool === 'select';
    
    canvas.getObjects().forEach(obj => {
      if (obj instanceof fabric.FabricImage) return;
      obj.selectable = tool === 'select';
    });

    canvas.off('mouse:down');

    if (tool === 'line') {
      let line: fabric.Line | null = null;
      canvas.on('mouse:down', (o) => {
        const pointer = canvas.getScenePoint(o.e);
        const points = [pointer.x, pointer.y, pointer.x, pointer.y] as [number, number, number, number];
        line = new fabric.Line(points, {
          strokeWidth: 3,
          stroke: '#2DD4BF',
          originX: 'center',
          originY: 'center',
          selectable: false
        });
        canvas.add(line);
      });

      canvas.on('mouse:move', (o) => {
        if (!line) return;
        const pointer = canvas.getScenePoint(o.e);
        line.set({ x2: pointer.x, y2: pointer.y });
        canvas.renderAll();
      });

      canvas.on('mouse:up', () => {
        if (line) {
          line.setCoords();
          line = null;
        }
      });
    } else if (tool === 'rect') {
      let rect: fabric.Rect | null = null;
      let origX = 0;
      let origY = 0;

      canvas.on('mouse:down', (o) => {
        const pointer = canvas.getScenePoint(o.e);
        origX = pointer.x;
        origY = pointer.y;
        rect = new fabric.Rect({
          left: origX,
          top: origY,
          width: 0,
          height: 0,
          fill: 'transparent',
          stroke: '#2DD4BF',
          strokeWidth: 3,
          selectable: false
        });
        canvas.add(rect);
      });

      canvas.on('mouse:move', (o) => {
        if (!rect) return;
        const pointer = canvas.getScenePoint(o.e);
        if (origX > pointer.x) {
          rect.set({ left: pointer.x });
        }
        if (origY > pointer.y) {
          rect.set({ top: pointer.y });
        }
        rect.set({
          width: Math.abs(origX - pointer.x),
          height: Math.abs(origY - pointer.y)
        });
        canvas.renderAll();
      });

      canvas.on('mouse:up', () => {
        if (rect) {
          rect.setCoords();
          rect = null;
        }
      });
    } else if (tool === 'text') {
      canvas.on('mouse:down', (o) => {
        const pointer = canvas.getScenePoint(o.e);
        const text = new fabric.IText('Type here...', {
          left: pointer.x,
          top: pointer.y,
          fontFamily: 'Inter',
          fontSize: 20,
          fill: '#2DD4BF',
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        setTool('select');
      });
    }
  };

  const handleClear = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    canvas.getObjects().forEach(obj => {
      if (!(obj instanceof fabric.FabricImage)) {
        canvas.remove(obj);
      }
    });
    canvas.renderAll();
  };

  const handleDelete = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    canvas.remove(...activeObjects);
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  const handleSave = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const json = JSON.stringify(canvas.toJSON());
    onSave(json);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[900px] bg-card border-border p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-sm font-bold uppercase tracking-wider">Annotate Trade Setup</DialogTitle>
          <div className="flex items-center gap-2">
            <ToolButton 
              icon={<MousePointer2 size={18} />} 
              active={activeTool === 'select'} 
              onClick={() => setTool('select')} 
              label="Select"
            />
            <ToolButton 
              icon={<Minus size={18} />} 
              active={activeTool === 'line'} 
              onClick={() => setTool('line')} 
              label="Line"
            />
            <ToolButton 
              icon={<Square size={18} />} 
              active={activeTool === 'rect'} 
              onClick={() => setTool('rect')} 
              label="Rectangle"
            />
            <ToolButton 
              icon={<Type size={18} />} 
              active={activeTool === 'text'} 
              onClick={() => setTool('text')} 
              label="Text"
            />
            <div className="w-px h-6 bg-border mx-2" />
            <ToolButton 
              icon={<Trash2 size={18} />} 
              onClick={handleDelete} 
              label="Delete Selected"
            />
            <ToolButton 
              icon={<Undo2 size={18} />} 
              onClick={handleClear} 
              label="Clear All"
            />
          </div>
        </DialogHeader>

        <div className="flex justify-center bg-black p-4">
          <canvas ref={canvasRef} className="shadow-2xl border border-white/10" />
        </div>

        <DialogFooter className="p-4 border-t border-border bg-muted/30">
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">Cancel</Button>
          <Button onClick={handleSave} className="bg-bento-accent text-background hover:bg-bento-accent/90">
            <Save size={18} className="mr-2" /> Save Annotations
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ToolButton({ icon, active, onClick, label }: { icon: React.ReactNode; active?: boolean; onClick: () => void; label: string }) {
  return (
    <Button
      variant={active ? 'secondary' : 'ghost'}
      size="icon"
      onClick={onClick}
      className={cn(
        "w-9 h-9",
        active ? "bg-bento-accent/10 text-bento-accent" : "text-muted-foreground hover:text-foreground"
      )}
      title={label}
    >
      {icon}
    </Button>
  );
}
