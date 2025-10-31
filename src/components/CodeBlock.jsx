import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const CodeBlock = ({ code, language = 'bash' }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({
      title: 'Copied to clipboard!',
      description: 'Command copied successfully',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <div className="bg-black/40 border border-gray-700 rounded-lg p-4 font-mono text-sm overflow-x-auto">
        <pre className="text-gray-300 whitespace-pre-wrap break-all">{code}</pre>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 bg-gray-800/80 hover:bg-gray-700"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-400" />
        ) : (
          <Copy className="h-4 w-4 text-gray-400" />
        )}
      </Button>
    </div>
  );
};

export default CodeBlock;
