
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import type { WebflowAPI } from '@webflow/designer-extension-typings';

declare global {
  interface Window {
    webflow: WebflowAPI;
  }
}

export function ElementLogger() {
  const [error, setError] = useState<string | null>(null);
  
  const logElement = async () => {
    try {
      if (window.webflow) {
        const el = await window.webflow.getSelectedElement();
        console.log('Selected element:', el);
        setError(null);
      } else {
        setError('This extension must be run in Webflow Designer');
      }
    } catch (error) {
      setError('Error accessing Webflow API');
      console.error('Error getting selected element:', error);
    }
  };

  return (
    <div className="p-4">
      <Button onClick={logElement}>Log Selected Element</Button>
      {error && (
        <div className="mt-2 text-sm text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}
