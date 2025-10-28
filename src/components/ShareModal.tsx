import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Clipboard, Check } from 'lucide-react';

interface ShareContent {
  emoji: string;
  title: string;
  author?: string;
  text: string;
  link: string;
  source: string;
}

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  content: ShareContent;
}

const ShareModal = ({ open, onClose, content }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setCopied(false);
      setIsClosing(false);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open && !isClosing) return null;

  const formattedText = `${content.emoji} ${content.title}${
    content.author ? `\nBy ${content.author}` : ''
  }

---

${content.text}

🔗 ${content.link}

---

Johari - AI-Powered Mental Wellness

Gently reveal your blindspots and receive recommendations for exactly what you need, when you need it - books, practices, tools, etc.

Sign up at www.johari.ai`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(formattedText);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = formattedText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      setCopied(true);
      
      // Auto-close after 1.5s
      setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => {
          onClose();
        }, 300);
      }, 1500);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal - with max height and scrolling */}
      <Card
        className={`relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 shadow-2xl transition-all duration-300 my-auto ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Share Recommendation</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
            disabled={copied}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Preview Content */}
        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-3">
            This is what will be copied to your clipboard:
          </p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 max-h-[300px] overflow-y-auto">
            <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
              {formattedText}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={copied}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCopy}
            disabled={copied}
            className={`gap-2 transition-colors ${
              copied
                ? 'bg-green-600 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-600'
                : ''
            }`}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Clipboard className="h-4 w-4" />
                Copy to Clipboard
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ShareModal;
