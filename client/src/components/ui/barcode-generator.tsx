import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, QrCode, BarChart3 } from "lucide-react";

interface BarcodeGeneratorProps {
  value: string;
  type: "barcode" | "qrcode";
  title?: string;
}

export function BarcodeGenerator({ value, type, title }: BarcodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (type === "qrcode") {
      QRCode.toCanvas(canvas, value, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
    } else {
      // Simple barcode generation
      canvas.width = 300;
      canvas.height = 80;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = "#000000";
      const barWidth = 2;
      let x = 10;
      
      // Generate simple barcode pattern based on value
      for (let i = 0; i < value.length; i++) {
        const char = value.charCodeAt(i);
        const pattern = char % 2 === 0 ? [1, 0, 1, 0] : [0, 1, 0, 1];
        
        pattern.forEach((bar) => {
          if (bar) {
            ctx.fillRect(x, 10, barWidth, 50);
          }
          x += barWidth;
        });
      }
      
      // Add text below barcode
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(value, canvas.width / 2, 75);
    }
  }, [value, type]);

  const downloadImage = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement("a");
    link.download = `${type}-${value}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <Card className="w-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {type === "qrcode" ? <QrCode className="w-4 h-4" /> : <BarChart3 className="w-4 h-4" />}
          {title || (type === "qrcode" ? "QR Code" : "Código de Barras")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-center">
          <canvas ref={canvasRef} className="border rounded" />
        </div>
        <Button 
          onClick={downloadImage} 
          variant="outline" 
          size="sm" 
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          Baixar
        </Button>
      </CardContent>
    </Card>
  );
}